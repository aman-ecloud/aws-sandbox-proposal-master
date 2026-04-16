/**
 * Amazon EC2 - AWS Pricing Calculator Script
 *
 * Service name  : Amazon EC2
 * Configure URL : https://calculator.aws/#/createCalculator/ec2-enhancement
 *
 * Usage (AI agent):
 *   await page.evaluate(fs.readFileSync('Amazon EC2.js', 'utf8'));
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 */

(async function configureAmazonEC2(params) {
  // -- DEFAULT CONFIGURATION -------------------------------------------------
  // Every interactive field discovered on the live page appears here.
  const config = {
    // Description - optional | pricingImpact: false
    description: params?.description ?? 'SMB EC2 workload baseline',

    // Choose a location type | pricingImpact: true | options: Region
    locationType: params?.locationType ?? 'Region',

    // Choose a Region | pricingImpact: true | options depend on location type
    region: params?.region ?? 'US East (Ohio)',

    // Tenancy | pricingImpact: true | options include Shared Instances
    tenancy: params?.tenancy ?? 'Shared Instances',

    // Operating system | pricingImpact: true | options include Linux
    operatingSystem: params?.operatingSystem ?? 'Linux',

    // Workloads | pricingImpact: true
    workload: params?.workload ?? 'Constant usage',

    // Number of instances | pricingImpact: true
    numberOfInstances: params?.numberOfInstances ?? 2,

    // Storage for each EC2 instance | pricingImpact: true
    ebsStorageType: params?.ebsStorageType ?? 'General Purpose SSD (gp3)',

    // General Purpose SSD (gp3) - IOPS | pricingImpact: true
    ebsIops: params?.ebsIops ?? 3000,

    // General Purpose SSD (gp3) - Throughput Value | pricingImpact: true
    ebsThroughputValue: params?.ebsThroughputValue ?? 125,

    // General Purpose SSD (gp3) - Throughput Unit | pricingImpact: true
    ebsThroughputUnit: params?.ebsThroughputUnit ?? 'MBps',

    // Storage amount Value | pricingImpact: true
    ebsStorageAmount: params?.ebsStorageAmount ?? 100,

    // Unit Storage amount | pricingImpact: true
    ebsStorageUnit: params?.ebsStorageUnit ?? 'GB',

    // Snapshot Frequency | pricingImpact: true
    ebsSnapshotFrequency: params?.ebsSnapshotFrequency ?? 'No snapshot storage',

    // Enable monitoring | pricingImpact: true
    enableDetailedMonitoring: params?.enableDetailedMonitoring ?? false,

    // Inbound Data Transfer Enter Amount | pricingImpact: true
    inboundDataAmount: params?.inboundDataAmount ?? 1,

    // Intra-Region Data Transfer Enter Amount | pricingImpact: true
    intraRegionDataAmount: params?.intraRegionDataAmount ?? 1,

    // Outbound Data Transfer Enter Amount | pricingImpact: true
    outboundDataAmount: params?.outboundDataAmount ?? 1,

    // Enter any placeholder cost such as Licensing... | pricingImpact: true
    additionalCosts: params?.additionalCosts ?? 0
  };

  console.log('[Amazon EC2] Starting with config:', config);

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

  function findByAriaIn(inputs, text) {
    return [...document.querySelectorAll(inputs)].find(el => (el.getAttribute('aria-label') || '').includes(text));
  }

  async function waitForVisible(selector, timeout = 12000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const el = [...document.querySelectorAll(selector)].find(e => e.offsetParent !== null);
      if (el) return el;
      await wait(400);
    }
    return null;
  }

  function findButtonByText(text) {
    return [...document.querySelectorAll('button')].find(b => b.textContent.trim() === text);
  }

  function findSectionButtonByLabelContains(text) {
    return [...document.querySelectorAll('button')].find(b => {
      const aria = b.getAttribute('aria-label') || '';
      const txt = (b.textContent || '').trim();
      return aria.includes(text) || txt.includes(text);
    });
  }

  async function toggleSectionOpen(labelContains) {
    const btn = findSectionButtonByLabelContains(labelContains);
    if (!btn) return;
    const expanded = btn.getAttribute('aria-expanded');
    if (expanded === 'true') return;
    scrollTo(btn);
    await jitter(120, 260);
    btn.click();
    await jitter(260, 420);
  }

  // -- PHASE 1 : NAVIGATE ----------------------------------------------------
  if (!window.location.hash.includes('/createCalculator/ec2-enhancement')) {
    window.location.hash = '#/addService';
    await wait(3000);

    const searchAllRadio = [...document.querySelectorAll('input[type="radio"]')]
      .find(r => (r.closest('label, div')?.textContent || '').includes('Search all services'));
    if (searchAllRadio && !searchAllRadio.checked) {
      scrollTo(searchAllRadio);
      await jitter(200, 400);
      searchAllRadio.click();
      await wait(800);
    }

    const searchBox = await waitForVisible('input[placeholder="Search for a service"], input[aria-label="Find Service"], input[role="searchbox"]');
    if (searchBox) {
      scrollTo(searchBox);
      await jitter(200, 500);
      setInputValue(searchBox, 'Amazon EC2');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' && b.closest('li, article')?.textContent?.includes('Amazon EC2'));
    if (configBtn) {
      scrollTo(configBtn);
      await jitter(300, 700);
      configBtn.click();
      await wait(5000);
    }
  }

  // -- PHASE 2 : FILL FORM ---------------------------------------------------
  await waitForVisible('h1, input[aria-label*="Description"]', 15000);

  await toggleSectionOpen('Amazon Elastic Block Store (EBS) - optional');
  await toggleSectionOpen('Detailed monitoring - optional');
  await toggleSectionOpen('Data transfer - optional');
  await toggleSectionOpen('Additional costs - optional');

  const description = findByAriaIn('input, textarea', 'Description - optional');
  if (description) {
    await jitter();
    setInputValue(description, config.description);
    await jitter(100, 300);
  }

  const numberOfInstances = findByAriaIn('input, textarea', 'Number of instances');
  if (numberOfInstances) {
    await jitter();
    setInputValue(numberOfInstances, config.numberOfInstances);
    await jitter(100, 300);
  }

  const ebsIops = findByAriaIn('input, textarea', 'General Purpose SSD (gp3) - IOPS');
  if (ebsIops) {
    await jitter();
    setInputValue(ebsIops, config.ebsIops);
    await jitter(100, 300);
  }

  const ebsThroughput = findByAriaIn('input, textarea', 'General Purpose SSD (gp3) - Throughput Value');
  if (ebsThroughput) {
    await jitter();
    setInputValue(ebsThroughput, config.ebsThroughputValue);
    await jitter(100, 300);
  }

  const ebsStorage = findByAriaIn('input, textarea', 'Storage amount Value');
  if (ebsStorage) {
    await jitter();
    setInputValue(ebsStorage, config.ebsStorageAmount);
    await jitter(100, 300);
  }

  const transferAmounts = [...document.querySelectorAll('input, textarea')]
    .filter(el => (el.getAttribute('aria-label') || '').includes('Enter Amount Enter amount'));
  if (transferAmounts[0]) {
    await jitter();
    setInputValue(transferAmounts[0], config.inboundDataAmount);
    await jitter(100, 300);
  }
  if (transferAmounts[1]) {
    await jitter();
    setInputValue(transferAmounts[1], config.intraRegionDataAmount);
    await jitter(100, 300);
  }
  if (transferAmounts[2]) {
    await jitter();
    setInputValue(transferAmounts[2], config.outboundDataAmount);
    await jitter(100, 300);
  }

  const monitorCheckbox = findByAriaIn('input[type="checkbox"]', 'Enable monitoring');
  if (monitorCheckbox && monitorCheckbox.checked !== config.enableDetailedMonitoring) {
    scrollTo(monitorCheckbox);
    await jitter();
    monitorCheckbox.click();
    await jitter(100, 300);
  }

  const additionalCosts = findByAriaIn('input, textarea', 'Enter any placeholder cost such as Licensing to add to your estimate');
  if (additionalCosts) {
    await jitter();
    setInputValue(additionalCosts, config.additionalCosts);
    await jitter(100, 300);
  }

  // -- PHASE 3 : SAVE --------------------------------------------------------
  const saveBtn = findButtonByText('Save and add service');
  if (saveBtn) {
    scrollTo(saveBtn);
    await jitter(300, 600);
    saveBtn.click();
    console.log('[Amazon EC2] Saved successfully!');
  } else {
    console.warn('[Amazon EC2] Save and add service button not found');
  }

})({
  // Override defaults if needed.
});
