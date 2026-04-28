# AWS Pricing Calculator — Script Generation Guide

Generate JavaScript automation scripts to browse the `https://calculator.aws/#/addService` website for configuring AWS services. These scripts can be executed by AI agents or directly in browser consoles.

---

## ⛔ MANDATORY PRE-CHECK — Execute Before Any Other Step

For **every** service in the request, check the workspace first:

```
Does  scripts/{service}/{service}.js  exist?
  YES → Use the existing script directly. Do NOT regenerate it. Stop here.
  NO  → You MUST complete the Browser Inspection Protocol (see below) before writing a single line of JS code.
```

**Prohibited shortcuts when the file does NOT exist:**
- ❌ Do NOT copy-paste or adapt code from another existing service script
- ❌ Do NOT use the "Service Configuration Quick Reference" section in this file as a source of selectors
- ❌ Do NOT generate selectors from memory, training knowledge, or any static description
- ❌ Do NOT proceed to write code until the Browser Inspection steps below are fully completed

The **only** valid source of CSS selectors and `aria-label` values is the **live AWS Pricing Calculator page**, inspected in the current browser session.

---

## Browser Inspection Protocol (REQUIRED for every new service)

Complete all steps before writing the `.js` file. Skipping any step is not permitted.

### Step B1 — Open the Calculator and Navigate to the Service Config Page

1. Open the browser and navigate to `https://calculator.aws/#/addService`.
   - If the browser fails to open, retry until it works normally.
2. In the "Find Service" search box, type the **exact** service name from `assets/aws_services.json`.
3. Wait for search results to appear, then click the `Configure` button for the matching service card.
4. Wait 5 seconds for the configuration page to fully load.

### Step B2 — Capture the Full Page Structure

Take a **full page snapshot** (accessibility tree or screenshot) of the configuration page and record:

- The page title / service name shown on the page
- All visible **section headings** (they group related inputs)
- Every **input field**: record its `aria-label`, `id`, `name`, `placeholder`, and `type`
- Every **dropdown / select**: record its trigger button `aria-label`, and list all available option labels
- Every **radio button group**: record the group label and all option labels
- Every **checkbox**: record its label text
- The exact label text of the **"Save and add service"** button

Record this in a structured comment block at the top of the script you will write (see Template below).

### Step B3 — Identify Required vs Optional Fields

Mark each captured field as:
- `REQUIRED` — form will not submit without it, or it has no sensible default on the page
- `OPTIONAL` — has a pre-selected default that produces a valid configuration

Fields marked `REQUIRED` must become function parameters with a stated default value in the script.

### Step B4 — Write the Script Using Only Observed Selectors

Use only the `aria-label` values, element roles, and visible label text captured in Step B2.  
Do **not** use element `id` or positional selectors (`nth-child`) — they change between sessions.

---

## Overview

Each service script must be self-contained, execute immediately when run in a browser console, and optionally accept a `params` object from an AI agent caller.

**Scope:** Generate scripts for any services provided by user/AI Agent.
Note: when scripts are used by AI Agent, since the `require` library is not available in the browser context, you must use the `read_file` tool to pull in the script content, then embed it directly into the Playwright API: `page.evaluate()` function.

**End goal:** Automated scripts that navigate the calculator website, configure services, and save them to an estimate.

## Prerequisites

- Browser MCP server (e.g., `chrome-devtools-mcp`, `playwright-mcp`, or Copilot built-in browser tools)
- Internet access to https://calculator.aws
- Reference to the full service names from `assets/aws_services.json`

## High-Level Flow

The automation scripts should accomplish the following:

```
1. MUST open a browser and navigate to AWS calculator website: `https://calculator.aws/#/addService`; if opening browser has some errors, must retry it until the browser is opened and works normally
2. MUST input the full service name from `assets/aws_services.json` to the search box, and select the corresponding service
3. MUST open a service configure page by clicking the "Configure" button
4. Inspect and record HTML elements in each service page
5. Identify required inputs
6. Convert inputs into variables
7. Fill the form automatically
8. Click "Save and add service"
```

## Script Requirements

### Dual Execution Mode

Each service script must be able to:
- **Find Service** by put in the full service name into the search box
- **Receive input parameters** from AI agents programmatically
- **Run standalone** in browser console with default values
- **Auto-detect execution context** (browser vs AI agent)
- **Use sensible defaults** when no input is provided (defaults must match the corresponding service)

> **Important:** Do NOT use the load function method. The script should execute immediately when run.

### Technical Requirements

#### Wait Between Navigation
Between each page navigation, include a **5-second wait** function to ensure elements load.

#### Scroll Before Interaction
For every button/input/option element the script intends to click, **scroll to the element** beforehand to ensure it is visible and interactable.

#### Virtual DOM Input Handling
For `input`, `select`, and `textarea` elements, use the following approach because `element.value = "..."` doesn't work on virtual DOM:

```js
let setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set
setter.call(
    document.querySelector("#element-class"),
    "your input value"
)
document.querySelector("#element-class").dispatchEvent(new Event('change', { bubbles: true }));
```

#### Service Name Reference
Each script should refer to the **full service name** from `assets/aws_services.json`.

## Folder Structure and Naming Convention

```
.github/
└── skills/
    └── aws-sandbox-proposal-master/
        └── scripts/
            ├── ec2/ec2.js
            ├── cloudfront/cloudfront.js
            ├── rds/rds.js
            ├── s3/s3.js
            ├── {service_name}/{service_name}.js
            └── ....
```

New scripts MUST be saved as `scripts/{service_name}/{service_name}.js` before being used. `{service_name}` is a lowercase, hyphen-free slug derived from the AWS service name (e.g., `apigateway`, `dynamodb`, `elasticache`).

## New Script File Template

Use this template when creating a script from scratch after completing the Browser Inspection Protocol. Fill in the `OBSERVED ELEMENTS` block with the data captured in Step B2.

```js
/**
 * AWS Pricing Calculator – {Full Service Name} Automation Script
 * Service name (from assets/aws_services.json): "{exact name}"
 *
 * OBSERVED ELEMENTS (captured from live calculator page on {date}):
 *   Section: {section heading}
 *     - {aria-label or label text} | type: {input/select/radio} | required: {yes/no}
 *     - ... (repeat for every field)
 *   "Save and add service" button text: "{exact text observed}"
 *
 * Default params (override as needed):
 *   {param}  : {default}   // {units or allowed values}
 */
(async function configure{ServiceName}(params = {}) {
  const {
    // destructure params with defaults derived from observed required fields
  } = params;

  function wait(ms) { return new Promise(res => setTimeout(res, ms)); }

  function setInputValue(el, value) {
    if (!el) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function findByText(selector, text) {
    return [...document.querySelectorAll(selector)]
      .find(el => el.innerText?.toLowerCase().includes(text.toLowerCase()));
  }

  // Step 1: Navigate
  window.location.hash = '#/addService';
  await wait(5000);

  // Step 2: Search
  const searchBox = document.querySelector('input[aria-label="Find Service"]');
  if (!searchBox) throw new Error('Search box not found');
  searchBox.focus();
  setInputValue(searchBox, '{exact service name from aws_services.json}');
  searchBox.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  await wait(2000);

  // Step 3: Configure
  const configBtn = [...document.querySelectorAll('button')]
    .find(b => b.getAttribute('aria-label')?.includes('Configure {Full Service Name}'));
  if (!configBtn) throw new Error('Configure button not found');
  configBtn.scrollIntoView();
  configBtn.click();
  await wait(5000);

  // Step 4..N: Fill observed fields
  // (use aria-label selectors captured in Step B2 of the Browser Inspection Protocol)

  // Final: Save
  await wait(1000);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.innerText?.trim() === 'Save and add service');
  if (!saveBtn) throw new Error('"Save and add service" button not found');
  saveBtn.scrollIntoView();
  saveBtn.click();
  await wait(3000);

  return { status: 'success', service: '{Full Service Name}', params };
})();
```

## Step-by-Step Automation

### Phase 1: Create a New Estimate

1. **Navigate** to `https://calculator.aws/#/`
2. **Wait** for the page to fully load (look for "Create estimate" button)
3. **Click** the `Create estimate` button
4. You will be redirected to `https://calculator.aws/#/addService`

### Phase 2: Set the Region (Optional)

1. **Locate** the region dropdown (labeled "Choose a Region")
2. **Click** the dropdown button
3. **Select** the target region (e.g., "Asia Pacific (Taipei)", "US East (N. Virginia)")
4. The service list refreshes for the selected region

### Phase 3: Add and Configure Each Service

For **each** AWS service, repeat this sub-flow:

#### 3a. Search for the Service

1. **Click** the "Find Service" search box
2. **Type** the service name (e.g., "EC2", "CloudFront", "RDS", "S3", etc.) using the full name from `assets/aws_services.json`
3. **Wait** for the filtered results to appear
4. **Locate** the matching service card in the list

#### 3b. Click Configure

1. **Click** the `Configure` button on the service card
2. You are now on the **Configure service** page (Step 2)
3. The page shows configuration fields specific to that service

#### 3c. Fill Configuration Fields

This varies per service. Use the accessibility tree or page snapshot to identify:
- Input fields (text, number)
- Dropdowns and select lists
- Radio buttons
- Checkboxes

Refer to the **Service Configuration Quick Reference** section below for service-specific fields.

#### 3d. Save the Service Configuration

1. **Scroll** to the bottom of the configuration page
2. **Click** the `Save and add service` button (adds this service and returns to the Add Service page)
3. A green notification banner confirms the service was added successfully

#### 3e. Repeat for Additional Services

After saving, you return to the "Add service" page. Repeat steps 3a–3d for each remaining service.

## General Rules for Element Selection

### Buttons
```js
document.querySelector('button')
```

### Input fields
```js
document.querySelector('input')
```

### Dropdowns / Radio / Custom Select
```js
document.querySelector('div')
```

#### Note:
If you cannot find a component, try scrolling the screen or scrolling to the element first.

## Helper Utilities

Use these helper functions in your scripts for more robust element interaction:

```js
function findByText(selector, text) {
    return [...document.querySelectorAll(selector)]
        .find(el => el.innerText?.toLowerCase().includes(text.toLowerCase()));
}

function clickByText(selector, text) {
    const el = findByText(selector, text);
    if (el) el.click();
}

function setInputByLabel(labelText, value) {
    const label = findByText('label', labelText);
    if (!label) return;

    const input = label.parentElement.querySelector('input');
    if (input) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
}
```

## Service Configuration Quick Reference

> ⚠️ **HISTORICAL REFERENCE ONLY — DO NOT USE FOR SELECTOR GENERATION**
>
> The field names below are **approximate descriptions** from past observations. They are provided only for orientation — to help you know *what kinds of fields* to look for when you open the browser. They are **not** selectors and must **never** be used to write `document.querySelector(...)` calls directly.
>
> Field labels, `aria-label` values, and element structure **change between calculator versions**. Always run the **Browser Inspection Protocol** (see top of this guide) to capture the current, live selectors before writing any code.

### Amazon EC2
Key fields to configure:
- Operating System (Linux/Windows)
- Instance type (e.g., t3.medium, m5.large)
- Tenancy (Shared/Dedicated)
- Number of instances
- Pricing strategy (On-Demand/Reserved/Savings Plans)
- Storage (EBS volume type + size in GB)

### Amazon CloudFront
Key fields to configure:
- Data transfer out (GB/month per region)
- Number of HTTP requests
- Number of HTTPS requests
- Regional data out (North America, Europe, etc.)

### Amazon RDS
Key fields to configure:
- Database engine (MySQL, PostgreSQL, etc.)
- Instance type (e.g., db.t3.medium)
- Deployment option (Single-AZ/Multi-AZ)
- Storage type (General Purpose SSD/Provisioned IOPS)
- Storage amount (GB)
- Backup retention period

### Amazon S3
Key fields to configure:
- Storage class (S3 Standard, Glacier, etc.)
- Storage amount (GB per month)
- PUT, COPY, POST, LIST requests count
- GET, SELECT, and all other requests count
- Data transfer out (GB)

> **Note:** Field labels and IDs may change between calculator sessions. Always use label text or aria-label attributes for element selection.

## Best Practices

- Always **inspect elements first** before writing selectors
- Prefer **label → input mapping** over brittle ID or class selectors
- Avoid **nth-child** or positional selectors that break when UI changes
- Include **error handling** for missing elements
- Add **wait/retry logic** for elements that load asynchronously

## Testing Requirements (MUST DO)

After generating each script, you **must** test it yourself on the browser:

1. Use `chrome-devtools-mcp` to open a new browser instance
2. Navigate to https://calculator.aws
3. Run the generated script in the browser console
4. Test with:
   - Valid input parameters
   - `undefined` parameters
   - `null` parameters
   - Default values (no parameters)
5. Verify that the service is successfully added to the estimate
6. If the script fails, identify the issue and revise the script
7. Repeat testing until the script works reliably in all scenarios

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Element not found | Scroll to the element first; wait longer for async loading |
| Input value not persisting | Use the virtual DOM setter pattern (see Technical Requirements) |
| Service not appearing in search | Use the exact service name or a shorter keyword (e.g., "S3" instead of "Simple Storage Service") |
| Configuration fields not visible | Scroll down the page; some sections may be collapsed by default |
| "Save and add service" button disabled | Ensure all required fields are filled; check for validation errors displayed on the page |
| Script works in browser but fails for AI agent | Add longer wait times between steps; ensure the script returns a useful status or result object |