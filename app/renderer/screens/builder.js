// Setup, TurboTax-style: one question per screen on first sign-in.
// The answers build "Your setup", where every choice can be changed later.
import { call, esc, tag, chip, radio, act, toast, on, readFiles, dropZone, modal, posted, sparkle, working } from '../lib.js';

const KIND = { resume: ['Resume', 'good'], linkedin: ['LinkedIn', 'good'], review: ['Review', 'good'], portfolio: ['Work sample', 'good'], writing: ['Your writing', 'info'], personality: ['Personality', 'muted'], job_posting: ['Job you want', 'att'], other: ['Other', 'muted'] };
const NO_REASONS = ['Wrong kind of work', 'Too junior', 'Too senior', 'Pay too low', 'Location', 'Type of employer', 'Title was misleading', 'Something else'];
const RATE_TARGET = 10;

// Each question: id, ask (the headline), help, when(st) to include it, body(st, ui), mount(el, st, ui), next(el, st) → false to stay, skip text.
const Q = [
  { id: 'resume', ask: 'Let’s start with your resumes. All of them.', help: 'Drop in every resume you have: old ones, different versions, ones made for different jobs. We put them all together to learn your full work history and how you write. Your LinkedIn PDF and reviews help too.',
    body: (st) => `<section class="drop" id="drop">${sparkle(28)}<div style="font-family:var(--display);font-size:22px;font-weight:700">Drop your resumes here</div><div class="muted small">As many as you have. PDF, Word, text or screenshots.</div><label class="btn secondary">Choose files<input type="file" multiple class="sr" id="files" accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp"></label><div data-progress="materials" class="small muted" aria-live="polite"></div></section>
${st.materials.length ? `<div class="list">${st.materials.map((m) => `<div class="item">${m.problem ? tag('Can’t read', 'alert') : tag((KIND[m.kind] || KIND.other)[0], (KIND[m.kind] || KIND.other)[1])}<div class="grow"><div>${esc(m.name)}</div><div class="small muted">${esc(m.problem || m.summary || '')}</div></div><button class="btn small" data-act="rmfile" data-id="${m.id}">Remove</button></div>`).join('')}</div>` : ''}
${st.materials.length ? `<p class="small"><b>${st.materials.length} file${st.materials.length === 1 ? '' : 's'} added.</b> ${st.materials.length < 3 ? 'Got more? Older or different versions help.' : 'Great, the more the better.'}</p>` : ''}
<p class="tiny muted">LinkedIn: on your profile, press More, then Save to PDF. We can’t open LinkedIn links ourselves.</p>`,
    mount(el, st, ui) {
      dropZone(el.querySelector('#drop'), el.querySelector('#files'), async (files) => {
        el.querySelector('[data-progress]').innerHTML = `<span class="spin"></span> Reading ${files.length} file${files.length > 1 ? 's' : ''}…`;
        try { const added = await call('materials.add', { files: await readFiles(files), defer: true }); const moved = added.filter((m) => m.kind === 'job_posting').length; if (moved) toast(`${moved} file${moved > 1 ? 's' : ''} looked like a job posting, so we saved it as a job you want.`); } catch (e) { toast(e.message, true); }
        ui.repaint();
      });
      on(el, { rmfile: async (b) => { await call('materials.remove', { id: b.dataset.id }); ui.repaint(); } });
    },
    next(el, st) { if (!st.hasResume) { toast('Add at least one resume or your LinkedIn PDF to continue.', true); return false; } call('builder.prepareProfile').catch(() => {}); } },

  { id: 'interviewed', ask: 'Which jobs got you interviews lately?', help: 'Even if they didn’t work out. These are the strongest sign of where you fit, because an employer already said yes.', skip: 'I haven’t had interviews lately',
    body: (st) => jobAdder(st.interviewed, 'interviewed'), mount: (el, st, ui) => wireAdder(el, 'interviewed', ui) },

  { id: 'fit', ask: 'Add 4 jobs that really suit your background.', help: 'Real postings you’d apply to tomorrow. Paste a link or the job’s text, or drop a file.',
    body: (st) => `<div class="row"><b>${st.fit.length} of 4</b>${st.fit.length >= 4 ? tag('Nice', 'good') : ''}</div>${jobAdder(st.fit, 'fit')}`, mount: (el, st, ui) => wireAdder(el, 'fit', ui),
    next(el, st) { if (st.fit.length + st.interviewed.length < 2) { toast('Add at least 2 jobs so we can tell what fits.', true); return false; } } },

  { id: 'reach', ask: 'Now add one reach.', help: 'A job you’d love that’s a stretch: more senior, a new field, a dream company. We’ll show you a few like it, not a flood.', skip: 'Skip the reach',
    body: (st) => jobAdder(st.reach, 'reach', 1), mount: (el, st, ui) => wireAdder(el, 'reach', ui), leave: () => call('builder.prepareWants').catch(() => {}) },

  { id: 'pay', ask: 'What’s the lowest salary you’d take?', help: 'Per year. Jobs that pay less get hidden. Jobs that don’t list pay still show up, marked “pay not listed.”', skip: 'I’d rather not say',
    body: (st) => `<div class="row" style="font-size:22px"><span>$</span><input type="number" id="pay" min="0" step="1000" value="${st.want.payFloor || ''}" placeholder="85000" style="font-size:22px;max-width:260px"><span class="muted" style="font-size:16px">a year</span></div>`,
    next: (el) => call('want.save', { payFloor: Number(el.querySelector('#pay').value) || null }) },

  { id: 'salary', ask: 'When a form asks your salary expectations, what do you say?', help: 'We’ll use this exact answer on applications. A range with “depending on the full package” keeps your options open.', skip: 'Ask me each time',
    body: (st, ui) => { const floor = st.want.payFloor; const suggestion = floor ? `$${Math.round(floor * 1.1 / 1000)}k to $${Math.round(floor * 1.3 / 1000)}k, depending on the full package` : ''; return `<input type="text" id="sal" value="${esc(ui.answers.salary || suggestion)}" placeholder="e.g. $95k to $110k, depending on the full package">${suggestion && !ui.answers.salary ? '<p class="tiny muted">We suggested a range a bit above your lowest number. Change it to whatever feels right.</p>' : ''}`; },
    next: (el) => call('answers.save', { key: 'salary', question: 'What are your salary expectations?', answer: el.querySelector('#sal').value.trim() }) },

  { id: 'where', ask: 'Where do you want to work?', help: 'Pick all that work for you.',
    body: (st) => { const w = st.want.where || []; const hybrid = (w.find((x) => /hybrid|on-?site near/i.test(x)) || '').replace(/^(hybrid|on-?site)\s*near\s*/i, ''); return `<div class="row">${chip('Remote', w.includes('Remote'), 'data-w="Remote"')}${chip('Hybrid', w.some((x) => /hybrid/i.test(x)), 'data-w="Hybrid"')}${chip('On-site', w.some((x) => /on-?site/i.test(x)), 'data-w="On-site"')}</div><label class="field">For hybrid or on-site, near which city?<input type="text" id="city" value="${esc(hybrid)}" placeholder="e.g. Portland, OR"></label>`; },
    mount(el) { el.querySelectorAll('[data-w]').forEach((c) => (c.onclick = () => c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'))); },
    next(el) {
      const on_ = (k) => el.querySelector(`[data-w="${k}"]`).getAttribute('aria-pressed') === 'true';
      const city = el.querySelector('#city').value.trim();
      if (!on_('Remote') && !on_('Hybrid') && !on_('On-site')) { toast('Pick at least one.', true); return false; }
      if ((on_('Hybrid') || on_('On-site')) && !city) { toast('Add the city for hybrid or on-site jobs.', true); return false; }
      const where = [...(on_('Remote') ? ['Remote'] : []), ...(on_('Hybrid') ? [`Hybrid near ${city}`] : []), ...(on_('On-site') ? [`On-site near ${city}`] : [])];
      return call('want.save', { where });
    } },

  { id: 'relocate', ask: 'Would you move for the right job?', help: 'Applications often ask. We’ll answer the same way every time.',
    body: (st, ui) => `<div class="row">${['No', 'Yes', 'Open to it for the right role'].map((o) => radio('rel', o, o, ui.answers.relocate === o)).join('')}</div><label class="field" id="citiesbox">Which cities or regions?<input type="text" id="cities" value="${esc(ui.answers.relocateCities)}" placeholder="e.g. Seattle, Denver, anywhere on the West Coast"></label>`,
    mount(el) { const box = el.querySelector('#citiesbox'); const sync = () => box.classList.toggle('hidden', !['Yes', 'Open to it for the right role'].includes(el.querySelector('input[name=rel]:checked')?.value)); el.querySelectorAll('input[name=rel]').forEach((r) => (r.onchange = sync)); sync(); },
    async next(el) {
      const v = el.querySelector('input[name=rel]:checked')?.value; if (!v) { toast('Pick one.', true); return false; }
      const cities = el.querySelector('#cities').value.trim();
      await call('answers.save', { key: 'relocate', question: 'Are you willing to relocate?', answer: v === 'No' ? 'No' : cities ? `${v}: ${cities}` : v });
      await call('answers.save', { key: 'relocateCities', question: 'Where would you relocate?', answer: v === 'No' ? '' : cities });
    } },

  { id: 'start', ask: 'When could you start a new job?', help: 'We’ll use this on applications that ask.',
    body: (st, ui) => `<div class="row">${['Right away', 'With 2 weeks’ notice', 'In about a month'].map((o) => radio('start', o, o, ui.answers.start === o)).join('')}<label class="radio"><input type="radio" name="start" value="date" ${ui.answers.start && !['Right away', 'With 2 weeks’ notice', 'In about a month'].includes(ui.answers.start) ? 'checked' : ''}>A specific date</label></div><input type="date" id="sdate" style="max-width:220px">`,
    async next(el) { let v = el.querySelector('input[name=start]:checked')?.value; if (!v) { toast('Pick one.', true); return false; } if (v === 'date') { const d = el.querySelector('#sdate').value; if (!d) { toast('Pick the date.', true); return false; } v = new Date(d + 'T12:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); } await call('answers.save', { key: 'start', question: 'When can you start?', answer: v }); } },

  { id: 'never', ask: 'Anything you never want to see?', help: 'Jobs with these get hidden. You can change this any time.', skip: 'Nothing comes to mind',
    body: (st) => { const all = [...new Set(['Sales targets', 'Night or weekend shifts', 'Relocation', 'Unpaid trial work', 'On-call', ...(st.want.dealBreakers || [])])]; return `<div class="row">${all.map((d) => chip(d, (st.want.dealBreakers || []).includes(d), `data-d="${esc(d)}"`)).join('')}</div><input type="text" id="deal" placeholder="Add your own, press Enter" style="max-width:320px">`; },
    mount(el) { el.querySelectorAll('[data-d]').forEach((c) => (c.onclick = () => c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'))); const d = el.querySelector('#deal'); d.onkeydown = (e) => { if (e.key === 'Enter' && d.value.trim()) { const c = document.createElement('button'); c.type = 'button'; c.className = 'chip'; c.dataset.d = d.value.trim(); c.textContent = d.value.trim(); c.setAttribute('aria-pressed', 'true'); c.onclick = () => c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); d.previousElementSibling.append(c); d.value = ''; } }; },
    next: (el) => call('want.save', { dealBreakers: [...el.querySelectorAll('[data-d][aria-pressed=true]')].map((c) => c.dataset.d) }) },

  { id: 'writing', ask: 'Want your letters to sound like you?', help: 'Share something you wrote in your own words: a long email to friends, a cover letter you liked, a LinkedIn post. A couple of paragraphs is plenty. We only use it to learn how you write.', skip: 'Just use my resumes',
    body: (st) => `<div class="stack-s"><textarea id="wtext" placeholder="Paste something you wrote" style="min-height:160px"></textarea>
<div class="row"><button class="btn secondary" data-act="addw" data-busy="Saving…">Add this</button><label class="btn">Or choose a file<input type="file" class="sr" id="wfile" accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"></label></div></div>
${st.voice.samples.length ? `<div class="list">${st.voice.samples.map((x) => `<div class="item">${tag('Your writing', 'info')}<div class="grow"><div>${esc(x.name)}</div><div class="small muted">${x.words} words</div></div><button class="btn small" data-act="rmw" data-id="${x.id}">Remove</button></div>`).join('')}</div>` : ''}
<p class="tiny muted">No samples? We’ll learn from how your resumes are written. You can add more any time in Profile.</p>`,
    mount(el, st, ui) {
      el.querySelector('#wfile').onchange = async (e) => { const [file] = await readFiles(e.target.files); try { await call('voice.addFile', { file }); ui.repaint(); } catch (ex) { toast(ex.message, true); } };
      on(el, {
        addw: (b) => act(b, async () => { const t = el.querySelector('#wtext').value.trim(); if (!t) throw new Error('Paste something first.'); await call('voice.addSample', { text: t, name: `Pasted writing (${t.split(/\s+/).slice(0, 5).join(' ')}…)` }); ui.repaint(); }),
        rmw: async (b) => { await call('voice.removeSample', { id: b.dataset.id }); ui.repaint(); },
      });
    },
    async next(el, st) { const t = el.querySelector('#wtext').value.trim(); if (t) await call('voice.addSample', { text: t, name: `Pasted writing (${t.split(/\s+/).slice(0, 5).join(' ')}…)` }); } },

  { id: 'connect', when: (st) => !st.hasKey, ask: 'Now let’s connect Claude.', help: 'Claude is what reads your files and writes for you. During testing, you use your own Claude API key. It takes about 3 minutes, and then we’ll read everything you’ve added.',
    body: () => `<div class="stack"><a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" class="btn secondary" style="align-self:flex-start">Sign in to Claude Console to get a key</a>
<ol class="small muted" style="margin:0;padding-left:20px"><li>Sign in, and add $5 of credit under Settings, Billing.</li><li>Press Create Key, name it Job Wizard, and copy it.</li><li>Paste it here.</li></ol>
<input type="password" id="key" placeholder="sk-ant-…" autocomplete="off"><div class="note alert hidden" id="err" role="alert"></div></div>`,
    async next(el) { const err = el.querySelector('#err'); err.classList.add('hidden'); try { await call('settings.save', { claudeKey: el.querySelector('#key').value }); await call('settings.testKey'); toast('Claude is connected. Reading your files now.'); call('builder.prepareProfile').then(() => call('builder.prepareWants')).catch(() => {}); } catch (e) { err.textContent = e.message; err.classList.remove('hidden'); return false; } } },

  { id: 'found', enter: () => call('builder.analyze'), ask: 'Here’s what we pulled from your resumes.', help: 'Fill in anything that’s missing, like your LinkedIn link, website or portfolio, and city and state. Everything Job Wizard writes for you comes from this, and we never make anything up.',
    body: (st) => { const c = st.profile.contact || {}; return `<div class="grid">${[['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['location', 'City, State'], ['linkedin', 'LinkedIn link'], ['website', 'Website or portfolio']].map(([k, l]) => `<label class="field">${l}<input type="text" data-contact="${k}" value="${esc(c[k] || '')}"></label>`).join('')}</div>
<div class="list"><div class="list-head row between"><span>${st.profile.roles.length} role${st.profile.roles.length === 1 ? '' : 's'} · ${st.profile.years} years</span><span class="tiny muted" style="font-weight:400">You can edit roles and results any time in Profile.</span></div>${st.profile.roles.map((r) => `<div class="item"><div class="grow"><div>${esc(r.title)} · ${esc(r.company)}</div><div class="small muted">${esc(r.start || '')} – ${esc(r.end || '')} · ${r.results} results</div></div></div>`).join('')}</div>
<div class="row">${st.profile.skills.slice(0, 16).map((x) => `<span class="tag muted">${esc(x)}</span>`).join('')}</div>
${st.profile.checks ? `<div class="note info">${st.profile.checks} thing${st.profile.checks > 1 ? 's' : ''} to double-check, like dates that don’t match between files. <a href="#/setup/3">Check now</a> or later in Profile.</div>` : ''}`; },
    mount(el) { el.querySelectorAll('[data-contact]').forEach((i) => (i.onchange = () => call('profile.setContact', { [i.dataset.contact]: i.value }))); } },

  { id: 'sweetspot', ask: 'Here’s your sweet spot.', help: 'From your resume and the jobs you added. Keep the titles that sound right.', enter: () => call('builder.analyze'),
    body: (st) => `${st.want.summary ? `<div class="note info"><b>${esc(st.want.summary)}</b></div>` : ''}${st.want.reachNote ? `<div class="note muted"><b>Your reach:</b> ${esc(st.want.reachNote)}</div>` : ''}
<b class="small">Job titles we’ll look for</b><div class="row">${st.want.titles.map((t) => `<button class="chip" aria-pressed="true" data-act="deltitle" data-t="${esc(t)}">${esc(t)} ×</button>`).join('')}<input type="text" id="title" placeholder="Add a title, press Enter" style="width:240px"></div>
${(st.want.suggestedTitles || []).filter((x) => x.accepted == null).length ? `<b class="small">You might also fit:</b><div class="row">${st.want.suggestedTitles.filter((x) => x.accepted == null).map((x) => `<span class="chip suggest">${esc(x.title)} <button class="btn small" data-act="sugg" data-t="${esc(x.title)}" data-v="1" style="color:var(--good)">Yes</button><button class="btn small" data-act="sugg" data-t="${esc(x.title)}" data-v="0">No</button></span>`).join('')}</div>` : ''}`,
    mount(el, st, ui) {
      const t = el.querySelector('#title'); t.onkeydown = async (e) => { if (e.key === 'Enter' && t.value.trim()) { await call('want.save', { titles: [...st.want.titles, t.value.trim()] }); ui.repaint(); } };
      on(el, {
        deltitle: async (b) => { await call('want.save', { titles: st.want.titles.filter((x) => x !== b.dataset.t) }); ui.repaint(); },
        sugg: async (b) => { const sug = st.want.suggestedTitles.map((x) => (x.title === b.dataset.t ? { ...x, accepted: b.dataset.v === '1' } : x)); await call('want.save', { suggestedTitles: sug, ...(b.dataset.v === '1' ? { titles: [...st.want.titles, b.dataset.t] } : {}) }); ui.repaint(); },
      });
    },
    next(el, st) { if (!st.want.titles.length) { toast('Keep at least one job title.', true); return false; } } },

  { id: 'words', when: (st) => (st.want.ambiguous || []).length > 0, ask: 'Quick check: these words mean two things.', help: 'Job posts use them in different ways. Which do you mean?',
    body: (st) => st.want.ambiguous.map((a, i) => `<div class="stack-s"><b>“${esc(a.word)}”</b><div class="row">${[...a.meanings, 'Both', 'Neither, skip these'].map((m) => { const v = m === 'Both' ? 'both' : m.startsWith('Neither') ? 'skip' : m; return radio(`amb${i}`, v, m, a.choice === v); }).join('')}</div></div>`).join(''),
    mount(el, st) { el.querySelectorAll('input[name^=amb]').forEach((r) => (r.onchange = () => { st.want.ambiguous[Number(r.name.slice(3))].choice = r.value; call('want.save', { ambiguous: st.want.ambiguous }); })); } },

  { id: 'rate', ask: 'Last one: rate a few real jobs.', help: 'These are live jobs we found with your answers. Every yes and no teaches Job Wizard what fits before your first morning batch.', skip: 'Skip for now', custom: true },

  { id: 'done', ask: 'Your job search is built.', help: 'Every morning, Job Wizard checks for new jobs that fit and gets your best matches ready to apply. Change any answer later in Profile.', custom: true },
];

export async function render(root, params, app) {
  document.body.classList.add('building');
  const [rawId] = params;
  const [qid, query = ''] = String(rawId || '').split('?');
  const back = /back=1/.test(location.hash);
  let st = await call('builder.status');
  let answers = await call('builder.answers');
  const list = Q.filter((q) => !q.when || q.when(st) || q.id === qid);
  let idx = Math.max(0, list.findIndex((q) => q.id === qid));
  if (!qid) idx = Math.max(0, list.findIndex((q) => q.id === (app.overview.setup.at || list[0].id)));
  void query;

  const ui = {
    get answers() { return answers; },
    async repaint() { st = await call('builder.status'); answers = await call('builder.answers'); paint(); },
  };
  const go = (i) => app.go(`#/build/${list[Math.min(list.length - 1, Math.max(0, i))].id}${back ? '?back=1' : ''}`);

  async function paint() {
    const q = list[idx];
    call('setup.go', { step: app.overview.setup.step, at: q.id }).catch(() => {});
    const pct = Math.round((idx / (list.length - 1)) * 100);
    root.innerHTML = `<div class="page" style="max-width:760px;padding-top:32px">
<div class="stack-s"><div class="row between"><span class="eyebrow">${back ? 'Profile' : `Question ${idx + 1} of ${list.length}`}</span>${back ? '<a href="#/profile" class="small">Back to Profile</a>' : '<button class="btn link small" data-act="later" style="color:var(--ink-muted)">Finish later</button>'}</div>
<div style="height:8px;border-radius:999px;background:var(--line);overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--spark-deep);border-radius:999px"></div></div></div>
<div><h1 style="margin-top:24px">${q.ask}</h1><p class="muted" style="font-size:18px;line-height:28px">${q.help}</p></div>
<div id="qbody" class="stack"></div>
<div class="foot" id="qfoot"></div></div>`;
    const body = root.querySelector('#qbody'), foot = root.querySelector('#qfoot');
    if (q.enter && !q._entered) {
      body.innerHTML = working('Almost there: finishing reading your files…') + '<span data-progress="builder" class="small muted"></span>';
      try { st = await q.enter(); q._entered = true; } catch (e) { body.innerHTML = `<div class="note alert">${esc(e.message)}</div>`; foot.innerHTML = navButtons(q, idx); return; }
    }
    if (q.id === 'rate') return rateScreen(body, foot);
    if (q.id === 'done') return doneScreen(body, foot);
    body.innerHTML = q.body(st, ui);
    foot.innerHTML = navButtons(q, idx);
    q.mount?.(body, st, ui);
    body.querySelector('input:not([type=hidden]):not([type=file]), textarea')?.focus();
  }

  function navButtons(q, i) {
    return `${i > 0 && !back ? '<button class="btn" data-act="prev">Back</button>' : ''}<button class="btn primary big" data-act="next" data-busy="${q.id === 'resume' ? 'Reading your resume…' : 'Saving…'}">${back ? 'Save' : 'Continue'}</button>${q.skip && !back ? `<button class="btn link" data-act="skip" style="color:var(--ink-muted)">${esc(q.skip)}</button>` : ''}<span data-progress="builder" class="small muted"></span>`;
  }

  on(root, {
    prev: () => go(idx - 1),
    skip: async () => { list[idx].leave?.(); app.go(`#/build/${await nextAfter(list[idx].id)}`); },
    later: () => { document.body.classList.remove('building'); app.go('#/profile'); },
    next: (b) => act(b, async () => {
      const q = list[idx];
      const r = q.next ? await q.next(root.querySelector('#qbody'), st, ui) : undefined;
      if (r === false) return;
      q.leave?.();
      if (back) { document.body.classList.remove('building'); app.go('#/profile'); return; }
      // Answers can add or remove questions (e.g. words that mean two things), so work out the next one fresh.
      app.go(`#/build/${await nextAfter(q.id)}`);
    }),
  });

  // ----- rating jobs, one at a time -----
  let pendingNo = null;
  async function rateScreen(body, foot) {
    body.innerHTML = working('Finding live jobs with your answers…') + '<span data-progress="builder" class="small muted"></span>';
    foot.innerHTML = '';
    let res = { found: 0 };
    try { res = await call('builder.findJobs'); } catch (e) { toast(e.message, true); }
    const draw = async () => {
      const { jobs, learned } = await call('jobs.sample', { count: RATE_TARGET });
      if (!jobs.length) {
        body.innerHTML = `<div class="note att">${res.noSites ? 'We need a company or two to watch.' : 'We didn’t find live jobs that match yet.'} Paste the careers page of a company you’d like to work for. Pages on Greenhouse, Lever, Ashby, SmartRecruiters or Workable work best.</div>
<div class="row"><input type="url" id="site" placeholder="e.g. jobs.lever.co/acme or acme.com/careers" style="flex:1 1 320px"><button class="btn secondary" data-act="addsite" data-busy="Checking…">Add and look</button></div>`;
        foot.innerHTML = navButtons(list[idx], idx);
        on(body, { addsite: (b) => act(b, async () => { const r = await call('sites.add', { url: body.querySelector('#site').value.trim() }); if (r.kind !== 'board' && r.kind !== 'webpage') throw new Error(r.suggestion || 'We can’t read jobs from that site yet.'); res = await call('builder.findJobs'); draw(); }) });
        return;
      }
      const rated = jobs.filter((j) => j.rated);
      const j = jobs.find((x) => !x.rated);
      const bar = jobs.slice(0, RATE_TARGET).map((x) => `<span class="${x.rated || (x === j ? 'now' : '')}"></span>`).join('');
      body.innerHTML = `<div class="stack-s"><div class="row"><b>${rated.length} of ${Math.min(RATE_TARGET, jobs.length)} rated</b><span class="small muted">Every job here is open today.</span></div><div class="progress">${bar}</div></div>
${j ? `<section class="card featured"><div style="font-family:var(--display);font-size:22px;font-weight:700">${esc(j.title)}</div><div class="muted">${esc([j.company, j.location, j.pay, posted(j)].filter(Boolean).join(' · '))}</div>
<div><b>Why we picked it:</b> ${esc(j.why || (j.scoreReasons || []).join('; ').toLowerCase() || 'it matches your titles.')}</div>
${j.snippet ? `<p class="small muted">${esc(j.snippet)}…</p>` : ''}
${pendingNo === j.id ? `<b class="small">Why not? Pick any.</b><div class="row" id="reasons">${NO_REASONS.map((r) => chip(r, false, 'data-act="reason"')).join('')}</div><div class="row"><button class="btn primary" data-act="rate" data-id="${j.id}" data-v="no">Save</button><button class="btn" data-act="cancelno">Cancel</button></div>`
  : `<div class="row"><button class="btn primary" data-act="rate" data-id="${j.id}" data-v="yes">Yes, I’d apply</button><button class="btn secondary" data-act="rate" data-id="${j.id}" data-v="maybe">Maybe</button><button class="btn" data-act="no" data-id="${j.id}">No</button>${j.url ? `<a class="small" href="${esc(j.url)}" target="_blank" rel="noopener">Read the full post</a>` : ''}</div>`}</section>` : '<div class="note good">All rated. Nice work.</div>'}
${learned.length ? `<section class="card quiet tight"><b>What we’ve learned so far</b>${learned.map((t) => `<div class="small">✦ ${esc(t)}</div>`).join('')}</section>` : ''}`;
      foot.innerHTML = `${idx > 0 ? '<button class="btn" data-act="prev">Back</button>' : ''}<button class="btn ${!j || rated.length >= 5 ? 'primary big' : ''}" data-act="next">${!j || rated.length >= RATE_TARGET ? 'Continue' : rated.length >= 5 ? 'That’s enough for now' : 'Skip for now'}</button>`;
    };
    on(body, {
      no: (b) => { pendingNo = b.dataset.id; draw(); },
      cancelno: () => { pendingNo = null; draw(); },
      reason: (b) => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'),
      rate: async (b) => {
        const reasons = [...body.querySelectorAll('#reasons [aria-pressed=true]')].map((x) => x.textContent.replace(/^✓\s*/, ''));
        const r = await call('jobs.rate', { id: b.dataset.id, value: b.dataset.v, reasons });
        await call('jobs.markSetupRated', { id: b.dataset.id });
        pendingNo = null;
        if (r.newRules?.length) toast(`Learned: ${r.newRules[0].text}`);
        draw();
      },
    });
    draw();
  }

  async function doneScreen(body, foot) {
    await call('builder.complete');
    await app.refresh();
    const s = await call('settings.get');
    body.innerHTML = `<section class="card featured"><h2>Every morning at</h2><div class="row"><select id="hour" style="width:auto">${[5, 6, 7, 8, 9, 10].map((h) => `<option value="${h}" ${h === Number(s.morningHour) ? 'selected' : ''}>${h}:00 AM</option>`).join('')}</select><span class="muted">we’ll get your best</span><select id="count" style="width:auto">${[1, 2, 3, 5].map((n) => `<option ${n === Number(s.morningCount) ? 'selected' : ''}>${n}</option>`).join('')}</select><span class="muted">matches ready to apply.</span></div><p class="tiny muted">Job Wizard needs to be open, even in the background.</p></section>`;
    body.querySelectorAll('select').forEach((x) => (x.onchange = () => call('settings.save', { morningHour: Number(body.querySelector('#hour').value), morningCount: Number(body.querySelector('#count').value) })));
    foot.innerHTML = `<button class="btn primary big" data-act="dash" data-busy="Getting your first matches ready…">Go to my Dashboard</button><a class="btn" href="#/profile">See your choices in Profile</a>`;
    on(foot, { dash: (b) => act(b, async () => { document.body.classList.remove('building'); app.go('#/dashboard'); call('batch.run', { reason: 'setup' }).then(() => app.refresh()).catch(() => {}); }) });
  }

  await paint();
}

// The next question after this one that applies now (answers can add or remove questions).
async function nextAfter(id) {
  const fresh = await call('builder.status');
  const i = Q.findIndex((x) => x.id === id);
  return (Q.slice(i + 1).find((x) => !x.when || x.when(fresh)) || Q.at(-1)).id;
}

// ----- "Your setup": every choice from the builder, each one changeable -----
export async function dashboard(root, app, { embedded = false } = {}) {
  document.body.classList.remove('building');
  const [st, answers, learning] = await Promise.all([call('builder.status'), call('builder.answers'), call('learning.get')]);
  const w = st.want;
  const card = (q, title, value, extra = '') => `<section class="card tight"><div class="row between" style="flex-wrap:nowrap;align-items:flex-start"><b>${title}</b><a class="btn small" href="#/build/${q}?back=1">Change</a></div><div class="small">${value || '<span class="muted">Not answered yet</span>'}</div>${extra}</section>`;
  const jobs = (l) => (l.length ? l.map((x) => esc(`${x.title}${x.company ? ` · ${x.company}` : ''}`)).join('<br>') : '');
  const c = st.profile.contact || {};
  root.innerHTML = `<div class="${embedded ? 'stack' : 'page'}" style="gap:24px">
${embedded ? (st.done ? '' : '<div class="note att row between"><span>Setup isn’t finished yet.</span><a class="btn primary" href="#/build">Finish setup</a></div>') : `<div class="head"><div><h1>Your setup</h1><p class="muted">Every choice you made in setup. Change any of them and your matches update.</p></div>${st.done ? '' : '<a class="btn primary" href="#/build">Finish setup</a>'}</div>`}
<div class="grid">
<section class="card tight"><div class="row between"><b>Your experience</b><a class="btn small" href="#/setup/3">Edit</a></div><div class="small">${st.profile.roles.length} roles · ${st.profile.skills.length} skills · ${st.profile.years} years</div><span class="tiny muted">From ${st.materials.length} file${st.materials.length === 1 ? '' : 's'}. <a href="#/documents">Add or manage files in Documents</a>${st.profile.checks ? ` · <a href="#/setup/3">${st.profile.checks} to check</a>` : ''}</span></section>
${card('found', 'Contact details', [c.name, c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('<br>'))}
${card('interviewed', 'Jobs that got you interviews', jobs(st.interviewed))}
${card('fit', 'Jobs that suit you', jobs(st.fit))}
${card('reach', 'Your reach', jobs(st.reach))}
${card('sweetspot', 'Your sweet spot', `${w.summary ? esc(w.summary) + '<br>' : ''}${w.titles.map((t) => `<span class="tag muted">${esc(t)}</span>`).join(' ')}`)}
${(w.ambiguous || []).length ? card('words', 'Words that mean two things', w.ambiguous.map((a) => `${esc(a.word)}: ${esc(a.choice === 'skip' ? 'skip these' : a.choice || 'not answered')}`).join('<br>')) : ''}
${card('pay', 'Lowest salary', w.payFloor ? `$${Number(w.payFloor).toLocaleString()} a year` : '')}
${card('salary', 'Salary expectations answer', esc(answers.salary))}
${card('where', 'Where', (w.where || []).map(esc).join(', '))}
${card('relocate', 'Would you move?', esc(answers.relocate))}
${card('start', 'When you could start', esc(answers.start))}
${card('never', 'Never show me', (w.dealBreakers || []).map(esc).join(', '))}
${card('writing', 'Your writing style', st.voice.samples.length ? st.voice.samples.map((x) => esc(x.name)).join('<br>') : 'Learning from your resume', `<span class="tiny muted"><a href="#/setup/4">Fine-tune your style</a></span>`)}
${card('rate', 'Jobs you’ve rated', `${learning.summary.yes} yes · ${learning.summary.no} no`, `<span class="tiny muted"><a href="#/profile/learned">${learning.summary.rules} rule${learning.summary.rules === 1 ? '' : 's'} learned</a></span>`)}
</div>
<section class="stack"><h2>More</h2><div class="grid">
<a class="card tight" href="#/setup/7" style="text-decoration:none;color:inherit"><b>Companies and job sites we watch</b><span class="small muted">${st.sites.length} watched. Companies from the jobs you added are watched automatically.</span></a>
<a class="card tight" href="#/setup/5" style="text-decoration:none;color:inherit"><b>Resume design</b><span class="small muted">Template, fonts, length. A bigger design update is coming.</span></a>
<a class="card tight" href="#/profile/settings" style="text-decoration:none;color:inherit"><b>Claude and morning schedule</b><span class="small muted">API key, models, when the morning batch runs.</span></a>
<a class="card tight" href="#/profile/extension" style="text-decoration:none;color:inherit"><b>Browser extension</b><span class="small muted">Fill applications in your browser, and the answers it uses.</span></a>
</div></section>
</div>`;
  void app; void modal;
}

// Paste a link or text, or drop a file; shows what's been added for this kind of job.
function jobAdder(list, kind, max) {
  const full = max && list.length >= max;
  return `${full ? '' : `<div class="stack-s"><textarea id="jobin" placeholder="Paste a job link, or the job’s text" style="min-height:64px"></textarea>
<div class="row"><button class="btn secondary" data-act="addjob" data-busy="Reading the job…">Add this job</button><label class="btn">Or choose a file<input type="file" class="sr" id="jobfile" accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"></label><span class="tiny muted">LinkedIn and Indeed links can’t be read: paste the job’s text instead.</span></div></div>`}
<div class="list" id="joblist" ${list.length ? '' : 'hidden'}>${list.map((x) => `<div class="item">${tag(kind === 'interviewed' ? 'Got an interview' : kind === 'reach' ? 'Reach' : 'Suits you', kind === 'interviewed' ? 'good' : kind === 'reach' ? 'info' : 'spark')}<div class="grow"><div>${esc(x.title || 'Job')}${x.company ? ` · ${esc(x.company)}` : ''}</div>${x.url ? `<div class="small muted">${esc(x.url.replace(/^https?:\/\//, '').slice(0, 70))}</div>` : ''}</div><button class="btn small" data-act="rmjob" data-id="${x.id}">Remove</button></div>`).join('')}</div>`;
}

function wireAdder(el, kind, ui) {
  const add = (args) => call('want.addExample', { kind, ...args });
  el.querySelector('#jobfile')?.addEventListener('change', async (e) => {
    const [file] = await readFiles(e.target.files);
    try { await add({ file }); ui.repaint(); } catch (ex) { toast(ex.message, true); }
  });
  on(el, {
    addjob: (b) => act(b, async () => { const v = el.querySelector('#jobin').value.trim(); if (!v) throw new Error('Paste a job link or its text first.'); await add({ input: v }); ui.repaint(); }),
    rmjob: async (b) => { await call('want.removeExample', { id: b.dataset.id }); ui.repaint(); },
  });
}
