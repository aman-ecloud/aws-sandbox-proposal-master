/**
 * Amazon EventBridge - AWS Pricing Calculator Script
 *
 * Service name  : Amazon EventBridge
 * Configure URL : https://calculator.aws/#/addService (resolved at runtime)
 *
 * Usage (AI agent):
 *   Read this file with the Read tool, paste full content into page.evaluate(`...`).
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 */

(async function configureAmazonEventBridge(params) {

  const config = {
    // Description - optional | PRICING IMPACT: false
    description: params?.description ?? 'SMB EventBridge event routing baseline',

    // Choose a Region | PRICING IMPACT: true
    region: params?.region ?? 'US East (N. Virginia)',

    // Number of events published to EventBridge (millions/month) | PRICING IMPACT: true
    eventsMillions: params?.eventsMillions ?? 5,

    // Number of schema discovery events (millions/month) | PRICING IMPACT: true
    schemaDiscoveryEventsMillions: params?.schemaDiscoveryEventsMillions ?? 1,

    // Number of cross-account events (millions/month) | PRICING IMPACT: true
    crossAccountEventsMillions: params?.crossAccountEventsMillions ?? 0,

    // Number of event replays (GB) | PRICING IMPACT: true
    eventReplayGb: params?.eventReplayGb ?? 0,
  };

  console.log('[Amazon EventBridge] Starting with config:', config);

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

  async function setFieldByAria(labelText, value, index = 0) {
    const all = [...document.querySelectorAll('input, textarea')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(labelText));
    const el = all[index];
    if (!el) { console.warn('[Amazon EventBridge] Field not found:', labelText); return; }
    await jitter();
    setInputValue(el, value);
    await jitter(100, 300);
  }

  async function selectDropdown(labelText, value, index = 0) {
    const btns = [...document.querySelectorAll('button[aria-haspopup="listbox"]')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(labelText));
    const btn = btns[index];
    if (!btn) { console.warn('[Amazon EventBridge] Dropdown not found:', labelText); return; }
    scrollTo(btn);
    await jitter();
    btn.click();
    await wait(600);
    const option = [...document.querySelectorAll('[role="option"]')]
      .find(o => o.textContent.trim().includes(value));
    if (!option) { console.warn('[Amazon EventBridge] Option not found:', value); return; }
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
    if (!regionBtn) { console.warn('[Amazon EventBridge] Region dialog button not found'); return; }
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
      console.warn('[Amazon EventBridge] combobox search input not found');
    }
    const option = [...document.querySelectorAll('[role="option"]')]
      .find(o => o.textContent.trim().includes(value));
    if (!option) { console.warn('[Amazon EventBridge] Region option not found:', value); return; }
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
      console.warn('[Amazon EventBridge] Region dialog still open after click; retrying');
      option.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      option.dispatchEvent(new MouseEvent('mousedown',  { bubbles: true, cancelable: true }));
      option.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      option.dispatchEvent(new MouseEvent('mouseup',    { bubbles: true }));
      option.click();
      await wait(600);
    }
    console.log('[Amazon EventBridge] Region set to:', value);
  }

  async function waitForElement(selector, timeout = 12000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const el = document.querySelector(selector);
      if (el) return el;
      await wait(300);
    }
    console.warn('[Amazon EventBridge] waitForElement timed out:', selector);
    return null;
  }

  if (!window.location.hash.includes('/addService') && !window.location.hash.includes('/createCalculator')) {
    window.location.hash = '#/addService';
    await wait(2500);
  }

  if (window.location.hash.includes('/addService')) {
    const searchAllRadio = [...document.querySelectorAll('input[type="radio"]')]
      .find(r => (r.closest('label, div')?.textContent || '').includes('Search all services'));
    if (searchAllRadio && !searchAllRadio.checked) {
      scrollTo(searchAllRadio);
      await jitter(200, 400);
      searchAllRadio.click();
      await wait(800);
    }

    const searchBox = await waitForElement('input[placeholder="Search for a service"], input[aria-label="Find Service"], input[role="searchbox"]');
    if (searchBox) {
      scrollTo(searchBox);
      await jitter(200, 500);
      setInputValue(searchBox, 'Amazon EventBridge');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' && b.closest('li, article')?.textContent?.includes('Amazon EventBridge'));
    if (configBtn) {
      scrollTo(configBtn);
      await jitter(250, 600);
      configBtn.click();
      await wait(5000);
    } else {
      console.warn('[Amazon EventBridge] Configure button not found');
      return;
    }
  }

  await waitForElement('h1, input[aria-label*="Description"]', 15000);

  await setFieldByAria('Description - optional', config.description);
  await selectRegion(config.region);
  await setFieldByAria('Number of events', config.eventsMillions);
  await setFieldByAria('schema discovery', config.schemaDiscoveryEventsMillions);
  await setFieldByAria('cross-account', config.crossAccountEventsMillions);
  await setFieldByAria('replay', config.eventReplayGb);

  await jitter(400, 800);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');
  if (saveBtn) {
    scrollTo(saveBtn);
    await jitter(300, 600);
    saveBtn.click();
    console.log('[Amazon EventBridge] Saved successfully!');
  } else {
    console.warn('[Amazon EventBridge] Save and add service button not found');
  }

})({
  // Override defaults here. All keys are optional — omit to keep script default.
  // region: 'US East (N. Virginia)',
  // eventsMillions: 5,
  // schemaDiscoveryEventsMillions: 1,
  // crossAccountEventsMillions: 0,
  // eventReplayGb: 0,
});
