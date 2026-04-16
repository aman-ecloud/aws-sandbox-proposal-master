/**
 * Amazon CloudFront - AWS Pricing Calculator Script
 *
 * Service name  : Amazon CloudFront
 * Configure URL : https://calculator.aws/#/addService (resolved at runtime)
 *
 * Usage (AI agent):
 *   Read this file with the Read tool, paste full content into page.evaluate(`...`).
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 */

(async function configureAmazonCloudFront(params) {

  const config = {
    // Description - optional | PRICING IMPACT: false
    description: params?.description ?? 'SMB CloudFront CDN baseline',

    // Data transfer out to internet (GB/month) | PRICING IMPACT: true
    dataTransferOutGb: params?.dataTransferOutGb ?? 500,

    // Number of HTTP requests (millions/month) | PRICING IMPACT: true
    httpRequestsMillions: params?.httpRequestsMillions ?? 10,

    // Number of HTTPS requests (millions/month) | PRICING IMPACT: true
    httpsRequestsMillions: params?.httpsRequestsMillions ?? 10,

    // Data transfer out to origin (GB/month) | PRICING IMPACT: true
    dataTransferToOriginGb: params?.dataTransferToOriginGb ?? 50,

    // Number of invalidation paths per month | PRICING IMPACT: true
    invalidationPaths: params?.invalidationPaths ?? 1000,
  };

  console.log('[Amazon CloudFront] Starting with config:', config);

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
    if (!el) { console.warn('[Amazon CloudFront] Field not found:', labelText); return; }
    await jitter();
    setInputValue(el, value);
    await jitter(100, 300);
  }

  async function waitForElement(selector, timeout = 12000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const el = document.querySelector(selector);
      if (el) return el;
      await wait(300);
    }
    console.warn('[Amazon CloudFront] waitForElement timed out:', selector);
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
      setInputValue(searchBox, 'Amazon CloudFront');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' && b.closest('li, article')?.textContent?.includes('Amazon CloudFront'));
    if (configBtn) {
      scrollTo(configBtn);
      await jitter(250, 600);
      configBtn.click();
      await wait(5000);
    } else {
      console.warn('[Amazon CloudFront] Configure button not found');
      return;
    }
  }

  await waitForElement('h1, input[aria-label*="Description"]', 15000);

  await setFieldByAria('Description - optional', config.description);
  await setFieldByAria('Data transfer out to internet', config.dataTransferOutGb);
  await setFieldByAria('Number of HTTP requests', config.httpRequestsMillions);
  await setFieldByAria('Number of HTTPS requests', config.httpsRequestsMillions);
  await setFieldByAria('Data transfer out to origin', config.dataTransferToOriginGb);
  await setFieldByAria('invalidation', config.invalidationPaths);

  await jitter(400, 800);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');
  if (saveBtn) {
    scrollTo(saveBtn);
    await jitter(300, 600);
    saveBtn.click();
    console.log('[Amazon CloudFront] Saved successfully!');
  } else {
    console.warn('[Amazon CloudFront] Save and add service button not found');
  }

})({
  // Override defaults here. All keys are optional — omit to keep script default.
  // region: not applicable — CloudFront is a global service
  // dataTransferOutGb: 500,
  // httpRequestsMillions: 10,
  // httpsRequestsMillions: 10,
  // dataTransferToOriginGb: 50,
  // invalidationPaths: 1000,
});
