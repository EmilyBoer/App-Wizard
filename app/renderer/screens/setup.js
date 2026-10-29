import { call, esc, tag, chip, radio, act, toast, on, readFiles, dropZone, modal, working, posted, sparkle } from '../lib.js';
import { renderDesigner } from './designer.js';

const STEPS = ['Your account', 'Your materials', 'Your experience', 'Your voice', 'Resume design', 'What you want', 'Job sites', 'Standard answers', 'Rate 10 real jobs', 'All set'];
const MINUTES_LEFT = { 2: 25, 3: 20, 4: 17, 5: 14, 6: 11, 7: 8, 8: 5, 9: 3, 10: 0 };

const KIND = {
  resume: ['Resume', 'good', 'Main source for your experience.'],
  linkedin: ['LinkedIn', 'good', 'Cross-checked with your resumes.'],
  review: ['Review', 'good', 'Used to find results your resume undersells.'],
  portfolio: ['Work sample', 'good', 'Used to find results and skills.'],
  writing: ['Your writing', 'info', 'Used to learn how you write.'],
  personality: ['Personality', 'muted', 'Shapes your voice and interview prep. Never listed as experience.'],
  job_posting: ['Job you want', 'att', 'A job you want, not your experience. Moved to What you want.'],
  other: ['Other', 'muted', 'Kept for reference.'],
};

// These pages edit one part of your setup in depth. They're reached from Profile.
const EDITOR_TITLE = { 2: 'Your files', 3: 'Your experience', 4: 'Your writing style', 5: 'Resume design', 6: 'What you want', 7: 'Companies and job sites', 8: 'Application answers', 9: 'Rate jobs' };

export async function render(root, params, app) {
  const step = Math.min(9, Math.max(2, Number(params[0]) || 3));
  if (step === 2) return app.go('#/documents');
  root.innerHTML = `<div class="page" style="max-width:1040px"><a href="#/profile" class="small">← Profile</a><section class="stack" id="step" style="gap:24px"></section></div>`;
  const el = root.querySelector('#step');
  const ctx = {
    app, el, step,
    head(h1, intro) { return `<div><div class="eyebrow">Profile · ${EDITOR_TITLE[step]}</div><h1>${h1}</h1><p class="muted" style="max-width:680px">${intro}</p></div>`; },
    foot({ next = 'Done' } = {}) { return `<div class="foot"><button class="btn primary big" data-act="next" data-busy="Saving…">${next === 'Continue' || next === 'Continue anyway' ? 'Done' : next}</button><a class="btn" href="#/profile">Back to Profile</a></div>`; },
    async next() { app.go('#/profile'); },
  };
  await STEP_RENDER[step](ctx);
}

// Show one of these pages inside another screen (a Profile tab, or a setup question).
export async function embed(el, step, app, { title = true } = {}) {
  const ctx = {
    app, el, step,
    head(h1, intro) { return title ? `<div><h2>${h1}</h2><p class="muted" style="max-width:680px">${intro}</p></div>` : ''; },
    foot() { return ''; },
    async next() {},
  };
  await STEP_RENDER[step](ctx);
}

const STEP_RENDER = { 2: materials, 3: experience, 4: voice, 5: design, 6: want, 7: sites, 8: answers, 9: rateJobs };

// ---------------- 2. Materials ----------------
async function materials(ctx) {
  const { el } = ctx;
  const paint = async () => {
    const [list, settings] = await Promise.all([call('materials.list'), call('settings.get')]);
    el.innerHTML = `${ctx.head('Toss in everything about your work.', 'Resumes, your LinkedIn, reviews, screenshots. We read it all and sort it. You’ll check what we found on the next step.')}
${settings.hasKey ? '<div class="note good"><b>✓ Claude is connected.</b> Your key is saved. Change it any time in the Claude tab.</div>' : keyCard()}
<section class="drop" id="drop">
  ${sparkle(28)}
  <div style="font-family:var(--display);font-size:22px;font-weight:700">Drop anything here</div>
  <div class="muted">PDF, Word, text, screenshots and photos all work. Messy is fine; we sort it.</div>
  <div class="row"><label class="btn secondary">Choose files<input type="file" multiple class="sr" id="files" accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.gif,.html,.csv,.rtf"></label><button class="btn" data-act="paste">Paste text</button></div>
  <div data-progress="materials" class="small muted" aria-live="polite"></div>
</section>
<section class="card">
  <h2>Add your LinkedIn</h2>
  <p class="muted">We can’t open LinkedIn links: LinkedIn doesn’t allow it. These take a minute and work better anyway.</p>
  <div class="grid">
    <div class="card tight">${tag('Fastest', 'good')}<b>Save your profile as a PDF</b><span class="small muted">On your LinkedIn profile, press <b>More</b>, then <b>Save to PDF</b>. Drop the file here.</span></div>
    <div class="card tight">${tag('Most complete', 'info')}<b>Download your LinkedIn data</b><span class="small muted">Settings, Data privacy, <b>Get a copy of your data</b>. Includes every role, skill and recommendation.</span></div>
    <div class="card tight">${tag('Also fine', 'muted')}<b>Screenshots</b><span class="small muted">Screenshots of your experience section work. We read the words in the image.</span></div>
  </div>
  <div class="note info"><b>Why LinkedIn helps:</b> we compare it with your resumes. Different dates or titles get flagged for you to settle, and things only on LinkedIn get offered as additions. Nothing is added without your OK.</div>
</section>
<section class="card quiet">
  <h2>A good order, if you want one</h2>
  <div class="row">${['Your resume (any version)', 'LinkedIn profile', 'Older resumes', 'Performance reviews', 'Portfolio or work samples', 'Personality tests', 'Anything else'].map((t) => {
    const have = { 'Your resume (any version)': 'resume', 'LinkedIn profile': 'linkedin', 'Performance reviews': 'review', 'Portfolio or work samples': 'portfolio', 'Personality tests': 'personality' }[t];
    return `<span class="chip" aria-pressed="${have && list.some((m) => m.kind === have) ? 'true' : 'false'}" style="cursor:default">${esc(t)}</span>`;
  }).join('')}</div>
  <p class="tiny muted">Add more later, any time. Every new file makes your matches and documents better.</p>
</section>
${list.length ? `<section class="list"><div class="list-head">What you’ve added · ${list.length} file${list.length > 1 ? 's' : ''}</div>${list.map((m) => {
      const [label, kind, note] = KIND[m.kind] || KIND.other;
      return `<div class="item">${m.problem ? tag('Can’t read', 'alert') : tag(label, kind)}<div class="grow"><div>${esc(m.name)}</div><div class="small muted">${esc(m.problem || (m.kind === 'job_posting' ? note : [m.summary, note].filter(Boolean).join('. ').replace(/\.\./g, '.')))}</div></div>
        ${m.problem ? '' : `<label class="small">This is <select data-kind="${m.id}" style="width:auto;padding:4px 8px">${Object.entries(KIND).map(([k, [l]]) => `<option value="${k}" ${k === m.kind ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`}
        <button class="btn small" data-act="remove" data-id="${m.id}" aria-label="Remove ${esc(m.name)}">Remove</button></div>`;
    }).join('')}</section>` : ''}
${ctx.foot({ next: 'Continue: build my work history' })}`;
    dropZone(el.querySelector('#drop'), el.querySelector('#files'), upload);
    el.querySelectorAll('[data-kind]').forEach((s) => (s.onchange = async () => { await call('materials.setKind', { id: s.dataset.kind, kind: s.value }); toast('Updated.'); paint(); }));
    wireKey(el, paint);
  };
  async function upload(files) {
    const prog = el.querySelector('[data-progress]');
    prog.innerHTML = `<span class="spin"></span> Reading ${files.length} file${files.length > 1 ? 's' : ''}…`;
    try {
      const data = await readFiles(files);
      const added = await call('materials.add', { files: data });
      const moved = added.filter((m) => m.kind === 'job_posting').length;
      const bad = added.filter((m) => m.problem);
      toast(`Added ${added.length - bad.length} file${added.length - bad.length === 1 ? '' : 's'}.${moved ? ` ${moved} looked like a job you want; we moved it to What you want.` : ''}${bad.length ? ` ${bad.length} couldn’t be read.` : ''}`);
    } catch (e) { toast(e.message, true); }
    paint();
  }
  on(el, {
    paste: () => modal(`<h2>Paste text</h2><p class="muted">Paste a resume, your LinkedIn About and Experience sections, a review, anything.</p><label class="field">Name it (optional)<input type="text" id="pname" placeholder="e.g. LinkedIn experience"></label><textarea id="ptext" style="min-height:220px"></textarea><div class="row"><button class="btn primary" id="padd">Add</button><button class="btn" data-close>Cancel</button></div>`, {
      onMount: (m, close) => { m.querySelector('#padd').onclick = (e) => act(e.target, async () => { const text = m.querySelector('#ptext').value.trim(); if (!text) throw new Error('Paste something first.'); await call('materials.add', { text, name: (m.querySelector('#pname').value.trim() || 'Pasted text') + '.txt' }); close(); paint(); }, { done: 'Added.' }); },
    }),
    remove: async (b) => { await call('materials.remove', { id: b.dataset.id }); paint(); },
    next: (b) => act(b, async () => {
      const list = await call('materials.list');
      if (list.some((m) => ['resume', 'linkedin'].includes(m.kind))) { b.dataset.busy = 'Building your work history…'; await call('profile.build'); }
      else if (!confirm('You haven’t added a resume or your LinkedIn yet. Continue anyway? You can add your experience by hand on the next step.')) return;
      await ctx.next();
    }),
  });
  await paint();
}

function keyCard() {
  return `<section class="card featured" id="keycard"><h2>First: connect Claude</h2><p class="muted">We use Claude to read your files and write. During testing, paste your own Claude API key. <a href="#/help/api-key">How to get one</a></p>
<div class="row"><a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" class="btn">Sign in to Claude Console to get a key</a><span class="small muted">Sign in, press Create Key, copy it, and paste it here.</span></div>
<div class="row"><input type="password" id="key" placeholder="sk-ant-…" style="flex:1 1 280px"><button class="btn secondary" data-act="savekey" data-busy="Checking…">Save and test</button></div><div class="note alert hidden" id="keyerr" role="alert"></div></section>`;
}
function wireKey(el, after) {
  on(el.querySelector('#keycard') || document.createElement('div'), {
    savekey: (b) => act(b, async () => { const err = el.querySelector('#keyerr'); err.classList.add('hidden'); try { await call('settings.save', { claudeKey: el.querySelector('#key').value }); await call('settings.testKey'); } catch (e) { err.textContent = e.message; err.classList.remove('hidden'); throw e; } after(); }, { done: 'Claude is connected.' }),
  });
}

// ---------------- 3. Experience ----------------
async function experience(ctx) {
  const { el } = ctx;
  window.__materials = await call('materials.list');
  const paint = async () => {
    const p = await call('profile.get');
    const conflicts = p.conflicts.filter((c) => c.chosen == null);
    const under = p.underselling.filter((u) => u.status === 'pending');
    const c = p.contact || {};
    el.innerHTML = `${ctx.head('Here’s what we found. Is it right?', 'We put your files together into one work history. Settle anything that doesn’t match, and say yes to anything we found that’s true.')}
<div class="note good"><b>Our promise:</b> everything we write for you comes from this page. We reword and reorder; we never invent jobs, dates, numbers or skills.</div>
${!p.roles.length ? `<div class="empty"><h2>No work history yet</h2><p class="muted">Add files on the last step, or add your roles by hand.</p><div class="row"><a class="btn secondary" href="#/setup/2">Add files</a><button class="btn" data-act="addrole">Add a role</button><button class="btn" data-act="rebuild" data-busy="Building…">Build from my files</button></div></div>` : ''}
${conflicts.length ? `<section class="card featured"><h2>${conflicts.length} thing${conflicts.length > 1 ? 's' : ''} to settle</h2><p class="muted">Your files don’t agree. Pick what’s true.</p>
${conflicts.map((k) => `<div class="stack-s" data-conflict="${k.id}"><b class="small">${esc(k.label)}</b><div class="row">${k.options.map((o, i) => radio(k.id, o.value, `${o.value} (${srcName(o.source)})`, i === 0)).join('')}<label class="radio"><input type="radio" name="${k.id}" value="__other">Something else</label><input type="text" class="hidden" placeholder="Type it" style="width:200px"><button class="btn small secondary" data-act="settle" data-id="${k.id}">Save</button></div></div>`).join('')}</section>` : ''}
${under.length ? `<section class="card"><h2>We think you might be underselling these</h2><p class="muted">Found in your other files but not on your resume. Is each one true?</p>
${under.map((u) => `<div class="item" style="padding:12px 0"><div class="grow"><div>${esc(u.text)}</div><div class="small muted">Found in: ${esc(srcName(u.source))}${u.company ? ` · ${esc(u.company)}` : ''}</div></div><div class="row"><button class="btn small secondary" data-act="under" data-id="${u.id}" data-d="added">Yes, add it</button><button class="btn small" data-act="underedit" data-id="${u.id}" data-text="${esc(u.text)}">Not quite</button><button class="btn small" data-act="under" data-id="${u.id}" data-d="no">No</button></div></div>`).join('')}
<p class="tiny muted">“Not quite” lets you fix the wording or the number. We never guess numbers.</p></section>` : ''}
${p.roles.length ? `<section class="list"><div class="list-head row between"><span>Your work history · ${p.roles.length} role${p.roles.length > 1 ? 's' : ''}</span><button class="btn small" data-act="addrole">Add a role</button></div>
${p.roles.map((r) => `<details class="item" style="display:block"><summary class="row" style="cursor:pointer;list-style:none">${tag(r.end && !/present/i.test(r.end) ? `${String(r.start || '').slice(0, 4)}–${String(r.end).slice(0, 4)}` : 'Current', /present/i.test(r.end || '') ? 'good' : 'muted')}<span class="grow"><b>${esc(r.title)}</b> · ${esc(r.company)}<span class="small muted"> · ${r.bullets.length} results</span></span><span class="btn small">Review</span></summary>
<div class="stack-s" style="margin-top:12px">
  <div class="row"><input type="text" value="${esc(r.title)}" data-role="${r.id}" data-f="title" style="flex:1 1 200px" aria-label="Title"><input type="text" value="${esc(r.company)}" data-role="${r.id}" data-f="company" style="flex:1 1 200px" aria-label="Company"><input type="text" value="${esc(r.start)}" data-role="${r.id}" data-f="start" style="width:110px" aria-label="Start (YYYY-MM)"><input type="text" value="${esc(r.end)}" data-role="${r.id}" data-f="end" style="width:110px" aria-label="End (YYYY-MM or present)"></div>
  ${r.bullets.map((b) => `<div class="row"><textarea data-bullet="${b.id}" style="min-height:44px;flex:1 1 300px">${esc(b.text)}</textarea><button class="btn small danger" data-act="delbullet" data-id="${b.id}" aria-label="Delete line">Delete</button></div>`).join('')}
  <div class="row"><button class="btn small" data-act="addbullet" data-company="${esc(r.company)}">Add a result</button><button class="btn small danger" data-act="delrole" data-id="${r.id}">Remove role</button></div>
</div></details>`).join('')}</section>` : ''}
<section class="card"><h2>Skills we found</h2><div class="row">${p.skills.map((s) => `<button class="chip" aria-pressed="true" data-act="delskill" data-name="${esc(s.name)}" title="From: ${esc((s.sources || []).map(srcName).join(', '))}. Click to remove.">${esc(s.name)} ×</button>`).join('')}<input type="text" id="skill" placeholder="Add a skill" style="width:200px"></div><p class="tiny muted">Hover a skill to see where it came from. Click to remove it.</p></section>
<section class="card"><h2>Contact details</h2><div class="grid">${[['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['location', 'City, State'], ['linkedin', 'LinkedIn link'], ['website', 'Website or portfolio']].map(([k, l]) => `<label class="field">${l}<input type="text" data-contact="${k}" value="${esc(c[k] || '')}"></label>`).join('')}</div></section>
<section class="card"><h2>Education</h2>${p.education.map((e) => `<div class="row between"><span>${esc([e.degree, e.field].filter(Boolean).join(', '))} · ${esc(e.school)} ${esc(e.year || '')}</span><button class="btn small danger" data-act="deledu" data-id="${e.id}">Remove</button></div>`).join('') || '<p class="muted small">None yet.</p>'}<button class="btn small" data-act="addedu" style="align-self:flex-start">Add education</button></section>
${ctx.foot()}`;
    el.querySelectorAll('[data-conflict] input[type=radio]').forEach((r) => (r.onchange = () => r.closest('.row').querySelector('input[type=text]').classList.toggle('hidden', r.value !== '__other')));
    el.querySelectorAll('[data-bullet]').forEach((t) => (t.onchange = () => call('profile.updateBullet', { bulletId: t.dataset.bullet, text: t.value }).then(() => toast('Saved.'))));
    el.querySelectorAll('[data-role]').forEach((t) => (t.onchange = () => call('profile.updateRole', { roleId: t.dataset.role, [t.dataset.f]: t.value }).then(() => toast('Saved.'))));
    el.querySelectorAll('[data-contact]').forEach((t) => (t.onchange = () => call('profile.setContact', { [t.dataset.contact]: t.value }).then(() => toast('Saved.'))));
    const sk = el.querySelector('#skill'); sk.onkeydown = async (e) => { if (e.key === 'Enter' && sk.value.trim()) { await call('profile.addSkill', { name: sk.value.trim() }); paint(); } };
  };
  on(el, {
    settle: async (b) => {
      const box = el.querySelector(`[data-conflict="${b.dataset.id}"]`);
      let value = box.querySelector('input[type=radio]:checked')?.value;
      if (value === '__other') value = box.querySelector('input[type=text]').value.trim();
      if (!value) return toast('Pick one, or type what’s right.', true);
      await call('profile.settle', { conflictId: b.dataset.id, value }); toast('Settled.'); paint();
    },
    under: async (b) => { await call('profile.undersell', { itemId: b.dataset.id, decision: b.dataset.d }); toast(b.dataset.d === 'added' ? 'Added to your profile.' : 'Left out.'); paint(); },
    underedit: (b) => modal(`<h2>Fix the wording</h2><p class="muted">Change anything that isn’t quite right, especially numbers.</p><textarea id="ut">${esc(b.dataset.text)}</textarea><div class="row"><button class="btn primary" id="usave">Add it</button><button class="btn" data-close>Cancel</button></div>`, { onMount: (m, close) => { m.querySelector('#usave').onclick = async () => { await call('profile.undersell', { itemId: b.dataset.id, decision: 'added', text: m.querySelector('#ut').value }); close(); paint(); }; } }),
    rebuild: (b) => act(b, async () => { await call('profile.build'); paint(); }),
    addrole: () => modal(`<h2>Add a role</h2><div class="grid"><label class="field">Title<input type="text" id="rt"></label><label class="field">Company<input type="text" id="rc"></label><label class="field">Start (YYYY-MM)<input type="text" id="rs" placeholder="2021-03"></label><label class="field">End (YYYY-MM or present)<input type="text" id="re" value="present"></label></div><div class="row"><button class="btn primary" id="radd">Add</button><button class="btn" data-close>Cancel</button></div>`, { onMount: (m, close) => { m.querySelector('#radd').onclick = async () => { await call('profile.addRole', { title: m.querySelector('#rt').value, company: m.querySelector('#rc').value, start: m.querySelector('#rs').value, end: m.querySelector('#re').value }); close(); paint(); }; } }),
    addbullet: (b) => modal(`<h2>Add a result</h2><p class="muted">Something you did at ${esc(b.dataset.company)}. Use real numbers only.</p><textarea id="bt"></textarea><div class="row"><button class="btn primary" id="badd">Add</button><button class="btn" data-close>Cancel</button></div>`, { onMount: (m, close) => { m.querySelector('#badd').onclick = async () => { await call('profile.addBullet', { company: b.dataset.company, text: m.querySelector('#bt').value }); close(); paint(); }; } }),
    delbullet: async (b) => { await call('profile.removeBullet', { bulletId: b.dataset.id }); paint(); },
    delrole: async (b) => { if (confirm('Remove this role from your profile?')) { await call('profile.removeRole', { roleId: b.dataset.id }); paint(); } },
    delskill: async (b) => { await call('profile.removeSkill', { name: b.dataset.name }); paint(); },
    addedu: () => modal(`<h2>Add education</h2><div class="grid"><label class="field">Degree<input type="text" id="ed"></label><label class="field">Field<input type="text" id="ef"></label><label class="field">School<input type="text" id="es"></label><label class="field">Year<input type="text" id="ey"></label></div><div class="row"><button class="btn primary" id="eadd">Add</button><button class="btn" data-close>Cancel</button></div>`, { onMount: (m, close) => { m.querySelector('#eadd').onclick = async () => { await call('profile.addEducation', { degree: m.querySelector('#ed').value, field: m.querySelector('#ef').value, school: m.querySelector('#es').value, year: m.querySelector('#ey').value }); close(); paint(); }; } }),
    deledu: async (b) => { await call('profile.removeEducation', { id: b.dataset.id }); paint(); },
    next: async () => {
      const p = await call('profile.get');
      if (p.conflicts.some((c) => c.chosen == null) && !confirm('There are still things to settle. Continue anyway? We’ll use your resume’s version for now.')) return;
      ctx.next();
    },
  });
  await paint();
}

function srcName(id) {
  if (!id) return 'your files';
  if (id === 'you') return 'you';
  if (id === 'chat') return 'a chat';
  const m = (window.__materials || []).find((x) => x.id === id);
  return m ? m.name : 'another file';
}

// ---------------- 4. Voice ----------------
async function voice(ctx) {
  const { el } = ctx;
  window.__materials = await call('materials.list');
  const paint = async () => {
    const v = await call('voice.get');
    const d = v.dials;
    const dial = (k, l, r) => `<div class="dial"><span class="l">${l}</span><input type="range" min="0" max="4" step="1" value="${d[k]}" data-dial="${k}" aria-label="${l} to ${r}"><span>${r}</span></div>`;
    el.innerHTML = `${ctx.head('Let’s make it sound like you.', 'Cover letters and answers should read like you wrote them on a good day.')}
<section class="card"><h2>Show us how you write</h2><p class="muted">Two or three things you wrote yourself. Cover letters, emails, posts, anything.</p>
${v.samples.map((s) => `<div class="row">${tag('Added', 'good')}<span class="grow">${esc(s.name)} <span class="small muted">· ${esc(s.text.slice(0, 80))}…</span></span><button class="btn small" data-act="delsample" data-id="${s.id}">Remove</button></div>`).join('')}
<div class="row"><button class="btn secondary" data-act="paste">Paste writing</button><label class="btn">Add a file<input type="file" class="sr" id="wfile" accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"></label></div></section>
<section class="card"><h2>Quick dials</h2>${dial('formal', 'Formal', 'Relaxed')}${dial('detail', 'Short', 'Detailed')}${dial('confidence', 'Modest', 'Confident')}${dial('color', 'Plain', 'Colorful')}</section>
<section class="card"><h3>Words or phrases to leave out</h3><p class="small muted" style="margin-top:-8px">We’ll never use these in your letters or answers.</p><div class="leave-out">${v.never.map((w) => `<span class="word">${esc(w)}<button type="button" data-act="delword" data-w="${esc(w)}" aria-label="Remove ${esc(w)}">×</button></span>`).join('')}<input type="text" id="word" placeholder="Add a word or phrase" style="width:220px;font-size:14px;padding:5px 10px"></div></section>
<section class="card featured"><h2>Does this sound like you?</h2>
${v.sampleLine ? `<p class="muted">A line we wrote from your experience, in your voice.</p><blockquote style="margin:0;padding:16px 20px;border-left:4px solid var(--spark);background:var(--panel);border-radius:8px;font-size:18px;line-height:28px">${esc(v.sampleLine)}</blockquote>
${v.sampleRating ? `<div class="note ${v.sampleRating === 'yes' ? 'good' : 'muted'}">${v.sampleRating === 'yes' ? 'Great. We’ll write like this.' : 'Thanks. We’ve noted what to change.'}</div>` : ''}
<div class="row"><button class="btn secondary" data-act="rate" data-r="yes">Sounds like me</button><button class="btn" data-act="close">Close, but…</button><button class="btn" data-act="regen" data-busy="Writing…">Not me, try again</button></div>
<details><summary class="small">What we learned about your voice</summary><ul class="small">${(v.guide || []).map((g) => `<li>${esc(g)}</li>`).join('')}</ul></details>`
    : `<p class="muted">When your samples and dials are set, we’ll write a line for you to check.</p><button class="btn secondary" data-act="regen" data-busy="Writing…" style="align-self:flex-start">Write a sample line</button>`}
</section>
${ctx.foot()}`;
    el.querySelectorAll('[data-dial]').forEach((r) => (r.onchange = () => call('voice.save', { dials: { [r.dataset.dial]: Number(r.value) } })));
    const w = el.querySelector('#word'); w.onkeydown = async (e) => { if (e.key === 'Enter' && w.value.trim()) { await call('voice.save', { never: [...v.never, w.value.trim().toLowerCase()] }); paint(); } };
    el.querySelector('#wfile').onchange = async (e) => { const files = await readFiles(e.target.files); await call('materials.add', { files }); const list = await call('materials.list'); const last = list[list.length - 1]; if (last && last.kind !== 'writing') await call('materials.setKind', { id: last.id, kind: 'writing' }); toast('Added.'); paint(); };
  };
  on(el, {
    paste: () => modal(`<h2>Paste something you wrote</h2><textarea id="wt" style="min-height:220px"></textarea><div class="row"><button class="btn primary" id="wadd">Add</button><button class="btn" data-close>Cancel</button></div>`, { onMount: (m, close) => { m.querySelector('#wadd').onclick = async () => { await call('voice.addSample', { text: m.querySelector('#wt').value }); close(); paint(); }; } }),
    delsample: async (b) => { await call('voice.removeSample', { id: b.dataset.id }); paint(); },
    delword: async (b) => { const v = await call('voice.get'); await call('voice.save', { never: v.never.filter((x) => x !== b.dataset.w) }); paint(); },
    regen: (b) => act(b, async () => { await call('voice.generate'); paint(); }),
    rate: async (b) => { await call('voice.rate', { rating: b.dataset.r }); paint(); },
    close: () => modal(`<h2>What’s off?</h2><p class="muted">Too formal? A word you wouldn’t use? Tell us in your own words.</p><textarea id="cn"></textarea><div class="row"><button class="btn primary" id="cs" data-busy="Trying again…">Try again</button><button class="btn" data-close>Cancel</button></div>`, { onMount: (m, close) => { m.querySelector('#cs').onclick = (e) => act(e.target, async () => { await call('voice.rate', { rating: 'close', note: m.querySelector('#cn').value }); await call('voice.generate'); close(); paint(); }); } }),
    next: () => ctx.next(),
  });
  await paint();
}

// ---------------- 5. Resume design ----------------
async function design(ctx) {
  const { el } = ctx;
  el.innerHTML = `${ctx.head('How should your resume look?', 'Pick a template, then change anything: layout, sidebar, section order, colors, fonts and spacing. Every resume we make for you uses this design.')}<div id="dz"></div>${ctx.foot()}`;
  await renderDesigner(el.querySelector('#dz'), { dark: document.body.classList.contains('building') });
  on(el, { next: () => ctx.next() });
}

// ---------------- 6. What you want ----------------
async function want(ctx) {
  const { el } = ctx;
  const opts = await call('want.options');
  const paint = async () => {
    const w = await call('want.get');
    const where = w.where || [];
    const hybrid = where.find((x) => /hybrid/i.test(x)) || '';
    el.innerHTML = `${ctx.head('What job are you looking for?', 'The more we understand, the fewer wrong jobs you’ll see. Start with real jobs you like; we’ll work out the rest with you.')}
<section class="card featured"><h2>Paste 2 to 5 jobs you’d apply to tomorrow</h2><p class="muted">Real postings you like. These teach us what you want; they’re never treated as your experience.</p>
<div class="row"><textarea id="ex" placeholder="Paste a job link or the job’s text" style="flex:1 1 320px;min-height:48px"></textarea><button class="btn secondary" data-act="addex" data-busy="Reading…">Add</button></div>
${w.examples.map((x) => `<div class="item" style="padding:10px 0">${tag('Added', 'good')}<div class="grow"><div>${esc(x.title || 'Job')}${x.company ? ` · ${esc(x.company)}` : ''}</div><div class="small muted">${x.from ? 'Moved here from your files.' : x.url ? 'From a link.' : 'Pasted text.'}</div></div><button class="btn small" data-act="delex" data-id="${x.id}">Remove</button></div>`).join('')}
${w.summary ? `<div class="note info"><b>${esc(w.summary)}</b></div>` : ''}
<button class="btn ${w.summary ? '' : 'secondary'}" data-act="analyze" data-busy="Reading your jobs…" style="align-self:flex-start">${w.summary ? 'Look again' : 'Find what these have in common'}</button></section>
<section class="card"><h2>Job titles you’d say yes to</h2>
<div class="row">${w.titles.map((t) => `<button class="chip" aria-pressed="true" data-act="deltitle" data-t="${esc(t)}">${esc(t)} ×</button>`).join('')}<input type="text" id="title" placeholder="Add a title, press Enter" style="width:240px"></div>
${(w.suggestedTitles || []).filter((s) => s.accepted == null).length ? `<b class="small">Based on your experience, you might also fit:</b><div class="row">${w.suggestedTitles.filter((s) => s.accepted == null).map((s) => `<span class="chip suggest">${esc(s.title)} <button class="btn small" data-act="sugg" data-t="${esc(s.title)}" data-v="1" style="color:var(--good)">Yes</button><button class="btn small" data-act="sugg" data-t="${esc(s.title)}" data-v="0">No</button></span>`).join('')}</div>` : ''}</section>
<section class="card"><h2>What should most of your day be?</h2><p class="muted">Pick your top 2, most important first. Titles mean different things at different places; this is how we tell.</p>
<div class="grid-s">${opts.workTypes.map((t) => { const i = w.work.indexOf(t); return `<button class="pick ${i >= 0 ? 'on' : ''}" data-act="work" data-t="${esc(t)}"><span class="row"><b>${esc(t)}</b>${i >= 0 ? tag(`#${i + 1}`, 'spark') : ''}</span><span class="small muted">${esc(WORK_NOTES[t] || '')}</span></button>`; }).join('')}</div></section>
${(w.ambiguous || []).length ? `<section class="card featured"><h2>Quick check: words that mean two things</h2><p class="muted">Job posts use some words in different ways. Tell us which one you mean.</p>
${w.ambiguous.map((a, i) => `<div class="stack-s"><b class="small">“${esc(a.word)}”</b><div class="row">${[...a.meanings, 'Both', 'Neither, skip these'].map((m) => radio(`amb${i}`, m === 'Both' ? 'both' : m.startsWith('Neither') ? 'skip' : m, m, a.choice === (m === 'Both' ? 'both' : m.startsWith('Neither') ? 'skip' : m))).join('')}</div></div>`).join('')}</section>` : ''}
<section class="card"><h2>What kind of place?</h2><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:8px">${opts.employerTypes.map((t) => `<div class="tri"><b class="small">${esc(t)}</b><span class="opts">${['Love', 'Fine', 'Avoid'].map((o) => `<button class="${o} ${(w.places[t] || 'Fine') === o ? 'on' : ''}" data-act="place" data-t="${esc(t)}" data-o="${o}" aria-pressed="${(w.places[t] || 'Fine') === o}">${o}</button>`).join('')}</span></div>`).join('')}</div></section>
<section class="card"><h2>Must-haves and deal-breakers</h2>
<div class="grid">
<label class="field">Lowest pay you’d take (per year)<input type="number" id="pay" min="0" step="1000" value="${w.payFloor || ''}" placeholder="85000"><span class="tiny muted" style="font-weight:400">Jobs that don’t list pay still show, marked “pay not listed.”</span></label>
<div class="stack-s"><b class="small">Where</b><div class="row">${chip('Remote', where.includes('Remote'), 'data-act="where" data-v="Remote"')}${chip('On-site', where.includes('On-site'), 'data-act="where" data-v="On-site"')}</div><input type="text" id="hybrid" placeholder="Hybrid or on-site near… (e.g. Portland, OR)" value="${esc(hybrid.replace(/^hybrid near\s*/i, ''))}"></div>
<div class="stack-s"><b class="small">Level</b><div class="row">${['Mid', 'Senior', 'Lead', 'Manager', 'Director'].map((l) => chip(l, w.level.includes(l), `data-act="toggle" data-k="level" data-v="${l}"`)).join('')}</div></div>
<div class="stack-s"><b class="small">Job type</b><div class="row">${['Full-time', 'Contract', 'Part-time'].map((l) => chip(l, w.jobType.includes(l), `data-act="toggle" data-k="jobType" data-v="${l}"`)).join('')}</div></div>
</div>
<b class="small">Never show me jobs with:</b><div class="row">${[...new Set([...opts.dealBreakers, ...w.dealBreakers])].map((l) => chip(l, w.dealBreakers.includes(l), `data-act="toggle" data-k="dealBreakers" data-v="${esc(l)}"`)).join('')}<input type="text" id="deal" placeholder="Add your own" style="width:200px"></div></section>
${ctx.foot()}`;
    const title = el.querySelector('#title'); title.onkeydown = async (e) => { if (e.key === 'Enter' && title.value.trim()) { await call('want.save', { titles: [...w.titles, title.value.trim()] }); paint(); } };
    const deal = el.querySelector('#deal'); deal.onkeydown = async (e) => { if (e.key === 'Enter' && deal.value.trim()) { await call('want.save', { dealBreakers: [...w.dealBreakers, deal.value.trim()] }); paint(); } };
    el.querySelector('#pay').onchange = (e) => call('want.save', { payFloor: Number(e.target.value) || null }).then(() => toast('Saved.'));
    el.querySelector('#hybrid').onchange = (e) => { const v = e.target.value.trim(); const rest = where.filter((x) => !/hybrid/i.test(x)); call('want.save', { where: v ? [...rest, `Hybrid near ${v}`] : rest }).then(() => toast('Saved.')); };
    el.querySelectorAll('input[name^=amb]').forEach((r) => (r.onchange = async () => { const i = Number(r.name.slice(3)); w.ambiguous[i].choice = r.value; await call('want.save', { ambiguous: w.ambiguous }); toast('Got it.'); }));
    ctx.w = w;
  };
  on(el, {
    addex: (b) => act(b, async () => { await call('want.addExample', { input: el.querySelector('#ex').value }); paint(); }),
    delex: async (b) => { await call('want.removeExample', { id: b.dataset.id }); paint(); },
    analyze: (b) => act(b, async () => { await call('want.analyze'); paint(); }),
    deltitle: async (b) => { await call('want.save', { titles: ctx.w.titles.filter((t) => t !== b.dataset.t) }); paint(); },
    sugg: async (b) => { const s = ctx.w.suggestedTitles.map((x) => (x.title === b.dataset.t ? { ...x, accepted: b.dataset.v === '1' } : x)); await call('want.save', { suggestedTitles: s, ...(b.dataset.v === '1' ? { titles: [...ctx.w.titles, b.dataset.t] } : {}) }); paint(); },
    work: async (b) => { let work = [...ctx.w.work]; const t = b.dataset.t; work = work.includes(t) ? work.filter((x) => x !== t) : [...work, t].slice(-2); await call('want.save', { work }); paint(); },
    place: async (b) => { await call('want.save', { places: { ...ctx.w.places, [b.dataset.t]: b.dataset.o } }); paint(); },
    where: async (b) => { const v = b.dataset.v; const where = ctx.w.where.includes(v) ? ctx.w.where.filter((x) => x !== v) : [...ctx.w.where, v]; await call('want.save', { where }); paint(); },
    toggle: async (b) => { const k = b.dataset.k, v = b.dataset.v; const cur = ctx.w[k] || []; await call('want.save', { [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] }); paint(); },
    next: async () => { const w = await call('want.get'); if (!w.titles.length && !w.examples.length) return toast('Add at least one job title or example job so we know what to look for.', true); ctx.next(); },
  });
  await paint();
}
const WORK_NOTES = { 'Writing and editing': 'Making the words.', 'Running the website': 'Pages, content system, launches.', 'Strategy and planning': 'Deciding what to make and why.', 'Managing people': 'Leading a team.', 'Fundraising and grants': 'Asking for money, writing grants.', 'Social media': 'Posting and community.' };

// ---------------- 7. Job sites ----------------
async function sites(ctx) {
  const { el } = ctx;
  const presets = await call('sites.presets');
  const paint = async () => {
    const list = await call('sites.list');
    const cats = [...new Set(presets.options.map((o) => o.category))];
    const STATUS = { board: ['Ready', 'good', 'We read their open jobs directly, every day.'], webpage: ['Ready', 'good', 'We read the jobs on this page every day.'], alerts: ['One step', 'att', null], unsupported: ['Not yet', 'muted', null] };
    el.innerHTML = `${ctx.head(esc(presets.question), esc(presets.help))}
<section class="stack">${cats.map((c) => `<div><b class="small">${esc(c)}</b><div class="row" style="margin-top:8px">${presets.options.filter((o) => o.category === c).map((o) => { const s = list.find((x) => x.input === o.url); return chip(o.name, Boolean(s), `data-act="preset" data-url="${esc(o.url)}" data-name="${esc(o.name)}" data-id="${s?.id || ''}"`); }).join('')}</div></div>`).join('')}</section>
<section class="stack-s"><label class="small" for="site"><b>${esc(presets.fieldLabel)}</b></label><div class="row" style="max-width:680px"><input type="url" id="site" placeholder="${esc(presets.fieldPlaceholder)}" style="flex:1 1 280px"><button class="btn secondary" data-act="add" data-busy="Checking…">Add</button></div><span class="small muted">Tip: company career pages work best. Find a company you like, open its Careers page, and paste the link.</span></section>
${list.length ? `<section class="list"><div class="list-head">Your job sites</div>${list.map((s) => { const [l, k, n] = STATUS[s.kind] || STATUS.unsupported; return `<div class="item">${tag(l, k)}<div class="grow"><div>${esc(s.name || s.label)}</div><div class="small muted">${esc(n || s.suggestion || '')}${s.kind === 'alerts' ? ' <a href="#/help/alerts">Show me how</a>' : ''}</div></div><button class="btn small" data-act="del" data-id="${s.id}">Remove</button></div>`; }).join('')}</section>` : ''}
${ctx.foot()}`;
    el.querySelector('#site').onkeydown = (e) => { if (e.key === 'Enter') el.querySelector('[data-act=add]').click(); };
  };
  on(el, {
    preset: async (b) => { if (b.dataset.id) await call('sites.remove', { id: b.dataset.id }); else await act(b, () => call('sites.add', { url: b.dataset.url, name: b.dataset.name })); paint(); },
    add: (b) => act(b, async () => { const url = el.querySelector('#site').value.trim(); if (!url) throw new Error('Paste a website first.'); const r = await call('sites.add', { url }); toast(r.kind === 'board' || r.kind === 'webpage' ? 'We can read this one.' : r.suggestion || 'Added.'); paint(); }),
    del: async (b) => { await call('sites.remove', { id: b.dataset.id }); paint(); },
    next: () => ctx.next(),
  });
  await paint();
}

// ---------------- 8. Standard answers ----------------
async function answers(ctx) {
  const { el } = ctx;
  const list = await call('answers.get');
  el.innerHTML = `${ctx.head('The questions every application asks.', 'Answer once; we use these when filling applications. Personal ones are yours to decide, and we never answer them without you. Leave any blank to answer each time.')}
<section class="card">${list.map((q) => `<label class="field">${esc(q.question)}${q.personal ? ' <span class="tag muted" style="align-self:flex-start">Personal</span>' : ''}
${q.type === 'choice' ? `<select data-key="${q.key}" data-q="${esc(q.question)}"><option value="">Ask me each time</option>${q.options.map((o) => `<option ${o === q.answer ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>` : `<input type="text" data-key="${q.key}" data-q="${esc(q.question)}" value="${esc(q.answer)}" placeholder="${q.key === 'salary' ? 'e.g. $95,000 to $110,000, depending on the full package' : 'Ask me each time'}">`}</label>`).join('')}</section>
${ctx.foot()}`;
  el.querySelectorAll('[data-key]').forEach((i) => (i.onchange = () => call('answers.save', { key: i.dataset.key, question: i.dataset.q, answer: i.value }).then(() => toast('Saved.'))));
  on(el, { next: () => ctx.next() });
}

// ---------------- 9. Rate 10 real jobs ----------------
const NO_REASONS = ['Wrong kind of work', 'Too junior', 'Too senior', 'Pay too low', 'Location', 'Type of employer', 'Title was misleading', 'Something else'];
async function rateJobs(ctx) {
  const { el } = ctx;
  let pendingNo = null;
  const paint = async () => {
    const { jobs, learned } = await call('jobs.sample', { count: 10 });
    const rated = jobs.filter((j) => j.rated);
    const current = jobs.find((j) => !j.rated);
    const bar = Array.from({ length: 10 }, (_, i) => `<span class="${jobs[i]?.rated || (jobs[i] && jobs[i] === current ? 'now' : '')}"></span>`).join('');
    el.innerHTML = `${ctx.head('Rate 10 real jobs.', 'We found these with what you’ve told us. Your yes and no answers teach us what fits before your first morning.')}
${!jobs.length ? `<div class="empty"><h2>Let’s find your first jobs</h2><p class="muted">We’ll check your job sites now.</p><button class="btn primary" data-act="fetch" data-busy="Checking your job sites…">Find my jobs</button><span data-progress="jobs" class="small muted"></span></div>` : `
<div class="stack-s"><div class="row"><b>${rated.length} of ${Math.min(10, jobs.length)}</b><span class="small muted">Every job here is live: we checked it’s open today.</span></div><div class="progress">${bar}</div></div>
${rated.slice(-2).map((j) => jobCard(j)).join('')}
${current ? jobCard(current, true, pendingNo === current.id) : '<div class="note good">All rated. Nice work.</div>'}
<section class="card quiet"><h2>What we’ve learned so far</h2>${learned.length ? learned.map((t) => `<div class="row" style="align-items:flex-start;flex-wrap:nowrap"><span style="color:var(--spark)">✦</span><span>${esc(t)}</span></div>`).join('') : '<p class="muted">Rate a few jobs and we’ll show you what we’re picking up.</p>'}
<p class="tiny muted">This keeps going after setup: every time you skip or save a job, your matches get sharper. See it any time in Profile.</p></section>`}
${ctx.foot({ next: rated.length >= Math.min(10, jobs.length) && jobs.length ? 'Continue' : 'Continue anyway' })}`;
  };
  function jobCard(j, live, askingNo) {
    const stateTag = j.rated === 'yes' ? tag('Yes, I’d apply', 'good') : j.rated === 'no' ? tag('No', 'alert') : j.rated === 'maybe' ? tag('Maybe', 'info') : '';
    return `<section class="card ${live ? 'featured' : ''}"><div class="row between" style="align-items:flex-start"><div class="grow"><div style="font-family:var(--display);font-size:20px;font-weight:700">${esc(j.title)}</div><div class="muted">${esc([j.company, j.location, j.pay, posted(j)].filter(Boolean).join(' · '))}</div></div>${stateTag}</div>
<div><b>Why we picked it:</b> ${esc(j.why || (j.scoreReasons || []).join('; ').toLowerCase() || 'it matches your titles and work.')}</div>
${j.rated === 'no' && j.ratedReasons?.length ? `<div class="row">${j.ratedReasons.map((r) => chip(r, true)).join('')}</div>` : ''}
${live && !askingNo ? `<div class="row"><button class="btn primary" data-act="rate" data-id="${j.id}" data-v="yes">Yes, I’d apply</button><button class="btn secondary" data-act="rate" data-id="${j.id}" data-v="maybe">Maybe</button><button class="btn" data-act="no" data-id="${j.id}">No</button>${j.url ? `<a class="small" href="${esc(j.url)}" target="_blank" rel="noopener">Read the full post</a>` : ''}</div>` : ''}
${askingNo ? `<b class="small">Why not? Pick any.</b><div class="row" id="reasons">${NO_REASONS.map((r) => chip(r, false, `data-act="reason"`)).join('')}</div><div class="row"><button class="btn primary" data-act="rate" data-id="${j.id}" data-v="no">Save</button><button class="btn" data-act="cancelno">Cancel</button></div>` : ''}</section>`;
  }
  on(el, {
    fetch: (b) => act(b, async () => { const r = await call('jobs.refresh'); toast(`Found ${r.kept} matching jobs.`); paint(); }),
    no: (b) => { pendingNo = b.dataset.id; paint(); },
    cancelno: () => { pendingNo = null; paint(); },
    reason: (b) => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'),
    rate: async (b) => {
      const reasons = [...el.querySelectorAll('#reasons [aria-pressed=true]')].map((x) => x.textContent.replace(/^✓\s*/, ''));
      const r = await call('jobs.rate', { id: b.dataset.id, value: b.dataset.v, reasons });
      await call('jobs.markSetupRated', { id: b.dataset.id });
      pendingNo = null;
      if (r.newRules?.length) toast(`Learned: ${r.newRules[0].text}`);
      paint();
    },
    next: () => ctx.next(),
  });
  await paint();
}

// ---------------- 10. All set ----------------
async function allSet(ctx) {
  const { el, app } = ctx;
  const [s, o] = await Promise.all([call('settings.get'), call('app.overview')]);
  el.innerHTML = `${ctx.head('You’re all set.', 'From here on, we do the hunting. You do the deciding.')}
<section class="card featured"><h2>Every morning</h2><p class="muted">We check your job sites, find new matches, and get a resume and cover letter ready for the best ones. The app needs to be open (it can sit in the background).</p>
<div class="row-l"><label class="field">Time<select id="hour" style="width:auto">${[5, 6, 7, 8, 9, 10].map((h) => `<option value="${h}" ${h === Number(s.morningHour) ? 'selected' : ''}>${h}:00 AM</option>`).join('')}</select></label>
<label class="field">How many to get ready<select id="count" style="width:auto">${[1, 2, 3, 5, 8].map((n) => `<option ${n === Number(s.morningCount) ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
<label class="radio" style="align-self:flex-end"><input type="checkbox" id="mon" ${s.morningOn ? 'checked' : ''}>Turned on</label></div></section>
<div class="grid">
<div class="card tight">${sparkle(18)}<b>Check what’s ready</b><span class="small muted">Your Journey page shows new matches and applications ready to send.</span></div>
<div class="card tight">${sparkle(18)}<b>Apply in your browser</b><span class="small muted">The Margo extension fills in forms. You check and press submit. <a href="#/help/extension">Set it up</a></span></div>
<div class="card tight">${sparkle(18)}<b>Keep teaching it</b><span class="small muted">Every yes, no and edit makes it smarter. ${o.learning.rules} rule${o.learning.rules === 1 ? '' : 's'} learned so far.</span></div>
</div>
<div class="foot"><button class="btn" data-act="back">Back</button><button class="btn primary big" data-act="finish" data-busy="Getting your first applications ready…">Go to my Journey</button><button class="btn" data-act="batch" data-busy="Working…">Get my first applications ready now</button><span data-progress class="small muted"></span></div>`;
  const save = () => call('settings.save', { morningHour: Number(el.querySelector('#hour').value), morningCount: Number(el.querySelector('#count').value), morningOn: el.querySelector('#mon').checked });
  el.querySelectorAll('select, input').forEach((i) => (i.onchange = save));
  on(el, {
    finish: async () => { await call('setup.done', { step: 10 }); app.go('#/dashboard'); },
    batch: (b) => act(b, async () => { await call('setup.done', { step: 10 }); const r = await call('batch.run', { reason: 'setup' }); toast(`${r.made} application${r.made === 1 ? '' : 's'} ready.`); app.go('#/dashboard'); }),
  });
}

export { STEPS };
void working;
