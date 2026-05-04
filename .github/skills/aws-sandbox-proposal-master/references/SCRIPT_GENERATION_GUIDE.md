# Script Generation Guide — GROUP B Calculator Scripts

Every time a GROUP B service is manually filled, immediately write a `.js` script for it so future runs treat it as GROUP A.

## File location

```
.github/skills/aws-sandbox-proposal-master/scripts/calculator/{ExactServiceName}.js
```

`{ExactServiceName}` = exact name from `assets/aws_services.json` with spaces replaced by spaces (keep spaces in the filename) — e.g. `Amazon Kinesis Data Streams.js`.

## What the script must do

1. Search for the service by name
2. Click Configure
3. Set the region
4. Fill every numeric or dropdown field touched during the manual fill
5. Click "Save and add service"
6. Print `[ServiceName] Saved successfully!` on success

## Script template — use this structure exactly

Read `scripts/calculator/AWS Lambda.js` as the reference — every generated script follows the same 4-phase pattern with the same helper set.

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

  async function selectDropdown(labelText, value) {
    const btns = [...document.querySelectorAll('button[aria-haspopup="listbox"]')]
      .filter(el => (el.getAttribute('aria-label') || el.textContent || '').includes(labelText));
    const btn = btns[0];
    if (!btn) { console.warn('[{ShortName}] Dropdown not found:', labelText); return; }
    scrollTo(btn); await jitter(); btn.click(); await wait(600);
    const option = [...document.querySelectorAll('[role="option"]')]
      .find(o => o.textContent.trim().includes(value));
    if (!option) { console.warn('[{ShortName}] Option not found:', value); return; }
    scrollTo(option); await jitter(); option.click(); await jitter(100, 300);
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
  // Use setFieldByAria() for numeric inputs, selectDropdown() for dropdowns,
  // clickRadioByExactAria() for radio buttons.

  await waitForElement('h1, input[aria-label*="Region"]', 15000);

  await selectDropdown('Region', config.region);

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

## Rules for the generated script

- **`params?.field ?? defaultValue`** for every config entry — never a bare literal
- **Defaults must be realistic mid-range SMB values** — not minimal (1/month) and not the proposal's production numbers
- **Use the same helper set** — do not invent new helpers; the existing ones cover every case
- **Exact aria-label strings** — copy character-for-character from the live DOM during the manual fill
- **`})({...})` override block** — leave with only comments; the agent fills it at inject time

## After writing the script

Update the "Available scripts" count/list in `SKILL.md` header to include the new service so future runs classify it as GROUP A.
