/**
 * Amazon RDS for MySQL - AWS Pricing Calculator Script
 *
 * Service name  : Amazon RDS for MySQL
 * Configure URL : https://calculator.aws/#/addService (resolved at runtime)
 *
 * Usage (AI agent):
 *   Read this file with the Read tool, paste full content into page.evaluate(`...`).
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 */

(async function configureAmazonRDSForMySQL(params) {

  const config = {
    // Description - optional | PRICING IMPACT: false
    description: params?.description ?? 'SMB RDS MySQL baseline',

    // Choose a Region | PRICING IMPACT: true
    region: params?.region ?? 'US East (N. Virginia)',

    // DB instance class | PRICING IMPACT: true
    // options: 'db.t3.micro', 'db.t3.small', 'db.t3.medium', 'db.t3.large', 'db.m6g.large'
    instanceClass: params?.instanceClass ?? 'db.t3.medium',

    // Deployment option | PRICING IMPACT: true
    // options: 'Single-AZ', 'Multi-AZ'
    deploymentOption: params?.deploymentOption ?? 'Single-AZ',

    // Storage type | PRICING IMPACT: true
    // options: 'General Purpose SSD (gp2)', 'General Purpose SSD (gp3)', 'Provisioned IOPS SSD (io1)'
    storageType: params?.storageType ?? 'General Purpose SSD (gp2)',

    // Storage amount (GB) | PRICING IMPACT: true
    storageAmountGb: params?.storageAmountGb ?? 100,

    // Backup storage (GB) | PRICING IMPACT: true
    backupStorageGb: params?.backupStorageGb ?? 100,
  };

  console.log('[Amazon RDS for MySQL] Starting with config:', config);

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
    if (!el) { console.warn('[Amazon RDS for MySQL] Field not found:', labelText); return; }
    await jitter();
    setInputValue(el, value);
    await jitter(100, 300);
  }

  async function selectDropdown(labelText, value, index = 0) {
    const btns = [...document.querySelectorAll('button[aria-haspopup="listbox"]')]
      .filter(el => (el.getAttribute('aria-label') || el.textContent || '').includes(labelText));
    const btn = btns[index];
    if (!btn) { console.warn('[Amazon RDS for MySQL] Dropdown not found:', labelText); return; }
    scrollTo(btn);
    await jitter();
    btn.click();
    await wait(600);
    const option = [...document.querySelectorAll('[role="option"]')]
      .find(o => o.textContent.trim().includes(value));
    if (!option) { console.warn('[Amazon RDS for MySQL] Option not found:', value); return; }
    scrollTo(option);
    await jitter();
    option.click();
    await jitter(100, 300);
  }

  async function waitForElement(selector, timeout = 12000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const el = document.querySelector(selector);
      if (el) return el;
      await wait(300);
    }
    console.warn('[Amazon RDS for MySQL] waitForElement timed out:', selector);
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
      setInputValue(searchBox, 'Amazon RDS for MySQL');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' && b.closest('li, article')?.textContent?.includes('RDS for MySQL'));
    if (configBtn) {
      scrollTo(configBtn);
      await jitter(250, 600);
      configBtn.click();
      await wait(5000);
    } else {
      console.warn('[Amazon RDS for MySQL] Configure button not found');
      return;
    }
  }

  await waitForElement('h1, input[aria-label*="Description"]', 15000);

  await setFieldByAria('Description - optional', config.description);
  await selectDropdown('Region', config.region);
  await selectDropdown('DB instance class', config.instanceClass);
  await selectDropdown('Deployment option', config.deploymentOption);
  await selectDropdown('Storage type', config.storageType);
  await setFieldByAria('Storage amount', config.storageAmountGb);
  await setFieldByAria('Backup storage', config.backupStorageGb);

  await jitter(400, 800);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');
  if (saveBtn) {
    scrollTo(saveBtn);
    await jitter(300, 600);
    saveBtn.click();
    console.log('[Amazon RDS for MySQL] Saved successfully!');
  } else {
    console.warn('[Amazon RDS for MySQL] Save and add service button not found');
  }

})({
  // Override defaults here. All keys are optional — omit to keep script default.
  // region: 'US East (N. Virginia)',
  // instanceClass: 'db.t3.medium',
  // deploymentOption: 'Single-AZ',
  // storageType: 'General Purpose SSD (gp2)',
  // storageAmountGb: 100,
  // backupStorageGb: 100,
});
