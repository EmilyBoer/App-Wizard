// Run with the test server up (PORT=4399 node test/ui-server.mjs) and a finished setup.
// Needs Playwright: npm i -D playwright, or set PLAYWRIGHT to its index.mjs.
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const B = 'http://127.0.0.1:4399/';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1360, height: 900 } });
const problems = [];
let where = '';
p.on('pageerror', (e) => problems.push(`${where}: page error ${e.message}`));
p.on('dialog', (d) => d.dismiss());
const SKIP = /del|rm|remove|reset|logout|me$|rate|dash|next|apply|run|batch|find|sample|retry|rebuild|fix|again|undo|copy|key|review|prev|later|skip|status|move|archive|pdf|save|done|approve|build|addsite|addjob|refresh|fetch|check/i;
const routes = ['#/profile', '#/profile/setup', '#/profile/design', '#/profile/style', '#/profile/vault', '#/profile/schedule', '#/journey', '#/interviews', '#/documents', '#/claude', '#/extension', '#/help',
  '#/setup/2', '#/setup/3', '#/setup/4', '#/setup/5', '#/setup/6', '#/setup/7', '#/setup/8', '#/build'];
// a job and a document, if any
await p.goto(B + '#/journey'); await p.waitForTimeout(1500);
const jobHref = await p.$eval('a[href^="#/job/"]', (a) => a.getAttribute('href')).catch(() => null);
if (jobHref) routes.push(jobHref);
const docHref = await p.goto(B + '#/documents').then(() => p.waitForTimeout(1200)).then(() => p.$eval('a[href^="#/documents/"], a[href^="#/doc"]', (a) => a.getAttribute('href')).catch(() => null));
if (docHref) routes.push(docHref);
let opened = 0;
for (const r of routes) {
  where = r;
  await p.goto(B + r); await p.waitForTimeout(900);
  const build = r.startsWith('#/build');
  if (build && !p.url().includes('#/profile')) problems.push('#/build still opens setup after it was finished');
  const exit = await p.$('.nav a:visible');
  if (!exit) problems.push(`${r}: no visible way out (nav or back link)`);
  const audit = await p.evaluate(() => {
    const vis = (e) => e.offsetParent && !e.closest('.modal-back, iframe, .dz-preview, .dz-mini, .own-sheet');
    const primaries = [...document.querySelectorAll('#screen .btn.primary')].filter(vis).length;
    const sizes = new Map();
    for (const e of document.querySelectorAll('#screen *')) { if (!vis(e) || !e.childNodes.length || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue; const fs = parseFloat(getComputedStyle(e).fontSize); sizes.set(fs, (sizes.get(fs) || 0) + 1); }
    return { primaries, sizes: [...sizes.entries()] };
  });
  if (audit.primaries > 1) problems.push(`${r}: ${audit.primaries} primary buttons (style guide: one per screen)`);
  const SCALE = [10, 11, 12, 12.5, 13, 14, 15, 16, 17, 18, 20, 21, 22, 30, 36];
  for (const [fs, n] of audit.sizes) if (!SCALE.includes(fs)) problems.push(`${r}: ${n} text element(s) at ${fs}px, not on the type scale`);
  const acts = await p.$$eval('#screen [data-act]:not([disabled]), #screen [data-edit]', (els) => els.filter((e) => e.offsetParent).map((e) => (e.dataset.edit ? 'edit=' + e.dataset.edit : e.dataset.act)));
  for (const a of [...new Set(acts)].filter((x) => x.startsWith('edit=') || !SKIP.test(x))) {
    const sel = a.startsWith('edit=') ? `#screen [data-edit="${a.slice(5)}"]` : `#screen [data-act="${a}"]`;
    const el = await p.$(sel); if (!el || !(await el.isVisible())) continue;
    await el.click().catch(() => {}); await p.waitForTimeout(400);
    if (await p.$('.modal-back')) {
      opened++;
      if (!(await p.$('.modal-x'))) problems.push(`${r} [${a}]: overlay has no X`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      if (await p.$('.modal-confirm')) await p.click('.modal-confirm [data-discard]');
      if (await p.$('.modal-back')) { problems.push(`${r} [${a}]: overlay didn't close with Escape`); await p.click('.modal-x').catch(() => {}); }
    }
    if (!p.url().endsWith(r)) { await p.goto(B + r); await p.waitForTimeout(700); }
  }
}
// unsaved typing is protected
where = 'dirty-check';
await p.goto(B + '#/interviews'); await p.waitForTimeout(800);
const add = await p.$('[data-act=add]');
if (add) {
  await add.click(); await p.waitForSelector('.modal');
  const field = await p.$('.modal input[type=text], .modal textarea'); await field.type('typed text');
  await p.mouse.click(5, 5); await p.waitForTimeout(200);
  if (!(await p.$('.modal-confirm'))) problems.push('clicking outside after typing closed without asking');
  await p.click('.modal-confirm [data-keep]'); if (!(await p.$('.modal'))) problems.push('Keep editing closed the overlay');
  await p.click('.modal-x'); await p.click('.modal-confirm [data-discard]'); await p.waitForTimeout(200);
  if (await p.$('.modal')) problems.push('Close without saving did not close');
}
console.log(`routes ${routes.length}, overlays opened and closed ${opened}`);
console.log(problems.length ? problems.join('\n') : 'no problems');
await b.close();
