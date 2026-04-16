/**
 * Amazon Lightsail - AWS Pricing Calculator Script
 *
 * Service name  : Amazon Lightsail
 * Configure URL : https://calculator.aws/#/createCalculator/Lightsail
 *
 * Usage (AI agent):
 *   await page.evaluate(fs.readFileSync('Amazon Lightsail.js', 'utf8'));
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 */

(async function configureAmazonLightsail(params) {

  // -- DEFAULT CONFIGURATION -------------------------------------------------
  const config = {
    // General | pricingImpact: false
    description: params?.description ?? 'SMB Lightsail baseline',

    // Feature toggles | pricingImpact: true
    lightsailVirtualServers: params?.lightsailVirtualServers ?? true,
    lightsailManagedDatabases: params?.lightsailManagedDatabases ?? false,
    lightsailContainers: params?.lightsailContainers ?? true,
    lightsailObjectStorage: params?.lightsailObjectStorage ?? false,
    lightsailLoadBalancer: params?.lightsailLoadBalancer ?? false,
    lightsailBlockStorage: params?.lightsailBlockStorage ?? false,
    lightsailDataTransfer: params?.lightsailDataTransfer ?? false,

    // Virtual Servers | pricingImpact: true
    numberOfServers: params?.numberOfServers ?? 1,
    operatingSystemVirtual: params?.operatingSystemVirtual ?? 'Linux',
    selectedInstanceVirtual: params?.selectedInstanceVirtual ?? 'Bundle:0.5GB',
    serverUtilization: params?.serverUtilization ?? 730,
    serverUtilizationUnit: params?.serverUtilizationUnit ?? 'Hours/Month',

    // Containers | pricingImpact: true
    numberOfContainers: params?.numberOfContainers ?? 1,
    operatingSystemContainers: params?.operatingSystemContainers ?? 'Linux',
    selectedInstanceContainers: params?.selectedInstanceContainers ?? 'Large',
    containerUtilization: params?.containerUtilization ?? 730,
    containerUtilizationUnit: params?.containerUtilizationUnit ?? 'Hours/Month'
  };

  console.log('[Amazon Lightsail] Starting with config:', config);

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
    console.warn('[Amazon Lightsail] waitForElement timed out:', selector);
    return null;
  }

  function inputByAriaContains(text, index = 0) {
    return [...document.querySelectorAll('input, textarea')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(text))[index] || null;
  }

  async function setFieldByAria(text, value, index = 0) {
    const el = inputByAriaContains(text, index);
    if (!el) {
      console.warn('[Amazon Lightsail] Field not found:', text, 'index', index);
      return;
    }
    await jitter();
    setInputValue(el, value);
    await jitter(100, 300);
  }

  function findCheckbox(labelText) {
    const direct = [...document.querySelectorAll('input[type="checkbox"]')]
      .find(c => (c.getAttribute('aria-label') || '').includes(labelText));
    if (direct) return direct;

    const labelNode = [...document.querySelectorAll('label, div, span')]
      .find(n => (n.textContent || '').trim() === labelText);
    if (!labelNode) return null;
    return labelNode.closest('label, div')?.querySelector('input[type="checkbox"]') || null;
  }

  async function setCheckbox(labelText, target) {
    const cb = findCheckbox(labelText);
    if (!cb) {
      console.warn('[Amazon Lightsail] Field not found:', labelText);
      return;
    }
    if (cb.disabled) return;
    if (cb.checked !== target) {
      scrollTo(cb);
      await jitter();
      cb.click();
      await jitter(100, 300);
    }
  }

  // -- PHASE 1 / 2 -----------------------------------------------------------
  if (!window.location.hash.includes('/addService') &&
      !window.location.hash.includes('/createCalculator/Lightsail')) {
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
      setInputValue(searchBox, 'Amazon Lightsail');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' && b.closest('li, article')?.textContent?.includes('Amazon Lightsail'));
    if (configBtn) {
      scrollTo(configBtn);
      await jitter(250, 600);
      configBtn.click();
      await wait(5000);
    } else {
      console.warn('[Amazon Lightsail] Configure button not found');
      return;
    }
  }

  // -- PHASE 3 ---------------------------------------------------------------
  await waitForElement('h1, input[aria-label*="Description"]', 15000);

  await setFieldByAria('Description - optional', config.description, 0);

  await setCheckbox('Lightsail Virtual Servers', config.lightsailVirtualServers);
  await setCheckbox('Lightsail Managed Databases', config.lightsailManagedDatabases);
  await setCheckbox('Lightsail Containers', config.lightsailContainers);
  await setCheckbox('Lightsail Object Storage', config.lightsailObjectStorage);
  await setCheckbox('Lightsail Load Balancer', config.lightsailLoadBalancer);
  await setCheckbox('Lightsail Block Storage', config.lightsailBlockStorage);
  await setCheckbox('Lightsail Data Transfer', config.lightsailDataTransfer);

  await setFieldByAria('Number of servers', config.numberOfServers, 0);
  await setFieldByAria('Server utilization Value', config.serverUtilization, 0);

  await setFieldByAria('Number of containers', config.numberOfContainers, 0);
  await setFieldByAria('Container utilization Value', config.containerUtilization, 0);

  // -- PHASE 4 ---------------------------------------------------------------
  await jitter(300, 600);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');

  if (saveBtn) {
    scrollTo(saveBtn);
    await jitter(300, 600);
    saveBtn.click();
    console.log('[Amazon Lightsail] Saved successfully!');
  } else {
    console.warn('[Amazon Lightsail] Save and add service button not found');
  }

})({
  // Override defaults here.
});
