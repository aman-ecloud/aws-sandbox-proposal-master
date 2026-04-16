# AWS Pricing Calculator — Browser Automation Guide

## What this step does

Open the AWS Pricing Calculator in the browser, add every service from `service_list`, get a public share link, and write it to `context.json`.

---

## Before opening the browser

1. Read `assets/aws_services.json` to get the exact display name for each service.
2. Check which services have a pre-built script in `.github/skills/aws-sandbox-proposal-master/scripts/calculator/`. These are GROUP A. Everything else is GROUP B.
3. Write out your two lists before touching the browser. Example:
   ```
   GROUP A (inject script): AWS Lambda, Amazon DynamoDB, Amazon S3, Amazon ElastiCache, Amazon CloudWatch
   GROUP B (fill form manually):   Amazon Kinesis Data Streams, Amazon API Gateway, AWS IoT Core
   ```

---

## Navigate to the calculator

```javascript
await page.goto('https://calculator.aws/#/addService');
await page.waitForLoadState('networkidle');
await page.getByRole('radio', { name: /Search all services/i }).check().catch(() => {});
```

Do this once. Do not repeat it between services.

---

## GROUP A — services with a pre-built script

The pre-built scripts run inside the browser tab. They use React synthetic events to fill every field and click Save. Playwright's outer `page.fill()` and `page.locator().click()` do not trigger React's internal state — the form fields look filled but React sees them as empty, so the Save button stays hidden and the click times out. This is why you must inject the full script via `page.evaluate()` instead of writing outer Playwright code.

For each GROUP A service, do these steps in order:

**Step 1 — Read the script file** (before any Playwright block, using the Read tool)
```
Read: .github/skills/aws-sandbox-proposal-master/scripts/calculator/{ServiceName}.js
```

**Step 2 — Inject the full file content into the browser**

Take the entire file text from Step 1. Fill in the override block at the bottom (`})({ ... })`). Paste the whole thing verbatim into `page.evaluate()`:

```javascript
await page.evaluate(`
(async function configure...(params) {
  // ... full file content pasted here verbatim — do not shorten, rewrite, or extract pieces ...
})({
  region: 'Asia Pacific (Mumbai)',
  numberOfRequests: 4000000,
  requestDurationMs: 300,
  memoryMainValue: 1024,
});
`);
await page.waitForURL('**/addService**', { timeout: 30000 }).catch(() => page.waitForTimeout(8000));
await page.waitForLoadState('networkidle');
```

**Rules:**
- Do NOT call `page.goto` before each script — only the one navigate at the start
- Do NOT write custom functions (`addLambda`, `configureService`, `setInputByAriaContains`, etc.) — the pre-built script handles everything internally
- Do NOT call `page.fill`, `page.locator`, or `page.click` to target the service form — use `page.evaluate` only
- Use `networkidle` not `domcontentloaded` — without it, the next evaluate starts before React finishes and the context gets destroyed
- Check the console output for `[ServiceName] Saved successfully!`
- If you see `Execution context was destroyed`: check the estimate table. If the service is already there, it saved — move on. If not, re-inject.

---

## GROUP B — services with no pre-built script

For each GROUP B service, use this exact pattern:

```javascript
// 1. Search for the service
await page.fill('input[placeholder="Search for a service"], input[aria-label="Find Service"], input[role="searchbox"]', 'Exact Service Name Here');
await page.waitForTimeout(1500);

// 2. Click Configure on the first result
await page.locator('button', { hasText: 'Configure' }).first().click();
await page.waitForLoadState('networkidle');

// 3. Fill the fields using Playwright locators
// Set region (look for a dropdown labelled "Region")
await page.locator('button[aria-haspopup="listbox"]').filter({ hasText: /Region/i }).first().click().catch(() => {});
await page.waitForTimeout(500);
await page.locator('[role="option"]').filter({ hasText: 'Asia Pacific (Mumbai)' }).first().click().catch(() => {});
await page.waitForTimeout(500);

// Fill numeric fields by aria-label
await page.locator('input[aria-label*="YOUR FIELD LABEL"]').fill('YOUR VALUE').catch(() => {});

// 4. Save
await page.locator('button', { hasText: 'Save and add service' }).first().click();
await page.waitForLoadState('networkidle');

// 5. Go back to add the next service
await page.goto('https://calculator.aws/#/addService');
await page.waitForLoadState('networkidle');
await page.getByRole('radio', { name: /Search all services/i }).check().catch(() => {});
```

**Rules:**
- Do NOT use `page.accessibility.snapshot()` or `page.accessibility` — these trigger Chrome DevTools and open external windows
- Do NOT use Chrome DevTools MCP tools — use only the VS Code browser Playwright tools (`page.goto`, `page.fill`, `page.locator`, `page.click`, `page.evaluate`)
- Any code using `document` or `window` must be inside `page.evaluate()` — these don't exist in the outer Playwright block
- Use the real proposal numbers when filling fields — not minimal or placeholder values

---

## After all services are added

Navigate to the estimate summary:
```javascript
await page.goto('https://calculator.aws/#/estimate');
await page.waitForLoadState('networkidle');
```

Set page size to 50 rows so all services are visible at once:
1. Click the gear icon (⚙) in the table header
2. Select 50 rows
3. Click Confirm

Read the table. Check that every service from `service_list` is there. If any are missing, add them. If any are duplicated, delete the extras.

---

## Get the share link

1. Click **Share**
2. If an "Agree and continue" button appears, click it
3. Wait for the share link to appear in the dialog (takes 3–8 seconds)
4. Copy the URL — it looks like `https://calculator.aws/#/estimate?id=<hash>`

Then verify it is real: navigate to that URL in the same browser and confirm the services load correctly.

Write the link to `context.json` as `sandbox.business.calculator_link`.

---

## Service field reference (GROUP B quick lookup)

| Service | Key fields to fill |
|---|---|
| Amazon Kinesis Data Streams | Region, Number of shards, Retention period (hours) |
| Amazon API Gateway | Region, Number of REST/HTTP API requests (in millions) |
| AWS IoT Core | Region, Number of devices, Messages per device per day |
| Amazon EKS | Region, Number of clusters, Node type, Number of nodes |
| AWS Fargate | Region, vCPU, Memory (GB), Number of tasks, Hours |
| Amazon CloudFront | Region, Data transfer out (GB), Number of HTTP/HTTPS requests (millions) |
| Amazon RDS | Region, Engine, Instance type, Single-AZ, Storage (GB) |
| Amazon VPC | Region, NAT Gateway data processed (GB) |
| Amazon Redshift | Region, Node type, Number of nodes |
| Amazon OpenSearch | Region, Instance type, Number of instances, Storage (GB) |
| Amazon Bedrock | Model, Input tokens per request, Output tokens per request, Requests |
