/**
 * validate_scripts.js
 *
 * For each generated service_spec/{SERVICE}.js file, opens the AWS Pricing
 * Calculator in a headful browser, injects a dummy-value version of the script,
 * captures all console.warn messages, and reports PASS or FAIL.
 *
 * Run with:  node service_spec/validate_scripts.js
 *
 * PASS = zero console.warn messages AND "Saved successfully!" was logged
 * FAIL = lists every warning so scripts can be patched
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = path.join(__dirname);
const DISCOVERY_FILE = path.join(__dirname, 'discovery.json');

const SERVICES = [
  'Amazon EC2', 'AWS Lambda', 'AWS Fargate', 'Amazon EKS', 'Amazon Lightsail',
  'Amazon Simple Storage Service (S3)', 'Amazon Elastic Block Store (EBS)',
  'Amazon Elastic File System (EFS)', 'Amazon RDS for MySQL', 'Amazon RDS for PostgreSQL',
  'Amazon DynamoDB', 'Amazon Aurora MySQL-Compatible', 'Amazon ElastiCache',
  'Amazon CloudFront', 'Amazon Route 53', 'Amazon Virtual Private Cloud (VPC)',
  'Elastic Load Balancing', 'Amazon Simple Queue Service (SQS)',
  'Amazon Simple Notification Service (SNS)', 'Amazon EventBridge',
  'Amazon CloudWatch', 'AWS Key Management Service', 'AWS Secrets Manager',
  'Amazon Bedrock', 'Amazon SageMaker',
];

let discovery = {};
if (fs.existsSync(DISCOVERY_FILE)) {
  try { discovery = JSON.parse(fs.readFileSync(DISCOVERY_FILE, 'utf8')); } catch {}
}

// Replace all default values in a script with dummies for validation
function injectDummies(scriptSrc, fields, optionMap) {
  // Replace number defaults with 1, strings with 'test', dropdowns with first option
  return scriptSrc.replace(
    /params\?\.(\w+)\s*\?\?\s*([^,\n]+)/g,
    (match, key, defaultVal) => {
      const trimmed = defaultVal.trim();
      if (trimmed === 'true' || trimmed === 'false') return `params?.${key} ?? false`;
      if (!isNaN(Number(trimmed))) return `params?.${key} ?? 1`;
      if (trimmed.startsWith("'") || trimmed.startsWith('"')) {
        // Find first valid option from discovery if available
        const allOptions = Object.values(optionMap || {}).flat();
        const firstOption = allOptions[0];
        if (firstOption) return `params?.${key} ?? '${firstOption.replace(/'/g, "\\'")}'`;
        return `params?.${key} ?? 'test'`;
      }
      return match;
    }
  );
}

const results = [];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const serviceName of SERVICES) {
    const scriptFile = path.join(SCRIPT_DIR, `${serviceName}.js`);
    if (!fs.existsSync(scriptFile)) {
      console.log(`[SKIP] ${serviceName} - script file not found`);
      results.push({ serviceName, status: 'SKIP', reason: 'script file not found', warnings: [] });
      continue;
    }

    const originalScript = fs.readFileSync(scriptFile, 'utf8');
    const serviceDiscovery = discovery[serviceName] || {};
    const dummyScript = injectDummies(originalScript, serviceDiscovery.fields || [], serviceDiscovery.optionMap || {});

    console.log(`\n[VALIDATE] ${serviceName}`);

    const warnings = [];
    let savedSuccessfully = false;

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'warning' && text.startsWith(`[${serviceName}]`)) {
        warnings.push(text);
        console.log(`  WARN: ${text}`);
      }
      if (text.includes('Saved successfully!')) {
        savedSuccessfully = true;
        console.log(`  [OK] ${text}`);
      }
    });

    try {
      await page.goto('https://calculator.aws/#/addService', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      await page.evaluate(dummyScript);
      await page.waitForTimeout(8000); // wait for script to complete
    } catch (err) {
      warnings.push(`SCRIPT_ERROR: ${err.message}`);
      console.log(`  ERROR: ${err.message}`);
    }

    const status = (warnings.length === 0 && savedSuccessfully) ? 'PASS' : 'FAIL';
    results.push({ serviceName, status, savedSuccessfully, warnings });
    console.log(`[${status}] ${serviceName} - ${warnings.length} warnings, saved=${savedSuccessfully}`);

    page.removeAllListeners('console');
    await page.waitForTimeout(1000);
  }

  await browser.close();

  // Print final summary
  console.log('\n\n============== VALIDATION SUMMARY ==============');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '[OK]' : r.status === 'SKIP' ? '[-]' : '[X]';
    console.log(`${icon} [${r.status}] ${r.serviceName}`);
    if (r.warnings.length > 0) {
      r.warnings.forEach(w => console.log(`       ${w}`));
    }
  }

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  console.log(`\nTotal: ${passed} PASS, ${failed} FAIL, ${skipped} SKIP`);

  // Write validation report
  fs.writeFileSync(
    path.join(SCRIPT_DIR, 'validation_report.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\nFull report saved to service_spec/validation_report.json');
})().catch((err) => {
  console.error('VALIDATION_RUNNER_FATAL:', err?.stack || err?.message || String(err));
  try {
    fs.writeFileSync(
      path.join(SCRIPT_DIR, 'validation_report.json'),
      JSON.stringify([{ serviceName: 'RUNNER', status: 'FAIL', warnings: [String(err?.message || err)] }], null, 2)
    );
  } catch {}
  process.exitCode = 1;
});
