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
> 2. `references/AWS_CALCULATOR_GUIDE.md` and `references/SCRIPT_GENERATION_GUIDE.md` — read once before Step 3B
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

When this run ends, the output folder must have: `*context*.json`, `*architecture*.png`, and `*Proposal*.docx`.

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
- **No script** → **GROUP B** — use manual Playwright form fill (`references/AWS_CALCULATOR_GUIDE.md`), then **immediately write a new `.js` script** for that service so future runs can use GROUP A injection.

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

**Notice:** Do not ask user to configure the interpreter environment. Run the following bash script to set up the environment automatically.
**Run this immediately to setting up the interpreter environment:** `bash .github/skills/aws-sandbox-proposal-master/scripts/init_py_venv.sh`

> **Note for the above step:** Do not change directory, the script will create a `.venv` in the current working directory and install dependencies there. If you change directory, the agent may not find the virtual environment and fail to run the Python scripts.

**Run this right after setting up the environment before anything else.** The bundled `scripts/diagrams_resolver.py` checks all required dependencies and guides installation of anything missing.

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

| Failure                                                                                                                                                                                   | Fix                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `Error: Failed to run uv pip install --python` or `No module named pip` or `cannot access '.venv/Scripts/python.exe': No such file or directory` or `bash: py: command not found` | `init_py_venv.sh`                                                                                              |
| `diagrams not installed`                                                                                                                                                                | `pip install diagrams`                                                                                         |
| `docxtpl not installed`                                                                                                                                                                 | `pip install docxtpl python-docx`                                                                              |
| `Graphviz 'dot' not found`                                                                                                                                                              | Windows:`winget install graphviz` · macOS: `brew install graphviz` · Ubuntu: `sudo apt install graphviz` |
| `Python < 3.10`                                                                                                                                                                         | Use `python3` / `py -3.12` · or specify full path to a Python ≥ 3.10 interpreter                           |

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

#### Step 2A Output Contract (MANDATORY)

Persist the plan to a single file before starting Step 3A/3B:

```text
output/{ProjectName}_context.json
```

The file is the only accepted source for Step 3A and Step 3B. Add these fields:

- `sandbox.business.region` (required)
- `sandbox.business.service_list` (required)

`service_list` item format:

```json
{
  "service_name": "Amazon S3",
  "calculator_config": {
    "storage_gb": 10,
    "put_requests": 400,
    "get_requests": 400
  },
  "diagram_tags": ["storage", "edge"]
}
```

Step 3A and 3B must fail-fast if either field is missing.

**Input:** Structured data from Step 1.

**Output:** `output/{ProjectName}_context.json`.

**Save rule:** Required.

**Verification:** JSON exists, parses, and includes `sandbox.business.region` and non-empty `sandbox.business.service_list`.

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
- **`references/SCRIPT_GENERATION_GUIDE.md`** —Generate JavaScript automation scripts to browse the `https://calculator.aws/#/addService` website for configuring AWS services. These scripts can be executed by AI agents or directly in browser consoles.
- **`references/CALCULATOR_SIZING.md`** — how to size each service, which unit each field expects, and the cost sanity check to run before clicking Share

**Using Modular Service Scripts:**

Each AWS service has its own automation module under `scripts/{service}/{service}.js`.

**Scope:** Run scripts in `scripts/` to get the AWS services pricing
Note: when scripts are used by AI Agent, since the `require` function is not available in the browser context, so MUST NOT use the `require` function, you must use the `read_file` tool to pull in the script content, then embed it directly into the Playwright API: `page.evaluate()` function.

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

Guardrail:

- The expected service set (`sandbox.business.service_list`) must match both applied sets. If mismatch exists, stop before Step 5.

Save the JSON to `output/{ProjectName}_context.json` for reproducibility and future updates.

**Input:** Step 2 context data + Step 3A/3B outputs.

**Output:** Finalized `output/{ProjectName}_context.json`.

**Save rule:** Required.

**Verification:** `service_list`, `architecture.applied_services`, and `business.applied_services` are consistent.

### Step 5 — Generate the DOCX

The script binds the context JSON onto the standard **Sandbox Innovation Plan Template** (`assets/Sandbox Innovation Plan Template_v2.docx`) using `docxtpl` (Jinja2 for Word). The template contains Jinja2 placeholders (`{{sandbox.details.summary}}`) and row loops (`{%tr for phase in sandbox.plan.total_phases%}`) that are filled automatically.

1. Ensure dependencies are installed:
   ```bash
   pip install docxtpl python-docx
   ```
2. Run the bundled generator script:
	```bash
	python <skill_dir>/scripts/generate_proposal.py output/{ProjectName}_context.json --output output/{ProjectName}_Proposal.docx
	```

	Or invoke the function directly in Python:
	```python
	import json, sys
	from pathlib import Path
	sys.path.insert(0, str(Path('<skill_dir>/scripts')))
	from generate_proposal import generate_proposal

	context = json.loads(Path('context.json').read_text())
	generate_proposal(context, Path('output/{ProjectName}_Proposal.docx'))
	```

   To use a custom template:

	```bash
	python <skill_dir>/scripts/generate_proposal.py output/{ProjectName}_context.json -o output/{ProjectName}_Proposal.docx -t /path/to/custom_template.docx
	```

The script:

- Validates all required fields (exits with clear error on missing data)
- Reshapes the JSON to match the template's Jinja2 placeholder structure
- Auto-converts Markdown strings to `docxtpl.RichText` (bold, italic, headers, lists, code)
- Embeds the architecture diagram as an `InlineImage` at 6 inches width
- Renders the template and saves the final DOCX

**Input:** `output/{ProjectName}_context.json`.

**Output:** `output/{ProjectName}_Proposal.docx`.

**Save rule:** Required.

**Verification:**

- DOCX exists and opens with all fields rendered.
- The architecture description must be corresponding with the diagram, and the calculator link is present in the business justification section.

### Step 6 — Deliver to User

Present the generated DOCX file to the user. If the environment supports download links, provide one. Mention:

- The context JSON is saved for future updates
- The AWS Calculator share link for independent cost review

**Input:** `output/{ProjectName}_Proposal.docx` and `output/{ProjectName}_context.json`.

**Output:** User delivery confirmation.

**Save rule:** No new file; reuse saved output artifacts.

**Verification:** User receives the DOCX path and calculator link.

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
