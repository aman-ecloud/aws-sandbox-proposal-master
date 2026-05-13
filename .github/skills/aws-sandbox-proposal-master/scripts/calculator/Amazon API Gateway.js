/**
 * Amazon API Gateway - AWS Pricing Calculator Script
 *
 * Service name  : Amazon API Gateway
 * Configure URL : https://calculator.aws/#/createCalculator/APIGateway
 *
 * Usage (AI agent):
 *   Read this file with the Read tool, paste full content into page.evaluate(`...`).
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 *
 * Notes:
 *   The AWS Pricing Calculator shows two API Gateway flavours on the same form:
 *   REST API and HTTP API. This script fills REST API calls only by default,
 *   which is the most commonly requested type. Override httpApiCallsMillions to
 *   price HTTP API requests instead (or in addition).
 */

(async function configureAmazonAPIGateway(params) {

  const config = {
    // Description - optional | PRICING IMPACT: false
    description: params?.description ?? 'SMB API Gateway REST baseline',

    // Choose a Region | PRICING IMPACT: true
    region: params?.region ?? 'US East (N. Virginia)',

    // REST API calls (millions/month) | PRICING IMPACT: true
    restApiCallsMillions: params?.restApiCallsMillions ?? 4,

    // HTTP API calls (millions/month) | PRICING IMPACT: true
    httpApiCallsMillions: params?.httpApiCallsMillions ?? 0,

    // WebSocket connection minutes (millions/month) | PRICING IMPACT: true
    webSocketConnectionMinutesMillions: params?.webSocketConnectionMinutesMillions ?? 0,

    // WebSocket messages (millions/month) | PRICING IMPACT: true
    webSocketMessagesMillions: params?.webSocketMessagesMillions ?? 0,

    // Cache memory size (GB) — 0 means no caching | PRICING IMPACT: true
    cacheMemoryGb: params?.cacheMemoryGb ?? 0,
  };

  console.log('[Amazon API Gateway] Starting with config:', config);

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
    console.warn('[Amazon API Gateway] waitForElement timed out:', selector);
    return null;
  }

  function findInputsByAriaContains(text) {
    return [...document.querySelectorAll('input, textarea')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(text));
  }

  async function setFieldByAria(text, value, index = 0) {
    const all = findInputsByAriaContains(text);
    const el = all[index] || null;
    if (!el) { console.warn('[Amazon API Gateway] Field not found:', text, 'index', index); return; }
    await jitter();
    setInputValue(el, value);
    await jitter(100, 300);
  }

  async function selectDropdown(labelText, value) {
    const btns = [...document.querySelectorAll('button[aria-haspopup="listbox"]')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(labelText));
    const btn = btns[0];
    if (!btn) { console.warn('[Amazon API Gateway] Dropdown not found:', labelText); return; }
    scrollTo(btn);
    await jitter();
    btn.click();
    await wait(600);
    const option = [...document.querySelectorAll('[role="option"]')]
      .find(o => o.textContent.trim().includes(value));
    if (!option) { console.warn('[Amazon API Gateway] Option not found:', value); return; }
    scrollTo(option);
    await jitter();
    option.click();
    await jitter(100, 300);
  }

  // -- PHASE 1 : NAVIGATE ----------------------------------------------------

  if (!window.location.hash.includes('/addService') &&
      !window.location.hash.includes('/createCalculator/APIGateway')) {
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
      setInputValue(searchBox, 'Amazon API Gateway');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' &&
                 b.closest('li, article')?.textContent?.includes('API Gateway'));
    if (configBtn) {
      scrollTo(configBtn);
      await jitter(250, 600);
      configBtn.click();
      await wait(5000);
    } else {
      console.warn('[Amazon API Gateway] Configure button not found');
      return;
    }
  }

  // -- PHASE 3 : FILL FORM ---------------------------------------------------

  await waitForElement('h1, input[aria-label*="Description"]', 15000);

  await setFieldByAria('Description - optional', config.description);
  await selectDropdown('Region', config.region);

  // REST API calls
  if (config.restApiCallsMillions > 0) {
    await setFieldByAria('REST API calls', config.restApiCallsMillions);
  }

  // HTTP API calls
  if (config.httpApiCallsMillions > 0) {
    await setFieldByAria('HTTP API calls', config.httpApiCallsMillions);
  }

  // WebSocket
  if (config.webSocketConnectionMinutesMillions > 0) {
    await setFieldByAria('WebSocket connection minutes', config.webSocketConnectionMinutesMillions);
  }
  if (config.webSocketMessagesMillions > 0) {
    await setFieldByAria('WebSocket messages', config.webSocketMessagesMillions);
  }

  // -- PHASE 4 : SAVE --------------------------------------------------------

  await jitter(400, 800);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');
  if (saveBtn) {
    scrollTo(saveBtn);
    await jitter(300, 600);
    saveBtn.click();
    console.log('[Amazon API Gateway] Saved successfully!');
  } else {
    console.warn('[Amazon API Gateway] Save and add service button not found');
  }

})({
  // Override defaults here. All keys are optional — omit to keep script default.
  // region: 'Asia Pacific (Mumbai)',
  // restApiCallsMillions: 4,
  // httpApiCallsMillions: 0,
});
