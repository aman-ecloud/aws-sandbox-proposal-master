/**
 * Amazon EKS - AWS Pricing Calculator Script
 *
 * Service name  : Amazon EKS
 * Configure URL : https://calculator.aws/#/createCalculator/EKS
 *
 * Usage (AI agent):
 *   await page.evaluate(fs.readFileSync('Amazon EKS.js', 'utf8'));
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 */

(async function configureAmazonEKS(params) {

  // -- DEFAULT CONFIGURATION -------------------------------------------------
  const config = {
    // Description | pricingImpact: false
    description: params?.description ?? 'SMB managed Kubernetes baseline',

    // Location | pricingImpact: true
    locationType: params?.locationType ?? 'Region',
    region: params?.region ?? 'US East (Ohio)',

    // EKS Cluster Pricing - Standard Support | pricingImpact: true
    standardSupportClusters: params?.standardSupportClusters ?? 1,

    // EKS Cluster Pricing - Extended Support | pricingImpact: true
    extendedSupportClusters: params?.extendedSupportClusters ?? 0,

    // EKS Capabilities Pricing | pricingImpact: true
    argoCdCapabilities: params?.argoCdCapabilities ?? 1,
    argoCdAppsPerCapability: params?.argoCdAppsPerCapability ?? 10,
    ackCapabilities: params?.ackCapabilities ?? 1,
    ackResourcesPerCapability: params?.ackResourcesPerCapability ?? 10,
    kroCapabilities: params?.kroCapabilities ?? 1,
    kroRgdPerCapability: params?.kroRgdPerCapability ?? 10,

    // EKS Hybrid Nodes Pricing | pricingImpact: true
    hybridNodes: params?.hybridNodes ?? 1,
    hybridNodesUnit: params?.hybridNodesUnit ?? 'per month',
    vcpuPerHybridNode: params?.vcpuPerHybridNode ?? 2
  };

  console.log('[Amazon EKS] Starting with config:', config);

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
    console.warn('[Amazon EKS] waitForElement timed out:', selector);
    return null;
  }

  function fieldsByAria(text) {
    return [...document.querySelectorAll('input, textarea')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(text));
  }

  async function setFieldByAria(text, value, index = 0) {
    const el = fieldsByAria(text)[index] || null;
    if (!el) {
      console.warn('[Amazon EKS] Field not found:', text, 'index', index);
      return;
    }
    await jitter();
    setInputValue(el, value);
    await jitter(100, 300);
  }

  async function openSection(labelContains) {
    const sectionBtn = [...document.querySelectorAll('button')].find(b => {
      const aria = b.getAttribute('aria-label') || '';
      const text = (b.textContent || '').trim();
      return aria.includes(labelContains) || text.includes(labelContains);
    });
    if (!sectionBtn) {
      console.warn('[Amazon EKS] Section button not found:', labelContains);
      return;
    }
    if (sectionBtn.getAttribute('aria-expanded') === 'true') return;
    scrollTo(sectionBtn);
    await jitter(120, 260);
    sectionBtn.click();
    await jitter(260, 420);
  }

  // -- PHASE 1 / 2 -----------------------------------------------------------
  if (!window.location.hash.includes('/addService') &&
      !window.location.hash.includes('/createCalculator/EKS')) {
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
      setInputValue(searchBox, 'Amazon EKS');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' && b.closest('li, article')?.textContent?.includes('Amazon EKS'));
    if (configBtn) {
      scrollTo(configBtn);
      await jitter(250, 600);
      configBtn.click();
      await wait(5000);
    } else {
      console.warn('[Amazon EKS] Configure button not found');
      return;
    }
  }

  // -- PHASE 3 ---------------------------------------------------------------
  await waitForElement('h1, input[aria-label*="Description"]', 15000);

  await openSection('EKS Cluster Pricing - Standard Support');
  await openSection('EKS Cluster Pricing - Extended Support');
  await openSection('EKS Capabilities Pricing');
  await openSection('EKS Hybrid Nodes Pricing');

  await setFieldByAria('Description - optional', config.description, 0);
  await setFieldByAria('Number of EKS Clusters', config.standardSupportClusters, 0);
  await setFieldByAria('Number of EKS Clusters', config.extendedSupportClusters, 1);

  await setFieldByAria('Number of Argo CD capabilities', config.argoCdCapabilities, 0);
  await setFieldByAria('Number of Argo CD Applications per Argo CD capability', config.argoCdAppsPerCapability, 0);
  await setFieldByAria('Number of ACK capabilities', config.ackCapabilities, 0);
  await setFieldByAria('Number of ACK resources per ACK capability', config.ackResourcesPerCapability, 0);
  await setFieldByAria('Number of KRO capabilities', config.kroCapabilities, 0);
  await setFieldByAria('Number of KRO RGD instances managed per KRO capability', config.kroRgdPerCapability, 0);

  await setFieldByAria('Number of hybrid nodes Value', config.hybridNodes, 0);
  await setFieldByAria('Number of vCPU per hybrid node', config.vcpuPerHybridNode, 0);

  // -- PHASE 4 ---------------------------------------------------------------
  await jitter(300, 600);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');

  if (saveBtn) {
    scrollTo(saveBtn);
    await jitter(300, 600);
    saveBtn.click();
    console.log('[Amazon EKS] Saved successfully!');
  } else {
    console.warn('[Amazon EKS] Save and add service button not found');
  }

})({
  // Override defaults here.
});
