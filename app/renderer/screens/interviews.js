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
    root.innerHTML = cheatPage(i, c);
    root.querySelector('#notes').onchange = (e) => call('interviews.update', { id, notes: e.target.value }).then(() => toast('Saved.'));
    // Jump links scroll within the page (the address keeps pointing at this interview).
    root.querySelectorAll('[data-jump]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); root.querySelector(`#cs-${a.dataset.jump}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); root.querySelectorAll('.cheat-nav a').forEach((x) => x.classList.toggle('on', x === a)); }));
    root.__i = i;
  };
  on(root, {
    make: (b) => act(b, async () => { await call('interviews.cheat', { id }); paint(); }),
    print: () => window.print(),
    copyty: () => navigator.clipboard.writeText(root.__i.cheat?.thankYou || '').then(() => toast('Copied.')),
    practice: () => app.openChat(null, `Let's practice for my ${root.__i.company} interview. Ask me one likely question at a time and give me feedback.`),
    edit: () => { const i = root.__i; modal(`<h2>Interview details</h2><div class="grid"><label class="field">Date and time<input type="datetime-local" id="d" value="${i.start ? new Date(new Date(i.start).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}"></label><label class="field">Round<input type="text" id="r" value="${esc(i.round || '')}"></label><label class="field">With<input type="text" id="w" value="${esc(i.with || '')}"></label><label class="field">Format<input type="text" id="f" value="${esc(i.format || '')}"></label></div><div class="row"><button class="btn primary" id="s">Save</button><button class="btn" data-close>Cancel</button><button class="btn danger" id="x">Delete interview</button></div>`, { onMount: (m, close) => { m.querySelector('#s').onclick = async () => { await call('interviews.update', { id, start: m.querySelector('#d').value ? new Date(m.querySelector('#d').value).toISOString() : null, round: m.querySelector('#r').value, with: m.querySelector('#w').value, format: m.querySelector('#f').value }); close(); paint(); }; m.querySelector('#x').onclick = async () => { if (confirm('Delete this interview?')) { await call('interviews.remove', { id }); close(); app.go('#/interviews'); } }; } }); },
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
