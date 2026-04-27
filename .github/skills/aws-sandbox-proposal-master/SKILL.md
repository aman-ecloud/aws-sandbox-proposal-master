---
name: aws-sandbox-proposal-master
description: >-
  Generate professional AWS Sandbox Innovation Plan proposal documents (DOCX).
  Covers end-to-end workflow: gathering business context, designing architecture
  diagrams with the Python diagrams library, automating AWS Pricing Calculator
  via browser to obtain a shareable cost estimate link, and producing formatted
  proposals. Use when the user asks to create, update, or review an AWS Sandbox
  proposal, Sandbox Innovation Plan, or partner-led co-sell proposal document.
metadata:
  author: eCloudvalley
  version: "2.0"
---

# AWS Sandbox Proposal Master

Generate reliable, professional-grade AWS Sandbox Innovation Plan proposals through a structured, multi-step workflow. This skill is **self-contained** — it ships its own DOCX template (`assets/Sandbox Innovation Plan Template_v2.docx`), a binding script (`scripts/generate_proposal.py`), and all reference docs needed to produce a standards-compliant proposal.

**Important:** This skill is not for demo purposes. It is designed for real-world use by AWS field teams and partners to create actual proposals that may be submitted for funding consideration. Follow the execution model and guidelines carefully to ensure the generated proposal meets AWS standards and effectively communicates the solution. Do not make any bold assumptions about user intent or skip steps in the workflow, as this may lead to incomplete or non-compliant proposals.

> ## ⚡ SPEED RULES — Read Once, Execute Immediately

> **Do NOT spend more than two file reads before starting Step 0.**
>
> The only pre-execution reads required are:
> 1. This file (`SKILL.md`) — read once, fully
> 2. `references/AWS_CALCULATOR_GUIDE.md` — read once before Step 3B
>
> Do NOT run regex searches across skill files to "locate" commands or "confirm" schema fields before starting. Do NOT search `generate_proposal.py`, `verify_proposal.py`, `CONTEXT_SCHEMA.md`, `DIAGRAM_GUIDE.md`, or any other reference file before executing. All commands are in this file and in `AWS_CALCULATOR_GUIDE.md`. Searching them via `Searched for regex` before acting is pre-flight probing and wastes 3–5 minutes on a standard run.
>
> Do NOT run `Get-ChildItem -Recurse` on the skill folder. Do NOT read `review-skill/SKILL.md` before finishing Step 3B.

## Run the full pipeline every time

Run every step in order. Do not stop in the middle to ask what to do next. Do not skip steps.

**Step 0 → Step 1 → Step 2 → Step 3A + Step 3B → Step 4 → Step 5 → Step 6 → Step 7 → Step 8**

- **Step 3B (AWS Calculator):** Open the browser, add all services, get a real share link. Do not deliver without it. Do not leave `calculator_link` blank. If it is blank, `generate_proposal.py` will fail and you cannot move forward — so finish Step 3B first.
- **Do not reuse an old `context.json`.** Every run creates a new folder with a fresh `context.json`.
- **Do not shrink the service list.** If the proposal has 12 services, all 12 go into the calculator. Do not reduce it.
- **Do not say the calculator link is "pending" or "coming next".** Get it now, in this run.
- **Do not read `scripts/chrome_browser.py`.** It is not used. Use the VS Code browser tools instead.

When this run ends, the output folder must have: `context.json`, `architecture.png`, and `Proposal.docx`.

## Execution Model (Copilot SKILL)

This project is implemented in the Copilot SKILL workflow style:

- The agent reads `SKILL.md` first, then follows each step in order.
- The agent references files in `references/` and executes scripts in `scripts/`.
- No frontend UI integration is required.
- No external LLM API key flow is required for Step 3B.
- Step 3B browser actions are performed in the VS Code built-in browser context.

## Pre-Built Calculator Scripts (.github/skills/aws-sandbox-proposal-master/scripts/calculator/)

The `.github/skills/aws-sandbox-proposal-master/scripts/calculator/` folder contains **ready-to-use browser console scripts** for the most commonly used AWS services. These scripts were generated from live DOM inspection of the AWS Pricing Calculator and are designed to auto-fill configuration forms accurately.

**Available scripts (38 services — self-growing):**
Amazon EC2, Amazon EKS, Amazon EFS, Amazon EBS, Amazon S3, Amazon RDS for MySQL, Amazon RDS for PostgreSQL, Amazon Aurora MySQL-Compatible, Amazon DynamoDB, Amazon ElastiCache, Amazon CloudFront, Amazon CloudWatch, Amazon Route 53, Amazon VPC, Amazon SageMaker, Amazon Bedrock, Amazon SNS, Amazon SQS, Amazon EventBridge, Amazon Lightsail, AWS Lambda, AWS Fargate, AWS KMS, AWS Secrets Manager, Elastic Load Balancing, AWS Amplify, AWS App Runner, AWS AppSync, AWS Application Migration Service, AWS Audit Manager, AWS Backup, Amazon Kinesis Data Streams, Amazon API Gateway, AWS IoT Core, Amazon Athena, Amazon Cognito, AWS IAM Access Analyzer, and more.

**This list grows automatically.** Every time a GROUP B service is successfully added via manual Playwright, a new `.js` script is written to `scripts/calculator/` and this list is updated. On the next run that service becomes GROUP A.

## How to add services in Step 3B

For each service in `service_list`, check whether a pre-built script exists:

- **Script exists** at `.github/skills/aws-sandbox-proposal-master/scripts/calculator/{ServiceName}.js` → **GROUP A** — use script injection (described below).
- **No script** → **GROUP B** — use manual Playwright form fill (`references/AWS_CALCULATOR_GUIDE.md`), then **immediately write a new `.js` script** for that service so future runs can use GROUP A injection (see "After GROUP B: Write the script" below).

### GROUP A — script injection (the only correct approach for these services)

The pre-built scripts run inside the browser tab using React synthetic events. They handle searching for the service, filling every form field, scrolling to the Save button, and clicking it. **You do not write any Playwright code for a GROUP A service.** The only thing you do is read the file and inject its content into the browser.

**Exact steps — do not deviate:**

1. **Once, at the very start of GROUP A:** navigate to `https://calculator.aws/#/addService` and select "Search all services". Do NOT repeat this before each script.

2. For each GROUP A service:
   a. Use the **Read tool** to read `.github/skills/aws-sandbox-proposal-master/scripts/calculator/{ServiceName}.js`. Note the `config` object keys.
   b. In a Playwright block, paste the **entire file content verbatim** as a string into `page.evaluate()`, with your values filled into the `})({...})` override block at the bottom:
      ```javascript
      await page.evaluate(`
      (async function configure...(params) {
        // ... full file content pasted here verbatim — do not shorten or rewrite it ...
      })({
        region: 'Asia Pacific (Mumbai)',
        numberOfRequests: 4000000,
        requestDurationMs: 300,
        memoryMainValue: 1024,
      });
      `);
      await page.waitForURL('**/addService**', { timeout: 30000 }).catch(() =>
        page.waitForTimeout(8000)
      );
      await page.waitForLoadState('networkidle');
      ```
   c. **Both wait lines are required.** `waitForURL` waits for the post-save redirect. `waitForLoadState('networkidle')` waits for React to finish rendering. Without both, the next script starts on a page that is still loading.

3. Watch the console output:
   - **`[ServiceName] Saved successfully!`** → done, inject the next script immediately (no `page.goto` needed)
   - **`console.warn` lines for specific fields** → the script already saved but some fields were skipped. Re-navigate to `https://calculator.aws/#/addService`, search the service, click Configure, manually fix only the warned fields, click Save. Do NOT re-run the full script — it will add a duplicate.
   - **`Configure button not found`** → fall back to GROUP B manual path for this service only

> **Why this approach?** Playwright's outer `page.fill()` and `page.locator().click()` do not trigger React's internal state updates. The form fields appear filled to the eye but React sees them as empty, so the Save button stays hidden — causing the "element is not visible" timeout. The pre-built scripts use React synthetic events (`dispatchEvent`) from inside the browser tab, which React does see. This is why injecting the full script via `page.evaluate()` works and outer Playwright does not.

**Do NOT write any of these for a GROUP A service:**
- Custom functions (`addLambda`, `setInputByAriaContains`, `configureService`, etc.)
- `page.fill()`, `page.locator()`, `page.click()` calls targeting the service form
- `page.goto` before each script
- Any code that replicates what the pre-built script already does internally

**Do NOT use** `discover_and_generate.js`, `validate_scripts.js`, or `validate_console_runs.js` — those are tooling scripts, not calculator automation scripts.

### After GROUP B: Write the script for next time

**Every time you successfully add a GROUP B service via manual Playwright, you must immediately write a new `.js` file for it** at:

```
.github/skills/aws-sandbox-proposal-master/scripts/calculator/{ExactServiceName}.js
```

Where `{ExactServiceName}` is the exact name from `assets/aws_services.json` (the same name used to search in the calculator), with spaces replaced by underscores — e.g. `Amazon_Kinesis_Data_Streams.js`.

#### What the script must do

The script must replicate — using React synthetic events — exactly the same steps you just performed manually with Playwright. It must:

1. Search for the service by name
2. Click Configure
3. Set the region
4. Fill every numeric or dropdown field you touched
5. Click "Save and add service"
6. Print `[ServiceName] Saved successfully!` on success

#### Script template — use this structure exactly

The structure must match the existing scripts precisely. Read `scripts/calculator/AWS Lambda.js` as the reference — every generated script follows the same 4-phase pattern with the same helper set.

```javascript
/**
 * {Exact Service Name} - AWS Pricing Calculator Script
 *
 * Service name  : {Exact Service Name}
 * Configure URL : https://calculator.aws/#/createCalculator/{ServiceSlug}
 *
 * Auto-generated after GROUP B manual fill on {date}.
 * Inject via page.evaluate() — do NOT use require/fs.
 */

(async function configure{ShortName}(params) {

  // -- DEFAULT CONFIGURATION -------------------------------------------------
  // Every field touched during the manual GROUP B fill appears here.
  // Defaults are realistic mid-range values for a medium-scale workload.
  // PRICING IMPACT: true = changing this value changes the monthly estimate.
  const config = {
    // Region | PRICING IMPACT: true
    region: params?.region ?? 'Asia Pacific (Mumbai)',

    // {Field description} | PRICING IMPACT: {true/false}
    {paramName}: params?.{paramName} ?? {sensibleDefault},

    // Add one entry per field you filled during the manual run.
    // Use the same naming convention as AWS Lambda.js:
    //   numberOfX, durationMs, storageGb, requestsPerMonth, retentionHours, etc.
    // Choose defaults that represent a realistic SMB/mid-scale workload —
    // not minimal (1 request/month) and not production-max.
    // Examples by field type:
    //   request counts  → 1_000_000 to 10_000_000 per month
    //   data sizes      → 100 GB
    //   durations       → realistic for the service (e.g. 200ms for Lambda, 24h for Kinesis retention)
    //   instance counts → 1 or 2 nodes
    //   storage         → 100–500 GB
  };

  console.log('[{ShortName}] Starting with config:', config);

  // -- HELPERS ---------------------------------------------------------------

  function jitter(min = 80, max = 350) {
    return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));
  }
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  function scrollTo(el) { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

  function setInputValue(el, value) {
    if (!el) return;
    scrollTo(el);
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, String(value));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function waitForElement(selector, timeout = 12000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const el = document.querySelector(selector);
      if (el) return el;
      await wait(300);
    }
    console.warn('[{ShortName}] waitForElement timed out:', selector);
    return null;
  }

  function findInputsByAriaContains(text) {
    return [...document.querySelectorAll('input, textarea')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(text));
  }

  async function setFieldByAria(text, value, index = 0) {
    const all = findInputsByAriaContains(text);
    const el = all[index] || null;
    if (!el) { console.warn('[{ShortName}] Field not found:', text, 'index', index); return; }
    await jitter();
    setInputValue(el, value);
    await jitter(100, 300);
  }

  async function clickRadioByExactAria(text) {
    const radio = [...document.querySelectorAll('input[type="radio"]')]
      .find(r => (r.getAttribute('aria-label') || '') === text);
    if (!radio) { console.warn('[{ShortName}] Radio not found:', text); return; }
    if (!radio.checked) { scrollTo(radio); await jitter(); radio.click(); await jitter(100, 300); }
  }

  // -- PHASE 1 : NAVIGATE ----------------------------------------------------

  if (!window.location.hash.includes('/addService') &&
      !window.location.hash.includes('/createCalculator/{ServiceSlug}')) {
    window.location.hash = '#/addService';
    await wait(2500);
  }

  // -- PHASE 2 : SEARCH AND CONFIGURE ----------------------------------------

  if (window.location.hash.includes('/addService')) {
    const searchAllRadio = [...document.querySelectorAll('input[type="radio"]')]
      .find(r => (r.closest('label, div')?.textContent || '').includes('Search all services'));
    if (searchAllRadio && !searchAllRadio.checked) {
      scrollTo(searchAllRadio); await jitter(200, 400); searchAllRadio.click(); await wait(800);
    }

    const searchBox = await waitForElement(
      'input[placeholder="Search for a service"], input[aria-label="Find Service"], input[role="searchbox"]'
    );
    if (searchBox) {
      scrollTo(searchBox); await jitter(200, 500);
      setInputValue(searchBox, '{Exact Service Name}');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' &&
                 b.closest('li, article')?.textContent?.includes('{Exact Service Name}'));
    if (configBtn) {
      scrollTo(configBtn); await jitter(250, 600); configBtn.click(); await wait(5000);
    } else {
      console.warn('[{ShortName}] Configure button not found'); return;
    }
  }

  // -- PHASE 3 : FILL FORM ---------------------------------------------------
  // Use the exact aria-label strings observed during the manual GROUP B fill.
  // Use setFieldByAria() for numeric inputs, clickRadioByExactAria() for radio buttons.
  // If a field has multiple inputs with the same aria-label, use the index param.

  await waitForElement('h1, input[aria-label*="Region"]', 15000);

  // Region dropdown — copy the pattern from Amazon DynamoDB.js or Amazon SQS.js
  // (find the region button, click it, find the option, click it)

  // {Fill each field here, one call per field}
  await setFieldByAria('{exact aria-label of field 1}', config.{paramName1});
  await setFieldByAria('{exact aria-label of field 2}', config.{paramName2});
  // ...

  // -- PHASE 4 : SAVE --------------------------------------------------------

  await jitter(400, 800);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');
  if (saveBtn) {
    scrollTo(saveBtn); await jitter(300, 600);
    saveBtn.click();
    console.log('[{ShortName}] Saved successfully!');
  } else {
    console.warn('[{ShortName}] Save and add service button not found');
  }

})({
  // Override defaults for this specific proposal run.
  // Only list the params that differ from the defaults above.
  // Example:
  //   region: 'US East (N. Virginia)',
  //   numberOfShards: 5,
  //   retentionHours: 168,
});
```

#### Rules for the generated script

- **Use `params?.field ?? defaultValue`** for every config entry — never `params.field` (crashes if params is undefined) and never a bare literal (makes the value non-overridable)
- **Defaults must be realistic mid-range values** — not 1 (too minimal to be useful) and not the proposal's production numbers (those belong in the `})({...})` override block at call time). Think: what would a typical SMB workload look like?
  - Request counts: 1 000 000–10 000 000 per month
  - Data/storage: 100–500 GB
  - Durations: realistic for the service (e.g. 200 ms for a Lambda, 24 h for a Kinesis stream retention)
  - Node/instance counts: 1–2
- **Use the same helper set** (jitter, wait, scrollTo, setInputValue, waitForElement, findInputsByAriaContains, setFieldByAria, clickRadioByExactAria) — do not invent new helpers; the existing ones cover every case
- **Use exact aria-label strings** from the live DOM — copy them character-for-character from what you observed during the manual fill; do not paraphrase
- **The `})({...})` override block at the bottom** is where the proposal's actual values go when the script is injected during a run — leave it with only comments in the generated file; the agent fills it at inject time
- **Test mentally:** re-read the script after writing and confirm every field touched during the manual fill has a corresponding `setFieldByAria` or `clickRadioByExactAria` call

#### After writing the script

Update the "Available scripts" count/list in this SKILL.md header to include the newly created service, so future runs know it is now GROUP A.

## When to Use This Skill

Activate when the user:
- Asks to create / update an AWS Sandbox proposal or Innovation Plan
- Needs an architecture diagram for a proposal
- Wants a cost estimate via **AWS Pricing Calculator** for a proposal
- Mentions keywords: sandbox, proposal, innovation plan, partner co-sell, AWS funding

## Deliverables & Required Output Files

All generated artifacts must be saved inside a **dedicated project subfolder**:

```
output/{ProjectName}/
├── context.json           ← proposal data (Step 2)
├── architecture.png       ← architecture diagram (Step 3A)
└── Proposal.docx          ← final proposal document (Step 5)
```

| Artifact | Type | Required | Output Path |
|----------|------|----------|-------------|
| Context JSON | JSON | Yes | `output/{ProjectName}/context.json` |
| Architecture Diagram | PNG | Yes | `output/{ProjectName}/architecture.png` |
| Proposal Document | DOCX | Yes | `output/{ProjectName}/Proposal.docx` |

`{ProjectName}` is constructed as **`{SafeTitle}_{YYYYMMDD_HHMM}`** where:
- `{SafeTitle}` = `sandbox.basics.title` with spaces replaced by `_`, all non-alphanumeric characters removed, and truncated to 60 characters
- `{YYYYMMDD_HHMM}` = current date-time at the moment the folder is created (e.g. `20260330_1423`)

This guarantees a **unique folder for every run** — two proposals with the same title on the same day get different folders, and no run ever overwrites another.

Example: title `"AI-Powered Smart Healthcare Monitoring"` on 2026-03-30 at 14:23 → `output/AI-Powered_Smart_Healthcare_Monitoring_20260330_1423/`

Create the subfolder with `mkdir -p output/{ProjectName}` at the start of Step 2 before writing any file.

## End-to-End Workflow

```
┌─────────────────────────────────┐
│  Step 0: Environment Check      │  ← RUN FIRST
└──────────────┬──────────────────┘
               │
┌─────────────────────────────────┐
│  Step 1: Gather Business Context│
└──────────────┬──────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  Step 2: Build Proposal Plan     │
│  (details, business, phases)     │
└──────────────┬───────────────────┘
               │
       ┌───────┴───────┐   ← Both run in PARALLEL
       ▼               ▼
┌────────────┐  ┌───────────────┐
│ Step 3A:   │  │ Step 3B:      │
│ Arch       │  │ AWS Calculator│
│ Diagram    │  │ Browser Auto  │
└─────┬──────┘  └──────┬────────┘
      │                │
      └────────┬────────┘
               ▼
┌───────────────────────────────────┐
│  Step 4: Assemble Context JSON    │
│  + Save to file                   │
└──────────────┬────────────────────┘
               ▼
┌───────────────────────────────────┐
│  Step 5: Generate DOCX            │
│  Run scripts/generate_proposal.py │
└──────────────┬────────────────────┘
               ▼
┌───────────────────────────────────┐
│  Step 6: Review (review-skill)    │  ← MANDATORY — runs R1→R4 checks
│  Static + Live calculator audit   │
└──────────────┬────────────────────┘
               ▼
┌───────────────────────────────────┐
│  Step 7: Deliver to User          │
└──────────────┬────────────────────┘
               ▼
┌────────────────────────────────────────┐
│  Step 8: Deploy Demo Architecture      │
│  (aws-cdk-development → CF template    │
│   → aws cloudformation deploy)         │
└────────────────────────────────────────┘

```

## I/O Contract (All Steps)

Use this format for every step:
- Input: source file/data required before the step starts
- Output: data/file produced by the step
- Save rule: whether output must be persisted to `output/`
- Verification: minimal check before moving to next step

Pipeline data dependency:
- Step 1 -> Step 2 -> (`output/{ProjectName}/context.json`)
- Step 2 -> Step 3A -> (`output/{ProjectName}/architecture.png`)
- Step 2 -> Step 3B -> (runtime tool loop + context write-back)
- Step 4 finalizes context -> Step 5 generates DOCX -> (`output/{ProjectName}/Proposal.docx`)
- Step 5 -> Step 6 (review-skill R1→R4) -> review report (`output/{ProjectName}/review_report.txt`)
- Step 6 PASS -> Step 7 delivers to user; Step 6 FAIL -> fix the failing check, re-run from the relevant step

Hard dependency rule:
- Step 3A input source is only `output/{ProjectName}/context.json` from Step 2.
- Step 3B input source is only `output/{ProjectName}/context.json` from Step 2.
- Steps 3A and 3B can run in parallel once Step 2 file persistence is complete.

### Step 0 — Environment Check (MANDATORY)

**Run this before anything else.** The bundled `scripts/diagrams_resolver.py` checks all required dependencies and guides installation of anything missing.


```bash
python <skill_dir>/scripts/diagrams_resolver.py check
```

Expected output:
```
✅ Python 3.10+
✅ diagrams <version>
✅ Graphviz: dot - graphviz version ...
✅ docxtpl <version>
✅ python-docx <version>

✅ All environment checks passed.
```

**If any check fails, resolve it before continuing:**

| Failure | Fix |
|---------|-----|
| `diagrams not installed` | `pip install diagrams` |
| `docxtpl not installed` | `pip install docxtpl python-docx` |
| `Graphviz 'dot' not found` | Windows: `winget install graphviz` · macOS: `brew install graphviz` · Ubuntu: `sudo apt install graphviz` |
| `Python < 3.10` | Use `python3` / `py -3.12` · or specify full path to a Python ≥ 3.10 interpreter |

> **Agent tip:** If pip installs fail or packages are installed but still not importable (common with multiple Python versions), find the correct interpreter path: `where python` / `which python`. Use the interpreter that pip installed to. Use `python <path>/diagrams_resolver.py check --auto-install` to let the script handle pip automatically.

**Input:** Local Python/runtime environment.

**Output:** Dependency check report in stdout.

**Save rule:** No file required.

**Verification:** All checks passed before continuing.

### Step 1 — Gather and Interpret Business Context

> **Run-through rule: never stop to ask for information.** Whether the input is a raw paragraph or structured fields, always complete the full pipeline in a single pass. Use `<TODO>` placeholders for fields that cannot be inferred. Do not present a confirmation prompt and wait for the user's reply before proceeding.

#### Detect Input Mode

| Mode | Signal | Action |
|------|--------|--------|
| **Raw prompt** | Free-form paragraph / description / vague idea | Run all four parser stages below, then proceed immediately to Step 2 |
| **Structured** | User provides labelled fields | Fill any gaps with defaults / `<TODO>`, then proceed immediately to Step 2 |

In both modes: **proceed without asking**. The DOCX will contain `<TODO>` markers wherever human input is still needed — the user can fill those in after reviewing the document.

---

#### Intelligent Prompt Parser (Raw Prompt Mode)

**Step 1-P1: Extract the Solution Domain**

Read the description and identify:
- What problem is being solved
- Who the target users are
- What outputs the system produces

See [references/PROMPT_PARSER.md](references/PROMPT_PARSER.md) for the full domain classification table and worked example.

**Step 1-P2: Map Capabilities to AWS Services**

Read `assets/aws_services.json`. For each capability in the description, pick the best-fit AWS service. Verify every selected name exists in `assets/aws_services.json` before adding it to `service_list`. Typical proposals have 8–15 services.

| Described capability | AWS service (exact name) |
|----------------------|--------------------------|
| IoT sensors / device telemetry | `AWS IoT Core` |
| Real-time streaming ingest | `Amazon Kinesis Data Streams` |
| Stream delivery to storage | `Amazon Data firehose` |
| Data lake / object storage | `Amazon Simple Storage Service (S3)` |
| ETL / data catalogue | `AWS Glue` |
| Time-series metrics | `Amazon Timestream` |
| Stream processing / Flink | `Amazon Managed Service for Apache Flink` |
| Data warehouse | `Amazon Redshift` |
| Serverless SQL on S3 | `Amazon Athena` |
| ML training and inference | `Amazon SageMaker` |
| Generative AI / LLMs | `Amazon Bedrock` |
| Demand forecasting | `Amazon Forecast` |
| Serverless compute | `AWS Lambda` |
| Workflow orchestration | `AWS Step Functions` |
| REST API layer | `Amazon API Gateway` |
| Event bus / decoupling | `Amazon EventBridge` |
| Notifications | `Amazon Simple Notification Service (SNS)` |
| Async queuing | `Amazon Simple Queue Service (SQS)` |
| Relational (MySQL) | `Amazon Aurora MySQL-Compatible` |
| Relational (PostgreSQL) | `Amazon Aurora PostgreSQL-Compatible DB` |
| NoSQL / key-value | `Amazon DynamoDB` |
| Caching | `Amazon ElastiCache` |
| Search | `Amazon OpenSearch Service` |
| Containers (serverless) | `AWS Fargate` |
| Containers (Kubernetes) | `Amazon EKS` |
| BI dashboards | `Amazon QuickSight` |
| Monitoring / alarms | `Amazon CloudWatch` |
| Identity / access control | `AWS IAM Access Analyzer` |
| Encryption keys | `AWS Key Management Service` |
| Secrets | `AWS Secrets Manager` |
| Audit trail | `AWS CloudTrail` |
| CDN | `Amazon CloudFront` |
| DNS | `Amazon Route 53` |
| VPC / networking | `Amazon Virtual Private Cloud (VPC)` |

**Step 1-P3: Detect Region**

Scan **both the user's prompt AND any surrounding conversation** for geographic signals and map to the closest AWS region:

| Signal (city / country / keyword) | AWS Region |
|-----------------------------------|------------|
| Taiwan, Taipei | `Asia Pacific (Taipei)` |
| Singapore | `Asia Pacific (Singapore)` |
| Japan, Tokyo | `Asia Pacific (Tokyo)` |
| Korea, Seoul | `Asia Pacific (Seoul)` |
| Australia, Sydney | `Asia Pacific (Sydney)` |
| India, Mumbai | `Asia Pacific (Mumbai)` |
| Hong Kong | `Asia Pacific (Hong Kong)` |
| Jakarta, Indonesia | `Asia Pacific (Jakarta)` |
| Germany, Frankfurt | `Europe (Frankfurt)` |
| Ireland, Dublin | `Europe (Ireland)` |
| UK, London | `Europe (London)` |
| Paris, France | `Europe (Paris)` |
| Stockholm, Sweden | `Europe (Stockholm)` |
| US East, Virginia, New York | `US East (N. Virginia)` |
| US West, Oregon, California | `US West (Oregon)` |
| Canada, Toronto | `Canada (Central)` |
| Brazil, São Paulo | `South America (São Paulo)` |
| Middle East, UAE, Dubai | `Middle East (UAE)` |
| No geographic signal | `US East (N. Virginia)` |

**Step 1-P4: Populate All Fields — Use `<TODO>` for Unknown Human Fields**

Derive every proposal field. For fields that require real human input and cannot be inferred, write the literal string `<TODO>` as the value — these will appear as visible placeholders in the final DOCX so the user knows exactly what to fill in.

| Field | Rule |
|-------|------|
| `title` | Derive from domain (e.g. "AI-Powered Smart Healthcare Monitoring & Early Warning System") |
| `partner` | `<TODO>` |
| `contact.name` | `<TODO>` |
| `contact.title` | `<TODO>` |
| `contact.email` | `<TODO>` |
| `pdm` | `<TODO>` |
| `sa` | `<TODO>` |
| `solution_type` | Infer from domain |
| `customer_type` | Infer from described users |
| `pain_point` | Summarise the problem (1–2 sentences) |
| `summary` | Write a 3–5 sentence executive summary |
| `features` | List 5–8 bullet points from capabilities mentioned |
| `justification` | Write 2–3 sentences on business value |
| `region` | Detect from Step 1-P3 |
| `aws_funding` | `"USD 80,000"` |
| `labor_cost` | `"USD 60,000"` |
| `total_cost` | `"USD 140,000"` |
| `start_date` | First day of month 3 months from today |
| `end_date` | 6 months after start |
| `release_date` | 1 month after end |
| `total_mandays` | ≤8 services → 60, 9–12 → 90, ≥13 → 120 |
| `phases` | 4 phases: Discovery → Foundation → Core Build → Delivery |
| `calculator_link` | `""` (empty; filled by Step 3B) |
| `applied_services` | `[]` (empty; filled by Step 3B) |
| `public_or_not` | `"No"` |
| `case_study` | `"Yes"` |
| `details.update.customer` | `"N/A"` (revision history field — blank for new proposals) |
| `details.update.feature` | `"N/A"` |
| `details.update.opportunity` | `"N/A"` |
| `details.update.pain_point` | `"N/A"` |
| `details.update.publish_date` | `"N/A"` |
| `business.additional_info` | `"N/A"` |

**Proceed immediately to Step 2** — do not wait for user confirmation.

---

#### Structured Input Mode

When the user provides structured fields: fill any gaps with the defaults from Step 1-P4 above (using `<TODO>` for unknown human fields). Then proceed immediately to Step 2.

**Input:** User-provided business and solution information (structured or raw).

**Output:** All proposal fields populated in memory — either from the prompt, inferred, or `<TODO>`.

**Save rule:** No file required at this step.

**Verification:** Every required field has a value (real, inferred, or `<TODO>`). No field is blank.

### Step 2 — Build Proposal Plan

Organize the information into the context JSON structure. Use Markdown in text fields — the DOCX generator renders bold, italic, headers, lists, and inline code.

#### Step 2A Output Contract (MANDATORY)

**First, compute the unique project name and create the subfolder:**

```bash
# {SafeTitle} = title with spaces→underscores, non-alphanumeric removed, max 60 chars
# {YYYYMMDD_HHMM} = current timestamp
# Example: output/AI-Powered_Smart_Healthcare_Monitoring_20260330_1423/

mkdir -p "output/{SafeTitle}_{YYYYMMDD_HHMM}"
```

Store the computed `{ProjectName}` string and use it consistently for all three artifact paths in this run. Never reuse a folder from a previous run.

Persist the plan to:

```text
output/{ProjectName}/context.json
```

Every artifact for this project — context JSON, architecture PNG, and Proposal DOCX — goes inside `output/{ProjectName}/`. This keeps runs for different projects separate and prevents files from one proposal overwriting another.

The file is the only accepted source for Step 3A and Step 3B. Add these fields:

- `sandbox.business.region` (required)
- `sandbox.business.service_list` (required)

`service_list` item format — use the **exact calculator display name** from `assets/aws_services.json`:

```json
{
  "service_name": "Amazon Simple Storage Service (S3)",
  "calculator_config": {
    "storage_gb": 10,
    "put_requests": 400,
    "get_requests": 400
  },
  "diagram_tags": ["storage", "edge"]
}
```

> **Critical:** `service_name` must match the exact string in `assets/aws_services.json`. This name is used directly to search the AWS Calculator. Wrong names cause missed services. See Step 3B for the lookup procedure.

Steps 3A, 3B, and 3C must fail-fast if either field is missing.

**Input:** Structured data from Step 1.

**Output:** `output/{ProjectName}/context.json`.

**Save rule:** Required.

**Verification:** JSON exists, parses, and includes `sandbox.business.region` and non-empty `sandbox.business.service_list`.

#### Step 2B — Write Immutable Service Reference (MANDATORY)

Immediately after saving `context.json`, snapshot the planned service names into a separate file. This file is the tamper-evident ground truth used by Steps 4, 5, and 6 to verify the calculator was completed for the full original set — not a reduced subset.

```bash
# Replace {ProjectName} with the actual computed project folder name before running.
# Example: proj="output/Serverless_Fraud_Detection_20260401_1705"
proj="output/{ProjectName}"
python -c "
import json, sys
from pathlib import Path
proj = '$proj'
ctx = json.loads(Path(proj + '/context.json').read_text(encoding='utf-8'))
names = [s['service_name'] for s in ctx['sandbox']['business']['service_list']]
assert len(names) >= 3, f'Too few services ({len(names)}): a valid proposal needs at least 3'
Path(proj + '/expected_services.json').write_text(json.dumps(names, indent=2), encoding='utf-8')
print('Locked', len(names), 'expected services:', names)
"
```

> **Do NOT modify `expected_services.json` after this point.** It is written once here and read-only from this point forward. Steps 4, 5, and 6 all compare against this file — not against `service_list` in context.json, which can be overwritten. If you are tempted to modify it: do not. Fix the calculator estimate instead.

### Step 3A — Generate Architecture Diagram (parallel-eligible with Step 3B)

**Before writing diagram code, resolve correct import names** using the bundled resolver:

```bash
# Resolve a specific service
python <skill_dir>/scripts/diagrams_resolver.py resolve opensearch aws.analytics
# → AmazonOpensearchService

# Generate all import statements at once
python <skill_dir>/scripts/diagrams_resolver.py imports \
  "opensearch:aws.analytics" "ecs:aws.compute" "bedrock:aws.ml" \
  "lambda:aws.compute" "s3:aws.storage" "cloudfront:aws.network"
```

Then write Python code using the `diagrams` library. Follow [references/DIAGRAM_GUIDE.md](references/DIAGRAM_GUIDE.md).

**Critical rules:**
- `show=False` in `Diagram()` constructor
- English-only node labels
- Import from `diagrams.*` hierarchy — **always resolve names first** with `diagrams_resolver.py`
- Save the PNG output path for the context JSON

Execute the code in the user's environment. If it fails due to imports, use `diagrams_resolver.py resolve` to find the correct name and retry.

Before finalizing, record the rendered service names to `sandbox.architecture.applied_services`.
If this set does not match `sandbox.business.service_list[].service_name`, fail-fast and report missing/extra services.

**Input:** `output/{ProjectName}/context.json`.

**Output:**
- `output/{ProjectName}/architecture.png`
- In-memory updates for:
  - `sandbox.architecture.diagram`
  - `sandbox.architecture.applied_services`

**Save rule:** PNG file is required under `output/`.

**Verification:** PNG exists and applied service set matches `sandbox.business.service_list`.

### Step 3B — AWS Pricing Calculator Automation (MANDATORY — parallel-eligible with 3A)

Open the browser, add every service from `service_list` to the AWS Pricing Calculator, get a real share link, and write it to `context.json`.

Read these two files before opening the browser:
- **`references/AWS_CALCULATOR_GUIDE.md`** — exact steps and code patterns for adding services (GROUP A script injection and GROUP B manual form fill)
- **`references/CALCULATOR_SIZING.md`** — how to size each service, which unit each field expects, and the cost sanity check to run before clicking Share

Do not improvise a different approach. The key rules are:
- Services that have a `.js` file in `scripts/calculator/` must use that script (read it with the Read tool, paste it into `page.evaluate()`)
- Services without a script are filled manually using Playwright (`page.fill`, `page.locator`, `page.click`)
- Do not write your own helper functions — the pre-built scripts already have all helpers inside them
- Do not use `page.accessibility` or Chrome DevTools MCP — use only the VS Code browser Playwright tools
- Use the real proposal numbers, not minimal placeholder values
- After all services are added, run the cost sanity check from `CALCULATOR_SIZING.md`, then get the share link, verify it loads correctly in the browser, then write it to `context.json`

**Input:** `output/{ProjectName}/context.json`, `assets/aws_services.json`.

**Output:** `sandbox.business.calculator_link` and `sandbox.business.applied_services` written back to `context.json`.

**Verification:** `calculator_link` is a real `https://calculator.aws/#/estimate?id=<hash>` URL, confirmed by navigating to it in the browser and seeing all services load correctly.

### Step 4 — Assemble Context JSON

Merge all collected data into a single JSON file:
- All business context from Steps 1-2
- `sandbox.architecture.diagram` = PNG path from Step 3A
- `sandbox.business.calculator_link` = share URL from Step 3B
- `sandbox.architecture.applied_services` = service names used by Step 3A
- `sandbox.business.applied_services` = service names used by Step 3B

**Hard gate — run this verification before proceeding to Step 5:**

```bash
python -c "
import json, sys
from pathlib import Path
proj = 'output/{ProjectName}'
ctx = json.loads(Path(proj + '/context.json').read_text(encoding='utf-8'))
biz = ctx['sandbox']['business']
link = biz.get('calculator_link', '')
applied = biz.get('applied_services', [])
errors = []
# 1. Calculator link must be real
if not (link and 'calculator.aws' in link and 'estimate?id=' in link):
    errors.append('calculator_link missing or invalid: ' + repr(link))
# 2. Compare against EXPECTED (locked at Step 2) — not against service_list (which may have been tampered)
exp_path = Path(proj + '/expected_services.json')
if not exp_path.exists():
    errors.append('expected_services.json not found — was Step 2B completed?')
else:
    expected = json.loads(exp_path.read_text(encoding='utf-8'))
    if len(expected) < 3:
        errors.append(f'Only {len(expected)} service(s) planned — minimum 3 required for a valid proposal')
    if sorted(applied) != sorted(expected):
        errors.append(f'applied_services does not match expected:\\n  applied:  {sorted(applied)}\\n  expected: {sorted(expected)}')
# 3. Architecture PNG must exist
if not Path(proj + '/architecture.png').exists():
    errors.append('architecture.png not found')
if errors:
    print('STEP 4 BLOCKED:')
    for e in errors: print(' -', e)
    sys.exit(1)
print('Step 4 OK — all', len(applied), 'services verified, calculator link present')
"
```

If this script exits with code 1: **stop here**. The most common cause is `applied_services` not matching `expected_services.json` — meaning the calculator estimate has fewer services than Step 2 planned. Fix the estimate (add missing services), re-run Step 3B round-trip verification, and re-run this gate.

Do NOT proceed if:
- `sandbox.business.calculator_link` is empty, `""`, or a placeholder — complete Step 3B
- `sandbox.business.applied_services` is empty or does not match `service_list`
- `sandbox.architecture.applied_services` does not match `service_list`
- `architecture.png` does not exist on disk

Save the JSON to `output/{ProjectName}/context.json` for reproducibility and future updates.

**Input:** Step 2 context data + Step 3A/3B outputs.

**Output:** Finalized `output/{ProjectName}/context.json`.

**Save rule:** Required.

**Verification:** `service_list`, `architecture.applied_services`, and `business.applied_services` are consistent.

### Step 5 — Generate the DOCX

> **HARD GATE — run this check FIRST. If it fails, go back to Step 3B before touching generate_proposal.py.**

```bash
python -c "
import json, sys
from pathlib import Path
proj = 'output/{ProjectName}'
ctx = json.loads(Path(proj + '/context.json').read_text(encoding='utf-8'))
biz = ctx['sandbox']['business']
link = biz.get('calculator_link', '')
applied = biz.get('applied_services', [])
errors = []
if not (link and 'calculator.aws' in link and 'estimate?id=' in link):
    errors.append('calculator_link invalid: ' + repr(link))
exp_path = Path(proj + '/expected_services.json')
if exp_path.exists():
    expected = json.loads(exp_path.read_text(encoding='utf-8'))
    if sorted(applied) != sorted(expected):
        errors.append(f'applied_services {sorted(applied)} != expected {sorted(expected)}')
    if len(applied) < 3:
        errors.append(f'Only {len(applied)} service(s) — minimum 3 required')
if errors:
    print('STEP 5 BLOCKED — complete Step 3B for ALL services before generating DOCX:')
    for e in errors: print(' -', e)
    sys.exit(1)
print('Step 5 OK — proceeding to generate_proposal.py with', len(applied), 'services and link:', link)
"
```

If this script exits with code 1: **stop**. Do not run `generate_proposal.py`. Return to Step 3B, add the missing services to the calculator, re-run round-trip verification, write back `applied_services` and `calculator_link`, then re-run this gate.

---

The script binds the context JSON onto the standard **Sandbox Innovation Plan Template** (`assets/Sandbox Innovation Plan Template_v2.docx`) using `docxtpl` (Jinja2 for Word). The template contains Jinja2 placeholders (`{{sandbox.details.summary}}`) and row loops (`{%tr for phase in sandbox.plan.total_phases%}`) that are filled automatically.

1. Ensure dependencies are installed:
   ```bash
   pip install docxtpl python-docx
   ```

2. Run the bundled generator script:
   ```bash
   python <skill_dir>/scripts/generate_proposal.py output/{ProjectName}/context.json --output output/{ProjectName}/Proposal.docx
   ```

   Or invoke the function directly in Python:
   ```python
   import json, sys
   from pathlib import Path
   sys.path.insert(0, str(Path('<skill_dir>/scripts')))
   from generate_proposal import generate_proposal

   context = json.loads(Path('context.json').read_text())
   generate_proposal(context, Path('output/{ProjectName}/Proposal.docx'))
   ```

   To use a custom template:
   ```bash
   python <skill_dir>/scripts/generate_proposal.py output/{ProjectName}/context.json -o output/{ProjectName}/Proposal.docx -t /path/to/custom_template.docx
   ```

The script:
- Validates all required fields (exits with clear error on missing data)
- **Enforces `calculator_link` as a required non-empty field** — exits with code 1 and an explicit error message if the link is empty, missing, or does not match the `https://calculator.aws/#/estimate?id=<hash>` format. This is a hard script-level block, not a warning. There is no flag or override to bypass it.
- Reshapes the JSON to match the template's Jinja2 placeholder structure
- Auto-converts Markdown strings to plain text for split-run template cells; converts to `docxtpl.RichText` for other fields
- Embeds the architecture diagram as an `InlineImage` sized to fit within page bounds (max 6" × 7")
- Renders the template and saves the final DOCX

**Input:** `output/{ProjectName}/context.json`.

**Output:** `output/{ProjectName}/Proposal.docx`.

**Save rule:** Required.

**Verification:** DOCX exists and opens with all fields rendered.

### Step 6 — Review (MANDATORY — runs review-skill R1→R5)

> **This step is not optional.** Before delivering to the user, the proposal must pass an independent consistency audit using the review-skill at `.github/skills/review-skill/SKILL.md`. Run all five review steps now as part of this pipeline.

Execute the full review-skill workflow on the project just generated:

**R1 — Load context:** Read `output/{ProjectName}/context.json`. Extract `service_list`, `business.applied_services`, `architecture.applied_services`, and `calculator_link`.

**R2 — Static service set check:** Compare all three service sets against each other and against `expected_services.json`. Run this check script:

```bash
python -c "
import json, sys
from pathlib import Path
proj = 'output/{ProjectName}'
ctx = json.loads(Path(proj + '/context.json').read_text(encoding='utf-8'))
biz = ctx['sandbox']['business']
arch = ctx['sandbox']['architecture']
planned   = set(s['service_name'].strip().lower() for s in biz.get('service_list', []))
calc_app  = set(s.strip().lower() for s in biz.get('applied_services', []))
diag_app  = set(s.strip().lower() for s in arch.get('applied_services', []))
exp_path  = Path(proj + '/expected_services.json')
expected  = set(s.strip().lower() for s in json.loads(exp_path.read_text())) if exp_path.exists() else planned
errors = []
if calc_app != expected:
    errors.append('Plan vs Calculator: missing=' + str(expected - calc_app) + ' extra=' + str(calc_app - expected))
if diag_app and diag_app != expected:
    errors.append('Plan vs Diagram: missing=' + str(expected - diag_app) + ' extra=' + str(diag_app - expected))
dup = [s for s in biz.get('applied_services', []) if biz.get('applied_services', []).count(s) > 1]
if dup:
    errors.append('Duplicates in applied_services: ' + str(list(set(dup))))
if errors:
    print('R2 FAIL:')
    for e in errors: print(' -', e)
    sys.exit(1)
print('R2 PASS — all', len(expected), 'services consistent across plan / calculator / diagram')
"
```

**R3 — Live calculator audit:** Navigate to `calculator_link` in the browser. Set page size to 50 rows. Read the full service table. Confirm count and names match `expected_services.json`.

**R4 — DOCX content verification:** Run `verify_proposal.py` against the generated document. This checks 26 mandatory fields and renders — it is a hard gate:

```bash
python .github/skills/aws-sandbox-proposal-master/scripts/verify_proposal.py \
    output/{ProjectName}/Proposal.docx \
    output/{ProjectName}/context.json
```

If `verify_proposal.py` exits with code 1: **do not proceed to R5 or Step 7**. Fix the failing checks (see `review-skill/SKILL.md` Step R4 for remediation by failure type), then regenerate the DOCX and re-run R4.

**R5 — Generate review report:** Print the structured report to the user (format defined in `review-skill/SKILL.md` Step R5). Include results from R2 static check, R3 live audit, and R4 DOCX verification. Save it to `output/{ProjectName}/review_report.txt`.

**If any check fails:** fix the root cause first (re-run Step 3A, 3B, 4, or 5 as appropriate), then re-run Step 6 before proceeding to Step 7. Do NOT deliver a proposal that failed its own review.

**Input:** `output/{ProjectName}/context.json`, `output/{ProjectName}/Proposal.docx`, `output/{ProjectName}/expected_services.json`, browser access to `calculator_link`.

**Output:** `output/{ProjectName}/review_report.txt`, review result in memory.

**Verification:** All R1–R5 checks pass (exit code 0 on R2 script, R4 script, live count matches, report saved).

---

### Step 7 — Deliver to User

> **FINAL DELIVERY GATE — run this check BEFORE presenting anything to the user. If it fails, the run is not complete.**

```bash
python -c "
import json, sys
from pathlib import Path
proj = 'output/{ProjectName}'
ctx = json.loads(Path(proj + '/context.json').read_text(encoding='utf-8'))
biz = ctx['sandbox']['business']
link = biz.get('calculator_link', '')
applied = biz.get('applied_services', [])
errors = []
# 1. Real calculator link
if not (link and 'calculator.aws' in link and 'estimate?id=' in link):
    errors.append('calculator_link invalid or missing: ' + repr(link))
# 2. Applied services match expected (locked at Step 2)
exp_path = Path(proj + '/expected_services.json')
if exp_path.exists():
    expected = json.loads(exp_path.read_text(encoding='utf-8'))
    if sorted(applied) != sorted(expected):
        errors.append(f'applied_services mismatch:\\n  got:      {sorted(applied)}\\n  expected: {sorted(expected)}')
    if len(applied) < 3:
        errors.append(f'Only {len(applied)} service(s) — minimum 3 required')
# 3. All artifact files present
for f in ['context.json', 'architecture.png', 'Proposal.docx']:
    if not Path(proj + '/' + f).exists():
        errors.append(f'{f} not found in {proj}/')
if errors:
    print('STEP 7 BLOCKED — fix these before continuing:')
    for e in errors: print(' -', e)
    sys.exit(1)
print('Step 7 checks passed — ready to deliver.')
print('  Calculator link:', link)
print('  Services (' + str(len(applied)) + '):', applied)
"
```

If this script exits with code 1: fix the failing checks, then re-run it.

If it exits with code 0: present the complete delivery to the user:

```
Proposal complete — output/{ProjectName}/

  context.json          — proposal data
  architecture.png      — architecture diagram
  Proposal.docx         — proposal document

Calculator estimate: https://calculator.aws/#/estimate?id=<hash>
```

**Input:** `output/{ProjectName}/Proposal.docx`, `output/{ProjectName}/context.json`, and `sandbox.business.calculator_link` (must be a live URL).

**Output:** User delivery with file paths and calculator link.

**Save rule:** No new file; reuse saved output artifacts.

**Verification:** All three files exist on disk AND `calculator_link` is a valid `https://calculator.aws/#/estimate?id=<hash>` URL.

---

### Step 8 — Deploy Minimal Demo Architecture

After Step 7 passes, deploy a minimal live demo of the architecture to AWS. **This step is mandatory — do not skip it, do not ask the user if they want to deploy.**

The demo is intentionally small — a fluff stack to prove the services wire together. Its purpose is proof-of-connectivity, not production scale. Use minimal configurations only. Never use proposal calculator numbers here.

#### 8A — Identify the core deployable services

Read `output/{ProjectName}/context.json`. From `sandbox.architecture.applied_services` (or `sandbox.business.service_list` if applied_services is absent), identify the services that form the **main data flow** described in `sandbox.architecture.description`.

Filter to only services that CloudFormation can provision as real resources:

| Deployable via CloudFormation | Skip — API-only, no resource to provision |
|---|---|
| Lambda, DynamoDB, S3, SQS, SNS, API Gateway, Kinesis, EventBridge, RDS, ElastiCache, EKS, Fargate, CloudFront, Step Functions, Cognito, OpenSearch, Secrets Manager, Redshift, VPC, CloudWatch, IoT Core, Glue, ECS, MSK | Bedrock, SageMaker, Comprehend, Rekognition, Textract, Polly, Transcribe, Translate, QuickSight, and any other service that has no provisionable resource |

From the deployable set, keep only the **3 to 5 services** most central to the data flow. Drop supporting services (CloudWatch, VPC, Secrets Manager, IAM) unless they are core to the architecture — CloudWatch alarms may be included as they are lightweight and free.

#### 8B — Derive the stack name and region

- **Stack name**: `demo-{service1}-{service2}-{service3}-{YYYYMMDD}` — lowercase, hyphens, max 4 services in the name
- **Region code**: the AWS region code from `sandbox.business.region` (e.g. `ap-southeast-1` for Singapore, `ap-south-1` for Mumbai)
- **Template file**: `output/{ProjectName}/demo-stack.yaml`

#### 8C — Read the aws-cdk-development skill and deploy

Read `.github/skills/aws-cdk-development/SKILL.md` fully before writing anything.

Then follow this exact sequence:

**8C-1: Verify AWS credentials (single command):**

```bash
aws sts get-caller-identity --output json
```

If it fails, stop and tell the user their credentials are not reachable. Do not continue.

**8C-2: Write the CloudFormation template.**

Write `output/{ProjectName}/demo-stack.yaml` — a minimal CloudFormation YAML that provisions only the services from 8A and wires them together. Use these demo configurations:

| Service | CloudFormation resource | Demo config |
|---|---|---|
| AWS Lambda | `AWS::Lambda::Function` | Runtime: python3.12, memory 128 MB, timeout 30s, inline ZipFile handler that logs the event and returns 200 |
| Amazon SQS | `AWS::SQS::Queue` + `AWS::Lambda::EventSourceMapping` | VisibilityTimeout 30s; EventSourceMapping BatchSize 10 pointing at the Lambda |
| Amazon SNS | `AWS::SNS::Topic` + `AWS::SNS::Subscription` | Protocol: sqs, Endpoint: queue ARN |
| Amazon DynamoDB | `AWS::DynamoDB::Table` | BillingMode: PAY_PER_REQUEST, one attribute `pk` (String) as KeySchema HASH |
| Amazon S3 | `AWS::S3::Bucket` | No versioning, no public access |
| Amazon API Gateway (HTTP) | `AWS::ApiGatewayV2::Api` + Integration + Route | HTTP_PROXY integration to Lambda |
| Amazon Kinesis | `AWS::Kinesis::Stream` | ShardCount: 1 |
| Amazon EventBridge | `AWS::Events::Rule` | ScheduleExpression: rate(5 minutes), targets Lambda |
| Amazon CloudWatch Alarm | `AWS::CloudWatch::Alarm` | MetricName: Errors, Namespace: AWS/Lambda, threshold 1 |
| Amazon Cognito | `AWS::Cognito::UserPool` | Minimal, email auto-verify |
| AWS Step Functions | `AWS::StepFunctions::StateMachine` | Single Pass state definition |
| Amazon RDS | `AWS::RDS::DBInstance` | DBInstanceClass: db.t3.micro, Engine: mysql, AllocatedStorage: 20 — requires VPC |
| Amazon VPC (auto-add) | `AWS::EC2::VPC` + subnets | Required whenever RDS, ElastiCache, EKS, or Fargate are in the stack |

Rules for the template:
- Add an IAM Role for Lambda with `AWSLambdaBasicExecutionRole` and inline policies only for the services it interacts with (SQS, DynamoDB, S3, Kinesis, SNS — only those present in 8A)
- Add `DeletionPolicy: Delete` on all resources so teardown is clean
- Add `Outputs:` for every meaningful ARN, URL, or name the user might want
- Inline the Lambda handler as a `ZipFile` — do not reference an S3 bucket for code
- Do not add encryption, multi-AZ, or any production safety feature — this is a fluff stack

**8C-3: Validate the template:**

```bash
aws cloudformation validate-template \
  --template-body file://output/{ProjectName}/demo-stack.yaml \
  --region {region-code}
```

If validation fails, read the error, fix `demo-stack.yaml`, and retry until it exits 0.

**8C-4: Deploy:**

```bash
aws cloudformation deploy \
  --template-file output/{ProjectName}/demo-stack.yaml \
  --stack-name {stack-name} \
  --capabilities CAPABILITY_IAM \
  --region {region-code} \
  --no-cli-pager
```

Wait for the command to exit naturally. Do not interrupt it. Do not run it a second time while it is running.

If deploy exits non-zero, check the CloudFormation events:

```bash
aws cloudformation describe-stack-events \
  --stack-name {stack-name} \
  --region {region-code} \
  --query "StackEvents[?ResourceStatus=='CREATE_FAILED'].{Resource:LogicalResourceId,Reason:ResourceStatusReason}" \
  --output table --no-cli-pager
```

Read the failure reason, fix `demo-stack.yaml`, then re-run validation and deploy.

**8C-5: Confirm CREATE_COMPLETE and collect outputs:**

```bash
aws cloudformation describe-stacks \
  --stack-name {stack-name} \
  --region {region-code} \
  --query "Stacks[0].{Status:StackStatus,Outputs:Outputs}" \
  --output json --no-cli-pager
```

`StackStatus` must be `CREATE_COMPLETE`. Collect all `Outputs` values for 8D.

**8C-6: Quick smoke test (pick whichever fits the deployed services):**

- **If SNS is deployed:** publish a test message and confirm the Lambda ran via CloudWatch Logs
  ```bash
  aws sns publish --topic-arn {TopicArn} --message "demo-test" --region {region-code} --no-cli-pager
  aws logs tail /aws/lambda/{LambdaName} --format short --since 5m --region {region-code} --no-cli-pager
  ```
- **If SQS only:** send a message directly to the queue
  ```bash
  aws sqs send-message --queue-url {QueueUrl} --message-body "demo-test" --region {region-code} --no-cli-pager
  aws logs tail /aws/lambda/{LambdaName} --format short --since 5m --region {region-code} --no-cli-pager
  ```
- **If API Gateway is deployed:** curl the endpoint
  ```bash
  curl -s {ApiEndpoint}
  ```

A REPORT line in the Lambda logs confirms the function was invoked successfully.

#### 8D — Print confirmation

Once `CREATE_COMPLETE` is confirmed, print:

```
Demo deployed — {stack-name} ({region-code})

  Services   : {comma-separated list from 8A}
  Data flow  : {one-line summary from architecture.description}
  Stack      : https://console.aws.amazon.com/cloudformation/home?region={region-code}#/stacks
  Template   : output/{ProjectName}/demo-stack.yaml

  Outputs:
  {each key: value from CloudFormation Outputs}

  To tear down:
  aws cloudformation delete-stack --stack-name {stack-name} --region {region-code}

This is a minimal demo stack. Production sizing and cost estimate are in the proposal.
```

---

## Updating an Existing Proposal

1. Load the saved context JSON
2. Modify the relevant fields
3. Re-generate the diagram if architecture changed
4. Re-run the generator script
5. Deliver the updated DOCX

## Language Guidelines

- Follow the user's language preference
- If the user speaks Chinese, use **Traditional Chinese** (繁體中文)
- Keep technical terms, service names, and code in English
- Proposal content language should match the user's preference

## Common Mistakes to Avoid

1. **Skipping Step 0 env check** — always run `diagrams_resolver.py check` first; mismatched Python environments waste many retries
2. **Wrong `diagrams` import names** — use `diagrams_resolver.py resolve <service> <module>` to look them up; never guess
3. **Skipping the diagram** — the generator will not embed an image if the path is missing or the file doesn't exist
4. **CJK characters in diagram node labels** — causes rendering failures in the `diagrams` library
5. **Not setting `show=False`** — diagram code tries to open a GUI window
6. **Forgetting to install `docxtpl`** — the generator depends on both `docxtpl` and `python-docx`
7. **Hardcoding paths** — let the agent choose sensible paths based on the user's workspace
8. **Skipping AWS Calculator** — the `calculator_link` now has its own placeholder in the template; always provide it
9. **Not reading `aws_services.json` first** — typing a short/alias name into the calculator search may return multiple results or the wrong service; always use the exact name from `aws_services.json`
10. **Not reading `references/LESSONS_LEARNED.md` before Step 3B** — this file records every known failure pattern; skipping it means repeating the same mistakes
11. **Reading `scripts/chrome_browser.py`** — this file is legacy and not used; reading it wastes context and causes confusion about the Step 3B execution model. Use `references/AWS_CALCULATOR_GUIDE.md` instead
12. **Stopping after Step 3A to ask "shall I continue with Step 3B?"** — Step 3B is mandatory; there is nothing to ask; proceed immediately
13. **Reducing the service list to 1 or a subset to "ensure reliable completion"** — this produces a meaningless cost estimate; add all services defined in Step 2 to the calculator, no exceptions
14. **Saying "natural next steps: expand the estimate"** — if the estimate is incomplete, the run is not done; finish it now
15. **Copying or reusing context.json from an existing similar output folder** — this silently carries over stale service sets, wrong calculator links, and wrong timestamps; always start from scratch
16. **Saying "if the calculator can't be completed I'll report the blocker"** — there is no acceptable partial-completion exit; retry the browser automation until it succeeds
17. **Not writing `expected_services.json` at Step 2B** — without this file, Step 4/5/6 gates cannot detect service list tampering
18. **Stopping after Step 7 without running Step 8** — the demo deploy is mandatory; the run is not complete until the CloudFormation stack is CREATE_COMPLETE in AWS
19. **Passing production calculator numbers to Step 8** — the demo uses the minimal sizing table in Step 8C, never the proposal's calculator values
20. **Including API-only services in the Step 8 deploy list** — Bedrock, SageMaker, and other API-only services have no CloudFormation resource; filter them out in 8A
21. **Deploying all proposal services instead of the core 3–5** — the demo exists to prove the data flow, not replicate production; keep it minimal and cost-safe
22. **Running Step 8 deploy a second time while the first is still running** — check CloudFormation stack status first; if CREATE_IN_PROGRESS, wait for natural exit
22. **Skipping script generation after a GROUP B fill** — every manually filled GROUP B service must get a `.js` script written immediately after it saves; skipping this means the next run repeats the same manual work
23. **Hardcoding proposal numbers inside the generated script** — scripts must use configurable params with defaults; the actual proposal values go in the `page.evaluate()` override block at call time, not baked into the script body
24. **Forgetting to update the "Available scripts" list** after writing a new script — the list in this SKILL.md header must stay accurate so future runs correctly classify services as GROUP A

## Output Completeness Check

Before final handoff, verify all required files exist:

```bash
ls output/{ProjectName}/context.json \
  output/{ProjectName}/architecture.png \
  output/{ProjectName}/Proposal.docx
```

If any file is missing, rerun the corresponding step before delivery.

## Validating Your Output

Run the built-in test suite to verify the generator works correctly in the current environment:

```bash
python <skill_dir>/scripts/test_generate.py -v
```

All 48 tests should pass. If any fail, the test output will identify exactly which placeholder or binding is broken.

Current baseline in this repository is 54 tests.

## SELF-LEARNING

After each run, summarize what happened and append any new lessons to `references/LESSONS_LEARNED.md`. Focus on:
- What went well and what didn't
- Any misunderstandings or assumptions made
- What was missing from the desired output and why
- How the output was received by the user
- What could be improved in the prompt or execution flow

## Reference Files

- [references/PROMPT_PARSER.md](references/PROMPT_PARSER.md) — **How to parse raw/unstructured prompts into proposals** (capability→service mapping, phase templates, worked example)
- [references/CONTEXT_SCHEMA.md](references/CONTEXT_SCHEMA.md) — Full JSON schema with field descriptions
- [references/DIAGRAM_GUIDE.md](references/DIAGRAM_GUIDE.md) — Architecture diagram coding guide
- [references/AWS_CALCULATOR_GUIDE.md](references/AWS_CALCULATOR_GUIDE.md) — Browser automation for AWS Pricing Calculator
- [references/CALCULATOR_SIZING.md](references/CALCULATOR_SIZING.md) — Service sizing, unit table, and cost sanity check for Step 3B
- [references/EXAMPLES.md](references/EXAMPLES.md) — Complete proposal examples
- [references/LESSONS_LEARNED.md](references/LESSONS_LEARNED.md) — Accumulated lessons from past executions
- [assets/aws_services.json](assets/aws_services.json) — Canonical AWS Calculator service names (189 services)
