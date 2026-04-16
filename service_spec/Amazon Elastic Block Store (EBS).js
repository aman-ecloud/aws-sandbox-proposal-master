/**
 * Amazon Elastic Block Store (EBS) - AWS Pricing Calculator Script
 *
 * Service name  : Amazon Elastic Block Store (EBS)
 * Configure URL : https://calculator.aws/#/createCalculator/EBS
 *
 * Usage (AI agent):
 *   await page.evaluate(fs.readFileSync('Amazon Elastic Block Store (EBS).js', 'utf8'));
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 */

(async function configureAmazonElasticBlockStoreEBS(params) {

  const config = {
    description: params?.description ?? 'SMB EBS storage baseline',

    numberOfVolumes: params?.numberOfVolumes ?? 1,
    averageDurationOfVolume: params?.averageDurationOfVolume ?? 730,
    storageAmountPerVolume: params?.storageAmountPerVolume ?? 30,
    amountChangedPerSnapshot: params?.amountChangedPerSnapshot ?? 3,

    numberOfSnapshotsToRestore: params?.numberOfSnapshotsToRestore ?? 0,

    getSnapshotBlockApiRequests: params?.getSnapshotBlockApiRequests ?? 0,
    listApiRequests: params?.listApiRequests ?? 0,
    putSnapshotBlockApiRequests: params?.putSnapshotBlockApiRequests ?? 0
  };

  console.log('[Amazon Elastic Block Store (EBS)] Starting with config:', config);

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
    console.warn('[Amazon Elastic Block Store (EBS)] waitForElement timed out:', selector);
    return null;
  }

  function fieldsByAria(text) {
    return [...document.querySelectorAll('input, textarea')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(text));
  }

  async function setFieldByAria(text, value, index = 0) {
    const el = fieldsByAria(text)[index] || null;
    if (!el) {
      console.warn('[Amazon Elastic Block Store (EBS)] Field not found:', text, 'index', index);
      return;
    }
    await jitter();
    setInputValue(el, value);
    await jitter(100, 300);
  }

  if (!window.location.hash.includes('/addService') &&
      !window.location.hash.includes('/createCalculator/EBS')) {
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
      setInputValue(searchBox, 'Amazon Elastic Block Store (EBS)');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' && b.closest('li, article')?.textContent?.includes('Amazon Elastic Block Store (EBS)'));
    if (configBtn) {
      scrollTo(configBtn);
      await jitter(250, 600);
      configBtn.click();
      await wait(5000);
    } else {
      console.warn('[Amazon Elastic Block Store (EBS)] Configure button not found');
      return;
    }
  }

  await waitForElement('h1, input[aria-label*="Description"]', 15000);

  await setFieldByAria('Description - optional', config.description, 0);
  await setFieldByAria('Number of volumes Enter amount', config.numberOfVolumes, 0);
  await setFieldByAria('Average duration of volume Value', config.averageDurationOfVolume, 0);
  await setFieldByAria('Storage amount per volume Value', config.storageAmountPerVolume, 0);
  await setFieldByAria('Amount changed per snapshot Value', config.amountChangedPerSnapshot, 0);

  await setFieldByAria('Number of snapshots to restore Enter amount', config.numberOfSnapshotsToRestore, 0);
  await setFieldByAria('Number of GetSnapshotBlock API requests Value', config.getSnapshotBlockApiRequests, 0);
  await setFieldByAria('Number of LIST API requests Value', config.listApiRequests, 0);
  await setFieldByAria('Number of PutSnapshotBlock API requests Value', config.putSnapshotBlockApiRequests, 0);

  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');

  if (saveBtn) {
    scrollTo(saveBtn);
    await jitter(300, 600);
    saveBtn.click();
    console.log('[Amazon Elastic Block Store (EBS)] Saved successfully!');
  } else {
    console.warn('[Amazon Elastic Block Store (EBS)] Save and add service button not found');
  }

})({
  // Override defaults here.
});
