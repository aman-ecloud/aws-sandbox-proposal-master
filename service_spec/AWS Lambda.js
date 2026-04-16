/**
 * AWS Lambda - AWS Pricing Calculator Script
 *
 * Service name  : AWS Lambda
 * Configure URL : https://calculator.aws/#/createCalculator/Lambda
 *
 * Usage (AI agent):
 *   await page.evaluate(fs.readFileSync('AWS Lambda.js', 'utf8'));
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 */

(async function configureAWSLambda(params) {

  // -- DEFAULT CONFIGURATION -------------------------------------------------
  // Every interactive field discovered on the live page appears here.
  const config = {
    // description | PRICING IMPACT: false
    description: params?.description ?? 'SMB event processing lambda',

    // Lambda Function mode | PRICING IMPACT: true
    pricingMode: params?.pricingMode ?? 'Lambda Function - Include Free Tier',

    // Service settings architecture | PRICING IMPACT: true
    architectureMain: params?.architectureMain ?? 'x86',

    // Number of requests | PRICING IMPACT: true
    numberOfRequests: params?.numberOfRequests ?? 2000000,
    numberOfRequestsUnit: params?.numberOfRequestsUnit ?? 'per month',

    // Duration of each request (in ms) | PRICING IMPACT: true
    requestDurationMs: params?.requestDurationMs ?? 100,

    // Amount of memory allocated | PRICING IMPACT: true
    memoryMainValue: params?.memoryMainValue ?? 512,
    memoryMainUnit: params?.memoryMainUnit ?? 'MB',

    // Amount of ephemeral storage allocated | PRICING IMPACT: true
    ephemeralStorageValue: params?.ephemeralStorageValue ?? 512,
    ephemeralStorageUnit: params?.ephemeralStorageUnit ?? 'MB',

    // Provisioned Concurrency settings | PRICING IMPACT: true
    architectureProvisioned: params?.architectureProvisioned ?? 'x86',
    concurrency: params?.concurrency ?? 1,
    provisionedTimeValue: params?.provisionedTimeValue ?? 1,
    provisionedTimeUnit: params?.provisionedTimeUnit ?? 'hours',
    provisionedRequestsValue: params?.provisionedRequestsValue ?? 1000,
    provisionedRequestsUnit: params?.provisionedRequestsUnit ?? 'per month',
    provisionedDurationMs: params?.provisionedDurationMs ?? 100,
    provisionedMemoryValue: params?.provisionedMemoryValue ?? 512,
    provisionedMemoryUnit: params?.provisionedMemoryUnit ?? 'MB',

    // SnapStart settings | PRICING IMPACT: true
    snapStartTimeValue: params?.snapStartTimeValue ?? 1,
    snapStartTimeUnit: params?.snapStartTimeUnit ?? 'hours',
    snapStartColdStarts: params?.snapStartColdStarts ?? 100,
    snapStartMemoryValue: params?.snapStartMemoryValue ?? 512,
    snapStartMemoryUnit: params?.snapStartMemoryUnit ?? 'MB',

    // Lambda@Edge settings | PRICING IMPACT: true
    edgeRequestsValue: params?.edgeRequestsValue ?? 100000,
    edgeRequestsUnit: params?.edgeRequestsUnit ?? 'per month',
    edgeDurationMs: params?.edgeDurationMs ?? 50,
    edgeMemoryValue: params?.edgeMemoryValue ?? 128,
    edgeMemoryUnit: params?.edgeMemoryUnit ?? 'MB'
  };

  console.log('[AWS Lambda] Starting with config:', config);

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
    console.warn('[AWS Lambda] waitForElement timed out:', selector);
    return null;
  }

  function findInputsByAriaContains(text) {
    return [...document.querySelectorAll('input, textarea')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(text));
  }

  async function setFieldByAria(text, value, index = 0) {
    const all = findInputsByAriaContains(text);
    const el = all[index] || null;
    if (!el) {
      console.warn('[AWS Lambda] Field not found:', text, 'index', index);
      return;
    }
    await jitter();
    setInputValue(el, value);
    await jitter(100, 300);
  }

  async function clickRadioByExactAria(text) {
    const radio = [...document.querySelectorAll('input[type="radio"]')]
      .find(r => (r.getAttribute('aria-label') || '') === text);
    if (!radio) {
      console.warn('[AWS Lambda] Field not found:', text);
      return;
    }
    if (!radio.checked) {
      scrollTo(radio);
      await jitter();
      radio.click();
      await jitter(100, 300);
    }
  }

  // -- PHASE 1 : NAVIGATE ----------------------------------------------------

  if (!window.location.hash.includes('/addService') &&
      !window.location.hash.includes('/createCalculator/Lambda')) {
    window.location.hash = '#/addService';
    await wait(2500);
  }

  // -- PHASE 2 : SEARCH AND CONFIGURE ---------------------------------------
  // Touches ONLY add-service controls if we are on the add-service page.

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
      setInputValue(searchBox, 'AWS Lambda');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' && b.closest('li, article')?.textContent?.includes('AWS Lambda'));
    if (configBtn) {
      scrollTo(configBtn);
      await jitter(250, 600);
      configBtn.click();
      await wait(5000);
    } else {
      console.warn('[AWS Lambda] Configure button not found');
      return;
    }
  }

  // -- PHASE 3 : FILL FORM ---------------------------------------------------

  await waitForElement('h1, input[aria-label*="Description"]', 15000);

  await setFieldByAria('Description - optional', config.description);
  await clickRadioByExactAria(config.pricingMode);

  await setFieldByAria('Number of requests Value', config.numberOfRequests, 0);
  await setFieldByAria('Duration of each request (in ms) Enter duration in ms', config.requestDurationMs, 0);
  await setFieldByAria('Amount of memory allocated Value', config.memoryMainValue, 0);
  await setFieldByAria('Amount of ephemeral storage allocated Value', config.ephemeralStorageValue, 0);

  await setFieldByAria('Concurrency Enter amount', config.concurrency, 0);
  await setFieldByAria('Time for which Provisioned Concurrency is enabled Value', config.provisionedTimeValue, 0);
  await setFieldByAria('Number of requests for Provisioned Concurrency Value', config.provisionedRequestsValue, 0);
  await setFieldByAria('Duration of each provisioned request (in ms) Enter duration in ms', config.provisionedDurationMs, 0);
  await setFieldByAria('Amount of memory allocated Value', config.provisionedMemoryValue, 1);

  await setFieldByAria('Time for which SnapStart is enabled Value', config.snapStartTimeValue, 0);
  await setFieldByAria('Number of cold-starts (i.e. SnapStart restores) Enter amount', config.snapStartColdStarts, 0);
  await setFieldByAria('Amount of memory allocated Value', config.snapStartMemoryValue, 2);

  await setFieldByAria('Number of requests Value', config.edgeRequestsValue, 1);
  await setFieldByAria('Duration of each request (in ms) Enter duration in ms', config.edgeDurationMs, 1);
  await setFieldByAria('Amount of memory allocated Value', config.edgeMemoryValue, 3);

  // -- PHASE 4 : SAVE --------------------------------------------------------

  await jitter(400, 800);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');
  if (saveBtn) {
    scrollTo(saveBtn);
    await jitter(300, 600);
    saveBtn.click();
    console.log('[AWS Lambda] Saved successfully!');
  } else {
    console.warn('[AWS Lambda] Save and add service button not found');
  }

})({
  // Override defaults here if needed.
});
