/**
 * Amazon Elastic File System (EFS) - AWS Pricing Calculator Script
 *
 * Service name  : Amazon Elastic File System (EFS)
 * Configure URL : https://calculator.aws/#/createCalculator/EFS
 *
 * Usage (AI agent):
 *   await page.evaluate(fs.readFileSync('Amazon Elastic File System (EFS).js', 'utf8'));
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 */

(async function configureAmazonElasticFileSystemEFS(params) {

  const config = {
    description: params?.description ?? 'SMB shared file system baseline',

    standardStorage: params?.standardStorage ?? true,
    oneZoneStorage: params?.oneZoneStorage ?? false,

    desiredStorageCapacity: params?.desiredStorageCapacity ?? 500,
    infrequentAccessPercent: params?.infrequentAccessPercent ?? 15,
    archivePercent: params?.archivePercent ?? 80,

    infrequentAccessTiering: params?.infrequentAccessTiering ?? 10,
    infrequentAccessRead: params?.infrequentAccessRead ?? 10,
    archiveAccessTiering: params?.archiveAccessTiering ?? 10,
    archiveAccessRead: params?.archiveAccessRead ?? 10
  };

  console.log('[Amazon Elastic File System (EFS)] Starting with config:', config);

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
    console.warn('[Amazon Elastic File System (EFS)] waitForElement timed out:', selector);
    return null;
  }

  function fieldsByAria(text) {
    return [...document.querySelectorAll('input, textarea')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(text));
  }

  async function setFieldByAria(text, value, index = 0) {
    const el = fieldsByAria(text)[index] || null;
    if (!el) {
      console.warn('[Amazon Elastic File System (EFS)] Field not found:', text, 'index', index);
      return;
    }
    await jitter();
    setInputValue(el, value);
    await jitter(100, 300);
  }

  if (!window.location.hash.includes('/addService') &&
      !window.location.hash.includes('/createCalculator/EFS')) {
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
      setInputValue(searchBox, 'Amazon Elastic File System (EFS)');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' && b.closest('li, article')?.textContent?.includes('Amazon Elastic File System (EFS)'));
    if (configBtn) {
      scrollTo(configBtn);
      await jitter(250, 600);
      configBtn.click();
      await wait(5000);
    } else {
      console.warn('[Amazon Elastic File System (EFS)] Configure button not found');
      return;
    }
  }

  await waitForElement('h1, input[aria-label*="Description"]', 15000);

  await setFieldByAria('Description - optional', config.description, 0);
  await setFieldByAria('Desired Storage Capacity Value', config.desiredStorageCapacity, 0);
  await setFieldByAria('Infrequent Access storage - Percentage of data that is accessed multiple times within a few months', config.infrequentAccessPercent, 0);
  await setFieldByAria('Archive storage - Percentage of data that is accessed once a year', config.archivePercent, 0);
  await setFieldByAria('Infrequent Access Tiering Value', config.infrequentAccessTiering, 0);
  await setFieldByAria('Infrequent Access Read Value', config.infrequentAccessRead, 0);
  await setFieldByAria('Archive Access Tiering Value', config.archiveAccessTiering, 0);
  await setFieldByAria('Archive Access Read Value', config.archiveAccessRead, 0);

  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');

  if (saveBtn) {
    scrollTo(saveBtn);
    await jitter(300, 600);
    saveBtn.click();
    console.log('[Amazon Elastic File System (EFS)] Saved successfully!');
  } else {
    console.warn('[Amazon Elastic File System (EFS)] Save and add service button not found');
  }

})({
  // Override defaults here.
});
