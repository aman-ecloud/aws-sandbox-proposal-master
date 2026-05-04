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

> **Read this entire SKILL.md before doing anything.** If the file is long, read it in multiple chunks (lines 1–400, then 401–800, etc.) until you reach the end. Do NOT start executing after reading only the first chunk.
>
> The only pre-execution reads required are:
> 1. This file (`SKILL.md`) — read once, **fully to the end**
> 2. `references/AWS_CALCULATOR_GUIDE.md` — read once before Step 3B
>
> Do NOT run regex searches across skill files to "locate" commands or "confirm" schema fields before starting. Do NOT search `generate_proposal.py`, `verify_proposal.py`, `CONTEXT_SCHEMA.md`, `DIAGRAM_GUIDE.md`, or any other reference file before executing. All commands are in this file and in `AWS_CALCULATOR_GUIDE.md`. Searching them via `Searched for regex` before acting is pre-flight probing and wastes 3–5 minutes on a standard run.
>
> Do NOT run `Get-ChildItem -Recurse` on the skill folder. Do NOT read `review-skill/SKILL.md` before finishing Step 3B.
>
> **After finishing this file, your very first tool call MUST be a Bash call to run Step 0:**
> ```bash
> bash .github/skills/aws-sandbox-proposal-master/scripts/init_py_venv.sh
> ```
> Not a Write call. Not a TodoWrite. Not a file creation. A Bash call running `init_py_venv.sh`. If that is not your next action, you are violating these instructions.

> ## 🚫 FABRICATION IS FORBIDDEN
>
> **This VS Code environment CAN run bash scripts, Python scripts, and browser automation.** Do NOT claim otherwise. The statement "I could not execute the browser automation or DOCX generation in this environment" is WRONG.
>
> The three required output files are **only valid when produced by running the actual tools**:
>
> | Required output | How to produce it | Forbidden substitutes |
> |---|---|---|
> | `architecture.png` | Write Python code using the `diagrams` library, execute with `.venv` Python | `architecture.mmd`, `architecture.md`, any text file |
> | `Proposal.docx` | Run `python .github/skills/aws-sandbox-proposal-master/scripts/generate_proposal.py` | `Proposal.md`, `proposal.txt`, any markdown |
> | Real `calculator_link` URL | VS Code browser + `page.evaluate()` injection per Step 3B | `cost_estimate.txt`, fake URL, placeholder |
>
> **Scripts that exist** (use only these): `init_py_venv.sh`, `diagrams_resolver.py`, `generate_proposal.py`
> **Scripts that do NOT exist** (never invent these): `generate_diagram.py`, `run_calculator_automation.py`, `run_browser.py`
>
> If a script or browser step fails, diagnose and retry. Do NOT substitute a hand-written file.
>
> **`expected_services.json` is produced only by running `lock_services.py` in Step 2B** — not upfront, not by hand. Any other time you create it is fabrication.
>
> **Writing a file by hand is NEVER completing a step.** Each step requires running actual bash scripts, Python scripts, or browser automation. The file is a byproduct of those scripts running. If you write the file without running the script, the step is NOT done.
>
> **Step 0 must run before any file is created.** Do not write context.json, do not create the output folder, do not mark any todo complete until `init_py_venv.sh` has exited 0.

## Run the full pipeline every time

Run every step in order without stopping. This skill is used by non-technical people — they cannot make technical decisions mid-run. **Resolve every error, ambiguity, and missing value autonomously and continue.**

**Step 0 → Step 1 → Step 2 → Step 3A + Step 3B → Step 4 → Step 5 → Step 6 → Step 7**

- **Never direct a question or choice at the user during a run.** If the next action is unclear, decide and execute — do not ask. If a step fails, fix and retry — do not report the failure and wait. The run ends only when `context.json`, `architecture.png`, and `Proposal.docx` exist on disk and the DOCX is delivered.
- **When a step fails:** diagnose the error, fix it, and retry in the same run. Resolve it autonomously.
- **When the prompt is vague:** infer all missing values using PROMPT_PARSER.md rules. Use `<TODO>` only for fields that require real human identity (name, email, partner). For everything else — services, region, architecture, costs — infer and proceed immediately.
- **Step 3B (AWS Calculator):** Open the browser, add all services, get a real share link. Do not deliver without it. Do not leave `calculator_link` blank. If it is blank, `generate_proposal.py` will fail and you cannot move forward — so finish Step 3B first.
- **Do not reuse an old `context.json`.** Every run creates a new folder with a fresh `context.json`.
- **Do not shrink the service list.** If the proposal has 12 services, all 12 go into the calculator. Do not reduce it.
- **Do not say the calculator link is "pending" or "coming next".** Get it now, in this run.
- **Do not read `scripts/chrome_browser.py`.** It is not used. Use the VS Code browser tools instead.

Output files are **produced by running their step's scripts** — writing them by hand is always fabrication:

| File | Produced by | ❌ Never write manually as |
|---|---|---|
| `patch.json` | Agent writes this flat JSON in Step 2A | any other format or upfront |
| `context.json` | `scaffold_context.py` (Step 2A) | hand-crafted JSON |
| `expected_services.json` | `lock_services.py` (Step 2B) | upfront placeholder |
| `architecture.png` | `diagrams_resolver.py` + `.venv` Python (Step 3A) | `architecture.mmd`, any text file |
| `Proposal.docx` | `generate_proposal.py` (Step 5) | `Proposal.md`, `proposal.txt`, markdown |

`cost_estimate.txt`, `architecture.md`, `Proposal.md` — these do not exist in this workflow; do not create them.

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
        region: 'Asia Pacific (Taipei)',
        numberOfRequests: 4000000,
      });
      `);
      await page.waitForURL('**/addService**', { timeout: 30000 }).catch(() =>
        page.waitForTimeout(8000)
      );
      await page.waitForLoadState('networkidle');
      ```
      **If injection throws a quoting or syntax error:** the pasted script content has backtick characters conflicting with the outer template literal. Fix: replace every `` ` `` in the pasted script with `` \` `` and retry immediately. Do not ask the user.

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

**Every time you successfully add a GROUP B service, immediately write a `.js` script for it** so the next run treats it as GROUP A. Follow [references/SCRIPT_GENERATION_GUIDE.md](references/SCRIPT_GENERATION_GUIDE.md) for the full template and rules. Then update the "Available scripts" count/list in this SKILL.md header.

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
└───────────────────────────────────┘

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

**Notice:**
- MUST NOT ask the user to configure the interpreter environment under any circumstance.
- MUST NOT configure the environment manually — everything must go through the scripts below only.

**Run this immediately, before anything else:**

```bash
bash .github/skills/aws-sandbox-proposal-master/scripts/init_py_venv.sh
```

> MUST NOT change directory. MUST NOT create a virtual environment by yourself. The script creates `.venv` in the current working directory and installs all dependencies there. Changing directory will cause Python scripts to fail.

**Then verify dependencies:**

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

Read `assets/aws_services.json`. For each capability, pick the best-fit service and verify the name exists in `aws_services.json` before adding it to `service_list`. Typical proposals have 8–15 services. See [references/PROMPT_PARSER.md](references/PROMPT_PARSER.md) for the full capability→service mapping table.

**Step 1-P3: Detect Region**

Scan the prompt and conversation for geographic signals. See [references/PROMPT_PARSER.md](references/PROMPT_PARSER.md) for the full signal→region table. Default (when no signal is found): `Asia Pacific (Taipei)` — as configured in `configs/defaults.json`.

**Step 1-P4: Populate All Fields — Use `<TODO>` for Unknown Human Fields**

See [references/PROMPT_PARSER.md](references/PROMPT_PARSER.md) for the full field→rule table. Key defaults: `aws_funding` = `"USD 80,000"`, `labor_cost` = `"USD 60,000"`, `total_cost` = `"USD 140,000"`. Human identity fields (`partner`, `contact.*`, `pdm`, `sa`) → `<TODO>`.

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

**Step 2A — Create project folder and write `context.json` via script (MANDATORY)**

**a. Compute the project folder name and create it:**

```bash
# {SafeTitle} = title with spaces→underscores, non-alphanumeric removed, max 60 chars
# {YYYYMMDD_HHMM} = current timestamp
# Example: output/Personalized_Fitness_Platform_20260504_1000/
mkdir -p "output/{SafeTitle}_{YYYYMMDD_HHMM}"
```

Store `{ProjectName}` and use it for all artifact paths in this run.

**b. Write a flat `patch.json` with the fields you determined in Step 1:**

```json
{
  "title": "{inferred title}",
  "region": "{detected region, or Asia Pacific (Taipei) if none}",
  "solution_type": "{inferred solution domain}",
  "customer_type": "{inferred target customer}",
  "summary": "{executive summary — 2–4 sentences}",
  "features": "{key features as markdown bullet list}",
  "pain_point": "{customer pain points as markdown bullet list}",
  "justification": "{business justification — market size, competitive advantage, expected ROI}",
  "architecture_description": "{architecture overview — 3–5 sentences}",
  "services": [
    { "service_name": "Amazon Simple Storage Service (S3)", "diagram_tags": ["storage"] },
    { "service_name": "AWS Lambda", "calculator_config": { "numberOfRequests": 2000000 } }
  ],
  "phase_descriptions": [
    "{Phase 1 description}",
    "{Phase 2 description}",
    "{Phase 3 description}",
    "{Phase 4 description}"
  ]
}
```

> **`service_name` must exactly match `assets/aws_services.json`.** Wrong names cause calculator search misses. All defaults (funding, dates, mandays, partner) are read from `configs/defaults.json` by the script — do not duplicate them in the patch.

**c. Run the scaffold script to produce `context.json`:**

```bash
python .github/skills/aws-sandbox-proposal-master/scripts/scaffold_context.py \
  --patch "output/{ProjectName}/patch.json" \
  --output "output/{ProjectName}/context.json"
```

The script computes all dates, phases, mandays, and defaults automatically. Verify output: `[scaffold_context] Written: output/{ProjectName}/context.json`.

**Input:** Parsed fields from Step 1.

**Output:** `output/{ProjectName}/context.json` (produced by script, not hand-written).

**Verification:** Script exits 0 and prints service count, region, and dates.

#### Step 2B — Lock the Service Reference (MANDATORY)

Immediately after `context.json` is written, snapshot the service names into `expected_services.json`. This is the tamper-evident ground truth Steps 4–6 use to verify the calculator was completed for the full set.

```bash
python .github/skills/aws-sandbox-proposal-master/scripts/lock_services.py \
  "output/{ProjectName}/context.json"
```

> **Do NOT modify `expected_services.json` after this.** It is written once, read-only from here forward. Fix the calculator estimate rather than touching this file.

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
18. **Skipping script generation after a GROUP B fill** — every manually filled GROUP B service must get a `.js` script written immediately after it saves; skipping this means the next run repeats the same manual work
19. **Writing fake output files instead of running the actual scripts** — `architecture.mmd`, `Proposal.md`, `cost_estimate.txt` are not valid outputs; `architecture.png` must come from the diagrams library, `Proposal.docx` must come from `generate_proposal.py`, the calculator link must come from the browser; fabricating these and continuing is silent failure
20. **Reading only the first 400 lines of SKILL.md** — the file is longer than 400 lines; if the reader stopped at line 400, it missed the Step 3B injection rules, the step details, and the common mistakes; always read to the end before executing
21. **Asking "which should I run next?" or offering options** — the pipeline order is fixed; if a step fails, fix and retry autonomously; never present choices to the user
22. **Hardcoding proposal numbers inside the generated script** — scripts must use configurable params with defaults; the actual proposal values go in the `page.evaluate()` override block at call time, not baked into the script body
23. **Forgetting to update the "Available scripts" list** after writing a new script — the list in this SKILL.md header must stay accurate so future runs correctly classify services as GROUP A

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
- [references/SCRIPT_GENERATION_GUIDE.md](references/SCRIPT_GENERATION_GUIDE.md) — Template and rules for writing GROUP B calculator scripts
- [references/LESSONS_LEARNED.md](references/LESSONS_LEARNED.md) — Accumulated lessons from past executions
- [assets/aws_services.json](assets/aws_services.json) — Canonical AWS Calculator service names (189 services)
