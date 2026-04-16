/**
 * AWS AppSync - AWS Pricing Calculator Script
 *
 * Service name  : AWS AppSync
 * Configure URL : https://calculator.aws/#/createCalculator/appSync
 *
 * Usage (AI agent):
 *   await page.evaluate(fs.readFileSync('AWS AppSync.js', 'utf8'));
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 */

(async function configureAppSync(params) {

  // -- DEFAULT CONFIGURATION -------------------------------------------------
  // Every interactive field discovered on the page appears here with SMB defaults.
  const config = {
    descriptionOptional: params?.descriptionOptional ?? 'SMB estimate',  // non-pricing metadata
    chooseALocationTypeinfo: params?.chooseALocationTypeinfo ?? 'Region',  // non-pricing metadata | options: Region
    unlabeled: params?.unlabeled ?? true,  // non-pricing metadata
    numberOfSubscribedClients: params?.numberOfSubscribedClients ?? '10',  // non-pricing metadata
    averageActiveDurationPerSubscribedClients: params?.averageActiveDurationPerSubscribedClients ?? 500,  // pricing driver
    unit: params?.unit ?? 'per month',  // non-pricing metadata | options: per day, per week, per month
    numberOfInboundMessagesIE: params?.numberOfInboundMessagesIE ?? 1,  // pricing driver
    numberOfOutboundMessagesValue: params?.numberOfOutboundMessagesValue ?? 1,  // pricing driver
    cacheMemorySizeGb: params?.cacheMemorySizeGb ?? 'cache.small (vCPU: 1, Memory: 1.55 GB)',  // pricing driver | options: cache.small (vCPU: 1, Memory: 1.55 GB)
    numberOfConnectedClientsEnterThe: params?.numberOfConnectedClientsEnterThe ?? '10',  // non-pricing metadata
    inboundMessagesPublishedFromBackendValue: params?.inboundMessagesPublishedFromBackendValue ?? 1,  // pricing driver
    inboundMessagesPublishedPerClientValue: params?.inboundMessagesPublishedPerClientValue ?? 100,  // pricing driver
    ouboundMessagesReceivedPerClientValue: params?.ouboundMessagesReceivedPerClientValue ?? 100,  // pricing driver
    connectionRequestsPerClientValue: params?.connectionRequestsPerClientValue ?? 100000,  // pricing driver
    subscriptionRequestsPerClientValue: params?.subscriptionRequestsPerClientValue ?? 100000,  // pricing driver
    unsubscribeRequestsPerClientValue: params?.unsubscribeRequestsPerClientValue ?? 100000,  // pricing driver
    eventHandlerInvocationsValue: params?.eventHandlerInvocationsValue ?? 1,  // pricing driver
    connectionMinutesPerClientValue: params?.connectionMinutesPerClientValue ?? 100,  // pricing driver
  };

  console.log('[AWS AppSync] Starting with config:', config);

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
      setInputValue(searchBox, 'AWS AppSync');
      await wait(2200);
    }

    const configBtn = [...document.querySelectorAll('button')].find(b => {
      const aria = b.getAttribute('aria-label') || '';
      return aria === 'Configure AWS AppSync' || ((b.textContent || '').trim() === 'Configure' && (b.closest('li,div')?.textContent || '').includes('AWS AppSync'));
    });
    if (configBtn) {
      await jitter(220, 520);
      configBtn.click();
      await wait(5200);
    } else {
      console.warn('[AWS AppSync] Configure button not found');
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
  const unlabeledEl = findField('(unlabeled)');
  if (unlabeledEl) {
    scrollTo(unlabeledEl);
    await jitter(90, 260);
    const shouldBeChecked = !!config.unlabeled;
    const isChecked = unlabeledEl.checked === true || unlabeledEl.getAttribute('aria-checked') === 'true';
    if (shouldBeChecked !== isChecked) { unlabeledEl.click(); }
    await jitter(100, 260);
  }

  await jitter(80, 220);
  const numberOfSubscribedClientsEl = findField('Number Of Subscribed Clients');
  if (numberOfSubscribedClientsEl) {
    setInputValue(numberOfSubscribedClientsEl, config.numberOfSubscribedClients);
    await jitter(100, 280);
  }

  await jitter(80, 220);
  const averageActiveDurationPerSubscribedClientsEl = findField('Average Active Duration per Subscribed Clients Value');
  if (averageActiveDurationPerSubscribedClientsEl) {
    setInputValue(averageActiveDurationPerSubscribedClientsEl, config.averageActiveDurationPerSubscribedClients);
    await jitter(100, 280);
  }

  await jitter(80, 220);
  await selectDropdown('Unit', config.unit);

  await jitter(80, 220);
  const numberOfInboundMessagesIEEl = findField('Number of Inbound Messages (i.e. GraphQL Mutations) Value');
  if (numberOfInboundMessagesIEEl) {
    setInputValue(numberOfInboundMessagesIEEl, config.numberOfInboundMessagesIE);
    await jitter(100, 280);
  }

  await jitter(80, 220);
  const numberOfOutboundMessagesValueEl = findField('Number of Outbound Messages Value');
  if (numberOfOutboundMessagesValueEl) {
    setInputValue(numberOfOutboundMessagesValueEl, config.numberOfOutboundMessagesValue);
    await jitter(100, 280);
  }

  await jitter(80, 220);
  await selectDropdown('Cache memory size (GB)', config.cacheMemorySizeGb);

  await jitter(80, 220);
  const numberOfConnectedClientsEnterTheEl = findField('Number of connected clients Enter the number of connected clients');
  if (numberOfConnectedClientsEnterTheEl) {
    setInputValue(numberOfConnectedClientsEnterTheEl, config.numberOfConnectedClientsEnterThe);
    await jitter(100, 280);
  }

  await jitter(80, 220);
  const inboundMessagesPublishedFromBackendValueEl = findField('Inbound messages published from backend Value');
  if (inboundMessagesPublishedFromBackendValueEl) {
    setInputValue(inboundMessagesPublishedFromBackendValueEl, config.inboundMessagesPublishedFromBackendValue);
    await jitter(100, 280);
  }

  await jitter(80, 220);
  const inboundMessagesPublishedPerClientValueEl = findField('Inbound messages published per client Value');
  if (inboundMessagesPublishedPerClientValueEl) {
    setInputValue(inboundMessagesPublishedPerClientValueEl, config.inboundMessagesPublishedPerClientValue);
    await jitter(100, 280);
  }

  await jitter(80, 220);
  const ouboundMessagesReceivedPerClientValueEl = findField('Oubound messages received per client Value');
  if (ouboundMessagesReceivedPerClientValueEl) {
    setInputValue(ouboundMessagesReceivedPerClientValueEl, config.ouboundMessagesReceivedPerClientValue);
    await jitter(100, 280);
  }

  await jitter(80, 220);
  const connectionRequestsPerClientValueEl = findField('Connection requests per client Value');
  if (connectionRequestsPerClientValueEl) {
    setInputValue(connectionRequestsPerClientValueEl, config.connectionRequestsPerClientValue);
    await jitter(100, 280);
  }

  await jitter(80, 220);
  const subscriptionRequestsPerClientValueEl = findField('Subscription requests per client Value');
  if (subscriptionRequestsPerClientValueEl) {
    setInputValue(subscriptionRequestsPerClientValueEl, config.subscriptionRequestsPerClientValue);
    await jitter(100, 280);
  }

  await jitter(80, 220);
  const unsubscribeRequestsPerClientValueEl = findField('Unsubscribe requests per client Value');
  if (unsubscribeRequestsPerClientValueEl) {
    setInputValue(unsubscribeRequestsPerClientValueEl, config.unsubscribeRequestsPerClientValue);
    await jitter(100, 280);
  }

  await jitter(80, 220);
  const eventHandlerInvocationsValueEl = findField('Event handler invocations Value');
  if (eventHandlerInvocationsValueEl) {
    setInputValue(eventHandlerInvocationsValueEl, config.eventHandlerInvocationsValue);
    await jitter(100, 280);
  }

  await jitter(80, 220);
  const connectionMinutesPerClientValueEl = findField('Connection minutes per client Value');
  if (connectionMinutesPerClientValueEl) {
    setInputValue(connectionMinutesPerClientValueEl, config.connectionMinutesPerClientValue);
    await jitter(100, 280);
  }

  // -- PHASE 4 : SAVE --------------------------------------------------------
  await jitter(420, 840);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => (b.textContent || '').trim() === 'Save and add service');
  if (saveBtn) {
    await jitter(220, 480);
    saveBtn.click();
    console.log('[AWS AppSync] Saved successfully!');
  } else {
    console.warn('[AWS AppSync] Save and add service button not found');
  }

})({
  // -- OVERRIDE DEFAULTS HERE ------------------------------------------------
});
