/**
 * AWS Fargate - AWS Pricing Calculator Script
 *
 * Service name  : AWS Fargate
 * Configure URL : https://calculator.aws/#/createCalculator/Fargate
 *
 * Usage (AI agent):
 *   await page.evaluate(fs.readFileSync('AWS Fargate.js', 'utf8'));
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 */

(async function configureAWSFargate(params) {

  // -- DEFAULT CONFIGURATION -------------------------------------------------
  const config = {
    // Description | pricingImpact: false
    description: params?.description ?? 'SMB container tasks on Fargate',

    // Location | pricingImpact: true
    locationType: params?.locationType ?? 'Region',
    region: params?.region ?? 'US East (Ohio)',

    // On Demand settings | pricingImpact: true
    operatingSystem: params?.operatingSystem ?? 'Linux', // options: Linux, Windows
    cpuArchitecture: params?.cpuArchitecture ?? 'x86', // options: x86, ARM

    numberOfTasksOrPods: params?.numberOfTasksOrPods ?? 2,
    numberOfTasksOrPodsUnit: params?.numberOfTasksOrPodsUnit ?? 'per day', // options: per second, per minute, per hour, per day, per month

    averageDuration: params?.averageDuration ?? 60,
    averageDurationUnit: params?.averageDurationUnit ?? 'minutes', // options: seconds, minutes, hours, days

    vcpuAllocated: params?.vcpuAllocated ?? '1', // options: 0.25, 0.5, 1, 2, 4, 8, 16

    memoryAllocatedValue: params?.memoryAllocatedValue ?? 2,
    memoryAllocatedUnit: params?.memoryAllocatedUnit ?? 'GB',

    ephemeralStorageValue: params?.ephemeralStorageValue ?? 20,
    ephemeralStorageUnit: params?.ephemeralStorageUnit ?? 'GB'
  };

  console.log('[AWS Fargate] Starting with config:', config);

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
    console.warn('[AWS Fargate] waitForElement timed out:', selector);
    return null;
  }

  function inputsByAria(text) {
    return [...document.querySelectorAll('input, textarea')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(text));
  }

  async function setFieldByAria(text, value, index = 0) {
    const field = inputsByAria(text)[index] || null;
    if (!field) {
      console.warn('[AWS Fargate] Field not found:', text, 'index', index);
      return;
    }
    await jitter();
    setInputValue(field, value);
    await jitter(100, 300);
  }

  // -- PHASE 1 / 2 -----------------------------------------------------------
  if (!window.location.hash.includes('/addService') &&
      !window.location.hash.includes('/createCalculator/Fargate')) {
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
      setInputValue(searchBox, 'AWS Fargate');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' && b.closest('li, article')?.textContent?.includes('AWS Fargate'));
    if (configBtn) {
      scrollTo(configBtn);
      await jitter(250, 600);
      configBtn.click();
      await wait(5000);
    } else {
      console.warn('[AWS Fargate] Configure button not found');
      return;
    }
  }

  // -- PHASE 3 ---------------------------------------------------------------
  await waitForElement('h1, input[aria-label*="Description"]', 15000);

  await setFieldByAria('Description - optional', config.description, 0);
  await setFieldByAria('Number of tasks or pods Value', config.numberOfTasksOrPods, 0);
  await setFieldByAria('Average duration Value', config.averageDuration, 0);
  await setFieldByAria('Amount of memory allocated Value', config.memoryAllocatedValue, 0);
  await setFieldByAria('Amount of ephemeral storage allocated for Amazon ECS Value', config.ephemeralStorageValue, 0);

  // -- PHASE 4 ---------------------------------------------------------------
  await jitter(300, 600);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');

  if (saveBtn) {
    scrollTo(saveBtn);
    await jitter(300, 600);
    saveBtn.click();
    console.log('[AWS Fargate] Saved successfully!');
  } else {
    console.warn('[AWS Fargate] Save and add service button not found');
  }

})({
  // Override defaults here.
});
