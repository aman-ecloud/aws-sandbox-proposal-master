const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const REPORT_FILE = path.join(SCRIPT_DIR, 'console_validation_report.json');

const SERVICES = [
  'Amazon EC2',
  'AWS Lambda',
  'AWS Fargate',
  'Amazon EKS',
  'Amazon Lightsail',
  'Amazon Simple Storage Service (S3)',
  'Amazon Elastic Block Store (EBS)',
  'Amazon Elastic File System (EFS)',
  'Amazon RDS for MySQL',
  'Amazon RDS for PostgreSQL',
  'Amazon DynamoDB',
  'Amazon Aurora MySQL-Compatible',
  'Amazon ElastiCache',
  'Amazon CloudFront',
  'Amazon Route 53',
  'Amazon Virtual Private Cloud (VPC)',
  'Elastic Load Balancing',
  'Amazon Simple Queue Service (SQS)',
  'Amazon Simple Notification Service (SNS)',
  'Amazon EventBridge',
  'Amazon CloudWatch',
  'AWS Key Management Service',
  'AWS Secrets Manager',
  'Amazon Bedrock',
  'Amazon SageMaker'
];

async function runWithTimeout(promise, ms, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`TIMEOUT: ${label} exceeded ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

(async () => {
  const results = [];

  for (const serviceName of SERVICES) {
    const scriptPath = path.join(SCRIPT_DIR, `${serviceName}.js`);
    const result = {
      serviceName,
      fileExists: fs.existsSync(scriptPath),
      savedLogSeen: false,
      successNotificationSeen: false,
      warnings: [],
      errors: [],
      status: 'FAIL'
    };

    if (!result.fileExists) {
      result.status = 'MISSING_FILE';
      results.push(result);
      console.log(`[MISSING_FILE] ${serviceName}`);
      continue;
    }

    const scriptSource = fs.readFileSync(scriptPath, 'utf8');
    let browser;
    let context;
    let page;
    try {
      browser = await chromium.launch({ headless: true });
      context = await browser.newContext();
      page = await context.newPage();
    } catch (err) {
      result.errors.push(`BROWSER_SETUP_ERROR: ${err.message || String(err)}`);
      result.status = 'FAIL';
      results.push(result);
      console.log(`[FAIL] ${serviceName} | setup error`);
      if (browser) {
        try { await browser.close(); } catch {}
      }
      continue;
    }

    const consoleListener = (msg) => {
      const text = msg.text();
      if (msg.type() === 'warning' && text.includes(`[${serviceName}]`)) result.warnings.push(text);
      if (msg.type() === 'error' && text.includes(`[${serviceName}]`)) result.errors.push(text);
      if (text.includes(`[${serviceName}] Saved successfully!`)) {
        result.savedLogSeen = true;
      }
    };

    page.on('console', consoleListener);

    try {
      await runWithTimeout(page.goto('https://calculator.aws/#/addService', { waitUntil: 'domcontentloaded' }), 30000, `${serviceName} goto`);
      await page.waitForTimeout(1500);

      // Inject exactly as browser-console code using eval (not blocked by CSP like inline script tags).
      await runWithTimeout(
        page.evaluate((src) => { (0, eval)(src); return true; }, scriptSource),
        15000,
        `${serviceName} script inject`
      );
      await page.waitForTimeout(5000);

      const successText = `Successfully added ${serviceName} estimate.`;
      const hasNotification = await page.locator(`text=${successText}`).count();
      result.successNotificationSeen = hasNotification > 0;

      if (result.savedLogSeen && result.successNotificationSeen) {
        result.status = 'PASS';
      } else {
        result.status = 'FAIL';
      }
    } catch (err) {
      result.errors.push(err.message || String(err));
      result.status = 'FAIL';
    }

    page.removeListener('console', consoleListener);
    try { await browser.close(); } catch {}
    results.push(result);

    console.log(`[${result.status}] ${serviceName} | savedLog=${result.savedLogSeen} notification=${result.successNotificationSeen} warnings=${result.warnings.length} errors=${result.errors.length}`);
  }

  fs.writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2));
  console.log(`\nReport written: ${REPORT_FILE}`);

})();
