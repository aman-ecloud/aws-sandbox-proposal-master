/**
 * AWS Application Migration Service - AWS Pricing Calculator Script
 *
 * Service name  : AWS Application Migration Service
 * Configure URL : https://calculator.aws/#/createCalculator/appmigrationsvc
 *
 * Usage (AI agent):
 *   await page.evaluate(fs.readFileSync('AWS Application Migration Service.js', 'utf8'));
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 */

(async function configureApplicationMigrationService(params) {

  // -- DEFAULT CONFIGURATION -------------------------------------------------
  // Every interactive field discovered on the page appears here with SMB defaults.
  const config = {
    descriptionOptional: params?.descriptionOptional ?? 'SMB estimate',  // non-pricing metadata
    chooseALocationTypeinfo: params?.chooseALocationTypeinfo ?? 'Region',  // non-pricing metadata | options: Region
    numberOfServerSNumber: params?.numberOfServerSNumber ?? '10',  // non-pricing metadata
    numberOfHourSPerServer: params?.numberOfHourSPerServer ?? '10',  // pricing driver
  };

  console.log('[AWS Application Migration Service] Starting with config:', config);

  // -- HELPERS ---------------------------------------------------------------
  function jitter(min = 80, max = 350) {
    return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));
  }

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  function scrollTo(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function setInputValue(el, value) {
    if (!el) return;
    scrollTo(el);
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, String(value));
    else el.value = String(value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function waitForElement(selector, timeout = 12000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const el = document.querySelector(selector);
      if (el) return el;
      await wait(400);
    }
    return null;
  }

  function findField(text) {
    const byAria = [...document.querySelectorAll('input, select, textarea')]
      .find(el => (el.getAttribute('aria-label') || '').includes(text));
    if (byAria) return byAria;
    const labels = [...document.querySelectorAll('label, legend, [class*="label"]')];
    const label = labels.find(l => (l.textContent || '').trim().includes(text));
    if (!label) return null;
    if (label.htmlFor) return document.getElementById(label.htmlFor);
    const local = label.closest('fieldset, [class*="form-field"], [class*="FormField"]');
    if (local) {
      const control = local.querySelector('input, select, textarea');
      if (control) return control;
    }
    return label.querySelector('input, select, textarea');
  }

  async function selectDropdown(fieldLabelText, targetOption) {
    const trigger = [...document.querySelectorAll('button[aria-haspopup="listbox"], button[aria-expanded]')]
      .find(b => {
        const aria = b.getAttribute('aria-label') || '';
        if (aria.includes(fieldLabelText)) return true;
        const formField = b.closest('[class*="form-field"], [class*="FormField"], fieldset');
        if (formField) {
          const lbl = formField.querySelector('label, legend, [class*="label"]');
          if (lbl && (lbl.textContent || '').trim().includes(fieldLabelText)) return true;
        }
        return false;
      });
    if (!trigger) return;
    scrollTo(trigger);
    await jitter(100, 260);
    trigger.click();
    await jitter(650, 950);
    const listbox = [...document.querySelectorAll('[role="listbox"]')]
      .find(lb => lb.offsetParent !== null);
    if (!listbox) return;
    const option = [...listbox.querySelectorAll('[role="option"], li')]
      .find(el => (el.textContent || '').trim() === targetOption || (el.textContent || '').trim().startsWith(targetOption));
    if (option) {
      scrollTo(option);
      await jitter(80, 200);
      option.click();
    }
    await jitter(250, 520);
  }

  // -- PHASE 1 : NAVIGATE ----------------------------------------------------
  if (!window.location.hash.includes('/addService') && !window.location.hash.includes('/createCalculator')) {
    window.location.hash = '#/addService';
    await wait(3000);
  }

  // -- PHASE 2 : SEARCH AND CONFIGURE ---------------------------------------
  if (window.location.hash.includes('/addService')) {
    const searchBox = await waitForElement('input[aria-label*="Find Service"], input[placeholder="Search for a service"]', 15000);
    if (searchBox) {
      await jitter(160, 420);
      setInputValue(searchBox, 'AWS Application Migration Service');
      await wait(2200);
    }

    const configBtn = [...document.querySelectorAll('button')].find(b => {
      const aria = b.getAttribute('aria-label') || '';
      return aria === 'Configure AWS Application Migration Service' || ((b.textContent || '').trim() === 'Configure' && (b.closest('li,div')?.textContent || '').includes('AWS Application Migration Service'));
    });
    if (configBtn) {
      await jitter(220, 520);
      configBtn.click();
      await wait(5200);
    } else {
      console.warn('[AWS Application Migration Service] Configure button not found');
      return;
    }
  }

  // Expand collapsible blocks and tabs before filling.
  for (let i = 0; i < 3; i++) {
    const collapsed = [...document.querySelectorAll('button[aria-expanded="false"], [role="button"][aria-expanded="false"]')]
      .filter(el => el.offsetParent !== null);
    for (const b of collapsed) {
      await jitter(80, 220);
      b.click();
      await wait(200);
    }
  }

  const tabs = [...document.querySelectorAll('[role="tab"]')].filter(el => el.offsetParent !== null);
  for (const t of tabs) {
    await jitter(80, 220);
    t.click();
    await wait(500);
  }

  // -- PHASE 3 : FILL FORM ---------------------------------------------------
  await waitForElement('input[aria-label*="Description"], h1', 15000);

  await jitter(80, 220);
  const descriptionOptionalEl = findField('Description - optional');
  if (descriptionOptionalEl) {
    setInputValue(descriptionOptionalEl, config.descriptionOptional);
    await jitter(100, 280);
  }

  await jitter(80, 220);
  await selectDropdown('Choose a location typeInfo:', config.chooseALocationTypeinfo);

  await jitter(80, 220);
  const numberOfServerSNumberEl = findField('Number of server/s Number');
  if (numberOfServerSNumberEl) {
    setInputValue(numberOfServerSNumberEl, config.numberOfServerSNumber);
    await jitter(100, 280);
  }

  await jitter(80, 220);
  const numberOfHourSPerServerEl = findField('Number of hour/s per server Number');
  if (numberOfHourSPerServerEl) {
    setInputValue(numberOfHourSPerServerEl, config.numberOfHourSPerServer);
    await jitter(100, 280);
  }

  // -- PHASE 4 : SAVE --------------------------------------------------------
  await jitter(420, 840);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => (b.textContent || '').trim() === 'Save and add service');
  if (saveBtn) {
    await jitter(220, 480);
    saveBtn.click();
    console.log('[AWS Application Migration Service] Saved successfully!');
  } else {
    console.warn('[AWS Application Migration Service] Save and add service button not found');
  }

})({
  // -- OVERRIDE DEFAULTS HERE ------------------------------------------------
});
