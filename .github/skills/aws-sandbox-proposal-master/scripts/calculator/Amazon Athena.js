/**
 * Amazon Athena - AWS Pricing Calculator Script
 *
 * Service name  : Amazon Athena
 * Configure URL : https://calculator.aws/#/createCalculator/Athena
 *
 * Auto-generated after GROUP B manual fill on 2026-04-27.
 * Inject via page.evaluate() - do NOT use require/fs.
 */

(async function configureAmazonAthena(params) {

  // -- DEFAULT CONFIGURATION -------------------------------------------------
  // Defaults are realistic SMB/mid-scale values and can be overridden at call time.
  const config = {
    // Description - optional | PRICING IMPACT: false
    description: params?.description ?? 'SMB interactive analytics baseline',

    // Region | PRICING IMPACT: true
    region: params?.region ?? 'Asia Pacific (Mumbai)',

    // SQL queries with per query pricing | PRICING IMPACT: true
    totalQueries: params?.totalQueries ?? 10000,
    totalQueriesUnit: params?.totalQueriesUnit ?? 'per month',
    dataScannedPerQuery: params?.dataScannedPerQuery ?? 2,
    dataScannedPerQueryUnit: params?.dataScannedPerQueryUnit ?? 'GB',

    // SQL queries with capacity based pricing | PRICING IMPACT: true
    numberOfDpus: params?.numberOfDpus ?? 8,
    activeCapacityTimeValue: params?.activeCapacityTimeValue ?? 40,
    activeCapacityTimeUnit: params?.activeCapacityTimeUnit ?? 'hours per month',

    // Spark pricing | PRICING IMPACT: true
    totalSparkSessions: params?.totalSparkSessions ?? 300,
    totalSparkSessionsUnit: params?.totalSparkSessionsUnit ?? 'per month',
    codeExecutionPerSession: params?.codeExecutionPerSession ?? 0.25,
    codeExecutionPerSessionUnit: params?.codeExecutionPerSessionUnit ?? 'DPU-hour',
  };

  console.log('[Amazon Athena] Starting with config:', config);

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
    console.warn('[Amazon Athena] waitForElement timed out:', selector);
    return null;
  }

  function findInputsByAriaContains(text) {
    return [...document.querySelectorAll('input, textarea')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(text));
  }

  async function setFieldByAria(text, value, index = 0) {
    const all = findInputsByAriaContains(text);
    const el = all[index] || null;
    if (!el) { console.warn('[Amazon Athena] Field not found:', text, 'index', index); return; }
    await jitter();
    setInputValue(el, value);
    await jitter(100, 300);
  }

  async function clickRadioByExactAria(text) {
    const radio = [...document.querySelectorAll('input[type="radio"]')]
      .find(r => (r.getAttribute('aria-label') || '') === text);
    if (!radio) { console.warn('[Amazon Athena] Radio not found:', text); return; }
    if (!radio.checked) { scrollTo(radio); await jitter(); radio.click(); await jitter(100, 300); }
  }

  async function selectDropdown(labelText, value, index = 0) {
    const btns = [...document.querySelectorAll('button[aria-haspopup="listbox"]')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(labelText));
    const btn = btns[index] || null;
    if (!btn) { console.warn('[Amazon Athena] Dropdown not found:', labelText, 'index', index); return; }
    scrollTo(btn);
    await jitter();
    btn.click();
    await wait(600);
    const option = [...document.querySelectorAll('[role="option"]')]
      .find(o => o.textContent.trim().includes(value));
    if (!option) { console.warn('[Amazon Athena] Option not found:', value); return; }
    scrollTo(option);
    await jitter();
    option.click();
    await jitter(100, 300);
  }

  // -- PHASE 1 : NAVIGATE ----------------------------------------------------

  if (!window.location.hash.includes('/addService') &&
      !window.location.hash.includes('/createCalculator/Athena')) {
    window.location.hash = '#/addService';
    await wait(2500);
  }

  // -- PHASE 2 : SEARCH AND CONFIGURE ----------------------------------------

  if (window.location.hash.includes('/addService')) {
    const searchAllRadio = [...document.querySelectorAll('input[type="radio"]')]
      .find(r => (r.closest('label, div')?.textContent || '').includes('Search all services'));
    if (searchAllRadio && !searchAllRadio.checked) {
      scrollTo(searchAllRadio);
      await jitter(200, 400);
      searchAllRadio.click();
      await wait(800);
    }

    const searchBox = await waitForElement(
      'input[placeholder="Search for a service"], input[aria-label="Find Service"], input[role="searchbox"]'
    );
    if (searchBox) {
      scrollTo(searchBox);
      await jitter(200, 500);
      setInputValue(searchBox, 'Amazon Athena');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' &&
                 b.closest('li, article')?.textContent?.includes('Amazon Athena'));
    if (configBtn) {
      scrollTo(configBtn);
      await jitter(250, 600);
      configBtn.click();
      await wait(5000);
    } else {
      console.warn('[Amazon Athena] Configure button not found');
      return;
    }
  }

  // -- PHASE 3 : FILL FORM ---------------------------------------------------

  await waitForElement('h1, input[aria-label*="Description"]', 15000);

  await setFieldByAria('Description - optional', config.description);
  await selectDropdown('Choose a Region', config.region);

  await setFieldByAria('Total number of queries Value', config.totalQueries);
  await selectDropdown('Unit Total number of queries', config.totalQueriesUnit);

  await setFieldByAria('Amount of data scanned per query Value', config.dataScannedPerQuery);
  await selectDropdown('Unit Amount of data scanned per query', config.dataScannedPerQueryUnit);

  await setFieldByAria('Number of DPUs Enter amount', config.numberOfDpus);
  await setFieldByAria('Length of time capacity is active Value', config.activeCapacityTimeValue);
  await selectDropdown('Length of time capacity is active Unit', config.activeCapacityTimeUnit);

  await setFieldByAria('Total number of spark sessions Value', config.totalSparkSessions);
  await selectDropdown('Unit Total number of spark sessions', config.totalSparkSessionsUnit);

  await setFieldByAria('Code execution per session Value', config.codeExecutionPerSession);
  await selectDropdown('Unit Code execution per session', config.codeExecutionPerSessionUnit);

  // -- PHASE 4 : SAVE --------------------------------------------------------

  await jitter(400, 800);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');
  if (saveBtn) {
    scrollTo(saveBtn);
    await jitter(300, 600);
    saveBtn.click();
    console.log('[Amazon Athena] Saved successfully!');
  } else {
    console.warn('[Amazon Athena] Save and add service button not found');
  }

})({
  // Override defaults for this proposal run.
  // region: 'US East (N. Virginia)',
  // totalQueries: 20000,
  // totalQueriesUnit: 'per month',
  // dataScannedPerQuery: 1,
  // dataScannedPerQueryUnit: 'GB',
  // numberOfDpus: 8,
  // activeCapacityTimeValue: 60,
  // activeCapacityTimeUnit: 'hours per month',
  // totalSparkSessions: 500,
  // totalSparkSessionsUnit: 'per month',
  // codeExecutionPerSession: 0.25,
  // codeExecutionPerSessionUnit: 'DPU-hour',
});
