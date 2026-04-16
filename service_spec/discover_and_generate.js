/**
 * discover_and_generate.js
 * 
 * Runs a headful Playwright browser, visits the AWS Pricing Calculator for each
 * of the 25 target services, extracts all interactive fields and dropdown options,
 * then generates a ready-to-use browser-console automation script for each service.
 *
 * Run with:  node service_spec/discover_and_generate.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname);
const DISCOVERY_FILE = path.join(__dirname, 'discovery.json');

const SERVICES = [
  'Amazon EC2',
  'AWS Lambda',
  'AWS Fargate',
  'Amazon EKS',
  'Amazon Lightsail',
  'Amazon Simple Storage Service (S3)',
  'Amazon Elastic Block Store (EBS)',
  'Amazon Elastic File System (EFS)',
  'Amazon RDS for MySQL',
  'Amazon RDS for PostgreSQL',
  'Amazon DynamoDB',
  'Amazon Aurora MySQL-Compatible',
  'Amazon ElastiCache',
  'Amazon CloudFront',
  'Amazon Route 53',
  'Amazon Virtual Private Cloud (VPC)',
  'Elastic Load Balancing',
  'Amazon Simple Queue Service (SQS)',
  'Amazon Simple Notification Service (SNS)',
  'Amazon EventBridge',
  'Amazon CloudWatch',
  'AWS Key Management Service',
  'AWS Secrets Manager',
  'Amazon Bedrock',
  'Amazon SageMaker',
];

// Load any previously saved discovery data so we can resume if the runner crashes
let discovery = {};
if (fs.existsSync(DISCOVERY_FILE)) {
  try { discovery = JSON.parse(fs.readFileSync(DISCOVERY_FILE, 'utf8')); } catch {}
}

function saveDiscovery() {
  fs.writeFileSync(DISCOVERY_FILE, JSON.stringify(discovery, null, 2));
}

const jitter = (page, min = 80, max = 350) =>
  page.waitForTimeout(Math.floor(Math.random() * (max - min + 1)) + min);

// SMB-appropriate defaults by field type and label heuristics
function smbDefault(label, type, options) {
  const l = (label || '').toLowerCase();
  if (type === 'select/dropdown' && options && options.length > 0) {
    // Prefer common/safe options
    const preferred = options.find(o =>
      /on.demand|standard|general|default|none|no|disabled|us east.*virginia/i.test(o)
    );
    return preferred || options[0];
  }
  if (type === 'number') {
    if (/instance|server|node|container|replica|cluster/i.test(l)) return 2;
    if (/hour/i.test(l)) return 730;
    if (/day/i.test(l)) return 30;
    if (/month/i.test(l)) return 12;
    if (/gb|storage|size|capacity/i.test(l)) return 100;
    if (/tb/i.test(l)) return 1;
    if (/request|invocation|call|transaction/i.test(l)) return 1000000;
    if (/concurrency/i.test(l)) return 10;
    if (/user/i.test(l)) return 50;
    if (/vcpu|cpu/i.test(l)) return 4;
    if (/memory|mem/i.test(l)) return 8;
    return 1;
  }
  if (type === 'checkbox' || type === 'toggle') return false;
  if (type === 'radio') return options?.[0] || '';
  if (type === 'textarea' || type === 'text') {
    if (/description/i.test(l)) return 'SMB baseline estimate';
    return 'default';
  }
  return '';
}

function toCamelCase(name) {
  return name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/(?:^\w|[A-Z]|\b\w)/g, (w, i) => i === 0 ? w.toLowerCase() : w.toUpperCase()).replace(/\s+/g, '');
}

function toConfigKey(label, idx) {
  const key = (label || `field_${idx}`)
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (w, i) => i === 0 ? w.toLowerCase() : w.toUpperCase())
    .replace(/\s+/g, '')
    .replace(/^(\d)/, '_$1');
  return key || `field_${idx}`;
}

function generateScript(serviceName, configureUrl, fields, optionMap) {
  const fnName = `configure${toCamelCase(serviceName).replace(/^./, c => c.toUpperCase())}`;
  const filename = `${serviceName}.js`;

  // Build config entries
  const configLines = [];
  const fillLines = [];
  const overrideLines = [];
  const usedKeys = new Set();

  fields.forEach((f, idx) => {
    if (!f.label || f.label === 'Unlabeled') return;
    // Skip nav/header elements
    if (/search for a service|find service|language|feedback|contact sales/i.test(f.label)) return;

    let key = toConfigKey(f.label, idx);
    // Deduplicate keys
    let finalKey = key;
    let suffix = 2;
    while (usedKeys.has(finalKey)) { finalKey = `${key}${suffix}`; suffix++; }
    usedKeys.add(finalKey);

    // Find matching options from optionMap
    const matchedOptions = Object.values(optionMap).find(opts =>
      opts && opts.length > 0 &&
      (f.label ? opts.some(o => o.length < 80) : false)
    ) || [];

    const def = smbDefault(f.label, f.type, matchedOptions.length ? matchedOptions : null);
    const defStr = typeof def === 'string' ? `'${def.replace(/'/g, "\\'")}'` : String(def);
    const optionsComment = matchedOptions.length
      ? ` | options: ${matchedOptions.slice(0, 8).map(o => `'${o.replace(/'/g, "\\'")}'`).join(', ')}${matchedOptions.length > 8 ? ', ...' : ''}`
      : '';
    const impactComment = f.pricingImpact ? ' | PRICING IMPACT' : '';

    configLines.push(`    ${finalKey}: params?.${finalKey} ?? ${defStr},  // ${f.label}${impactComment}${optionsComment}`);
    overrideLines.push(`  // ${finalKey}: ${defStr},  // ${f.label}${optionsComment}`);

    if (f.type === 'select/dropdown') {
      fillLines.push(`
  // ${f.label}
  await selectDropdown('${f.label.replace(/'/g, "\\'")}', config.${finalKey});`);
    } else if (f.type === 'checkbox' || f.type === 'toggle') {
      fillLines.push(`
  // ${f.label}
  { const el = findField('${f.label.replace(/'/g, "\\'")}');
    if (el) { scrollTo(el); await jitter(); if (el.checked !== config.${finalKey}) el.click(); await jitter(100, 300); }
    else { console.warn('[${serviceName}] Field not found: ${f.label}'); } }`);
    } else if (f.type === 'radio') {
      fillLines.push(`
  // ${f.label}
  { const el = [...document.querySelectorAll('input[type="radio"]')].find(r => (r.getAttribute('aria-label') || r.closest('label')?.textContent || '').includes('${f.label.replace(/'/g, "\\'")}'));
    if (el && !el.checked) { scrollTo(el); await jitter(); el.click(); await jitter(100, 300); }
    else if (!el) { console.warn('[${serviceName}] Radio not found: ${f.label}'); } }`);
    } else {
      fillLines.push(`
  // ${f.label}
  { const el = findField('${f.label.replace(/'/g, "\\'")}');
    if (el) { await jitter(); setInputValue(el, config.${finalKey}); await jitter(100, 300); }
    else { console.warn('[${serviceName}] Field not found: ${f.label}'); } }`);
    }
  });

  return `/**
 * ${serviceName} - AWS Pricing Calculator Script
 *
 * Service name  : ${serviceName}
 * Configure URL : ${configureUrl}
 *
 * Usage (AI agent):
 *   await page.evaluate(fs.readFileSync('${filename}', 'utf8'));
 *
 * Usage (browser console):
 *   Paste the whole file - runs immediately with the defaults below.
 *   Override by changing the object at the very bottom of the file.
 */

(async function ${fnName}(params) {

  // -- DEFAULT CONFIGURATION -------------------------------------------------
  // Every interactive field discovered on the live page appears here.
  // Values are SMB-appropriate defaults (10-50 employees, moderate workload).
  const config = {
${configLines.join('\n')}
  };

  console.log('[${serviceName}] Starting with config:', config);

  // -- HELPERS ---------------------------------------------------------------

  /** Random delay between min-max ms to simulate human interaction timing */
  function jitter(min = 80, max = 350) {
    return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));
  }

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  function scrollTo(el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

  function setInputValue(el, value) {
    if (!el) return;
    scrollTo(el);
    const proto  = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, String(value));
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function waitForElement(selector, timeout = 12000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const el = document.querySelector(selector);
      if (el) return el;
      await wait(400);
    }
    console.warn('[${serviceName}] waitForElement timed out:', selector);
    return null;
  }

  async function waitForVisible(selector, timeout = 12000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const el = [...document.querySelectorAll(selector)].find(e => e.offsetParent !== null);
      if (el) return el;
      await wait(400);
    }
    console.warn('[${serviceName}] waitForVisible timed out:', selector);
    return null;
  }

  /**
   * Find any input/select/textarea by aria-label or associated label text.
   * NEVER uses #formField... IDs - those are session-generated and change every load.
   */
  function findField(text) {
    const byAria = [...document.querySelectorAll('input, select, textarea')]
      .find(el => el.getAttribute('aria-label')?.includes(text));
    if (byAria) return byAria;
    const label = [...document.querySelectorAll('label')]
      .find(l => l.textContent.trim().includes(text));
    if (!label) return null;
    if (label.htmlFor) return document.getElementById(label.htmlFor);
    return label.querySelector('input, select, textarea');
  }

  /** Opens an AWSUI dropdown by its form-field label, clicks the matching option. */
  async function selectDropdown(fieldLabelText, targetOption) {
    const trigger = [...document.querySelectorAll('button[aria-haspopup="listbox"], button[aria-expanded]')]
      .find(b => {
        if (b.getAttribute('aria-label')?.includes(fieldLabelText)) return true;
        const ids = [b.getAttribute('aria-labelledby'), b.getAttribute('aria-describedby')].filter(Boolean);
        if (ids.some(id => document.getElementById(id)?.textContent?.includes(fieldLabelText))) return true;
        const ff = b.closest('[class*="form-field"], [class*="FormField"], [class*="form_field"], fieldset');
        if (ff) {
          const lbl = ff.querySelector('label, legend, [class*="label"]');
          if (lbl?.textContent?.trim().includes(fieldLabelText)) return true;
        }
        return false;
      });
    if (!trigger) { console.warn('[${serviceName}] Dropdown trigger not found for:', fieldLabelText); return; }
    scrollTo(trigger);
    await jitter(100, 300);
    trigger.click();
    await jitter(600, 1000);
    const listbox = [...document.querySelectorAll('[role="listbox"]')].find(lb => lb.offsetParent !== null);
    if (!listbox) { console.warn('[${serviceName}] Listbox did not open for:', fieldLabelText); return; }
    const option = [...listbox.querySelectorAll('[role="option"], li')]
      .find(el => el.textContent.trim() === targetOption || el.textContent.trim().startsWith(targetOption));
    if (option) { scrollTo(option); await jitter(80, 200); option.click(); }
    else { console.warn('[${serviceName}] Option not found:', targetOption); }
    await jitter(300, 600);
  }

  // -- PHASE 1 : NAVIGATE ----------------------------------------------------

  if (!window.location.hash.includes('/addService') &&
      !window.location.hash.includes('/createCalculator')) {
    window.location.hash = '#/';
    await wait(3000);
    const createBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Create estimate');
    if (createBtn) { scrollTo(createBtn); await jitter(); createBtn.click(); await wait(3000); }
    else { console.warn('[${serviceName}] "Create estimate" button not found'); }
  }

  // -- PHASE 2 : SEARCH AND CONFIGURE --------------------------------------
  // Only interacts with: "Search all services" radio, search input, Configure button.
  // Does NOT touch language selector, info panels, sidebars, or nav elements.

  if (window.location.hash.includes('/addService')) {
    const searchAllRadio = [...document.querySelectorAll('input[type="radio"]')]
      .find(r => (r.closest('label, div')?.textContent || '').includes('Search all services'));
    if (searchAllRadio && !searchAllRadio.checked) {
      scrollTo(searchAllRadio); await jitter(200, 400); searchAllRadio.click(); await wait(800);
    }

    const searchBox = await waitForElement('input[placeholder="Search for a service"]');
    if (searchBox) {
      scrollTo(searchBox); await jitter(200, 500);
      setInputValue(searchBox, '${serviceName}');
      await wait(2000);
    }

    const configBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Configure' &&
                 b.closest('li, [class*="service-card"], [class*="ServiceCard"], article')
                   ?.textContent?.includes('${serviceName}'));
    if (configBtn) { scrollTo(configBtn); await jitter(300, 700); configBtn.click(); await wait(5000); }
    else { console.warn('[${serviceName}] Configure button not found'); }
  }

  // -- PHASE 3 : FILL FORM --------------------------------------------------

  await waitForElement('[aria-label*="Description"], h1', 15000);
  console.log('[${serviceName}] Configure page loaded - filling form...');
${fillLines.join('\n')}

  // -- PHASE 4 : SAVE -------------------------------------------------------

  await jitter(400, 800);
  const saveBtn = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'Save and add service');
  if (saveBtn) {
    scrollTo(saveBtn); await jitter(300, 600); saveBtn.click();
    console.log('[${serviceName}] Saved successfully!');
  } else {
    console.warn('[${serviceName}] "Save and add service" button not found');
  }

})({
  // -- OVERRIDE DEFAULTS HERE ----------------------------------------------
${overrideLines.join('\n')}
});
`;
}

function generateMarkdownReport(serviceName, fields, optionMap) {
  const rows = fields
    .filter(f => f.label && f.label !== 'Unlabeled' && !/search for a service|language|feedback/i.test(f.label))
    .map((f, idx) => {
      const opts = Object.values(optionMap).find(o => o?.length > 0) || [];
      const optsStr = opts.slice(0, 5).join(', ') + (opts.length > 5 ? ', ...' : '');
      const def = smbDefault(f.label, f.type, opts.length ? opts : null);
      return `| ${f.label} | ${f.type} | ${def} | ${optsStr} | ${f.pricingImpact ? 'Yes' : 'No'} | SMB default |`;
    });
  return `# ${serviceName} - Pricing Calculator Fields\n\n| Label on Page | Type | Default Value | Valid Options | Pricing Impact | Justification |\n|---|---|---|---|---|---|\n${rows.join('\n')}\n`;
}

async function discoverService(page, serviceName) {
  console.log(`\n[DISCOVER] ${serviceName}`);

  await page.goto('https://calculator.aws/#/addService', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Click "Search all services" radio - touch nothing else on this page
  const radios = page.locator('input[type="radio"]');
  const rc = await radios.count();
  for (let i = 0; i < rc; i++) {
    const r = radios.nth(i);
    const txt = (await r.evaluate(el => el.closest('label, div')?.textContent || '')).trim();
    if (txt.includes('Search all services')) {
      if (!await r.isChecked().catch(() => false)) {
        await jitter(page, 200, 400); await r.click({ force: true }); await page.waitForTimeout(900);
      }
      break;
    }
  }

  // Type into search input only
  const search = page.locator('input[placeholder="Search for a service"]').first();
  await search.waitFor({ state: 'visible', timeout: 20000 });
  await jitter(page, 200, 500);
  await search.fill('');
  await search.type(serviceName, { delay: 35 });
  await page.waitForTimeout(2200);

  // Click Configure inside the matching card only
  let configure = page.locator('li, article, [class*="service-card"], [class*="ServiceCard"]')
    .filter({ hasText: serviceName }).first().locator('button:has-text("Configure")').first();
  if (await configure.count() === 0)
    configure = page.locator(`button[aria-label="Configure ${serviceName}"]`).first();
  if (await configure.count() === 0)
    configure = page.locator('button:has-text("Configure")').first();
  if (await configure.count() === 0) {
    console.warn(`[SKIP] ${serviceName} - Configure button not found`);
    return null;
  }
  await jitter(page, 300, 700);
  await configure.click({ timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(5500);

  // Expand all collapsible sections (3 passes)
  for (let pass = 0; pass < 3; pass++) {
    const collapsed = page.locator('button[aria-expanded="false"]');
    const n = await collapsed.count();
    for (let i = 0; i < n; i++) {
      const b = collapsed.nth(i);
      if (await b.isVisible().catch(() => false)) {
        await jitter(page, 80, 200);
        await b.click({ force: true }).catch(() => {});
        await page.waitForTimeout(250);
      }
    }
  }

  // Navigate all tabs
  const tabs = page.locator('[role="tab"]');
  const tc = await tabs.count();
  for (let i = 0; i < tc; i++) {
    const t = tabs.nth(i);
    if (await t.isVisible().catch(() => false)) {
      await jitter(page);
      await t.click({ force: true }).catch(() => {});
      await page.waitForTimeout(500);
    }
  }

  const configureUrl = page.url();

  // Extract all interactive fields
  const fields = await page.evaluate(() => {
    const vis = el => !!el && el.offsetParent !== null;
    const norm = s => (s || '').replace(/\s+/g, ' ').trim();
    const pricingRe = /instance|vcpu|cpu|memory|storage|iops|throughput|request|hour|day|month|gb|tb|size|count|quantity|data|transfer|traffic|bandwidth|rate|duration|nodes|capacity|provisioned|concurrency|transactions|invocations/;
    const rows = [];
    const seen = new Set();

    const controls = Array.from(document.querySelectorAll(
      'input:not([type="hidden"]), textarea, select, button[aria-haspopup="listbox"], [role="switch"]'
    )).filter(vis);

    for (const el of controls) {
      if (el.closest('header, nav')) continue;
      if (el.matches('input[placeholder="Search for a service"], input[placeholder*="Find Service"]')) continue;

      const ff = el.closest('fieldset, [class*="form-field"], [class*="FormField"]');
      const labelEl = ff?.querySelector('label, legend, [class*="label"]');
      const label = norm(labelEl?.textContent || el.closest('label')?.textContent || '');
      const ariaLabel = norm(el.getAttribute('aria-label') || '');

      let type = 'text';
      if (el.matches('textarea')) type = 'textarea';
      else if (el.matches('select, button[aria-haspopup="listbox"]')) type = 'select/dropdown';
      else if (el.matches('[role="switch"]')) type = 'toggle';
      else if (el.matches('input')) {
        const t = (el.getAttribute('type') || 'text').toLowerCase();
        if (t === 'number') type = 'number';
        else if (t === 'checkbox') type = 'checkbox';
        else if (t === 'radio') type = 'radio';
        else type = 'text';
      }

      const displayLabel = label || ariaLabel;
      if (!displayLabel) continue;

      const key = `${displayLabel}|${type}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const defaultValue = norm(el.value || el.getAttribute('placeholder') || el.textContent || '');
      const pricingImpact = pricingRe.test(displayLabel.toLowerCase());

      rows.push({ label: displayLabel, ariaLabel, type, defaultValue, pricingImpact });
    }
    return rows;
  });

  // Extract dropdown options by opening each one individually
  const optionMap = {};
  let dd = 0;
  const triggers = page.locator(
    'fieldset button[aria-haspopup="listbox"], [class*="form-field"] button[aria-haspopup="listbox"], [class*="FormField"] button[aria-haspopup="listbox"]'
  );
  const dc = await triggers.count();
  for (let i = 0; i < dc; i++) {
    const trg = triggers.nth(i);
    if (!await trg.isVisible().catch(() => false)) continue;
    await jitter(page, 100, 300);
    await trg.click({ force: true }).catch(() => {});
    await page.waitForTimeout(700);
    const opts = await page.$$eval(
      '[role="listbox"] [role="option"], [role="listbox"] li',
      els => els.map(e => (e.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean)
    );
    if (opts.length) { dd++; optionMap[`dropdown_${dd}`] = opts; }
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
  }

  console.log(`[DONE] ${serviceName} - ${fields.length} fields, ${dd} dropdowns`);
  return { serviceName, configureUrl, fields, optionMap };
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Suppress console noise from the calculator page itself
  page.on('console', () => {});

  for (const serviceName of SERVICES) {
    // Skip if already discovered and script already exists
    const outFile = path.join(OUTPUT_DIR, `${serviceName}.js`);
    if (discovery[serviceName] && fs.existsSync(outFile)) {
      console.log(`[SKIP] ${serviceName} - already done`);
      continue;
    }

    try {
      const data = await discoverService(page, serviceName);
      if (!data) continue;

      // Save discovery data immediately so progress is never lost
      discovery[serviceName] = data;
      saveDiscovery();

      // Generate and write the automation script
      const script = generateScript(data.serviceName, data.configureUrl, data.fields, data.optionMap);
      fs.writeFileSync(outFile, script, 'utf8');
      console.log(`[SAVED] ${outFile}`);

      // Generate and write the markdown report
      const mdFile = path.join(OUTPUT_DIR, `${serviceName}.md`);
      const report = generateMarkdownReport(data.serviceName, data.fields, data.optionMap);
      fs.writeFileSync(mdFile, report, 'utf8');
      console.log(`[SAVED] ${mdFile}`);

    } catch (err) {
      console.error(`[ERROR] ${serviceName}:`, err.message);
      // Continue to next service - never abort the whole run
    }
  }

  await browser.close();
  console.log('\n[ALL DONE] Discovery and generation complete.');
})();
