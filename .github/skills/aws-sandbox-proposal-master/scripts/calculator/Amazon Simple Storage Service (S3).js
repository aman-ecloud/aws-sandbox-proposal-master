/**
 * Amazon Simple Storage Service (S3) - AWS Pricing Calculator Script
 *
 * Service name  : Amazon Simple Storage Service (S3)
 * Configure URL : https://calculator.aws/#/createCalculator/S3
 *
 * Usage (AI agent):
 *   await page.evaluate(fs.readFileSync('Amazon Simple Storage Service (S3).js', 'utf8'));
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 */

(async function configureAmazonSimpleStorageServiceS3(params) {

  const config = {
    description: params?.description ?? 'SMB object storage baseline',

    // Selected features
    enableS3Standard: params?.enableS3Standard ?? true,
    enableDataTransfer: params?.enableDataTransfer ?? true,

    // S3 Standard inputs
    s3StandardStorage: params?.s3StandardStorage ?? 500,
    putCopyPostListRequests: params?.putCopyPostListRequests ?? 100000,
    getSelectOtherRequests: params?.getSelectOtherRequests ?? 1000000,
    dataReturnedByS3Select: params?.dataReturnedByS3Select ?? 0,
    dataScannedByS3Select: params?.dataScannedByS3Select ?? 0
  };

  console.log('[Amazon Simple Storage Service (S3)] Starting with config:', config);

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
    console.warn('[Amazon Simple Storage Service (S3)] waitForElement timed out:', selector);
    return null;
  }

  function fieldsByAria(text) {
    return [...document.querySelectorAll('input, textarea')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(text));
  }

  async function setFieldByAria(text, value, index = 0) {
    const el = fieldsByAria(text)[index] || null;
    if (!el) {
      console.warn('[Amazon Simple Storage Service (S3)] Field not found:', text, 'index', index);
      return;
    }
    await jitter();
    setInputValue(el, value);
    await jitter(100, 300);
  }

  async function setCheckboxByAria(label, target) {
    const el = [...document.querySelectorAll('input[type="checkbox"]')]
      .find(c => (c.getAttribute('aria-label') || '') === label);
    if (!el) {
      console.warn('[Amazon Simple Storage Service (S3)] Field not found:', label);
      return;
    }
    if (el.checked !== target) {
      scrollTo(el);
      await jitter();
      el.click();
      await jitter(100, 300);
    }
  }

  if (!window.location.hash.includes('/addService') &&
      !window.location.hash.includes('/createCalculator/S3')) {
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
      setInputValue(searchBox, 'Amazon Simple Storage Service (S3)');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' && b.closest('li, article')?.textContent?.includes('Amazon Simple Storage Service (S3)'));
    if (configBtn) {
      scrollTo(configBtn);
      await jitter(250, 600);
      configBtn.click();
      await wait(5000);
    } else {
      console.warn('[Amazon Simple Storage Service (S3)] Configure button not found');
      return;
    }
  }

  await waitForElement('h1, input[aria-label*="Description"]', 15000);

  await setFieldByAria('Description - optional', config.description, 0);
  await setCheckboxByAria('S3 Standard', config.enableS3Standard);
  await setCheckboxByAria('Data Transfer', config.enableDataTransfer);

  await setFieldByAria('S3 Standard storage Value', config.s3StandardStorage, 0);
  await setFieldByAria('PUT, COPY, POST, LIST requests to S3 Standard Enter amount of requests', config.putCopyPostListRequests, 0);
  await setFieldByAria('GET, SELECT, and all other requests from S3 Standard Enter amount of requests', config.getSelectOtherRequests, 0);
  await setFieldByAria('Data returned by S3 Select Value', config.dataReturnedByS3Select, 0);
  await setFieldByAria('Data scanned by S3 Select Value', config.dataScannedByS3Select, 0);

  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');

  if (saveBtn) {
    scrollTo(saveBtn);
    await jitter(300, 600);
    saveBtn.click();
    console.log('[Amazon Simple Storage Service (S3)] Saved successfully!');
  } else {
    console.warn('[Amazon Simple Storage Service (S3)] Save and add service button not found');
  }

})({
  // Override defaults here.
});
