/**
 * AWS IoT Core - AWS Pricing Calculator Script
 *
 * Service name  : AWS IoT Core
 * Configure URL : https://calculator.aws/#/createCalculator/IoTCore
 *
 * Usage (AI agent):
 *   Read this file with the Read tool, paste full content into page.evaluate(`...`).
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 *
 * Notes:
 *   IoT Core pricing is based on connectivity + messaging + registry + rules.
 *   The most impactful fields are numberOfDevices and messagesPerDevicePerDay.
 *   The calculator page has a "Connectivity" section and a "Messaging" section.
 */

(async function configureAWSIoTCore(params) {

  const config = {
    // Description - optional | PRICING IMPACT: false
    description: params?.description ?? 'SMB IoT fleet telemetry baseline',

    // Choose a Region | PRICING IMPACT: true
    region: params?.region ?? 'US East (N. Virginia)',

    // Number of connected devices | PRICING IMPACT: true
    numberOfDevices: params?.numberOfDevices ?? 1000,

    // Average connection duration per device (hours/day) | PRICING IMPACT: true
    connectionHoursPerDay: params?.connectionHoursPerDay ?? 12,

    // Messages per device per day (each message ≤ 5 KB) | PRICING IMPACT: true
    messagesPerDevicePerDay: params?.messagesPerDevicePerDay ?? 300,

    // Average message size (KB, max 5) | PRICING IMPACT: true
    messageSizeKb: params?.messageSizeKb ?? 1,

    // IoT Rules triggered per month (millions) | PRICING IMPACT: true
    rulesTriggeredMillions: params?.rulesTriggeredMillions ?? 1,

    // Rule actions executed per month (millions) | PRICING IMPACT: true
    ruleActionsMillions: params?.ruleActionsMillions ?? 1,

    // Registry operations per month (thousands) | PRICING IMPACT: true
    registryOpsThousands: params?.registryOpsThousands ?? 100,
  };

  console.log('[AWS IoT Core] Starting with config:', config);

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
    console.warn('[AWS IoT Core] waitForElement timed out:', selector);
    return null;
  }

  function findInputsByAriaContains(text) {
    return [...document.querySelectorAll('input, textarea')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(text));
  }

  async function setFieldByAria(text, value, index = 0) {
    const all = findInputsByAriaContains(text);
    const el = all[index] || null;
    if (!el) { console.warn('[AWS IoT Core] Field not found:', text, 'index', index); return; }
    await jitter();
    setInputValue(el, value);
    await jitter(100, 300);
  }

  async function selectDropdown(labelText, value) {
    const btns = [...document.querySelectorAll('button[aria-haspopup="listbox"]')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(labelText));
    const btn = btns[0];
    if (!btn) { console.warn('[AWS IoT Core] Dropdown not found:', labelText); return; }
    scrollTo(btn);
    await jitter();
    btn.click();
    await wait(600);
    const option = [...document.querySelectorAll('[role="option"]')]
      .find(o => o.textContent.trim().includes(value));
    if (!option) { console.warn('[AWS IoT Core] Option not found:', value); return; }
    scrollTo(option);
    await jitter();
    option.click();
    await jitter(100, 300);
  }
  /**
   * selectRegion — opens the "Choose a Region" dialog (aria-haspopup="dialog")
   * and clicks the matching option. The region picker uses a dialog overlay,
   * not a listbox, so selectDropdown() cannot be used here.
   */
  async function selectRegion(value) {
    const regionBtn = document.querySelector('button[aria-haspopup="dialog"]');
    if (!regionBtn) { console.warn('[AWS IoT Core] Region dialog button not found'); return; }
    scrollTo(regionBtn);
    await jitter();
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
    const searchInput = document.querySelector('input[role="combobox"]');
    if (searchInput) {
      scrollTo(searchInput);
      setInputValue(searchInput, value);
      searchInput.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
      await wait(700);
    } else {
      console.warn('[AWS IoT Core] combobox search input not found');
    }
    const option = [...document.querySelectorAll('[role="option"]')]
      .find(o => o.textContent.trim().includes(value));
    if (!option) { console.warn('[AWS IoT Core] Region option not found:', value); return; }
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
    const stillOpen = document.querySelector('[role="dialog"][data-open="true"]');
    if (stillOpen) {
      console.warn('[AWS IoT Core] Region dialog still open after click; retrying');
      option.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      option.dispatchEvent(new MouseEvent('mousedown',  { bubbles: true, cancelable: true }));
      option.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      option.dispatchEvent(new MouseEvent('mouseup',    { bubbles: true }));
      option.click();
      await wait(600);
    }
    console.log('[AWS IoT Core] Region set to:', value);
  }

  // -- PHASE 1 : NAVIGATE ----------------------------------------------------

  if (!window.location.hash.includes('/addService') &&
      !window.location.hash.includes('/createCalculator/IoTCore')) {
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
      setInputValue(searchBox, 'AWS IoT Core');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' &&
                 b.closest('li, article')?.textContent?.includes('IoT Core'));
    if (configBtn) {
      scrollTo(configBtn);
      await jitter(250, 600);
      configBtn.click();
      await wait(5000);
    } else {
      console.warn('[AWS IoT Core] Configure button not found');
      return;
    }
  }

  // -- PHASE 3 : FILL FORM ---------------------------------------------------

  await waitForElement('h1, input[aria-label*="Description"]', 15000);

  await setFieldByAria('Description - optional', config.description);
  await selectRegion(config.region);

  // Connectivity section
  await setFieldByAria('Number of devices', config.numberOfDevices);
  await setFieldByAria('Average connection duration', config.connectionHoursPerDay);

  // Messaging section
  await setFieldByAria('Messages per device per day', config.messagesPerDevicePerDay);
  await setFieldByAria('Average message size', config.messageSizeKb);

  // Rules Engine
  await setFieldByAria('Rules triggered', config.rulesTriggeredMillions);
  await setFieldByAria('Rule actions', config.ruleActionsMillions);

  // Registry
  await setFieldByAria('Registry operations', config.registryOpsThousands);

  // -- PHASE 4 : SAVE --------------------------------------------------------

  await jitter(400, 800);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');
  if (saveBtn) {
    scrollTo(saveBtn);
    await jitter(300, 600);
    saveBtn.click();
    console.log('[AWS IoT Core] Saved successfully!');
  } else {
    console.warn('[AWS IoT Core] Save and add service button not found');
  }

})({
  // Override defaults here. All keys are optional — omit to keep script default.
  // region: 'Asia Pacific (Mumbai)',
  // numberOfDevices: 3000,
  // messagesPerDevicePerDay: 300,
  // connectionHoursPerDay: 12,
});
