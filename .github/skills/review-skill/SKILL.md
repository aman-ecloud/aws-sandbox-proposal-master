---
name: review-skill
description: >-
  Review and validate an AWS Sandbox proposal produced by aws-sandbox-proposal-master.
  Verifies that the services declared at Step 2 (service_list) exactly match the
  services added to the AWS Calculator estimate (applied_services) and the services
  rendered in the architecture diagram. Also runs strict DOCX content verification
  to confirm every mandatory field rendered correctly in the final Word document.
  Reports any mismatches, blank fields, rendering failures, duplicates, or missing
  entries. Use when the user wants to audit, validate, or QA a generated proposal.
metadata:
  author: eCloudvalley
  version: "2.0"
---

# AWS Sandbox Proposal Review Skill

Audit a completed AWS Sandbox proposal across **two dimensions**:
1. **Service consistency** — services declared at planning time match the calculator estimate and architecture diagram exactly
2. **DOCX content integrity** — every mandatory field rendered correctly in the final Word document

## When to Use This Skill

Activate when the user:
- Asks to review, validate, or QA a generated proposal
- Suspects the calculator link has wrong or missing services
- Wants to confirm the proposal is consistent before submitting for AWS funding
- Wants to verify the Word document has all content filled in correctly
- Mentions keywords: review proposal, validate services, check calculator, audit estimate, check document

## What This Skill Checks

### Service Consistency Checks
| Check | Source A | Source B | Pass Condition |
|-------|----------|----------|----------------|
| Plan vs Calculator | `service_list` | `business.applied_services` | Exact name-for-name match |
| Plan vs Diagram | `service_list` | `architecture.applied_services` | Exact name-for-name match |
| Calculator vs Diagram | `business.applied_services` | `architecture.applied_services` | Exact name-for-name match |
| Calculator URL live count | `service_list` count | Services loaded from the live calculator link | Count and names match |
| Duplicate detection | `business.applied_services` | — | No service appears more than once |
| Missing detection | `service_list` | `business.applied_services` | No service from plan is absent |

### DOCX Content Checks (26 checks across 6 groups)
| Group | What Is Checked |
|-------|----------------|
| A — Rendering Artifacts | No unrendered Jinja2 tags; no unexpected `<TODO>` in output |
| B — Mandatory Field Content | 15 fields: summary, features, pain_point, solution_type, customer_type, justification, costs, dates, calculator_link, architecture.description, total_mandays |
| C — Architecture Diagram | Diagram image is embedded in the document |
| D — Phases Table | Phase count ≥ 1; all activities, delivery dates, and mandays present in document |
| E — Calculator Link | Link not empty; matches `https://calculator.aws/#/estimate?id=...` format |
| F — Service Lists | service_list, business.applied_services, architecture.applied_services all non-empty |

## Review Workflow

```
┌──────────────────────────────────────┐
│  Step R1: Load Context JSON          │  ← read the proposal context file
└──────────────┬───────────────────────┘
               ▼
┌──────────────────────────────────────┐
│  Step R2: Static Service Set Check   │  ← compare all three service lists
└──────────────┬───────────────────────┘
               ▼
┌──────────────────────────────────────┐
│  Step R3: Live Calculator Audit      │  ← open the share link in browser
└──────────────┬───────────────────────┘
               ▼
┌──────────────────────────────────────┐
│  Step R4: DOCX Content Verification  │  ← run verify_proposal.py on Proposal.docx
└──────────────┬───────────────────────┘
               ▼
┌──────────────────────────────────────┐
│  Step R5: Generate Review Report     │  ← combine all results into one report
└──────────────────────────────────────┘
```

---

### Step R1 — Load Context JSON

Read the proposal context file:

```text
output/{ProjectName}/context.json
```

Extract these fields:

| Field | Path in JSON |
|-------|-------------|
| Declared service list | `sandbox.business.service_list[*].service_name` |
| Calculator-applied services | `sandbox.business.applied_services` |
| Diagram-applied services | `sandbox.architecture.applied_services` |
| Calculator share link | `sandbox.business.calculator_link` |
| Target region | `sandbox.business.region` |

If the context file does not exist or any of the above fields is missing or empty, report it immediately and stop — the proposal is incomplete.

**Input:** `output/{ProjectName}/context.json`

**Output:** In-memory sets for all three service lists and the calculator link.

---

### Step R2 — Static Service Set Check

Compare the three service lists without opening a browser.

#### 2A — Normalize names

Before comparing, normalize each name:
- Strip leading/trailing whitespace
- Lowercase for comparison purposes (keep original case for reporting)

#### 2B — Run comparisons

For each pair below, compute the symmetric difference:

**Plan vs Calculator (`service_list` vs `business.applied_services`)**

```
missing_from_calculator = service_list - applied_services
extra_in_calculator     = applied_services - service_list
```

**Plan vs Diagram (`service_list` vs `architecture.applied_services`)**

```
missing_from_diagram = service_list - architecture.applied_services
extra_in_diagram     = architecture.applied_services - service_list
```

**Duplicate detection**

Check `business.applied_services` for duplicate entries (same name appearing more than once).

#### 2C — Evaluate results

| Condition | Status |
|-----------|--------|
| All three sets are identical, no duplicates | ✅ PASS |
| Any set has missing or extra entries | ❌ FAIL — list the specific discrepancies |
| Any duplicate found in `applied_services` | ❌ FAIL — list the duplicate names |

**Output:** Structured mismatch report for each comparison.

---

### Step R3 — Live Calculator Audit

Open the calculator share link in the browser and verify the live estimate.

1. **Navigate** to `sandbox.business.calculator_link` in the VS Code built-in browser
2. **Wait** for the page to load (5–10 seconds for the SPA to hydrate)
3. If the page shows an error or "Loading..." indefinitely: reload once; if still failing, record as "LINK INVALID"

#### Set page size to 50 rows (do this before reading the table)

The estimate table defaults to 10 rows per page. Change it to 50 to see all services at once:

4. **Click** the **gear icon (⚙)** in the top-right corner of the service table header
5. In the **Preferences** dialog, select **50 rows** under "Page size"
6. Click **Confirm** — the table reloads

#### Read the full service list

7. **Read** the table — with 50-row view, all services (up to 50) appear on one page
8. List every service name visible
9. If a pagination indicator is still present (50+ services), click "Next" and append remaining names
10. Collect the complete list

#### Verify

11. Compare the live estimate service list against `sandbox.business.service_list`:
    - Count: `actual_count == len(service_list)` ?
    - Names: each expected service present? (partial match OK — "S3" matches "Amazon Simple Storage Service (S3)")
    - Duplicates: any service name appears more than once?
12. Take a screenshot of the table as evidence
13. Record any discrepancies

| Condition | Status |
|-----------|--------|
| Live count == expected AND all names match, no duplicates | ✅ LIVE PASS |
| Live count > expected (any duplicate rows visible) | ❌ DUPLICATES in live estimate |
| Live count < expected | ❌ MISSING services in live estimate |
| Link does not load a valid estimate | ❌ LINK INVALID |

> **How to remove duplicates if found:** Check the checkbox on each extra duplicate row, then click the **Delete** button in the toolbar above the table. Keep exactly one copy of each service.

**Output:** Live audit result with actual count, screenshot, and any discrepancies.

---

### Step R4 — DOCX Content Verification

Run the `verify_proposal.py` script against the generated `Proposal.docx` and its `context.json`. This step checks that every mandatory field actually rendered into the Word document — it is not enough that the data exists in `context.json`; it must appear in the document output.

#### Run the verifier

```bash
python3 .github/skills/aws-sandbox-proposal-master/scripts/verify_proposal.py \
    output/{ProjectName}/Proposal.docx \
    output/{ProjectName}/context.json
```

The script runs **26 checks across 6 groups** and exits with code `0` (all pass) or `1` (failures found):

| Group | Checks |
|-------|--------|
| **A — Rendering Artifacts** | No unrendered `{{...}}` or `{%...%}` Jinja2 tags left in the document XML. No unexpected `<TODO>` text in non-human-only fields. |
| **B — Mandatory Field Content** | 15 fields verified present in document XML: `details.summary`, `details.features`, `details.pain_point`, `details.solution_type`, `details.customer_type`, `business.justification`, `business.aws_funding`, `business.labor_cost`, `business.total_cost`, `business.calculator_link`, `business.start_date`, `business.end_date`, `business.release_date`, `architecture.description`, `plan.total_mandays` |
| **C — Architecture Diagram** | `<w:drawing>` or `<pic:pic` present in XML — confirms the diagram PNG was embedded |
| **D — Phases Table** | Phase count ≥ 1; every `phase.activity`, `phase.delivery_date`, and `phase.mandays` appears in the document |
| **E — Calculator Link** | Link is non-empty AND matches `^https://calculator\.aws/#/estimate\?id=[A-Za-z0-9_-]+$` |
| **F — Service Lists** | `service_list`, `business.applied_services`, and `architecture.applied_services` each contain ≥ 1 entry |

#### What to do when checks fail

| Failure | Root cause | Fix |
|---------|-----------|-----|
| Group A: Unrendered Jinja2 tags | Template placeholder not bound — context.json missing a key | Add the missing key to context.json; regenerate DOCX |
| Group A: `<TODO>` in output | Human-only field not filled | Inform the user which fields still need manual input |
| Group B: Field not in document | Field was empty string in context.json, OR RichText rendering failed | Check context.json value; if non-empty, re-run `generate_proposal.py` |
| Group C: No diagram | `architecture.diagram` path wrong or PNG missing | Re-run Step 3A to regenerate architecture.png |
| Group D: Phase missing | Phase text contains `&` or special chars that failed XML search | Verify phases render in Word manually; update context if phases are absent |
| Group E: Link empty or invalid | Step 3B did not complete successfully | Re-run Step 3B; obtain a valid calculator share link |
| Group F: Empty service list | Step 2B did not write services | Re-run Steps 2B and 3B |

**Hard stop:** If `verify_proposal.py` exits with code `1`, **do not deliver the proposal**. Fix the identified failures and regenerate before proceeding to Step R5.

**Input:** `output/{ProjectName}/Proposal.docx` and `output/{ProjectName}/context.json`

**Output:** Script output printed to terminal. Record pass/fail count for Step R5 report.

---

### Step R5 — Generate Review Report

Produce a structured report covering all checks (service consistency + DOCX verification). Use this format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AWS SANDBOX PROPOSAL REVIEW REPORT
Project : {sandbox.basics.title}
Context : output/{ProjectName}/context.json
Document: output/{ProjectName}/Proposal.docx
Region  : {sandbox.business.region}
Date    : {today}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DECLARED SERVICES ({N} total)
  {list each service_name}

─────────────────────────────────────────
CHECK 1: Plan vs Calculator (static)
  Status : ✅ PASS  /  ❌ FAIL
  Missing from calculator : {list or "none"}
  Extra in calculator     : {list or "none"}
  Duplicates              : {list or "none"}

CHECK 2: Plan vs Diagram (static)
  Status : ✅ PASS  /  ❌ FAIL
  Missing from diagram : {list or "none"}
  Extra in diagram     : {list or "none"}

CHECK 3: Live Calculator Audit
  Link   : {calculator_link}
  Status : ✅ LIVE PASS  /  ❌ FAIL  /  ❌ LINK INVALID
  Live count   : {N}
  Expected     : {N}
  Missing live : {list or "none"}
  Extra live   : {list or "none"}

CHECK 4: DOCX Content Verification (verify_proposal.py)
  Status   : ✅ ALL {N} CHECKS PASSED  /  ❌ {N} CHECK(S) FAILED
  Group A (Rendering) : ✅ PASS  /  ❌ FAIL — {detail}
  Group B (Fields)    : ✅ PASS  /  ❌ FAIL — {detail}
  Group C (Diagram)   : ✅ PASS  /  ❌ FAIL — {detail}
  Group D (Phases)    : ✅ PASS  /  ❌ FAIL — {detail}
  Group E (Calc Link) : ✅ PASS  /  ❌ FAIL — {detail}
  Group F (Services)  : ✅ PASS  /  ❌ FAIL — {detail}
  Failed checks: {list each failed check name, or "none"}

─────────────────────────────────────────
OVERALL RESULT : ✅ ALL CHECKS PASSED  /  ❌ {N} CHECK(S) FAILED

RECOMMENDED ACTIONS:
  {list specific remediation steps, or "None — proposal is consistent and document is complete."}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Recommended actions by failure type

| Failure | Recommended action |
|---------|-------------------|
| Missing from calculator | Re-run Step 3B; add only the missing services; re-share |
| Extra in calculator | Open the calculator link; delete the extra service rows; re-share |
| Duplicates in calculator | Open the calculator link; remove duplicate rows; re-share |
| Missing from diagram | Re-run Step 3A; add missing nodes; regenerate PNG |
| Extra in diagram | Re-run Step 3A; remove extra nodes; regenerate PNG |
| Link invalid | Re-run Step 3B from scratch; extract a new share link |
| Group A: Unrendered tags | Add missing key to context.json; regenerate DOCX with `generate_proposal.py` |
| Group A: `<TODO>` remaining | Inform user which human-only fields still need to be filled in manually |
| Group B: Field missing in DOCX | Value was empty in context.json OR rendering failed — check value, regenerate |
| Group C: No diagram in DOCX | `architecture.diagram` path wrong or PNG missing — re-run Step 3A |
| Group D: Phase missing in DOCX | Phase text has special chars or phase was not written to context — check context |
| Group E: Calc link empty/invalid | Step 3B incomplete — re-run from scratch and obtain a valid share link |
| Group F: Empty service list | Step 2B did not run — re-run Steps 2B and 3B |

**Output:** Review report displayed to the user (and optionally saved to `output/{ProjectName}/review_report.txt`).

---

## Quick Usage

```text
User: "Review the proposal for OptiFlow"
Agent: → reads output/OptiFlow/context.json
       → runs Step R2 (static service checks)
       → runs Step R3 (live browser audit)
       → runs Step R4: python3 .github/skills/aws-sandbox-proposal-master/scripts/verify_proposal.py
                        output/OptiFlow/Proposal.docx output/OptiFlow/context.json
       → runs Step R5: outputs combined review report
```

```text
User: "The calculator link seems wrong, can you check?"
Agent: → runs Step R3 only (live audit)
       → reports live count vs expected
```

```text
User: "Is the Word document correct? Does it have all the content?"
Agent: → runs Step R4 only (verify_proposal.py)
       → reports 26-check DOCX verification result
```

## Notes

- This skill reads existing output files — it does not modify `context.json` or regenerate any artifact
- Step R4 (DOCX verification) requires both `Proposal.docx` AND `context.json` to exist in the project output folder
- If `verify_proposal.py` exits with code `1`, the proposal **must not be delivered** — fix failures first, then re-run Step R4
- If the user wants to fix a detected mismatch, hand off to `aws-sandbox-proposal-master` for the specific step (3A, 3B, or 5) that needs re-running
- The review skill can be run at any time, not just after a completed proposal
- `verify_proposal.py` location: `.github/skills/aws-sandbox-proposal-master/scripts/verify_proposal.py`
