# AWS Pricing Calculator — Browser Automation Guide

Automate the AWS Pricing Calculator via browser MCP tools (e.g., `chrome-devtools-mcp`, Playwright MCP, or equivalent) to obtain a **public share link** for embedding in the Sandbox proposal.

## Overview

The AWS Pricing Calculator at https://calculator.aws is a client-side web application with no public API. To produce an official AWS cost estimate with a shareable link, you must interact with the browser UI programmatically.

**End goal:** A URL like `https://calculator.aws/#/estimate?id=<hash>` stored in `sandbox.business.calculator_link`.

**IMPORTANT — Service Scripts:** For every AWS service that has a pre-built script under `scripts/<service>/`, you **MUST** inject that script via `page.evaluate()` instead of manually clicking through the UI. This is mandatory — do not fall back to raw browser interaction for covered services. See [Phase 3](#phase-3-add-services-via-scripts) and the [Service Scripts Reference](#service-scripts-reference) below.

## Prerequisites

- A browser MCP server (e.g., `chrome-devtools-mcp`, `playwright-mcp`, or any tool that can navigate pages, click elements, type text, and read page content)
- Internet access to https://calculator.aws
- Access to the skill's `scripts/` directory at:
  `/.github/skills/aws-sandbox-proposal-master/scripts`

## High-Level Flow

```
1. Open calculator homepage
2. Create new estimate
3. For each AWS service:
  IF a script exists for the service →
    a. Inject the service script via page.evaluate() with config overrides
    (the script handles search, configure, and save automatically)

  ELSE (no script available) →
    a. Search for the service manually via the BROWSER (MUST interact via the browser)
    b. Click "Configure"
    c. Fill in configuration fields via browser interaction
    d. Click "Save and add service"
    e. Store all the class name, web interfaces info, and convert it to an automation web browsing script and store it under the `scripts/` folder

4. Get the share link
5. Extract the URL
```

## Step-by-Step Automation

### Phase 1: Create a New Estimate

1. **Navigate** to `https://calculator.aws/#/`
2. **Wait** for the page to fully load (look for "Create estimate" button)
3. **Click** the `Create estimate` button
4. You will be redirected to `https://calculator.aws/#/addService`
5. The page shows:
   - Region selector (default or pre-set)
   - "Find Service" search box
   - A list of available AWS services

### Phase 2: Set the Region

1. **Locate** the region dropdown (labeled "Choose a Region")
2. **Click** the dropdown button
3. **Select** the target region (e.g., "Asia Pacific (Taipei)", "US East (N. Virginia)")
4. The service list refreshes for the selected region

> **Tip:** The region dropdown is inside the "Search by location type" radio group. Make sure that radio option is selected (it is by default).

### Phase 3: Add Services via Scripts

For each AWS service in the proposal, check the [Service Scripts Reference](#service-scripts-reference) table first.

#### 3a. Script-Based Services (preferred — mandatory when a script exists)

Automate the browser to create a cost estimate on https://calculator.aws and obtain a **public share link**. Follow the detailed guide in [references/AWS_CALCULATOR_GUIDE.md](references/AWS_CALCULATOR_GUIDE.md).

**Using Modular Service Scripts:**

Each AWS service has its own automation module under `scripts/{service}/`:

```
scripts/
├── s3/                    # Amazon S3
│   └── s3.js     # Browser automation helpers
├── ec2/                   # Amazon EC2
│   └── ...
└── rds/                   # Amazon RDS
    └── ...
```

**Scope:** Run scripts in `scripts/` to get the AWS services pricing
Note: when scripts are used by AI Agent, since the `require` library is not available in the browser context, you must use the `read_file` tool to pull in the script content, then embed it directly into the Playwright API: `page.evaluate()` function.

**Prohibited behaviors:**
In the usage section of every script, MUST NOT instruct using functions such as page.evaluate and fs.readFile or fs.readFileSync, since AI Agents are not capable of using those functions.

> **Note:** Pass `region` in every config override so the script selects the correct region on the calculator.

#### 3b. Services Without a Script (mandatory new script creation)

For services **not** in the scripts table (i.e., `scripts/{service}/{service}.js` does **not** exist), you **must** create a new automation script before continuing. This is not optional.

**Follow the full Browser Inspection Protocol defined in `references/SCRIPT_GENERATION_GUIDE.md`:**

1. **Open the browser** and navigate to `https://calculator.aws/#/addService`.
2. **Search** for the service by its exact name from `assets/aws_services.json`.
3. **Click Configure** and wait for the configuration page to fully load.
4. **Capture the page structure**: take a snapshot of the accessibility tree or screenshot, then record every field's `aria-label`, input type, dropdown options, and radio labels.
5. **Write the `.js` script** using only the selectors observed in step 4 and the New Script File Template from `SCRIPT_GENERATION_GUIDE.md`.
6. **Save the script** to `scripts/{service_slug}/{service_slug}.js` before continuing.
7. **Fill the form** using the new script (inject via `page.evaluate()`) and click `Save and add service`.

> ⛔ **Do NOT** manually click through the form without saving a script. The whole purpose of this step is to produce a reusable `.js` file, not a one-time interaction.

> ⛔ **Do NOT** write the script by adapting an existing service's `.js` file. Selectors are service-specific and were observed from a live page — they are not transferable.

#### 3c. Repeat for All Services

After each service is saved (either via script or manual), you are returned to the Add Service page. Continue until all services are added.

### Phase 4: Navigate to Estimate Summary

After all services are added:
1. **Click** `View summary` button, or
2. **Navigate** to `https://calculator.aws/#/estimate`

You should see the estimate page with:
- All added services listed in a table
- Monthly cost, upfront cost, and 12-month total

### Phase 5: Get the Share Link

1. **Click** the `Share` button (located near the top of the estimate page, next to `Export`)
2. A **"Save estimate"** dialog appears with a progress bar
3. **Wait** for the progress bar to complete (typically 3–8 seconds)
4. Once complete, a **public share link** appears in a text input field
5. **Extract the URL** from the input field

**To extract the link programmatically:**

Using Playwright / evaluate_script:
```javascript
// Wait for the share dialog to finish loading, then grab the URL
await page.waitForTimeout(5000);
const linkInput = await page.locator('input[type="text"]').first();
const shareUrl = await linkInput.inputValue();
// shareUrl is like: https://calculator.aws/#/estimate?id=abc123def456
```

Using accessibility tree / page snapshot:
- Look for an `input` element inside the "Save estimate" dialog
- Its value is the share URL

6. **Close** the dialog (click Cancel or the X button)

### Phase 6: Record the Result

Store the extracted URL as `sandbox.business.calculator_link` in the proposal context JSON.

## Optimized Prompt for Browser MCP Agent

When delegating this task to a browser-capable agent or SubAgent, use this prompt template. Replace `<SERVICES_BLOCK>` with the user's specific service requirements:

```
Navigate to https://calculator.aws/#/ and create a new cost estimate.

Click "Create estimate" to start. Set the region to <REGION>.

Add the following AWS services to the estimate. For each service that has a
pre-built script under the skill's scripts/ directory, inject the script via
page.evaluate() with the appropriate config overrides (see Service Scripts
Reference). Only use manual browser interaction for services without a script.

<SERVICES_BLOCK>

After all services are configured and added, navigate to the estimate summary
page. Click the "Share" button, wait for the share link to generate (about 5
seconds), then extract the URL from the text input in the dialog.

The URL format is: https://calculator.aws/#/estimate?id=<hash>

Return ONLY the share link URL.
```

### Services Block Format

Each service entry should specify which script to use (if any) and its config:

```
Service 1: Amazon S3  →  use scripts/s3/s3.js
  - region: 'Asia Pacific (Taipei)'
  - s3StandardStorage: 10       (GB per month)
  - putCopyPostList: '400'
  - getSelectAndOther: '400'

Service 2: Amazon EC2  →  use scripts/ec2/ec2.js
  - region: 'Asia Pacific (Taipei)'
  - instanceType: 't3.medium'
  - numberOfInstances: 2
  - storageAmount: 30

Service 3: Amazon VPC  →  no script — use manual browser interaction
  - 1 Site-to-Site VPN Connection

Service 4: AWS Database Migration Service  →  no script — use manual browser interaction
  - Deployment: Single-AZ
  - Instance type: dms.t3.large
  - Storage: 100 GB General Purpose SSD (gp2)
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Create estimate" button not visible | Scroll down on the homepage; the button is in the main content area |
| Region dropdown not responding | Ensure "Search by location type" radio is selected (default) |
| Script evaluation throws an error | Verify the regex replace matched — check that the script file ends with `})({...});` |
| Script logs a `waitForElement timed out` warning | The page may not have fully loaded; add a `waitForTimeout(2000)` before evaluating |
| Service not found in search (manual flow) | Use the exact AWS service name; try shorter keywords (e.g., "S3" instead of "Amazon Simple Storage Service") |
| Configuration fields not found (manual flow) | Use page snapshot / accessibility tree to locate field labels; field IDs change between sessions |
| Share button click intercepted | A dialog may already be open; close it first, then retry |
| Share link progress bar stuck | Wait longer (up to 15 seconds); if still stuck, refresh the page and re-click Share |
| Multiple "Cancel" buttons found | Target the one inside the "Save estimate" dialog specifically |

## Service Scripts Reference

> ⚠️ **This table lists only scripts that are confirmed to exist in the `scripts/` folder.**
> Before using any entry, verify the file exists at `scripts/{service}/{service}.js`.
> If a service you need is **not** in this table, it has no pre-built script — follow Step 3b above to create one.

| Service | Script path | Key Config Parameters |
|---|---|---|
| Amazon Simple Storage Service (S3) | `scripts/s3/s3.js` | `storageGB`, `putCopyRequests`, `getSelectRequests` |
| Amazon RDS for MySQL | `scripts/rds/rds.js` | `nodes`, `instanceType`, `deploymentOption`, `pricingModel`, `storageType`, `storageGB` |
| AWS Lambda | `scripts/lambda/lambda.js` | `architecture`, `numberOfRequests`, `durationMs`, `memoryMB`, `ephemeralStorageMB` |
| Amazon Simple Queue Service (SQS) | `scripts/sqs/sqs.js` | `standardQueueRequests`, `fifoQueueRequests` |

### Config Injection Examples (confirmed-existing scripts only)

**Amazon S3:**
```javascript
script = script.replace(/\}\)\(\{[\s\S]*?\}\);?\s*$/, `})({
  storageGB         : 100,
  putCopyRequests   : 10000,
  getSelectRequests : 100000,
});`);
```

**Amazon RDS for MySQL:**
```javascript
script = script.replace(/\}\)\(\{[\s\S]*?\}\);?\s*$/, `})({
  nodes            : 1,
  instanceType     : 'db.t3.medium',
  deploymentOption : 'Multi-AZ',
  pricingModel     : 'OnDemand',
  storageType      : 'General Purpose SSD (gp2)',
  storageGB        : 100,
});`);
```

**AWS Lambda:**
```javascript
script = script.replace(/\}\)\(\{[\s\S]*?\}\);?\s*$/, `})({
  numberOfRequests  : 1000000,
  durationMs        : 500,
  memoryMB          : 512,
  ephemeralStorageMB: 512,
});`);
```

**Amazon SQS:**
```javascript
script = script.replace(/\}\)\(\{[\s\S]*?\}\);?\s*$/, `})({
  standardQueueRequests : 1,
  fifoQueueRequests     : 0,
});`);
```

> For any service not listed here, you must create a new script following the Browser Inspection Protocol before you can inject config overrides.
```

**Amazon CloudWatch:**
```javascript
script = script.replace(/\}\)\(\{[\s\S]*?\}\);?\s*$/, `})({
  region                : 'Asia Pacific (Taipei)',
  numberOfMetrics       : 10,
  standardLogsIngested  : 5,
  numberOfDashboards    : 1,
  standardAlarms        : 10,
});`);
```

**Elastic Load Balancing (ALB):**
```javascript
script = script.replace(/\}\)\(\{[\s\S]*?\}\);?\s*$/, `})({
  region                : 'Asia Pacific (Taipei)',
  numberOfALBs          : 1,
  processedBytesEC2     : 10,
  newConnectionsPerALB  : 100,
  requestsPerSecond     : 100,
});`);
```

**Amazon SageMaker:**
```javascript
script = script.replace(/\}\)\(\{[\s\S]*?\}\);?\s*$/, `})({
  region                  : 'Asia Pacific (Taipei)',
  studioDataScientists    : 1,
  studioInstancesPerDS    : 1,
  studioHoursPerDay       : 8,
  studioDaysPerMonth      : 20,
  studioInstanceType      : 'ml.t3.medium',
});`);
```

### Services Without Scripts (Manual Browser Interaction Required)

For these services, follow the manual steps in [Phase 3b](#3b-services-without-a-script-fallback--manual-browser-interaction):

| Service | Notes |
|---|---|
| Amazon VPC | Configure NAT Gateway data (GB/month), VPN connection count, PrivateLink endpoints |
| AWS DMS | Select instance type, Single/Multi-AZ deployment, storage size, and pricing model |
| Amazon ECS / EKS | Select launch type (Fargate/EC2), vCPUs, memory, task count, and duration |

> For any other service not listed in either table, use the page snapshot to discover available configuration fields and their labels.
