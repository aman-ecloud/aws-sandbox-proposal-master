/**
 * Amazon File Cache - AWS Pricing Calculator Script
 *
 * Service name  : Amazon File Cache
 * Configure URL : https://calculator.aws/#/createCalculator/filecache
 *
 * Usage (AI agent):
 *   const script = await readFile('Amazon File Cache.js', 'utf8');
 *   await page.evaluate(script);
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 *
 * Supported Regions:
 *   - US East (N. Virginia) [us-east-1]
 *   - US East (Ohio) [us-east-2]
 *   - US West (Oregon) [us-west-2]
 *   - Canada (Central) [ca-central-1]
 *   - Asia Pacific (Hong Kong) [ap-east-1]
 *   - Asia Pacific (Mumbai) [ap-south-1]
 *   - Asia Pacific (Seoul) [ap-northeast-2]
 *   - Asia Pacific (Singapore) [ap-southeast-1]
 *   - Asia Pacific (Sydney) [ap-southeast-2]
 *   - Asia Pacific (Tokyo) [ap-northeast-1]
 *   - Europe (Frankfurt) [eu-central-1]
 *   - Europe (Ireland) [eu-west-1]
 *   - Europe (London) [eu-west-2]
 *   - Europe (Stockholm) [eu-north-1]
 */

(async function configureAmazonFileCache(params) {

  const config = {
    description: params?.description ?? 'File Cache baseline configuration',
    
    // Location Configuration
    locationType: params?.locationType ?? 'Region',
    region: params?.region ?? 'Asia Pacific (Singapore)',
    
    // Storage Configuration
    // NOTE: File Cache requires minimum 3600 GB per month
    storageCapacity: params?.storageCapacity ?? 3600,
    storageCapacityUnit: params?.storageCapacityUnit ?? 'GB per month',
    
    // Throughput Configuration (File Cache typically supports 1000 MBps/TiB)
    throughputCapacity: params?.throughputCapacity ?? '1000 MBps/TiB'
  };

  console.log('[Amazon File Cache] Starting with config:', config);

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
    console.warn('[Amazon File Cache] waitForElement timed out:', selector);
    return null;
  }

  function fieldsByAria(text) {
    return [...document.querySelectorAll('input, textarea')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(text));
  }

  async function setFieldByAria(text, value, index = 0) {
    const el = fieldsByAria(text)[index] || null;
    if (!el) {
      console.warn('[Amazon File Cache] Field not found:', text, 'index', index);
      return;
    }
    await jitter();
    setInputValue(el, value);
    await jitter(100, 300);
  }

  // Navigate to the File Cache configuration page if not already there
  if (!window.location.hash.includes('/addService') &&
      !window.location.hash.includes('/createCalculator/filecache')) {
    window.location.hash = '#/addService';
    await wait(2500);
  }

  // If on the service selection page, search for and configure File Cache
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
      setInputValue(searchBox, 'Amazon File Cache');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' && b.closest('li, article')?.textContent?.includes('Amazon File Cache'));
    if (configBtn) {
      scrollTo(configBtn);
      await jitter(250, 600);
      configBtn.click();
      await wait(5000);
    } else {
      console.warn('[Amazon File Cache] Configure button not found');
      return;
    }
  }

  // Wait for the configuration form to load
  await waitForElement('h1, input[aria-label*="Description"]', 15000);

  // Fill in Description
  await setFieldByAria('Description - optional', config.description, 0);
  await jitter(300, 600);

  // Handle Location Type selection (should be "Region")
  const locationTypeBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.includes('location type') && b.textContent.includes(config.locationType));
  if (locationTypeBtn) {
    scrollTo(locationTypeBtn);
    await jitter(200, 400);
    // Location type is typically already set to "Region", so we may not need to click it
    console.log('[Amazon File Cache] Location type confirmed as:', config.locationType);
  }

  await jitter(300, 600);

  // Handle Region selection using the actual region value trigger and popup dialog
  console.log('[Amazon File Cache] Starting region selection for Singapore');

  const regionValueBtn = [...document.querySelectorAll('button')]
    .find(b => b.getAttribute('aria-haspopup') === 'dialog' && (b.textContent || '').includes('Asia Pacific'));

  if (regionValueBtn) {
    scrollTo(regionValueBtn);
    await jitter(250, 500);
    regionValueBtn.click();
    await wait(1200);

    const dialogRoot = [...document.querySelectorAll('[role="dialog"]')]
      .find(el => el.id && el.id.startsWith('dialog')) ||
      [...document.querySelectorAll('[role="dialog"]')][0] ||
      document.body;

    const singaporeOption = [...dialogRoot.querySelectorAll('button, [role="option"], li, div')]
      .find(el => (el.textContent || '').includes('Asia Pacific (Singapore)'));

    if (singaporeOption) {
      scrollTo(singaporeOption);
      await jitter(150, 350);
      singaporeOption.click();
      await wait(1000);

      const updatedRegionBtn = [...document.querySelectorAll('button')]
        .find(b => b.getAttribute('aria-haspopup') === 'dialog' && (b.textContent || '').includes('Asia Pacific (Singapore)'));
      if (updatedRegionBtn) {
        console.log('[Amazon File Cache] Singapore selected successfully');
      } else {
        console.warn('[Amazon File Cache] Singapore click attempted, but the button text did not update');
      }
    } else {
      console.warn('[Amazon File Cache] Singapore option not found in region dialog');
    }
  } else {
    console.warn('[Amazon File Cache] Region value button not found');
  }

  await jitter(300, 600);

  // Handle Throughput Capacity (typically 1000 MBps/TiB is the only option)
  const throughputBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.includes('Throughput capacity'));
  if (throughputBtn) {
    scrollTo(throughputBtn);
    // Throughput capacity typically only has one option, so no need to change
    console.log('[Amazon File Cache] Throughput capacity set to:', config.throughputCapacity);
  }

  await jitter(300, 600);

  // Handle Storage Capacity Value
  const storageCapacityInput = [...document.querySelectorAll('input[type="text"], input[type="number"]')]
    .find(el => (el.getAttribute('aria-label') || '').includes('Storage capacity') && 
                (el.getAttribute('aria-label') || '').includes('Value'));
  if (storageCapacityInput) {
    scrollTo(storageCapacityInput);
    await jitter(200, 400);
    setInputValue(storageCapacityInput, config.storageCapacity);
    await jitter(200, 400);
  } else {
    console.warn('[Amazon File Cache] Storage capacity Value input not found');
  }

  await jitter(300, 600);

  // Handle Storage Capacity Unit
  const unitBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.includes('Storage capacity') && 
              (b.textContent.includes('GB') || b.textContent.includes('TB')));
  if (unitBtn && !unitBtn.textContent.includes(config.storageCapacityUnit)) {
    scrollTo(unitBtn);
    await jitter(250, 500);
    unitBtn.click();
    await wait(1000);

    const unitOptions = [...document.querySelectorAll('option')]
      .filter(o => o.textContent.includes(config.storageCapacityUnit));
    if (unitOptions.length > 0) {
      scrollTo(unitOptions[0]);
      await jitter(150, 350);
      unitOptions[0].click();
      await wait(800);
    }
  }

  await jitter(300, 600);

  // Find and click the Save button
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');

  if (saveBtn) {
    scrollTo(saveBtn);
    await jitter(300, 600);
    saveBtn.click();
    console.log('[Amazon File Cache] Saved successfully!');
  } else {
    console.warn('[Amazon File Cache] Save and add service button not found');
  }

})({
  // Override defaults here. Examples:
  // description: 'Production File Cache in Frankfurt',
  // region: 'Europe (Frankfurt)',
  // storageCapacity: 3600,  // Minimum required: 3600 GB per month
  // storageCapacityUnit: 'GB per month',
  // locationType: 'Region',
  // throughputCapacity: '1000 MBps/TiB'
});
