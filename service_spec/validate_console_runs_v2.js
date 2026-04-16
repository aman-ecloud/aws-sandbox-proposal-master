const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const REPORT_FILE = path.join(SCRIPT_DIR, 'console_validation_report_v2.json');

const SERVICES = [
  'Amazon EC2', 'AWS Lambda', 'AWS Fargate', 'Amazon EKS', 'Amazon Lightsail',
  'Amazon Simple Storage Service (S3)', 'Amazon Elastic Block Store (EBS)',
  'Amazon Elastic File System (EFS)', 'Amazon RDS for MySQL', 'Amazon RDS for PostgreSQL',
  'Amazon DynamoDB', 'Amazon Aurora MySQL-Compatible', 'Amazon ElastiCache',
  'Amazon CloudFront', 'Amazon Route 53', 'Amazon Virtual Private Cloud (VPC)',
  'Elastic Load Balancing', 'Amazon Simple Queue Service (SQS)',
  'Amazon Simple Notification Service (SNS)', 'Amazon EventBridge',
  'Amazon CloudWatch', 'AWS Key Management Service', 'AWS Secrets Manager',
  'Amazon Bedrock', 'Amazon SageMaker'
];

function writeReport(results) {
  fs.writeFileSync(REPORT_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
}

(async () => {
  const results = [];
  writeReport(results);

  for (const serviceName of SERVICES) {
    const result = {
      serviceName,
      status: 'FAIL',
      fileExists: false,
      savedLogSeen: false,
      successNotificationSeen: false,
      warnings: [],
      errors: []
    };

    const scriptPath = path.join(SCRIPT_DIR, `${serviceName}.js`);
    if (!fs.existsSync(scriptPath)) {
      result.status = 'MISSING_FILE';
      results.push(result);
      writeReport(results);
      continue;
    }

    result.fileExists = true;
    const scriptSource = fs.readFileSync(scriptPath, 'utf8');

    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      page.on('console', (msg) => {
        const t = msg.text();
        if (t.includes(`[${serviceName}]`)) {
          if (msg.type() === 'warning') result.warnings.push(t);
          if (msg.type() === 'error') result.errors.push(t);
          if (t.includes('Saved successfully!')) result.savedLogSeen = true;
        }
      });

      await page.goto('https://calculator.aws/#/addService', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1500);

      // Console-style execution path.
      await page.evaluate((src) => {
        // eslint-disable-next-line no-eval
        (0, eval)(src);
      }, scriptSource);

      await page.waitForTimeout(10000);
      const successText = `Successfully added ${serviceName} estimate.`;
      const notifCount = await page.locator(`text=${successText}`).count();
      result.successNotificationSeen = notifCount > 0;
      result.status = (result.savedLogSeen && result.successNotificationSeen) ? 'PASS' : 'FAIL';
    } catch (e) {
      result.errors.push(e.message || String(e));
      result.status = 'FAIL';
    } finally {
      if (browser) {
        try { await browser.close(); } catch {}
      }
      results.push(result);
      writeReport(results);
    }
  }
})();
