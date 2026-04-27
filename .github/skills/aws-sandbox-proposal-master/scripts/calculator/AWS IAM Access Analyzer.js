/**
 * AWS IAM Access Analyzer - AWS Pricing Calculator Script
 *
 * Service name  : AWS IAM Access Analyzer
 * Configure URL : https://calculator.aws/#/addService
 *
 * Auto-generated after GROUP B manual fill on 2026-04-27.
 * Inject via page.evaluate() - do NOT use require/fs.
 */

(async function configureAWSIAMAccessAnalyzer(params) {

  const config = {
    // Region | PRICING IMPACT: true
    region: params?.region ?? 'Asia Pacific (Singapore)',

    // Number of analyzers per account | PRICING IMPACT: true
    analyzersPerAccount: params?.analyzersPerAccount ?? 1,
  };

  console.log('[AWS IAM Access Analyzer] Starting with config:', config);

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
    console.warn('[AWS IAM Access Analyzer] waitForElement timed out:', selector);
    return null;
  }

  function findInputsByAriaContains(text) {
    return [...document.querySelectorAll('input, textarea')]
      .filter(el => (el.getAttribute('aria-label') || '').includes(text));
  }

  async function setFieldByAria(text, value, index = 0) {
    const all = findInputsByAriaContains(text);
    const el = all[index] || null;
    if (!el) { console.warn('[AWS IAM Access Analyzer] Field not found:', text, 'index', index); return; }
    await jitter();
    setInputValue(el, value);
    await jitter(100, 300);
  }

  if (!window.location.hash.includes('/addService') &&
      !window.location.hash.includes('/createCalculator')) {
    window.location.hash = '#/addService';
    await wait(2500);
  }

  if (window.location.hash.includes('/addService')) {
    const searchAllRadio = [...document.querySelectorAll('input[type="radio"]')]
      .find(r => (r.closest('label, div')?.textContent || '').includes('Search all services'));
    if (searchAllRadio && !searchAllRadio.checked) {
      scrollTo(searchAllRadio); await jitter(200, 400); searchAllRadio.click(); await wait(800);
    }

    const searchBox = await waitForElement(
      'input[placeholder="Search for a service"], input[aria-label="Find Service"], input[role="searchbox"]'
    );
    if (searchBox) {
      scrollTo(searchBox); await jitter(200, 500);
      setInputValue(searchBox, 'AWS IAM Access Analyzer');
      await wait(1800);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' &&
                 b.closest('li, article')?.textContent?.includes('AWS IAM Access Analyzer'));
    if (configBtn) {
      scrollTo(configBtn); await jitter(250, 600); configBtn.click(); await wait(5000);
    } else {
      console.warn('[AWS IAM Access Analyzer] Configure button not found'); return;
    }
  }

  await waitForElement('h1, input[aria-label*="Region"]', 15000);

  const regionBtn = [...document.querySelectorAll('button[aria-haspopup="listbox"]')]
    .find(b => (b.getAttribute('aria-label') || b.textContent || '').includes('Region'));
  if (regionBtn) {
    scrollTo(regionBtn); await jitter(); regionBtn.click(); await wait(700);
    const opt = [...document.querySelectorAll('[role="option"]')]
      .find(o => o.textContent.trim().includes(config.region));
    if (opt) { scrollTo(opt); await jitter(); opt.click(); await wait(400); }
  }

  await setFieldByAria('Number of analyzers', config.analyzersPerAccount);
  await setFieldByAria('analyzers per account', config.analyzersPerAccount);

  await jitter(400, 800);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');
  if (saveBtn) {
    scrollTo(saveBtn); await jitter(300, 600);
    saveBtn.click();
    console.log('[AWS IAM Access Analyzer] Saved successfully!');
  } else {
    console.warn('[AWS IAM Access Analyzer] Save and add service button not found');
  }

})({
  // Override defaults for this specific proposal run.
  // Example:
  // region: 'Asia Pacific (Taipei)',
  // analyzersPerAccount: 1,
});
