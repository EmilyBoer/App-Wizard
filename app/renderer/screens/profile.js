import { call, esc, tag, act, toast, on, modal, ago } from '../lib.js';
import { dashboard as setupDashboard } from './builder.js';
import { embed as embedPage } from './setup.js';

const TABS = [['setup', 'Your information'], ['design', 'Resume design'], ['style', 'Writing style'], ['vault', 'Bullet vault']];

export async function render(root, [tab = 'setup'], app) {
  if (!TAB[tab]) tab = 'setup';
  const paint = async () => {
    root.innerHTML = `<div class="page">
<div class="head"><div><h1>Profile</h1><p class="muted">Everything Job Wizard knows about you and your search. Change anything and your matches update.</p></div></div>
<nav class="tabs" aria-label="Profile sections">${TABS.map(([k, l]) => `<a class="tab ${k === tab ? 'on' : ''}" ${k === tab ? 'aria-current="page"' : ''} href="#/profile/${k}">${l}</a>`).join('')}</nav>
<div id="tab" class="tab-body"></div></div>`;
    const el = root.querySelector('#tab');
    await TAB[tab]?.(el, app, paint);
  };
  await paint();
}

const TAB = {
  async setup(el, app) { await setupDashboard(el, app, { embedded: true }); },
  async style(el, app) { await embedPage(el, 4, app); },
  async design(el, app) { await embedPage(el, 5, app); },
  async schedule(el) {
    const s = await call('settings.get');
    el.innerHTML = `<section class="card" style="max-width:720px"><h2>Morning batch</h2><p class="muted">Every morning, Job Wizard checks for new jobs and gets your best matches ready to apply. The app needs to be open, even in the background.</p>
<div class="row-l"><label class="field">Time<select id="hour" style="width:auto">${[5, 6, 7, 8, 9, 10].map((h) => `<option value="${h}" ${h === Number(s.morningHour) ? 'selected' : ''}>${h}:00 AM</option>`).join('')}</select></label><label class="field">How many to get ready<select id="count" style="width:auto">${[1, 2, 3, 5, 8].map((n) => `<option ${n === Number(s.morningCount) ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label class="radio" style="align-self:flex-end"><input type="checkbox" id="mon" ${s.morningOn ? 'checked' : ''}>Turned on</label></div>
${s.lastBatch ? `<p class="small muted">Last run ${esc(ago(s.lastBatch.at))}: ${s.lastBatch.made} made ready.</p>` : ''}<a href="#/profile" class="small">← Back to your choices</a></section>`;
    el.querySelectorAll('select, input').forEach((i) => (i.onchange = () => call('settings.save', { morningHour: Number(el.querySelector('#hour').value), morningCount: Number(el.querySelector('#count').value), morningOn: el.querySelector('#mon').checked }).then(() => toast('Saved.'))));
  },
  async experience(el) {
    const p = await call('profile.get');
    const w = await call('want.get');
    el.innerHTML = `<div class="grid">
<a class="card" href="#/setup/3" style="text-decoration:none;color:inherit"><h2>Work history</h2><p class="muted">${p.roles.length} roles · ${p.roles.reduce((n, r) => n + r.bullets.length, 0)} results · ${p.skills.length} skills</p><span class="small">Edit roles, results, skills and contact details →</span></a>
<a class="card" href="#/setup/2" style="text-decoration:none;color:inherit"><h2>Your files</h2><p class="muted">Add a new resume, review or LinkedIn update any time.</p><span class="small">Add or check files →</span></a>
<a class="card" href="#/setup/4" style="text-decoration:none;color:inherit"><h2>Your voice</h2><p class="muted">Writing samples, dials and words you never use.</p><span class="small">Change your voice →</span></a>
<a class="card" href="#/setup/5" style="text-decoration:none;color:inherit"><h2>Resume design</h2><p class="muted">Template, fonts, length and paper.</p><span class="small">Change the look →</span></a>
<a class="card" href="#/setup/6" style="text-decoration:none;color:inherit"><h2>What you want</h2><p class="muted">${esc(w.titles.slice(0, 3).join(', ') || 'No titles yet')}</p><span class="small">Change titles, pay, places and deal-breakers →</span></a>
<a class="card" href="#/setup/7" style="text-decoration:none;color:inherit"><h2>Job sites</h2><p class="muted">Where we look every morning.</p><span class="small">Add or remove sites →</span></a>
<a class="card" href="#/setup/8" style="text-decoration:none;color:inherit"><h2>Standard answers</h2><p class="muted">The questions every application asks.</p><span class="small">Change your answers →</span></a>
</div>`;
  },
  // Every bullet for every job, original wordings with the alternatives saved from approved resumes beneath.
  async vault(el, app, repaint) {
    const p = await call('profile.get');
    const fmt = (d) => (!d ? '' : /present/i.test(d) ? 'Present' : String(d).replace(/^(\d{4})-(\d{2}).*/, (_, y, m) => `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m) - 1]} ${y}`));
    const total = p.roles.reduce((n, r) => n + r.bullets.length, 0);
    const line = (b, alt) => `<div class="vault-line ${alt ? 'alt' : ''}" data-b="${b.id}"><div class="vault-text" tabindex="0" role="button" aria-label="Edit this bullet">${esc(b.text)}</div><div class="row vault-meta"><span class="tiny muted">${alt ? (b.fromResume ? 'Saved from a resume you approved' : 'Another wording') : b.manual || (b.sources || []).includes('you') ? 'You added this' : 'From your files'}</span><button class="btn small" data-act="editb" data-id="${b.id}">Edit</button><button class="btn small danger" data-act="delb" data-id="${b.id}">Delete</button></div></div>`;
    el.innerHTML = `<div class="stack" style="gap:var(--s6)">
<div><h2>Bullet vault</h2><p class="muted" style="max-width:680px">Every result we know about, under each job: ${total} in all. Each tailored resume picks the best few for that job; the rest stay here. Edit anything, add what’s missing. Approved new wordings from your resumes are saved under the line they came from.</p></div>
${p.roles.length ? p.roles.map((r) => { const mains = r.bullets.filter((b) => !b.variantOf); const alts = (id) => r.bullets.filter((b) => b.variantOf === id); return `<section class="card vault-job"><div class="row between"><div><h3>${esc(r.title)} <span class="muted" style="font-weight:500">· ${esc(r.company)}</span></h3><div class="small muted">${esc(fmt(r.start))}${r.end ? ` – ${esc(fmt(r.end))}` : ''}${r.location ? ` · ${esc(r.location)}` : ''} · ${r.bullets.length} bullet${r.bullets.length === 1 ? '' : 's'}</div></div></div>
<div class="stack-s">${mains.map((b) => `${line(b, false)}${alts(b.id).length ? `<div class="vault-alts"><span class="tiny muted">Other wordings (${alts(b.id).length})</span>${alts(b.id).map((x) => line(x, true)).join('')}</div>` : ''}`).join('') || '<p class="small muted">No bullets yet.</p>'}</div>
<div class="row"><input type="text" placeholder="Add a result for this job (real numbers only)" data-addto="${esc(r.company)}" style="flex:1 1 320px"><button class="btn small secondary" data-act="addb" data-company="${esc(r.company)}">Add</button></div></section>`; }).join('') : '<div class="note muted">No jobs yet. Add your resume in Documents and we’ll fill this in.</div>'}
<div id="learned"></div></div>`;
    const edit = (bid) => {
      const row = el.querySelector(`[data-b="${bid}"]`); const t = row.querySelector('.vault-text');
      if (row.querySelector('textarea')) return;
      const ta = document.createElement('textarea'); ta.value = t.textContent; ta.rows = 3; t.replaceWith(ta); ta.focus();
      ta.onblur = async () => { const v = ta.value.trim(); if (v && v !== t.textContent) { await call('profile.updateBullet', { bulletId: bid, text: v }); toast('Saved.'); } repaint(); };
      ta.onkeydown = (e) => { if (e.key === 'Escape') repaint(); };
    };
    el.querySelectorAll('.vault-text').forEach((t) => { t.onclick = () => edit(t.closest('[data-b]').dataset.b); t.onkeydown = (e) => { if (e.key === 'Enter') edit(t.closest('[data-b]').dataset.b); }; });
    on(el, {
      editb: (b) => edit(b.dataset.id),
      delb: (b) => modal('<h2>Delete this bullet?</h2><p class="muted">It won’t be used on future resumes. Resumes you already made don’t change.</p><div class="row"><button class="btn primary" data-yes>Delete</button><button class="btn" data-close>Keep it</button></div>', { onMount: (m, close) => { m.querySelector('[data-yes]').onclick = async () => { await call('profile.removeBullet', { bulletId: b.dataset.id }); close(); repaint(); }; } }),
      addb: async (b) => { const inp = el.querySelector(`[data-addto="${CSS.escape(b.dataset.company)}"]`); const v = inp.value.trim(); if (!v) return toast('Write the result first.', true); await call('profile.addBullet', { company: b.dataset.company, text: v }); toast('Added.'); repaint(); },
    });
    await TAB.learned(el.querySelector('#learned'), app, repaint);
  },
  async learned(el, app, repaint) {
    const l = await call('learning.get');
    el.innerHTML = `<section class="card featured"><h2>What we’ve learned</h2><p class="muted">From ${l.summary.yes} yes, ${l.summary.no} no and ${l.summary.edits} edits. Every rule is plain language: turn any off, or delete it. ${l.lastReview ? `Last review ${esc(ago(l.lastReview))}.` : ''}</p>
${l.rules.length ? `<div class="list">${l.rules.map((r) => `<div class="item"><label class="radio" style="border:0;padding:0;background:none"><input type="checkbox" data-rule="${r.id}" ${r.active !== false ? 'checked' : ''} aria-label="Use this rule"></label><div class="grow"><div style="font-weight:500">${esc(r.text)}</div><div class="small muted">${{ auto: 'Learned from your choices', review: 'From a weekly review', you: 'You told us' }[r.source] || ''} · ${esc(ago(r.created))}</div></div><button class="btn small danger" data-act="del" data-id="${r.id}">Delete</button></div>`).join('')}</div>` : '<p class="muted">Nothing yet. Rate jobs and edit drafts and we’ll start picking things up.</p>'}
<div class="row"><input type="text" id="rule" placeholder="Tell us a rule, e.g. No jobs that need a car" style="flex:1 1 300px"><button class="btn" data-act="add">Add</button><button class="btn secondary" data-act="review" data-busy="Looking for patterns…">Look for new patterns</button></div></section>
${l.edits.length ? `<section class="card"><h2>Your recent edits</h2><p class="muted small">We use these as examples next time we write for you.</p>${l.edits.map((e) => `<div class="stack-s" style="border-top:1px solid var(--line);padding-top:10px"><span class="small muted"><s>${esc(e.before)}</s></span><span class="small">${esc(e.after)}</span></div>`).join('')}</section>` : ''}`;
    el.querySelectorAll('[data-rule]').forEach((c) => (c.onchange = () => call('learning.toggle', { id: c.dataset.rule, active: c.checked }).then(() => toast(c.checked ? 'Rule on.' : 'Rule off.'))));
    on(el, {
      del: async (b) => { await call('learning.remove', { id: b.dataset.id }); repaint(); },
      add: async () => { const v = el.querySelector('#rule').value.trim(); if (v) { await call('learning.add', { text: v }); repaint(); } },
      review: (b) => act(b, async () => { const r = await call('learning.review'); toast(r.added.length ? `Found ${r.added.length} new pattern${r.added.length > 1 ? 's' : ''}.` : 'No new patterns yet.'); repaint(); }),
    });
  },
  async settings(el, app, repaint) {
    const s = await call('settings.get');
    el.innerHTML = `<section class="card"><h2>Claude</h2><p class="muted small">Job Wizard uses Claude to read and write. <a href="#/help/api-key">Step-by-step help</a></p><div class="row"><a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" class="btn">Sign in to Claude Console to get a key</a></div>
<label class="field">API key<div class="row"><input type="password" id="key" value="${esc(s.claudeKey)}" placeholder="sk-ant-…" style="flex:1 1 300px"><button class="btn secondary" data-act="key" data-busy="Checking…">Save and test</button></div></label><div class="note alert hidden" id="keyerr" role="alert"></div>
<div class="row-l"><label class="field">Writing model<input type="text" id="model" value="${esc(s.model)}"></label><label class="field">Fast model<input type="text" id="fast" value="${esc(s.fastModel)}"></label></div></section>
<section class="card"><h2>Every morning</h2><div class="row-l"><label class="field">Time<select id="hour" style="width:auto">${[5, 6, 7, 8, 9, 10].map((h) => `<option value="${h}" ${h === Number(s.morningHour) ? 'selected' : ''}>${h}:00 AM</option>`).join('')}</select></label><label class="field">How many to get ready<select id="count" style="width:auto">${[1, 2, 3, 5, 8].map((n) => `<option ${n === Number(s.morningCount) ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label class="radio" style="align-self:flex-end"><input type="checkbox" id="mon" ${s.morningOn ? 'checked' : ''}>Turned on</label></div>
${s.lastBatch ? `<p class="small muted">Last run ${esc(ago(s.lastBatch.at))}: ${s.lastBatch.made} made ready.</p>` : ''}</section>`;
    const save = () => call('settings.save', { morningHour: Number(el.querySelector('#hour').value), morningCount: Number(el.querySelector('#count').value), morningOn: el.querySelector('#mon').checked, model: el.querySelector('#model').value, fastModel: el.querySelector('#fast').value }).then(() => toast('Saved.'));
    el.querySelectorAll('#hour,#count,#mon,#model,#fast').forEach((i) => (i.onchange = save));
    on(el, { key: (b) => act(b, async () => { const err = el.querySelector('#keyerr'); err.classList.add('hidden'); try { await call('settings.save', { claudeKey: el.querySelector('#key').value }); await call('settings.testKey'); } catch (e) { err.textContent = e.message; err.classList.remove('hidden'); throw e; } repaint(); app.refresh(); }, { done: 'Claude is connected.' }) });
  },
  async extension(el) {
    const token = await call('ext.token');
    el.innerHTML = `<section class="card featured"><h2>Fill applications in your browser</h2><p class="muted">The Job Wizard extension fills in application forms with your profile and the answers you approved. You check everything and press submit yourself.</p>
<ol class="stack-s" style="margin:0;padding-left:20px">
<li>In Chrome or Edge, open <b>Extensions</b>, turn on <b>Developer mode</b>, press <b>Load unpacked</b>, and pick the <span style="font-family:var(--mono)">extension</span> folder that came with Job Wizard. (A one-click install from the Chrome Web Store is coming.)</li>
<li>Press the Job Wizard icon in your browser toolbar and paste this pairing code:</li></ol>
<div class="row"><input type="text" readonly value="${esc(token)}" id="tok" style="font-family:var(--mono);flex:1 1 320px"><button class="btn" data-act="copy">Copy</button><button class="btn" data-act="reset">Make a new code</button></div>
<p class="small muted">Keep Job Wizard open while you apply; the extension talks to it on this computer only.</p></section>
<section class="card"><h2>What it fills</h2><ul style="margin:0;padding-left:18px"><li>Name, email, phone, location, LinkedIn and website</li><li>Your current title and company</li><li>Answers you saved in Standard answers</li><li>Your resume and cover letter for that job, when Job Wizard made them</li></ul><p class="small muted">It never answers personal questions you haven’t saved an answer for, and it never presses submit.</p></section>`;
    on(el, {
      copy: () => navigator.clipboard.writeText(el.querySelector('#tok').value).then(() => toast('Copied.')),
      reset: async () => { if (confirm('Make a new code? You’ll need to paste it into the extension again.')) { await call('ext.token', { reset: true }); TAB.extension(el); } },
    });
  },
};
void tag; void modal;
