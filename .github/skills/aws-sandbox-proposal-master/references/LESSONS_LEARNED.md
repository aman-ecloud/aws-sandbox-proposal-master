# Lessons Learned — AWS Sandbox Proposal Master

Accumulated lessons from developing and exercising the `aws-sandbox-proposal-master` skill.
Each entry follows the pattern: **Problem → Root Cause → Fix / Pattern**.

---

## 1. Python Environment Split on Windows

**Problem**: `pip install docxtpl` succeeds but `import docxtpl` fails at runtime.

**Root Cause**: On Windows with both pyenv and Microsoft Store Python, `python` in the shell resolves to the Store stub (3.10), while `pip` installs into the pyenv version (3.12.9). They are completely separate interpreters.

**Fix**: Always use the full path to the intended Python executable:

```bash
C:/.pyenv/pyenv-win/versions/3.12.9/python.exe script.py
```

Use `diagrams_resolver.py check` to verify all packages are visible to the correct interpreter before running any scripts.

---

## 2. `diagrams` Library Has No `__version__` Attribute

**Problem**: `diagrams.__version__` raises `AttributeError`.

**Root Cause**: The `diagrams` package does not expose a `__version__` module attribute (unlike most PyPI packages).

**Fix**: Use safe access:

```python
version = getattr(diagrams, '__version__', 'unknown')
```

This is applied in `diagrams_resolver.py → check_env()`.

---

## 3. `diagrams` Import Names Are Not Obvious

**Problem**: Class names in the `diagrams` library do not always match AWS service names. For example:

- `OpenSearch` → does NOT exist → correct class is `AmazonOpensearchService`
- `Fargate` → does NOT exist → correct class is `Fargate` (in `diagrams.aws.compute`)
- `Bedrock` → not in `diagrams.aws.ml`

**Root Cause**: The library uses its own class naming conventions that diverge from AWS service names, documentation names, and common abbreviations.

**Fix**: Use `diagrams_resolver.py resolve <keyword> <module>` before writing any architecture diagram code:

```bash
python diagrams_resolver.py resolve opensearch aws.analytics
# → AmazonOpensearchService  (diagrams.aws.analytics)

python diagrams_resolver.py list aws.ml
# → lists all ML node classes
```

---

## 4. AWS Pricing Calculator — Button Refs Become Stale

**Problem**: When using Playwright to interact with the AWS Calculator, element references (like `e15102`) in button selectors go stale after navigation.

**Root Cause**: The AWS Calculator is a React SPA. After navigation (`#/addService` → `#/createCalculator/Fargate`), the entire component tree re-renders and all element references change.

**Fix**: Always use semantic stable selectors:

```javascript
// GOOD — stable role + name
await page.getByRole('button', { name: 'Configure AWS Fargate' }).click();

// BAD — stale ref
await page.locator('[ref=e15102]').click();
```

---

## 5. AWS Fargate Calculator — Minimum Memory and Storage Constraints

**Problem**: Saving the Fargate configuration fails with validation errors:

- "Amount of memory allocated can't be less than 2 GB"
- Storage minimum is 20 GB

**Root Cause**: Fargate has minimum resource requirements that the calculator enforces. Default form values do not meet the minimum.

**Fix / Values**: Use aria-label selectors and always set:

- Memory: `≥ 2` GB
- Storage: `≥ 20` GB

```javascript
await page.getByLabel('Amount of memory allocated Value').fill('2');
await page.getByLabel('Amount of ephemeral storage allocated for Amazon ECS Value').fill('20');
```

---

## 6. AWS Calculator Region Availability — Claude Sonnet Not in AP Taipei

**Problem**: When configuring Amazon Bedrock in Asia Pacific (Taipei) region, only `Amazon : Nova Lite` appears in the model dropdown (single option). Claude 3 Sonnet is not available.

**Root Cause**: Claude models are not available in all regions via the standard pricing calculator. AP Taipei has limited Bedrock model availability.

**Fix**: For cost estimation proposals targeting Taiwan, either:

1. Use `Amazon : Nova Lite` as a proxy model for pricing
2. Or switch region to US East (N. Virginia) for Bedrock estimation then note it in the proposal

---

## 7. `docxtpl` Row-Loop Syntax Requires `{%tr for ... %}`

**Problem**: Normal Jinja2 `{% for item in list %}` does not work for repeating table rows in DOCX templates.

**Root Cause**: `docxtpl` extends Jinja2 with Word-specific tags. To repeat a table row, the `for` tag must be placed as the **first cell content** of the row using the `{%tr ...%}` syntax (not `{%...%}`).

**Fix**: In the DOCX template, put the loop control in the first cell:

```text
| {%tr for phase in sandbox.plan.total_phases %} | | | |
| {{phase.activity}} | {{phase.description}} | {{phase.mandays}} | {{phase.delivery_date}} |
| {%tr endfor %} | | | |
```

The `tr` prefix tells `docxtpl` to duplicate/remove the entire row.

---

## 8. Template Cover Page (Table 0) Has Static `<TODO>` Cells

**Problem**: Table 0 in the DOCX template contains hardcoded `<TODO>` placeholder text (not Jinja2). Attempting Jinja2 injection there causes rendering errors.

**Root Cause**: The cover page was designed for manual fill-in. It uses `<TODO>` as a visual marker for the human editor, not as a machine-parseable placeholder.

**Fix**: Never attempt to bind dynamic data to Table 0. All Jinja2 context goes to Table 1 (content) and Table 2 (phases loop). The cover page `<TODO>` cells require manual editing if needed.

---

## 9. Step 2 Contract Drift Between Step 3A and Step 3B

**Problem**: Diagram services and calculator services diverge (missing service in one side, extra service in the other).

**Root Cause**: Step 3A and Step 3B each infer services from narrative text independently.

**Fix**: Treat `sandbox.business.service_list` as the only source of truth.

1. Step 3A writes `sandbox.architecture.applied_services`.
2. Step 3B writes `sandbox.business.applied_services`.
3. Both sets must exactly match the Step 2 service set before proposal generation.

---

## 10. Adaptive Selector Fallback Works Only With Guardrails

**Problem**: Overly flexible fallback can complete UI actions but apply wrong service configuration.

**Root Cause**: Retry logic focused on click success, not business-level correctness.

**Fix**: Keep adaptive fallback bounded and verify domain invariants.

Fallback priority:

1. Role/name selector
2. Stable visible text selector
3. Accessible label selector

Always verify:

- Target region equals `sandbox.business.region`
- Applied service set equals `sandbox.business.service_list`
- Generated link format is valid before write-back

---

## 15. Selector Drift on Service Cards After React Re-render

**Problem**: When adding services like "Amazon S3" or "AWS Step Functions", the agent types the service name into the Find Service box, then immediately clicks "Configure". The click fails or hits the wrong card because the AWS Calculator's React frontend re-renders the results list after every keystroke, invalidating whatever DOM references the previous snapshot captured.

**Root Cause**: The agent had no `read` step between "type service name" and "click Configure". It was operating on a stale DOM snapshot. Additionally, the only fallback selector was the generic `button:has-text('Configure')`, which is ambiguous if more than one result card is visible at the same time.

**Fix**:

1. Added a `read` action between the type and click actions in `_service_to_task_spec`. This forces a fresh DOM snapshot after the search results settle, and instructs the agent to visually confirm the correct card is present before clicking.

2. Added `configure_fallbacks_template` to `build_page_action_profile` — an ordered list of 8 progressively broader selectors:
   - `button:has-text('Configure {service_name}')` — exact button text match
   - `[aria-label='Configure {service_name}']` — exact aria-label
   - `[aria-label*='Configure {service_name}']` — partial aria-label
   - `[data-testid*='{service_name}'] button:has-text('Configure')` — testid-scoped
   - `article:has-text('{service_name}') >> button:has-text('Configure')` — card-scoped
   - `li:has-text('{service_name}') >> button:has-text('Configure')` — list-item-scoped
   - `div[class*='card']:has-text('{service_name}') >> button:has-text('Configure')` — class-scoped
   - `button:has-text('Configure')` — generic last resort

3. `_service_to_task_spec` now generates the full fallback list at task-build time by substituting the actual service name into each template entry.

**Additional root cause — card label mismatch**: AWS Calculator card labels do not always match the canonical `service_name`. For example, "Amazon S3" may appear as "S3", "Simple Storage Service", or "Amazon Simple Storage Service (S3)". Typing the full canonical name can return zero results or the wrong card, and card-scoped selectors that hardcode the full name always miss.

**Additional fix**:
- Added `search_keyword` field to `ServiceSpec` and the `service_list` schema. Set it to a short, unambiguous keyword for the Find Service box (e.g., `"S3"`, `"Step Functions"`, `"Lambda"`). Defaults to `service_name` when omitted.
- The fallback chain now substitutes both `{service_name}` (canonical name for verification) and `{search_keyword}` (short name for card scoping). Card-scoped selectors use `search_keyword` because card labels are often abbreviated.
- Duplicates in the expanded fallback list are deduplicated before use.

**Pattern**: Always read the page after a search/type action before clicking on dynamic results. Use card-scoped selectors (`article:has-text(keyword) >> button`) as the fallback for any React SPA where results re-render. Use a short search keyword, not the full canonical service name.

---

## 16. `architecture.diagram` Path Must Be Relative to `context.json`

**Problem**: `generate_proposal.py` failed with `sandbox.architecture.diagram (file not found: output/.../architecture.png)` even though the PNG file existed.

**Root Cause**: In `context.json`, `sandbox.architecture.diagram` was set to `output/{ProjectName}/architecture.png`. The generator resolves relative paths from the directory containing `context.json`, so this became an incorrect nested path.

**Fix**: For outputs in the same folder as `context.json`, set:

```json
"architecture": {
   "diagram": "architecture.png"
}
```

Use absolute paths only when needed; otherwise prefer a same-folder relative path.

---

## 14. Selector-less ActionSpec Clicks Crash the Configuration Flow

**Problem**: After adding per-service region-setting actions to `_service_to_task_spec`, zero services were added to the calculator even though the estimate was created. The agent reported success with a valid share link pointing to an empty estimate (0.00 USD, no services).

**Root Cause**: Two `ActionSpec` items were added to handle region-setting inside each service's config form:
1. A `click` action with **no selector** — `_choose_selector` returns `""`, so the agent's click lands on whatever has focus or does nothing useful.
2. A `click` with `selector=f"text={region}"` — this is an extremely broad selector that matches any visible text containing the region name (e.g., headers, breadcrumbs, labels), causing the agent to navigate away from the config form before filling any fields.

The result: all service configuration forms were exited immediately after opening, saving nothing. The estimate remained empty. The verification step's wording ("STOP and return to Phase 3") was too soft — the agent interpreted it as advisory and continued to Share anyway.

**Fix**:
1. Removed the two broken region-setting `ActionSpec` items.
2. Merged the region instruction into the existing `read` action's `note` as a conditional: "if a region dropdown is present, set it to X before filling other fields."
3. Made the verify task's note imperative with a concrete count check and explicit block: `DO NOT advance to collect_share_link until count == N`.
4. Made `collect_share_link`'s Share click note a hard guard referencing the count from the previous task.

**Rule**: Never add a `click` ActionSpec without a concrete `selector`. A note alone cannot drive a click reliably — the agent will click randomly or on the wrong element.

---

## 13. Agent Fabricates Calculator Link Without Opening the Browser

**Problem**: The agent produces a `calculator_link` that looks syntactically valid (matches `https://calculator.aws/#/estimate?id=<hash>`) but is fabricated. No browser was opened, no services were added, and clicking the link in the finished proposal leads to a non-existent estimate or a generic calculator homepage.

**Root Cause**: The only validation in `chrome_browser.py` is a regex format check on the link and a set-equality check between `applied_services` and `service_list`. A hallucinating agent can pass both checks by:
1. Constructing a plausible-looking link from memory or an example
2. Reporting all `service_list` entries as `applied_services`

Neither check requires actual browser interaction.

**Fix**:

1. A `verify_share_link_round_trip` task was added to `_build_runtime_tasks` in `chrome_browser.py`. After `collect_share_link`, the runtime loop now navigates to the extracted link in the browser and reads the loaded estimate page to verify the service count. If the page does not load a valid estimate, the loop halts and does not proceed to write-back.

2. `AWS_CALCULATOR_GUIDE.md` Phase 5.5 (Round-Trip Link Verification) was added as a mandatory step before recording the link.

3. `SKILL.md` Step 3B now opens with a block of absolute rules (⛔ HALLUCINATION RULES) that explicitly forbid fabricating links, skipping the browser, or calling write-back before round-trip verification passes.

**Detection**: If the link in the proposal leads to the calculator homepage or an error page, assume fabrication occurred. Re-run Step 3B from scratch.

---

## 12. Service Not Found When Using "Search by Location Type" Mode

**Problem**: When the agent runs Step 3B with "Search by location type" selected and a specific region set (e.g., Asia Pacific Taipei), certain services from `service_list` do not appear in the search results. The agent silently skips the missing service and continues to get a share link, resulting in an incomplete estimate (e.g., 5 out of 6 services).

**Root Cause**: "Search by location type" filters the service catalogue to only services available in the chosen region. Services that are not listed for that region are invisible in search results. The agent has no way to distinguish "service not found" from "service name mistyped" mid-flow, so it falls through and moves on.

**Fix**: Always select the **"Search all services"** radio button after clicking "Create estimate". This shows all 189 services regardless of regional availability. The region is then set **inside each service's individual configuration form** (which has its own region/location dropdown) rather than globally on the Add Service page.

---

## 16. Large Unstructured Prompts Need `<TODO>` Contact Defaults

**Problem**: Users often provide only the technical target-state description and omit partner/contact metadata required by the DOCX template.

**Root Cause**: Step 1 parser can infer architecture and delivery content, but cannot safely infer human identity fields like partner name, contact owner, PDM, and SA.

**Fix**: For raw prompts, always continue the full pipeline and populate required human fields with literal `<TODO>` placeholders while still producing `context.json`, `architecture.png`, and `Proposal.docx` in a unique timestamped folder.

---

## 22. Save-Flow Modal and Overlay Interference During Batch Adds

**Problem**: During high-volume service additions, `Save and add service` clicks intermittently time out even when the button is visible.

**Root Cause**: AWS Calculator frequently renders blocking overlays/modals (including share and acknowledgement dialogs) that intercept pointer events while async UI updates are in progress.

**Fix**: Add resilient fallbacks in this order: (1) close/dismiss active modal before pagination or save actions, (2) retry with forced click after wait, (3) as last resort execute a direct DOM click for the save button and immediately verify the post-save page transition/toast. Always re-check estimate summary after each fallback batch.

---

## 23. SageMaker Form Defaults Can Block Save With Hidden Required Inputs

**Problem**: Saving `Amazon SageMaker` failed even though the Save button was visible and clickable.

**Root Cause**: The default selected options (`SageMaker Studio Notebooks` and `SageMaker On-Demand Notebook Instances`) require multiple numeric fields. If any required field is blank, the form keeps inline validation errors and save does not complete.

**Fix**: Fill all required notebook fields before save. Working baseline values used in this run:

- Studio: data scientists `2`, instances per scientist `1`, hours/day `8`, days/month `22`
- On-Demand: data scientists `2`, instances per scientist `1`, hours/day `8`, days/month `22`

Then click `Save and add service` again and confirm the success banner on the Add Service page.

---

## 25. Calculator Summary Names Must Be Treated As Canonical For Step 3B Parity

**Problem**: `service_list` labels can differ from calculator summary labels (for example `Amazon RDS for PostgreSQL` vs `Amazon Aurora PostgreSQL-Compatible DB`, and `Amazon S3` vs `Amazon Simple Storage Service (S3)`), causing Step 3B write-back parity validation to fail.

**Root Cause**: Step 2 planning names were architecture-friendly aliases, but `chrome_browser.py` validates exact normalized service sets against what was actually added.

**Fix**: Normalize `sandbox.business.service_list[*].service_name` and `sandbox.architecture.applied_services` to the exact calculator summary names before Step 3B write-back. In this run:

- `Amazon Aurora PostgreSQL-Compatible DB`
- `Amazon Simple Storage Service (S3)`

This keeps `service_list`, `business.applied_services`, and `architecture.applied_services` consistent and allows successful context validation.

---

## 24. Share Link Extraction Requires Acknowledgement Confirmation

**Problem**: Clicking `Share` on the estimate page did not immediately expose the public link field, causing automation to return an empty share URL.

**Root Cause**: AWS Calculator displayed the first-step `Save estimate` acknowledgement modal, and the link textbox is only rendered after clicking `Agree and continue`.

**Fix**: In Step 3B automation, treat the share flow as two-stage: click `Share`, then click `Agree and continue`, then read `textbox "Copy public link"` for the final URL.

---

## 26. AWS CLI ExpiredToken Blocks Step 3C Validation and Step 8 Deployment

**Problem**: `aws cloudformation validate-template` and `aws cloudformation deploy` fail with `ExpiredToken` even when templates and stack parameters are valid.

**Root Cause**: Local AWS session credentials were expired in the active shell profile.

**Fix**: Continue generating all local artifacts (`context.json`, `architecture.png`, `Proposal.docx`, `demo_stack.yaml`, `review_report.txt`) and run deployment commands as required. If CLI returns `ExpiredToken`, report deployment as blocked by credentials and re-run validation/deploy after refreshing AWS credentials.

---

## 26. Round-Trip Share Link Page Can Stall on Initial Load

**Problem**: Opening the generated `#/estimate?id=...` link in a fresh page sometimes remains on `Loading...` or throws front-end runtime request failures before rendering service rows.

**Root Cause**: The calculator SPA intermittently fails remote requests during first-load hydration in the headless browser session, even when the estimate itself is valid.

**Fix**: Perform round-trip verification with a retry strategy: reload once, then fall back to validating service table completeness on the originating estimate tab if the share page still fails to hydrate. Record the fallback path in run notes.

**Pattern**:
1. Add Service page → click **"Search all services"** radio (not "Search by location type")
2. Search for, configure, and fill each service
3. Inside the service config form → locate and set the region dropdown to `sandbox.business.region`
4. Save the service and repeat for the next

This ensures no service is silently skipped due to regional filtering.

---

## 11. Calculator Share Link Contains Only 1 Service When N Are Expected

**Problem**: The final proposal has a calculator link where only 1 service appears in the estimate, even though the architecture/proposal describes N services.

**Root Cause**: Two compounding issues:

1. `_service_to_task_spec` in `chrome_browser.py` was missing the "fill configuration fields" step. The runtime loop task jumped directly from "click Configure" to "click Save" without filling in any values. As a result, some services failed to save properly or were saved with empty/default configurations.

2. No service-count verification existed before the Share button was clicked. The agent could get a share link after adding only 1 service if the iterative `--run-loop` feedback cycle was not executed for all service tasks.

**Fix**:

1. `_service_to_task_spec` now inserts a `read` action followed by `click`/`type` action pairs for each field in `calculator_config` between the "configure" click and the "save" click.

2. `_build_runtime_tasks` now inserts a `verify_all_services_before_share` task between the last service task and `collect_share_link`. That task reads the summary page and requires confirming all services are present before proceeding.

3. `AWS_CALCULATOR_GUIDE.md` now contains Phase 3.5 (mandatory service completeness verification) and a pre-condition block on Phase 5.

4. `SKILL.md` Step 3B now marks the iterative `--run-loop` feedback cycle as **REQUIRED** (not "recommended") and includes an explicit pre-share verification requirement.

**Pattern**: Always verify `len(summary_services) == len(service_list)` before extracting the share link. The share link is immutable — it captures the estimate state at the moment of sharing.

---

## 27. Agent Clicks First Configure Button Without Verifying Card Title

**Problem**: After typing a search keyword, the agent immediately clicks the first `Configure` button it finds — even if the visible card belongs to a different service (e.g. searching "S3" may surface "Amazon S3 Glacier" first). The wrong service gets configured and added to the estimate.

**Root Cause**: The `read` action note before the Configure click said "note the exact text" but did not explicitly block progression when no matching card was found, and the click action had no guard condition tied to the read result.

**Fix**:
1. The read action note now says **⚠️ CARD VERIFICATION — do NOT click Configure yet** and requires the agent to explicitly classify each visible card as matching or not before proceeding.
2. A `screenshot` action was added between the read and the click — the agent must take a screenshot showing the matching card as evidence. If no matching card is visible in the screenshot, the agent must re-search.
3. The Configure click note now says **Only proceed if the previous screenshot shows a matching card** and requires a card-scoped selector.

**Pattern**: After every search, read → verify card title → screenshot → only then click Configure on the specific card. Never click Configure without confirming the card title matches the expected service.

---

## 28. Service Summary Verification Passes by Count But Misses Wrong Service Name

**Problem**: The `verify_all_services_before_share` task checks that the row count equals `len(service_list)`, but if one service was accidentally added twice and another was never added, the count matches while the contents are wrong. The agent proceeds to Share with a corrupted estimate.

**Root Cause**: Count-only verification is insufficient. A wrong service can replace a missing one and produce the same row count.

**Fix**:
1. The verify read note now requires a **name-by-name comparison**: for each expected service, the agent must classify it as PRESENT or MISSING (partial match OK).
2. A `screenshot` action was added after the read to capture the full service table as pre-Share evidence.
3. The block condition is now: "DO NOT advance until ALL services are PRESENT by name" — not just count == total.

**Pattern**: Service verification = name-by-name match + screenshot. Count alone is not sufficient.

---

## 19. Table Defaults to 10 Rows — Use Preferences to Set 50 Rows Before Counting

**Problem**: The estimate summary table defaults to 10 rows per page. Any estimate with 11+ services paginates. Agents read page 1 (10 rows), conclude services are missing, add them again from page 2 — creating duplicates (e.g. "AWS IAM Access Analyzer" ×3, "Amazon CloudWatch" ×2).

**Root Cause**: The default page size is 10. The agent was never instructed to change it before reading the table, so it always operated on a truncated view.

**Fix**: Before reading the service table, always:
1. Click the **gear icon (⚙)** in the table header → Preferences dialog opens
2. Select **50 rows** → click **Confirm**
3. The entire estimate (up to 50 services) now appears on a single page

With 50-row view active: no pagination to navigate, duplicates are immediately visible in a single read, and the row count is accurate in one pass.

**How to delete duplicates once found**: Check the checkbox on each extra row → click **Delete** in the toolbar above the table. Repeat until exactly one copy of each service remains.

**Pattern**: First action in any verification step = set page size to 50. Never count rows on a 10-row-default table.

---

## 18. Summary Table Pagination Causes Duplicate Service Adds

**Problem**: With 10+ services, the AWS Calculator summary table paginates (typically 10 rows per page). The agent reads only page 1, sees fewer rows than expected (e.g. 10 of 15), incorrectly concludes 5 services are missing, adds them again — resulting in 20 services across 2 pages. The share link then captures an estimate with double the expected services.

**Root Cause**: The verification read note said "count the rows" without instructing the agent to paginate. Reading a single page of a multi-page table always produces an under-count, triggering unnecessary re-adds and duplicates.

**Fix**:
1. `verify_all_services_before_share` now has a dedicated **PAGINATED FULL-TABLE READ** step that explicitly instructs the agent to click "Next page" until all pages have been read and all service names collected.
2. The strict verification step now handles **both** under-count (add missing) AND over-count (delete duplicates using the 🗑 icon on each extra row) — not just under-count.
3. Round-trip verification similarly instructs the agent to paginate before counting.
4. A **DUPLICATE GUARD** read was added as the first action in each per-service configure flow — before searching, check whether the service is already in the estimate.

**Pattern**: When `len(service_list) > 10`, always paginate through ALL pages before counting or comparing service names. Over-count is just as wrong as under-count.

---

## 20. SageMaker Studio Notebooks and On-Demand Notebooks Inflate the Estimate

**Problem**: The monthly cost estimate was abnormally high (hundreds of thousands USD) when `Amazon SageMaker` was added to the calculator. The overall estimate appeared valid (14/14 services present) but the total was unrealistic for a sandbox proposal.

**Root Cause**: SageMaker's configuration form has 4 sub-feature checkboxes. `SageMaker Studio Notebooks` and `SageMaker On-Demand Notebook Instances` are **checked by default**. Both require "Number of data scientists" — and even with conservative values (2 scientists, 8 hours/day, 22 days/month), the per-user cost is very high. The `fillAll` automation only targeted specific known aria-labels; if those labels didn't match exactly, the fields kept their large UI defaults.

**Fix**: Apply dynamic form analysis (see `AWS_CALCULATOR_GUIDE.md` section 3c) before filling any service form:

1. Read the current form state — identify all checkboxes, toggles, and accordion sections visible
2. Cross-reference with the proposal's architecture: which SageMaker sub-features does this solution actually use?
3. **Disable** sub-features not relevant to the use case (especially notebook environments for inference-only architectures)
4. **Enable** only what is needed, then fill conservative values for those sections

For a typical sandbox proposal that uses SageMaker for scheduled training + live inference (not interactive notebooks):
- Studio Notebooks → disable (uncheck)
- On-Demand Notebooks → disable (uncheck)
- Training → enable → `ml.m5.xlarge`, 40 hours/month
- Real-Time Inference → enable → `ml.m5.large`, 200 hours/month

```javascript
// Read the form first, then decide per the above
const studio = page.getByRole('checkbox', { name: /Studio Notebooks/i });
if (await studio.isChecked()) await studio.uncheck();
const onDemand = page.getByRole('checkbox', { name: /On-Demand Notebook/i });
if (await onDemand.isChecked()) await onDemand.uncheck();
// Enable only what the architecture calls for
await page.getByRole('checkbox', { name: /SageMaker Training/i }).check();
await page.getByRole('checkbox', { name: /Real-Time Inference/i }).check();
```

**Pattern**: Read the form → reason about the architecture → enable only relevant features → fill minimums → check for validation errors → save. This applies to any service with multiple sub-feature toggles, not just SageMaker.

---

## 21. Browser Opens at Homepage Instead of Add Service Page

**Problem**: Automation navigated to `https://calculator.aws/#/` and clicked "Create estimate", adding an extra page load and click before reaching the Add Service page. This occasionally stalls if the homepage button takes time to render.

**Root Cause**: Generated Playwright code defaulted to the homepage URL pattern instead of using the direct deep-link to the Add Service page.

**Fix**: Always navigate directly to `https://calculator.aws/#/addService`. The AWS Calculator supports deep-linking into the add-service flow without going through the homepage.

```javascript
// CORRECT
await page.goto('https://calculator.aws/#/addService');
await page.waitForTimeout(2000);

// WRONG — adds unnecessary step
// await page.goto('https://calculator.aws/#/');
// await page.getByRole('button', { name: /Create estimate/i }).click();
```

**Pattern**: Use `#/addService` as the entry point. After each service save, navigate back to `#/addService` directly (not `#/`) and re-select "Search all services" since the radio resets on each page load.

---

## See Also

- [generate_proposal.py](../scripts/generate_proposal.py) — Main DOCX generator
- [diagrams_resolver.py](../scripts/diagrams_resolver.py) — Import name resolver and env checker  
- [test_generate.py](../scripts/test_generate.py) — 48-test validation suite
- [SKILL.md](../SKILL.md) — Step-by-step workflow guide
