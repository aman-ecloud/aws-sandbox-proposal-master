/**
 * Amazon Kinesis Data Streams - AWS Pricing Calculator Script
 *
 * Service name  : Amazon Kinesis Data Streams
 * Configure URL : https://calculator.aws/#/createCalculator/KinesisDataStreams
 *
 * Usage (AI agent):
 *   Read this file with the Read tool, paste full content into page.evaluate(`...`).
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 */

(async function configureAmazonKinesisDataStreams(params) {

  const config = {
    // Description - optional | PRICING IMPACT: false
    description: params?.description ?? 'SMB Kinesis stream baseline',

    // Choose a Region | PRICING IMPACT: true
    region: params?.region ?? 'US East (N. Virginia)',

    // Number of shards | PRICING IMPACT: true
    numberOfShards: params?.numberOfShards ?? 5,

    // Data retention period (hours) | PRICING IMPACT: true
    // 24 = default (no charge), 168 = 7-day extended, 8760 = long-term
    retentionHours: params?.retentionHours ?? 24,

    // Extended retention (hours beyond 24h) — only set if retentionHours > 24 | PRICING IMPACT: true
    // Leave as 0 to keep the default 24-hour free window only.
    extendedRetentionHours: params?.extendedRetentionHours ?? 0,
  };

  console.log('[Amazon Kinesis Data Streams] Starting with config:', config);

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
    console.warn('[Amazon Kinesis Data Streams] waitForElement timed out:', selector);
    return null;
  }

  function findInputsByAriaContains(text) {
    return [...document.querySelectorAll('input, textarea')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(text));
  }

  async function setFieldByAria(text, value, index = 0) {
    const all = findInputsByAriaContains(text);
    const el = all[index] || null;
    if (!el) { console.warn('[Amazon Kinesis Data Streams] Field not found:', text, 'index', index); return; }
    await jitter();
    setInputValue(el, value);
    await jitter(100, 300);
  }

  async function selectDropdown(labelText, value) {
    const btns = [...document.querySelectorAll('button[aria-haspopup="listbox"]')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(labelText));
    const btn = btns[0];
    if (!btn) { console.warn('[Amazon Kinesis Data Streams] Dropdown not found:', labelText); return; }
    scrollTo(btn);
    await jitter();
    btn.click();
    await wait(600);
    const option = [...document.querySelectorAll('[role="option"]')]
      .find(o => o.textContent.trim().includes(value));
    if (!option) { console.warn('[Amazon Kinesis Data Streams] Option not found:', value); return; }
    scrollTo(option);
    await jitter();
    option.click();
    await jitter(100, 300);
  }

  // -- PHASE 1 : NAVIGATE ----------------------------------------------------

  if (!window.location.hash.includes('/addService') &&
      !window.location.hash.includes('/createCalculator/KinesisDataStreams')) {
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
      setInputValue(searchBox, 'Amazon Kinesis Data Streams');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' &&
                 b.closest('li, article')?.textContent?.includes('Kinesis Data Streams'));
    if (configBtn) {
      scrollTo(configBtn);
      await jitter(250, 600);
      configBtn.click();
      await wait(5000);
    } else {
      console.warn('[Amazon Kinesis Data Streams] Configure button not found');
      return;
    }
  }

  // -- PHASE 3 : FILL FORM ---------------------------------------------------

  await waitForElement('h1, input[aria-label*="Description"]', 15000);

  await setFieldByAria('Description - optional', config.description);
  await selectDropdown('Region', config.region);

  // Shard count
  await setFieldByAria('Number of shards Enter amount', config.numberOfShards);

  // Data retention — the calculator shows a single retention field in hours
  // Values accepted: 24 (default), 168 (7 days), 8760 (365 days)
  await setFieldByAria('Data Retention', config.retentionHours);

  // If extended retention beyond 24h is requested, fill the extended field too
  if (config.extendedRetentionHours > 0) {
    await setFieldByAria('Extended data retention', config.extendedRetentionHours);
  }

  // -- PHASE 4 : SAVE --------------------------------------------------------

  await jitter(400, 800);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');
  if (saveBtn) {
    scrollTo(saveBtn);
    await jitter(300, 600);
    saveBtn.click();
    console.log('[Amazon Kinesis Data Streams] Saved successfully!');
  } else {
    console.warn('[Amazon Kinesis Data Streams] Save and add service button not found');
  }

})({
  // Override defaults here. All keys are optional — omit to keep script default.
  // region: 'Asia Pacific (Mumbai)',
  // numberOfShards: 5,
  // retentionHours: 24,
});
