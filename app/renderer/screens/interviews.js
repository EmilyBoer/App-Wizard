import { call, esc, tag, act, toast, on, modal, when, readFiles, working } from '../lib.js';

export async function render(root, params, app, name) {
  if (name === 'interview' && params[0]) return sheet(root, params[0], app);
  const paint = async () => {
    const [list, tr] = await Promise.all([call('interviews.list'), call('tracker.list')]);
    const now = new Date().toISOString();
    const upcoming = list.filter((i) => !i.start || i.start >= now.slice(0, 16));
    const past = list.filter((i) => i.start && i.start < now.slice(0, 16)).reverse();
    root.innerHTML = `<div class="page">
<div class="head"><div><h1>Interviews</h1><p class="muted">A cheat sheet for every interview: likely questions, answers from your own experience, and research on the company.</p></div>
<div class="row"><label class="btn">Add from a calendar invite (.ics)<input type="file" class="sr" id="ics" accept=".ics,text/calendar"></label><button class="btn primary" data-act="add">Got an interview? Add it</button></div></div>
<section class="stack"><h2>Coming up</h2>${upcoming.length ? upcoming.map((i) => card(i, true)).join('') : '<p class="muted small">No interviews scheduled. When you get one, add it here or press Make cheat sheet on the job.</p>'}</section>
${past.length ? `<section class="stack"><h2>Past</h2><div class="grid">${past.map((i) => card(i)).join('')}</div></section>` : ''}
<p class="small muted">Tip: on any job, press <b>Make interview cheat sheet</b> and it shows up here. Calendar connections (Google, Outlook) are coming later.</p>
</div>`;
    root.querySelector('#ics').onchange = async (e) => { const [f] = await readFiles(e.target.files); try { const added = await call('interviews.fromIcs', { text: atob(f.data) }); toast(`Added ${added.length} interview${added.length > 1 ? 's' : ''}.${added.some((a) => !a.trackerId) ? ' Link it to a job so the cheat sheet knows the role.' : ''}`); } catch (ex) { toast(ex.message, true); } paint(); };
    root.__tracker = tr.list;
  };
  const card = (i, big) => `<article class="card ${big ? 'featured' : 'tight'}"><div class="row-l" style="align-items:center">
${big ? `<div style="text-align:center;padding:10px 16px;border-radius:12px;background:var(--info-soft);min-width:84px">${i.start ? `<div class="eyebrow" style="color:var(--info)">${new Date(i.start).toLocaleDateString('en-US', { weekday: 'short' })}</div><div style="font-family:var(--display);font-size:28px;font-weight:800;line-height:32px">${new Date(i.start).getDate()}</div><div class="small">${new Date(i.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>` : '<div class="small">Date not set</div>'}</div>` : ''}
<div class="grow"><div style="font-family:var(--display);font-size:${big ? 20 : 17}px;font-weight:700">${esc(i.role || i.title || 'Interview')}${i.company ? ` · ${esc(i.company)}` : ''}</div><div class="small muted">${esc([i.round, i.with, i.format, big ? '' : when(i.start)].filter(Boolean).join(' · '))}</div>
<div class="row" style="margin-top:6px">${i.cheat ? tag('Cheat sheet ready', 'good') : tag('No cheat sheet yet', 'muted')}</div></div>
<div class="row"><a class="btn secondary" href="#/interview/${i.id}">${i.cheat ? 'Open cheat sheet' : 'Make cheat sheet'}</a></div></div></article>`;
  on(root, {
    add: () => modal(`<h2>Add an interview</h2>
<label class="field">Which job?<select id="tj"><option value="">Not in my tracker</option>${root.__tracker.map((t) => `<option value="${t.id}">${esc(t.title)} · ${esc(t.company)}</option>`).join('')}</select></label>
<div class="grid"><label class="field">Company<input type="text" id="ic"></label><label class="field">Role<input type="text" id="ir"></label></div>
<div class="grid"><label class="field">Date and time<input type="datetime-local" id="id"></label><label class="field">Round<input type="text" id="iro" placeholder="First round, panel…"></label></div>
<div class="grid"><label class="field">With<input type="text" id="iw" placeholder="Name, title"></label><label class="field">Format<select id="if"><option>Video call</option><option>Phone</option><option>In person</option></select></label></div>
<div class="row"><button class="btn primary" id="iadd">Add</button><button class="btn" data-close>Cancel</button></div>`, {
      onMount: (m, close) => {
        const sel = m.querySelector('#tj');
        sel.onchange = () => { const t = root.__tracker.find((x) => x.id === sel.value); if (t) { m.querySelector('#ic').value = t.company; m.querySelector('#ir').value = t.title; } };
        m.querySelector('#iadd').onclick = async () => {
          const v = (s) => m.querySelector(s).value;
          const iv = await call('interviews.add', { trackerId: v('#tj') || null, company: v('#ic'), role: v('#ir'), start: v('#id') ? new Date(v('#id')).toISOString() : null, round: v('#iro'), with: v('#iw'), format: v('#if') });
          close(); app.go(`#/interview/${iv.id}`);
        };
      },
    }),
  });
  await paint();
}

async function sheet(root, id, app) {
  const paint = async () => {
    const list = await call('interviews.list');
    const i = list.find((x) => x.id === id);
    if (!i) { root.innerHTML = '<div class="page"><div class="note alert">Interview not found.</div></div>'; return; }
    const c = i.cheat;
    root.innerHTML = c?.v === 2 ? cheatPageV2(i, c) : cheatPage(i, c);
    if (c?.v === 2) spy(root);
    root.querySelector('#notes').onchange = (e) => call('interviews.update', { id, notes: e.target.value }).then(() => toast('Saved.'));
    // Jump links scroll within the page (the address keeps pointing at this interview).
    root.querySelectorAll('[data-jump]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); const sel = a.dataset.jump ? `#cs-${a.dataset.jump}` : a.getAttribute('href'); root.querySelector(sel)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (!a.dataset.jump && window.innerWidth <= 960) root.querySelector('.cs-index')?.removeAttribute('open'); root.querySelectorAll('.cheat-nav a').forEach((x) => x.classList.toggle('on', x === a)); }));
    root.__i = i;
  };
  on(root, {
    make: (b) => act(b, async () => { await call('interviews.cheat', { id }); paint(); }),
    print: () => window.print(),
    copyty: () => navigator.clipboard.writeText(root.__i.cheat?.thankYou || '').then(() => toast('Copied.')),
    practice: () => app.openChat(null, `Let's practice for my ${root.__i.company} interview. Ask me one likely question at a time and give me feedback.`),
    edit: () => { const i = root.__i; const f = (k, label, ph = '', type = 'text') => `<label class="field">${label}<input type="${type}" id="e-${k}" value="${esc(i[k] || '')}" placeholder="${esc(ph)}"></label>`;
      modal(`<h2>Interview details</h2><p class="muted small">The more we know, the better the cheat sheet. Everything here is optional.</p>
<div class="grid"><label class="field">Date and time<input type="datetime-local" id="e-start" value="${i.start ? new Date(new Date(i.start).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}"></label><label class="field">Length (minutes)<input type="number" id="e-mins" min="5" step="5" value="${i.start && i.end ? Math.round((new Date(i.end) - new Date(i.start)) / 60000) : ''}" placeholder="30"></label></div>
<div class="grid">${f('round', 'Round', 'Panel interview, round 4')}${f('format', 'Format', 'Video call')}</div>
<div class="grid">${f('with', 'Who you’re meeting', 'Name, title')}${f('theirTz', 'Where they are', 'Europe/London, or a city')}</div>
<label class="field">What you know about them<textarea id="e-about" rows="3" placeholder="Paste their LinkedIn summary, or anything the recruiter told you">${esc(i.about || '')}</textarea></label>
<div class="grid">${f('link', 'Call link', 'https://…', 'url')}${f('scheduler', 'Scheduled by', 'Name (recruiting)')}</div>
<div class="grid">${f('meetingId', 'Meeting ID')}${f('passcode', 'Passcode')}</div>
${f('companySite', 'Company website', 'https://…', 'url')}
<div class="row"><button class="btn primary" id="s">Save</button><button class="btn link" data-close>Cancel</button><button class="btn link" id="x">Delete interview</button></div>`, { onMount: (m, close) => {
        m.querySelector('#s').onclick = async () => {
          const v = (k) => m.querySelector(`#e-${k}`).value.trim();
          const start = v('start') ? new Date(v('start')).toISOString() : null;
          const end = start && Number(v('mins')) ? new Date(new Date(start).getTime() + Number(v('mins')) * 60000).toISOString() : i.end || null;
          await call('interviews.update', { id, start, end, round: v('round'), format: v('format'), with: v('with'), theirTz: v('theirTz'), about: v('about'), link: v('link'), scheduler: v('scheduler'), meetingId: v('meetingId'), passcode: v('passcode'), companySite: v('companySite') });
          close(); paint();
        };
        m.querySelector('#x').onclick = async () => { if (confirm('Delete this interview?')) { await call('interviews.remove', { id }); close(); app.go('#/interviews'); } };
      } }); },
  });
  root.innerHTML = `<div class="page">${working('Loading…')}</div>`;
  await paint();
}

// ----- the cheat sheet page: jump links on the left, every section on the right -----
const li = (x) => `<li>${esc(x)}</li>`;
const fromTag = (f) => (f?.length ? '<span class="tiny muted">From your profile</span>' : '');
function cheatPage(i, c) {
  const S = [];
  const add = (id, title, html) => { if (html) S.push({ id, title, html }); };
  if (c) {
    const facts = [i.start ? when(i.start) : 'Date not set', i.round, i.with && `With ${i.with}`, i.format, c.posted?.location].filter(Boolean);
    add('glance', 'At a glance', `<ul class="facts">${facts.map(li).join('')}</ul>${c.posted?.url ? `<a href="${esc(c.posted.url)}" target="_blank" rel="noopener" class="small">Open the job posting</a>` : ''}
      ${(c.talkingPoints || []).length ? `<h3>Your three talking points</h3><ol class="points">${c.talkingPoints.map(li).join('')}</ol>` : ''}`);
    add('company', 'The company', c.company && `<p>${esc(c.company.about || '')}</p>
      ${(c.company.recent || []).length ? `<h3>Recent</h3><ul>${c.company.recent.map(li).join('')}</ul>` : ''}
      ${(c.company.values || []).length ? `<h3>What they care about</h3><ul>${c.company.values.map(li).join('')}</ul>` : ''}`);
    const needs = (c.role?.theyNeed || []).map((n) => (typeof n === 'string' ? { need: n } : n));
    add('role', 'The role and why you', c.role && `<p>${esc(c.role.focus || '')}</p>
      ${needs.length ? `<div class="needs">${needs.map((n) => `<div class="need"><b>${esc(n.need)}</b>${n.proof ? `<span>${esc(n.proof)}</span>` : '<span class="muted">Be ready to talk about this one.</span>'}</div>`).join('')}</div>` : ''}`);
    add('pitch', 'Tell me about yourself', c.pitch && `<h3>Short version</h3><p class="lead">${esc(c.pitch)}</p>${c.pitchLong ? `<h3>Two-minute version</h3><p>${esc(c.pitchLong)}</p>` : ''}`);
    add('stories', 'Your stories', (c.stories || []).length && `<p class="muted small">Have these ready. Most questions are a way of asking for one of them.</p>${c.stories.map((x) => `<details class="story" open><summary>${esc(x.title)}</summary>
      <dl><dt>Situation</dt><dd>${esc(x.situation || '')}</dd><dt>What you did</dt><dd>${esc(x.action || '')}</dd><dt>Result</dt><dd>${esc(x.result || '')}</dd>${(x.usefulFor || []).length ? `<dt>Use it for</dt><dd>${esc(x.usefulFor.join(', '))}</dd>` : ''}</dl>${fromTag(x.from)}</details>`).join('')}`);
    const qs = c.questions || [];
    const cats = [...new Set(qs.map((q) => q.category || 'Questions'))];
    add('questions', 'Likely questions', qs.length && cats.map((cat) => `<h3>${esc(cat)}</h3>${qs.filter((q) => (q.category || 'Questions') === cat).map((q) => `<details class="qa" open><summary>${esc(q.q)}</summary><p>${esc(q.answer)}</p>${fromTag(q.from)}</details>`).join('')}`).join(''));
    add('tough', 'Tough questions', (c.tough || []).length && c.tough.map((q) => `<details class="qa" open><summary>${esc(q.q)}</summary><p>${esc(q.answer)}</p></details>`).join(''));
    const ask = (c.askThem || []).map((q) => (typeof q === 'string' ? { category: 'Questions', q } : q));
    const askCats = [...new Set(ask.map((q) => q.category || 'Questions'))];
    add('ask', 'Questions to ask them', ask.length && askCats.map((cat) => `${askCats.length > 1 ? `<h3>${esc(cat)}</h3>` : ''}<ul>${ask.filter((q) => (q.category || 'Questions') === cat).map((q) => li(q.q)).join('')}</ul>`).join(''));
    add('watch', 'Watch-outs', (c.watchOuts || []).length && `<ul>${c.watchOuts.map(li).join('')}</ul>`);
    add('pay', 'Pay and logistics', (c.pay || c.posted?.pay) && `${c.posted?.pay ? `<p><b>Posted range:</b> ${esc(c.posted.pay)}</p>` : ''}${c.pay ? `<p>${esc(c.pay)}</p>` : ''}`);
    add('close', 'Closing and thank-you', (c.closing || c.thankYou) && `${c.closing ? `<h3>To close</h3><p class="lead">${esc(c.closing)}</p>` : ''}${c.thankYou ? `<h3>Thank-you note to send today</h3><div class="letter">${esc(c.thankYou)}</div><button class="btn small" data-act="copyty">Copy the note</button>` : ''}`);
  }
  S.push({ id: 'notes', title: 'Your notes', html: `<textarea id="notes" placeholder="Anything you want to remember. After the interview, jot down how it went.">${esc(i.notes || '')}</textarea>` });
  return `<div class="page cheat-page">
<a href="#/interviews" class="small">← Interviews</a>
<div class="head"><div><div class="eyebrow">${esc(when(i.start))}${i.round ? ` · ${esc(i.round)}` : ''}${i.with ? ` · ${esc(i.with)}` : ''}</div><h1>${esc(i.role || 'Interview')}${i.company ? ` · ${esc(i.company)}` : ''}</h1></div>
<div class="row"><button class="btn" data-act="edit">Edit details</button><button class="btn" data-act="practice">Practice with Margo</button><button class="btn ${c ? '' : 'primary'}" data-act="make" data-busy="Researching and writing…">${c ? 'Make it again' : 'Make my cheat sheet'}</button><button class="btn" data-act="print">Print</button></div></div>
<span data-progress="cheat" class="small muted"></span>
${c?.researchNote ? `<div class="note att">${esc(c.researchNote)}</div>` : ''}
${!c ? '<div class="empty"><b>No cheat sheet yet.</b><span class="muted small">We’ll read the company’s own website and the job posting, then outline answers using your real results.</span></div>' : ''}
<div class="cheat">
<nav class="cheat-nav" aria-label="On this page"><b class="tiny muted">On this page</b>${S.map((x) => `<a href="#cs-${x.id}" data-jump="${x.id}">${esc(x.title)}</a>`).join('')}</nav>
<div class="cheat-body">${S.map((x) => `<section class="card cheat-sec" id="cs-${x.id}"><h2>${esc(x.title)}</h2>${x.html}</section>`).join('')}</div>
</div></div>`;
}

// ----- cheat sheet, version 2: built like a prep page a friend makes the night before -----
const P = (t) => `<p>${esc(t)}</p>`;
const glance = (g) => (g?.length ? `<ul class="cs-glance" aria-label="At a glance">${g.map(li).join('')}</ul>` : '');
const labelled = (t) => { const m = String(t).match(/^([^:]{2,40}):\s(.+)$/s); return m ? `<li><b>${esc(m[1])}:</b> ${esc(m[2])}</li>` : li(t); };
const steps = (list) => (list?.length > 2 ? `<div class="cs-steps" aria-label="Steps">${list.map((x, k) => `<span class="cs-step${k === 0 ? ' first' : ''}">${esc(x)}</span>`).join('<span class="cs-arrow" aria-hidden="true">→</span>')}</div>` : '');
const theirTime = (start, tz) => { if (!start || !tz) return ''; try { const o = { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }; const theirs = new Date(start).toLocaleTimeString([], { ...o, timeZone: tz }); return theirs === new Date(start).toLocaleTimeString([], o) ? '' : `${theirs} for them`; } catch { return `they’re in ${tz}`; } };

function cheatPageV2(i, c) {
  const nav = []; const body = [];
  const group = (id, title, items) => nav.push({ id, title, items });
  const name = c.interviewer?.name || i.with || 'them';
  const first = c.interviewer?.short || String(name).split(/[ ,]/)[0];
  // Start here
  const mins = i.start && i.end ? Math.round((new Date(i.end) - new Date(i.start)) / 60000) : 0;
  const facts = [
    ['When', [i.start ? when(i.start) : 'Date not set', mins && `${mins} min`, theirTime(i.start, i.theirTz)].filter(Boolean).join(' · ')],
    ['Where', i.link ? `<a href="${esc(i.link)}" target="_blank" rel="noopener">Join the call</a>${i.meetingId ? ` · ID <span class="mono">${esc(i.meetingId)}</span>` : ''}${i.passcode ? ` · passcode <span class="mono">${esc(i.passcode)}</span>` : ''}` : esc(i.format || 'Add the call link in Edit details')],
    i.scheduler && ['Scheduler', esc(i.scheduler)],
    ['The job', [c.posted?.pay, c.posted?.location].filter(Boolean).map(esc).join(' · ') + (c.posted?.url ? ` · <a href="${esc(c.posted.url)}" target="_blank" rel="noopener">Posting</a>` : '')],
  ].filter(Boolean);
  body.push(`<section class="cs-facts card" id="cs-top" aria-label="Meeting details">${facts.map(([k, v]) => `<div><span class="cs-label">${k}</span><p>${v.startsWith?.('<') || /<a |<span/.test(v) ? v : v}</p></div>`).join('')}</section>`);
  const start = [['cs-top', 'Meeting details']];
  if (c.interviewer) {
    start.push(['cs-who', `Who ${first} is`]);
    body.push(`<section class="cs-block" id="cs-who"><h2>Who ${esc(first)} is</h2>${glance(c.interviewer.glance)}${c.interviewer.details?.length ? `<ul>${c.interviewer.details.map(labelled).join('')}</ul>` : ''}
${c.news ? `<div class="cs-figure"><span class="cs-label">Recent news: ${esc(c.news.title)}</span>${glance(c.news.glance)}${c.news.details?.length ? `<ul>${c.news.details.map(labelled).join('')}</ul>` : ''}${c.news.other ? `<p><b>Other recent news:</b> ${esc(c.news.other)}</p>` : ''}${c.news.howToUse ? `<p><b>How to use it:</b> <i>“${esc(c.news.howToUse)}”</i></p>` : ''}</div>` : ''}
${c.interviewer.meansForYou ? `<p class="cs-tip"><b>What that means for you:</b> ${esc(c.interviewer.meansForYou)}</p>` : ''}</section>`);
  }
  if (c.land?.length) { start.push(['cs-land', 'Three things to land']); body.push(`<section class="cs-block" id="cs-land"><h2>Three things to land</h2><div class="cs-lands">${c.land.map((l) => `<div class="cs-land"><b>${esc(l.title)}</b><p>${esc(l.proof)}</p></div>`).join('')}</div></section>`); }
  if (c.onPaper?.length || c.notOnPaper?.length) {
    start.push(['cs-paper', `What ${first} may have in front of them`]);
    body.push(`<section class="cs-flagbox" id="cs-paper"><h2>What ${esc(first)} may have in front of them</h2>
${c.onPaper?.length ? `<ul>${c.onPaper.map((o) => `<li><b>${esc(o.source)} says:</b> <i>“${esc(o.says)}”</i><br><b>You say:</b> “${esc(o.youSay)}”</li>`).join('')}</ul>` : ''}
${c.notOnPaper?.length ? `<p><b>Not on what you sent, so they may ask:</b></p><ul>${c.notOnPaper.map((o) => `<li><b>${esc(o.topic)}.</b> You say: “${esc(o.youSay)}”</li>`).join('')}</ul>` : ''}</section>`);
  }
  group('cs-top', 'Start here', start);
  // Questions, by topic
  (c.groups || []).forEach((g, gi) => {
    const items = []; const cards = [];
    (g.questions || []).forEach((q, qi) => {
      const qid = `cs-q${gi}-${qi}`;
      items.push([qid, q.q, q.yourStory]);
      cards.push(`<article class="cs-qa card" id="${qid}"><h3>${esc(q.q)}</h3>${glance(q.glance)}<div class="cs-answer">${(q.answer || []).map(P).join('')}</div>${steps(q.steps)}
${(q.tips || []).map((t) => `<p class="cs-tip"><b>${esc(t.label)}:</b> ${esc(t.text)}</p>`).join('')}${q.flag ? `<p class="cs-flag"><b>${esc(q.flag.label)}:</b> ${esc(q.flag.text)}</p>` : ''}
<div class="row-l" style="justify-content:space-between">${q.from?.length ? '<span class="tiny muted">From your profile</span>' : '<span></span>'}<a class="cs-top-link small" href="#cs-top" data-jump>Back to the top</a></div></article>`);
    });
    group(`cs-g${gi}`, g.title, items);
    body.push(`<h2 class="cs-section" id="cs-g${gi}">${esc(g.title)}</h2><div class="cs-stack">${cards.join('')}</div>`);
  });
  // Homework
  const h = c.homework;
  if (h && (h.top3?.length || h.quickWins?.length || h.bigPlays?.length)) {
    const items = [];
    let html = `<h2 class="cs-section" id="cs-ideas">${esc(h.title || 'Ideas to bring')}</h2><div class="cs-stack">`;
    if (h.top3?.length) { items.push(['cs-top3', 'If you only mention three']); html += `<section class="cs-flagbox good" id="cs-top3"><h2>If you only mention three</h2><ol>${h.top3.map((x) => `<li><b>${esc(x.title)}</b> ${esc(x.detail)}</li>`).join('')}</ol>${h.framing ? `<p><b>How to frame it:</b> <i>${esc(h.framing)}</i></p>` : ''}</section>`; }
    if (h.lookedAt) html += `<p class="cs-tip"><b>What we looked at:</b> ${esc(h.lookedAt)}</p>`;
    const list = (id, title, xs) => { if (!xs?.length) return; items.push([id, title]); html += `<article class="cs-qa card" id="${id}"><h3>${esc(title)}</h3>${glance(xs.map((x) => x.title))}<ul>${xs.map((x) => `<li><b>${esc(x.title)}.</b> ${esc(x.detail)}</li>`).join('')}</ul>${id === 'cs-quick' && h.edge ? `<p class="cs-tip"><b>Your edge here:</b> ${esc(h.edge)}</p>` : ''}<a class="cs-top-link small" href="#cs-top" data-jump>Back to the top</a></article>`; };
    list('cs-quick', 'Quick wins', h.quickWins); list('cs-big', 'Bigger plays', h.bigPlays);
    html += '</div>'; body.push(html); group('cs-ideas', 'Ideas to bring', items);
  }
  if (h?.primers?.length) {
    group('cs-primers', 'In plain English', h.primers.map((p, k) => [`cs-p${k}`, p.term]));
    body.push(`<h2 class="cs-section" id="cs-primers">In plain English</h2><div class="cs-stack">${h.primers.map((p, k) => `<article class="cs-qa card" id="cs-p${k}"><h3>${esc(p.term)}</h3><p>${esc(p.plain)}</p>${p.ifAsked ? `<p class="cs-tip"><b>If asked:</b> <i>“${esc(p.ifAsked)}”</i></p>` : ''}</article>`).join('')}</div>`);
  }
  // Wrap-up
  const wrap = [];
  let w = `<h2 class="cs-section" id="cs-wrap">Wrap-up</h2><div class="cs-stack">`;
  const L = c.logistics;
  if (L) { wrap.push(['cs-logistics', 'Salary, location, start date']); w += `<article class="cs-qa card" id="cs-logistics"><h3>Salary, location, start date</h3>${glance(L.glance)}<div class="cs-answer">${L.salary ? `<p><b>Salary.</b> ${esc(L.salary)}</p>` : ''}${L.salaryScript ? `<p>What to say:</p><p><i>“${esc(L.salaryScript)}”</i></p>` : ''}${L.location ? `<p><b>Location.</b> ${esc(L.location)}</p>` : ''}${L.locationScript ? `<p><i>“${esc(L.locationScript)}”</i></p>` : ''}${L.authorization ? `<p><b>Authorization:</b> ${esc(L.authorization)}</p>` : ''}</div>${L.notes?.length ? `<div class="cs-figure"><span class="cs-label">Things to know before you answer</span><ul>${L.notes.map(labelled).join('')}</ul></div>` : ''}${L.yourCall ? `<p class="cs-flag"><b>Your call:</b> ${esc(L.yourCall)}</p>` : ''}</article>`; }
  if (c.ask?.list?.length) { wrap.push(['cs-ask', `Questions to ask ${first}`]); w += `<article class="cs-qa card" id="cs-ask"><h3>Questions to ask ${esc(first)}</h3>${glance(c.ask.glance)}<ul>${c.ask.list.map(li).join('')}</ul>${c.ask.tip ? `<p class="cs-tip"><b>Tip:</b> ${esc(c.ask.tip)}</p>` : ''}</article>`; }
  wrap.push(['cs-after', 'After the call']);
  w += `<article class="cs-qa card" id="cs-after"><h3>After the call</h3>${(c.after || []).length ? `<ul>${c.after.map(li).join('')}</ul>` : ''}${c.thankYou ? `<span class="cs-label">Thank-you note</span><div class="letter">${esc(c.thankYou)}</div><div class="row"><button class="btn small" data-act="copyty">Copy the note</button></div>` : ''}</article>`;
  wrap.push(['cs-notes', 'Your notes']);
  w += `<article class="cs-qa card" id="cs-notes"><h3>Your notes</h3><p class="small muted">Write down what you learn. The next round’s cheat sheet reads these.</p><textarea id="notes" rows="5" placeholder="How it went, what they care about, what to follow up on">${esc(i.notes || '')}</textarea></article></div>`;
  body.push(w); group('cs-wrap', 'Wrap-up', wrap);
  const navHtml = nav.map((g) => `<div class="cs-group"><a class="cs-cat" href="#${g.id}" data-jump>${esc(g.title)}</a><ul>${g.items.map(([id, t, story]) => `<li><a href="#${id}" data-jump>${esc(t)}</a>${story ? '<span class="cs-story">Your story</span>' : ''}</li>`).join('')}</ul></div>`).join('');
  return `<div class="page cheat2">
<a href="#/interviews" class="small">← Interviews</a>
<div class="head"><div><div class="eyebrow">${esc([i.round, i.with].filter(Boolean).join(' · ') || 'Interview')}</div><h1>${esc(i.company || '')}${i.company ? ': ' : ''}your ${mins ? `${mins} minutes` : 'interview'} with ${esc(first)}</h1>${c.subtitle ? `<p class="muted">${esc(c.subtitle)}</p>` : ''}</div>
<div class="row"><button class="btn secondary" data-act="practice">Practice with Margo</button><button class="btn secondary" data-act="edit">Edit details</button><button class="btn link" data-act="make" data-busy="Researching and writing…">Make it again</button><button class="btn link" data-act="print">Print</button></div></div>
<span data-progress="cheat" class="small muted"></span>
${c.researchNote ? `<div class="note att">${esc(c.researchNote)}</div>` : ''}
<div class="cs-layout">
<aside class="cs-side"><details class="cs-index" open><summary>On this page</summary><nav aria-label="On this page">${navHtml}</nav></details></aside>
<div class="cs-main">${body.join('\n')}
<footer class="cs-foot small muted"><p>Written in your voice from your profile${c.onPaper?.length ? ', the resume and letter you sent' : ''} and the job posting${c.sources?.length ? ', plus public sources' : ''}. Made ${c.at ? esc(new Date(c.at).toLocaleDateString()) : ''}. Check anything you plan to quote.</p>${c.sources?.length ? `<p>Sources: ${c.sources.slice(0, 12).map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>`).join(' · ')}</p>` : ''}</footer></div>
</div></div>`;
}

// Highlight where you are in the side menu, like a table of contents.
function spy(root) {
  const links = [...root.querySelectorAll('.cs-side a[href^="#cs-"]')];
  const targets = links.map((a) => root.querySelector(a.getAttribute('href'))).filter(Boolean);
  const side = root.querySelector('.cs-side');
  if (window.innerWidth <= 960) root.querySelector('.cs-index')?.removeAttribute('open');
  let current = null;
  const update = () => {
    if (!root.isConnected) { window.removeEventListener('scroll', onScroll); return; }
    const line = window.innerHeight * 0.3; let active = targets[0];
    for (const t of targets) { if (t.getBoundingClientRect().top <= line) active = t; else break; }
    if (!active || active === current) return; current = active;
    links.forEach((a) => a.removeAttribute('aria-current'));
    const a = links.find((x) => x.getAttribute('href') === `#${active.id}` && !x.classList.contains('cs-cat')) || links.find((x) => x.getAttribute('href') === `#${active.id}`);
    if (a) { a.setAttribute('aria-current', 'true'); a.closest('.cs-group')?.querySelector('.cs-cat')?.setAttribute('aria-current', 'true'); }
    if (a && side && getComputedStyle(side).position === 'sticky') { const r = a.getBoundingClientRect(), b = side.getBoundingClientRect(); if (r.top < b.top + 40 || r.bottom > b.bottom - 40) side.scrollTop += r.top - b.top - b.height / 3; }
  };
  let ticking = false;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}
