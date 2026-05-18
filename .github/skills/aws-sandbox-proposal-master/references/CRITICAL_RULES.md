# Critical Rules — Quick Reference

Read this file whenever you are unsure, make a mistake, or something fails mid-run.

---

## Pipeline Autonomy
- Run all steps (0→7) without stopping. Never ask "Shall I continue?", "Do you approve?", or offer a menu of options at the end.
- If a step fails, diagnose and fix it autonomously. Never report a failure and wait.
- If the prompt is vague, infer everything using `references/PROMPT_PARSER.md`. Use `<TODO>` only for human identity fields (name, email, pdm, sa).
- **Never list or read inside `output/` before Step 2A.** An existing output folder from a previous run is stale data — it does not mean the pipeline is complete. Always create a new folder with a new timestamp and run every step from scratch.

## Allowed Files & How to Create Them

| File | How it is created | Forbidden method |
|---|---|---|
| `context.json` | `scaffold_context.py` via Bash or Powershell| Write / Edit / Apply Patch |
| `expected_services.json` | `lock_services.py` via Bash | Write / Edit / Apply Patch |
| `architecture.png` | `diagram_code.py` via Bash | Any text/mmd/md substitute |
| `Proposal.docx` | `generate_proposal.py` via Bash | `proposal.md` or any markdown |
| `review_report.txt` | review-skill R1→R5 output | Writing by hand |
| `scripts/calculator/{Name}.js` | Write tool — after each GROUP B service | Skipping it |

- **Never use Write, Edit, or Apply Patch on any output file.** All files in `output/{ProjectName}/` must be produced by Bash + scripts. Using Apply Patch on an output file is fabrication regardless of its content.
- **Never create any file named `proposal.md`, `Proposal.md`, or any markdown/txt proposal variant.** The only valid proposal output is `Proposal.docx` from `generate_proposal.py`.
- **`.github/skills/` is read-only** — except for one thing: after you add a GROUP B service, write its `.js` script to `scripts/calculator/` right away. That's the one place you're allowed to write there. Everything else in `.github/skills/` stays untouched.
- **Never create extra `.py` scripts** in `output/` beyond `diagram_code.py`. Use `python -c "..."` inline.
- **Never run `pip install playwright`.** Browser automation uses VS Code's built-in Playwright tools.

## Services & Service Lists
- **`applied_services` = read from the live `#/estimate` table.** After Step 3B, navigate to `https://calculator.aws/#/estimate`, read the service name column, and use that list. Never copy from `service_list`.
- **Never reduce the service list.** All services planned in Step 2 must be in the calculator.
- **`expected_services.json` is only produced by `lock_services.py`** at Step 2B. Never write it by hand.

## AWS Calculator (Step 3B)
- **One service per `page.evaluate()`.** Never batch. React state does not carry between services.
- **After each inject**, go to `#/estimate` and confirm the row count increased. If it did not, the save failed — retry that service.
- **Before each save**, verify the Region dropdown matches the region in `context.json`. Fix it manually if wrong.
- **Read `references/CALCULATOR_SIZING.md` before adding any service.** Use the sizing values from that file. Target range: $20–$400/month per service, $500–$3,500/month total. If any service exceeds $500/month the quantities are probably in the wrong unit (e.g. raw count entered where millions expected). Fix it before continuing.
- **To confirm all services at the end, before proposal document creation**, Go to the aws generated link, and read the `#/estimate` table. If there are more than 10 services, then it goes to the second page of the `#/estimate` table. Every page in the `#/estimate` table has 10 services. You have to intelligently check that, all services are present  accordingly.
- **After all services are confirmed**, read the `#/estimate` table to get `applied_services`, then get the Share link.

## Context & Placeholders
- **`<TODO>` is an output string**, not a prompt to ask the user. Set it and keep going.
- **`context.json` is produced by `scaffold_context.py`** — never hand-write it.

## Step 6 Review
- **Step 6 is mandatory.** Run R1→R5 before Step 7.
- **`verify_proposal.py` exit code 1 = do not deliver.** Fix failures and regenerate DOCX first.
