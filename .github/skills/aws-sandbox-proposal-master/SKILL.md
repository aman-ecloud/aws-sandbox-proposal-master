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

> ## ⚡ SPEED RULES
>
> 1. **Read this entire file before doing anything.** Read in chunks (1–400, 401–800, 801+) until the end. Do not execute after only one chunk.
> 2. **First Bash call after reading:** `bash .github/skills/aws-sandbox-proposal-master/scripts/init_py_venv.sh`. Not a Write. Not a TodoWrite. Bash only.
> 3. **Before Step 3B:** read `references/AWS_CALCULATOR_GUIDE.md` and `references/CALCULATOR_SIZING.md`.
> 4. **Never glob or read inside `output/`** before Step 2A. An existing folder = a previous run — always start fresh with a new timestamp.
> 5. **Stuck or something failed?** Read `references/CRITICAL_RULES.md` — the short authoritative rule list.

> ## 🚫 NEVER DO THESE
>
> - **Write / Edit / Apply Patch on any output file** — all files in `output/{ProjectName}/` must come from Bash + scripts, not direct writes or patches.
> - **Create `proposal.md` (any case/extension)** — the only proposal output is `Proposal.docx` from `generate_proposal.py` at Step 5.
> - **Copy `applied_services` from `service_list`** — read it from the live `#/estimate` table after all services are added.
> - **Reuse an existing output folder** — even if one exists, create a new folder with a new timestamp and run all steps.
> - **Batch services in one `page.evaluate()`** — one service per call; React state does not carry between calls.
> - **Run `pip install playwright`** — VS Code provides browser automation built-in; do not install it yourself.
> - **Ask "Shall I continue?" or offer a menu** — pipeline runs 0→7 without pausing; see banned-phrases list in the pipeline section below.
> - **Use `require('fs')`, `fs.readFileSync()`, or `import('fs')` inside a Playwright block** — `page.evaluate()` runs in the browser, which has no filesystem access. Read the `.js` file with the Read tool first (a separate step before the Playwright block), then paste its content as a literal string into `page.evaluate()`.
> - **Fabricate or hardcode a calculator link** — `calculator_link` must be a real URL obtained by clicking Share in the browser. Never write a made-up `?id=` hash to context.json. If Step 3B is incomplete, go back and finish it — do not skip ahead.
> - **Skip services in Step 3B** — every service in `service_list` must be added to the calculator. Do not stop after the first one.
>
> → Full list with details: `references/CRITICAL_RULES.md`

## Run the full pipeline every time

Run every step in order without stopping. This skill is used by non-technical people — they cannot make technical decisions mid-run. **Resolve every error, ambiguity, and missing value autonomously and continue.**

**Step 0 → Step 1 → Step 2 → Step 3A + Step 3B → Step 4 → Step 5 → Step 6 → Step 7**

- **This pipeline is fully autonomous — treat it like running a program, not a conversation.** Once Step 0 starts, every step runs immediately after the previous one completes, with no pause, no check-in, and no message to the user until `Proposal.docx` is delivered in Step 7. The user's only role is the initial prompt. After that, the pipeline runs to the end by itself.

- **Never ask for permission to continue, for any reason.** After completing any step or sub-step, immediately start the next one. Do not narrate what you just did and then wait. Do not present a summary and end it with a question. The act of completing a step IS the permission to start the next one.

- **Banned phrases during the run — never output any of these:** "Shall I continue", "Should I proceed", "Would you like me to", "Do you want me to", "What would you like", "Can I", "May I", "Ready to proceed", "Let me know if", "Is that OK", "Do you approve", "Please confirm", "pick one", "which would you like", or any sentence ending in "?" addressed to the user. A "progress update" that ends with a question or a menu of choices is still asking — it is banned. **The pipeline ends at Step 7 delivery, not at a user menu.**

- **If the agent must send an intermediate message** (e.g. a turn-length limit is reached mid-pipeline): state only the last completed step and what step is next — then immediately execute it. Example: `"Step 3A complete. Continuing Step 3B."` — then start Step 3B tool calls in the same message with no gap. Do NOT end the message with a question or wait for the user to say "yes" or "continue". If the user sends any reply at all — even a single word, even blank — treat it as "keep going" and resume from the last incomplete step without re-reading SKILL.md or rebuilding the plan.

- **When a step fails:** diagnose, fix, and retry autonomously. Never report a failure and wait.
- **When the prompt is vague:** infer all missing values using PROMPT_PARSER.md rules. Use `<TODO>` only for human identity fields (name, email, partner, pdm, sa).
- **Step 3B (AWS Calculator):** Open the browser, add all services, get a real share link. Do not deliver without it — `generate_proposal.py` requires `calculator_link` to be set.

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
   a. Use the **Read tool** to read `.github/skills/aws-sandbox-proposal-master/scripts/calculator/{ServiceName}.js`. This is a **separate tool call before any Playwright block** — do NOT use `require('fs')` or `fs.readFileSync()` inside Playwright. The browser has no filesystem.
   b. Take the full text you just read. In a Playwright block, paste it **verbatim as a literal string** into `page.evaluate()`, with your values filled into the `})({...})` override block at the bottom:
      ```javascript
      await page.evaluate(`
      (async function configure...(params) {
        // ... full file content pasted here verbatim — do not shorten or rewrite it ...
      })({
        region: 'Asia Pacific (Taipei)',
        numberOfRequests: 4000000,
      });
      // If the region from context.json is not available for this service, stay with the script method — do NOT switch to browser MCP. Just pass the nearest available region instead (e.g. 'Asia Pacific (Singapore)' if 'Asia Pacific (Taipei)' is not listed).
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

You just added a GROUP B service. Now write a script for it. Do it right now, before moving on.

Save it to `.github/skills/aws-sandbox-proposal-master/scripts/calculator/{ExactServiceName}.js` using the template in [references/SCRIPT_GENERATION_GUIDE.md](references/SCRIPT_GENERATION_GUIDE.md). Then update the "Available scripts" count/list above.

Don't skip this. Don't wait to be asked. Just write it.

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

**If `bash` is not in PATH (common on Windows):** run the PowerShell equivalent directly — do not retry bash or search for it:

```powershell
if (-not (Test-Path .venv\Scripts\python.exe)) { python -m venv .venv }
.venv\Scripts\python.exe -m pip install --upgrade pip --quiet
.venv\Scripts\python.exe -m pip install -r .github/skills/aws-sandbox-proposal-master/scripts/requirements.txt --quiet
if (-not (Test-Path .vscode)) { New-Item -ItemType Directory -Path .vscode | Out-Null }
if (-not (Test-Path .vscode\settings.json)) {
  '{"python.defaultInterpreterPath":"${workspaceFolder}/.venv/Scripts/python.exe"}' | Out-File -Encoding utf8 .vscode\settings.json
}
Write-Output "Environment ready."
```

> Do not change directory. The script creates `.venv` in the current working directory.

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

**Step 1-P2: Build the Service List — Minimum 8 Services**

Follow all stages in [references/PROMPT_PARSER.md](references/PROMPT_PARSER.md):
- **Stage 2:** map explicit capability signals in the prompt to services
- **Stage 2b (mandatory):** add the 6-service universal baseline + the domain starter stack — this applies to every prompt, especially short or vague ones. After this step you should have 8–12 services before any trimming.
- **Stage 3:** trim duplicates and clearly out-of-scope services; enforce the 8-service minimum — never trim below 8.

Verify every service name against `assets/aws_services.json` before finalizing.

**Step 1-P3: Detect Region**

Scan the prompt and conversation for geographic signals. See [references/PROMPT_PARSER.md](references/PROMPT_PARSER.md) for the full signal→region table. Default (when no signal is found): `Asia Pacific (Taipei)` — as configured in `configs/defaults.json`.

**Step 1-P4: Populate All Fields — Use `<TODO>` for Unknown Human Fields**

See [references/PROMPT_PARSER.md](references/PROMPT_PARSER.md) for the full field→rule table. Key defaults: `aws_funding` = `"USD 80,000"`, `labor_cost` = `"USD 60,000"`, `total_cost` = `"USD 140,000"`. Human identity fields (`partner`, `contact.*`, `pdm`, `sa`) → `<TODO>`.

**Proceed immediately to Step 2** — do not wait for user confirmation.

---

#### Structured Input Mode

When the user provides structured fields: fill any gaps with the defaults from Step 1-P4 above (using `<TODO>` for unknown human fields). Then proceed immediately to Step 2.

**Input:** User-provided business and solution information (structured or raw).

**Output:** Proposal fields held in memory only — either from the prompt, inferred, or the literal string `<TODO>`.

**Save rule:** NOTHING is written to disk at this step. No Proposal.md. No draft. No summary. No context.json. No folder. Zero files. Step 2 writes the first file.

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
- **Write the diagram Python code to `output/{ProjectName}/diagram_code.py`** — never to `scripts/` or any skill directory. Execute with `.venv` Python. The `.py` file stays in the output folder alongside the `.png`.

Execute the code with:
```bash
.venv/Scripts/python.exe output/{ProjectName}/diagram_code.py
```
If it fails due to imports, use `diagrams_resolver.py resolve` to find the correct name, update `diagram_code.py`, and retry.

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

The exact code patterns for GROUP A injection, GROUP B manual fill, per-service verification, and region checking are in `references/AWS_CALCULATOR_GUIDE.md`. Read that file before opening the browser. The key rules are:

- **One service per `page.evaluate()` call — never batch.** Each GROUP A service gets its own isolated `page.evaluate()` with the full pre-built `.js` script. Batching silently fails because React state does not carry between services in a shared scope.
- **After each service inject**, navigate to `#/estimate` and confirm the row count increased. If it did not, the save failed — retry that service before continuing.
- **Before each save**, verify the Region dropdown shows the correct region from `context.json`. If it does not, set it manually before clicking Save. If the exact region is not available for a specific service, do NOT switch to browser MCP — stay with the script method and select the nearest available region for that service only.
- **Use real proposal numbers from `CALCULATOR_SIZING.md`.** Target: $20–$400/month per service, $500–$3,500/month total. If any service exceeds $500/month, the input unit is probably wrong (e.g. a raw request count entered in a "millions" field). Fix it before clicking Share.
- **Final count check:** After all services are injected, navigate to `#/estimate`. Click the ⚙ gear icon → set page size to **50** → Confirm. All services should now appear on one page. Check: (a) total row count equals `len(service_list)`, (b) no service name appears twice. If a duplicate exists, check its checkbox and click **Delete**. If any service is missing, re-add it. Only proceed to Share once both checks pass.

**Step 3B navigation sequence (follow exactly):**
1. Open a browser tab → navigate to `https://calculator.aws/#/addService`
2. Select "Search all services" radio button once
3. For each service: read its `.js` script → inject via `page.evaluate()` → wait for redirect → verify row count at `#/estimate`
4. After ALL services confirmed: run cost sanity check from `CALCULATOR_SIZING.md`; if any service cost looks wrong, fix the configuration before continuing
5. Click `Export` → `Share` → `Create public link` → copy the URL
6. Confirm the URL matches `https://calculator.aws/#/estimate?id=<hash>` and navigate to it to visually confirm all services are listed

**How to populate `applied_services` (MANDATORY — do NOT copy from `service_list`):**
After step 6 above, read the service name column from the `#/estimate` table. Extract each name exactly as shown. That list is `sandbox.business.applied_services`. Write it to `context.json` via inline Python `-c`. If the count is less than `len(service_list)`, do NOT proceed — re-add the missing services first.

**If Step 3B fails after 3 retries:** Do NOT ask the user. Navigate directly to `https://calculator.aws/#/addService`, start fresh from service #1, and retry the full sequence. If the browser session is lost, open a new tab and restart. The pipeline does not pause — keep retrying until the share link is obtained.

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

**Clean up temp files before the hard gate.** The final output folder must contain only the defined outputs. Delete any extra `.py` files except `diagram_code.py`:

```bash
.venv/Scripts/python.exe -c "
import os
from pathlib import Path
proj = Path('output/{ProjectName}')
keep = {'diagram_code.py'}
deleted = []
for f in proj.glob('*.py'):
    if f.name not in keep:
        f.unlink()
        deleted.append(f.name)
if deleted:
    print('Deleted temp files:', deleted)
else:
    print('No temp files to clean up')
"
```

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

**R3 — Live calculator audit:**

1. Navigate to the `calculator_link` URL in the browser.
2. **Set page size to 50:** click the ⚙ gear icon (top-right of the service table) → select **50** under "Page size" → click **Confirm**. This loads all services onto one page.
3. Read every service name from the **Service Name** column. If more than 50 services exist, click Next and collect names from subsequent pages too.
4. Compare the collected names against `expected_services.json`:
   - Missing from calculator → mark as FAIL
   - Duplicate rows (same name twice) → mark as FAIL; delete the extra row
   - Count matches and all names present → PASS

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

- [references/CRITICAL_RULES.md](references/CRITICAL_RULES.md) — **Quick reference for critical rules** — read this when something goes wrong or you are unsure
- [references/PROMPT_PARSER.md](references/PROMPT_PARSER.md) — **How to parse raw/unstructured prompts into proposals** (capability→service mapping, phase templates, worked example)
- [references/CONTEXT_SCHEMA.md](references/CONTEXT_SCHEMA.md) — Full JSON schema with field descriptions
- [references/DIAGRAM_GUIDE.md](references/DIAGRAM_GUIDE.md) — Architecture diagram coding guide
- [references/AWS_CALCULATOR_GUIDE.md](references/AWS_CALCULATOR_GUIDE.md) — Browser automation for AWS Pricing Calculator
- [references/CALCULATOR_SIZING.md](references/CALCULATOR_SIZING.md) — Service sizing, unit table, and cost sanity check for Step 3B
- [references/EXAMPLES.md](references/EXAMPLES.md) — Complete proposal examples
- [references/SCRIPT_GENERATION_GUIDE.md](references/SCRIPT_GENERATION_GUIDE.md) — Template and rules for writing GROUP B calculator scripts
- [references/LESSONS_LEARNED.md](references/LESSONS_LEARNED.md) — Accumulated lessons from past executions
- [assets/aws_services.json](assets/aws_services.json) — Canonical AWS Calculator service names (189 services)
