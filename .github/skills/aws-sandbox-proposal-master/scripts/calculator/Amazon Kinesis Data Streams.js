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
 *
 * NOTE: The calculator UI uses a dialog-based region picker (aria-haspopup="dialog"),
 *       not a listbox dropdown. selectRegion() handles this correctly.
 *       Capacity modes: 'On-Demand Standard', 'On-Demand Advantage Mode', 'Provisioned Mode'.
 */

(async function configureAmazonKinesisDataStreams(params) {

  const config = {
    // Description - optional | PRICING IMPACT: false
    description: params?.description ?? 'SMB Kinesis stream baseline',

    // Choose a Region | PRICING IMPACT: true
    region: params?.region ?? 'Asia Pacific (Seoul)',

    // Capacity mode | PRICING IMPACT: true
    // 'On-Demand Standard' | 'On-Demand Advantage Mode' | 'Provisioned Mode'
    mode: params?.mode ?? 'On-Demand Standard',

    // --- On-Demand Standard / Advantage Mode fields ---

    // Number of data records written per second | PRICING IMPACT: true
    numberOfRecords: params?.numberOfRecords ?? 100,

    // Average record size in KB | PRICING IMPACT: true
    recordSizeKB: params?.recordSizeKB ?? 1,

    // Number of consumer applications reading from the stream | PRICING IMPACT: true
    numberOfConsumers: params?.numberOfConsumers ?? 2,

    // Data retention in days (1 = 24 h default, max 365) | PRICING IMPACT: true
    retentionDays: params?.retentionDays ?? 1,

    // Enhanced fan-out consumer count | PRICING IMPACT: true
    numberOfEnhancedFanOutConsumers: params?.numberOfEnhancedFanOutConsumers ?? 0,

    // --- Provisioned Mode fields ---

    // Number of shards (only used when mode = 'Provisioned Mode') | PRICING IMPACT: true
    numberOfShards: params?.numberOfShards ?? 5,
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

  /**
   * selectRegion — opens the "Choose a Region" dialog (aria-haspopup="dialog")
   * and clicks the matching option. This is separate from selectDropdown because
   * the region picker uses a dialog overlay, NOT a listbox dropdown.
   */
  async function selectRegion(value) {
    // The "Choose a Region" button is the only button[aria-haspopup="dialog"] on the page
    const regionBtn = document.querySelector('button[aria-haspopup="dialog"]');
    if (!regionBtn) { console.warn('[Amazon Kinesis Data Streams] Region dialog button not found'); return; }
    scrollTo(regionBtn);
    await jitter();

    // element.click() alone does not mount the Cloudscape listbox — fire the full
    // pointer/mouse event sequence to properly trigger React's event handlers.
    regionBtn.dispatchEvent(new PointerEvent('pointerover',  { bubbles: true, cancelable: true }));
    regionBtn.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    regionBtn.dispatchEvent(new MouseEvent('mouseover',  { bubbles: true }));
    regionBtn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    regionBtn.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
    regionBtn.dispatchEvent(new MouseEvent('mousemove',  { bubbles: true }));
    regionBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    regionBtn.dispatchEvent(new MouseEvent('mousedown',  { bubbles: true, cancelable: true }));
    regionBtn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    regionBtn.dispatchEvent(new MouseEvent('mouseup',    { bubbles: true }));
    regionBtn.click();
    await wait(1000);

    // Type into the combobox search input to filter options
    const searchInput = document.querySelector('input[role="combobox"]');
    if (searchInput) {
      scrollTo(searchInput);
      setInputValue(searchInput, value);
      searchInput.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
      await wait(700);
    } else {
      console.warn('[Amazon Kinesis Data Streams] combobox search input not found');
    }

    // Click the matching option.
    // Like the region button, the Cloudscape option ignores a bare .click() —
    // React's synthetic handlers require the full pointer/mouse event sequence
    // to register a selection. Without this the dropdown stays open and the
    // region label never updates.
    const option = [...document.querySelectorAll('[role="option"]')]
      .find(o => o.textContent.trim().includes(value));
    if (!option) { console.warn('[Amazon Kinesis Data Streams] Region option not found:', value); return; }
    scrollTo(option);
    await jitter();
    option.dispatchEvent(new PointerEvent('pointerover',  { bubbles: true, cancelable: true }));
    option.dispatchEvent(new MouseEvent('mouseover',  { bubbles: true }));
    option.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
    option.dispatchEvent(new MouseEvent('mousemove',  { bubbles: true }));
    option.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    option.dispatchEvent(new MouseEvent('mousedown',  { bubbles: true, cancelable: true }));
    option.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    option.dispatchEvent(new MouseEvent('mouseup',    { bubbles: true }));
    option.click();
    await wait(600);

    // Verify selection took effect; if dialog is still open, retry once.
    const stillOpen = document.querySelector('[role="dialog"][data-open="true"]');
    if (stillOpen) {
      console.warn('[Amazon Kinesis Data Streams] Region dialog still open after click; retrying');
      option.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      option.dispatchEvent(new MouseEvent('mousedown',  { bubbles: true, cancelable: true }));
      option.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      option.dispatchEvent(new MouseEvent('mouseup',    { bubbles: true }));
      option.click();
      await wait(600);
    }
    console.log('[Amazon Kinesis Data Streams] Region set to:', value);
  }

  /**
   * selectDropdown — for standard listbox dropdowns (aria-haspopup="listbox").
   * Do NOT use for region — use selectRegion() instead.
   */
  async function selectDropdown(labelText, value) {
    const btns = [...document.querySelectorAll('button[aria-haspopup="listbox"]')]
      .filter(el => (el.getAttribute('aria-label') || el.textContent || '').includes(labelText));
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

  /**
   * selectMode — clicks the radio button for the desired capacity mode.
   * Accepted values: 'On-Demand Standard', 'On-Demand Advantage Mode', 'Provisioned Mode'
   */
  async function selectMode(mode) {
    // aria-label is null on these radios — match by parent container text instead
    const radio = [...document.querySelectorAll('input[type="radio"]')]
      .find(r => (r.parentElement?.parentElement?.textContent || '').includes(mode));
    if (!radio) { console.warn('[Amazon Kinesis Data Streams] Mode radio not found:', mode); return; }
    if (!radio.checked) {
      scrollTo(radio);
      await jitter();
      radio.click();
      await wait(600);
    }
    console.log('[Amazon Kinesis Data Streams] Mode set to:', mode);
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

  // Region: uses a dialog picker (aria-haspopup="dialog"), NOT a listbox dropdown.
  await selectRegion(config.region);

  // Capacity mode — radio button selection
  await selectMode(config.mode);

  if (config.mode === 'Provisioned Mode') {
    // Provisioned mode: configure shards
    await setFieldByAria('Number of shards', config.numberOfShards);
  } else {
    // On-Demand Standard / Advantage Mode: record-based fields
    await setFieldByAria('Number of records', config.numberOfRecords);
    await setFieldByAria('Average record size', config.recordSizeKB);
    await setFieldByAria('Number of Consumer Applications', config.numberOfConsumers);
    await setFieldByAria('Number of days for data retention', config.retentionDays);
    if (config.numberOfEnhancedFanOutConsumers > 0) {
      await setFieldByAria('Number of Enhanced fan-out consumers', config.numberOfEnhancedFanOutConsumers);
    }
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
  // region: 'Asia Pacific (Taipei)',
  // mode: 'On-Demand Standard',       // 'On-Demand Standard' | 'On-Demand Advantage Mode' | 'Provisioned Mode'
  // numberOfRecords: 100,             // records per second (On-Demand modes)
  // recordSizeKB: 1,                  // KB per record (On-Demand modes)
  // numberOfConsumers: 2,             // consumer applications (On-Demand modes)
  // retentionDays: 1,                 // 1–365 days (On-Demand modes)
  // numberOfEnhancedFanOutConsumers: 0,
  // numberOfShards: 5,                // shards (Provisioned Mode only)
});
