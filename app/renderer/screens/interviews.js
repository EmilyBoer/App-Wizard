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
    root.innerHTML = `<div class="page">
<a href="#/interviews" class="small">← Interviews</a>
<div class="head"><div><div class="eyebrow">${esc(when(i.start))}${i.round ? ` · ${esc(i.round)}` : ''}${i.with ? ` · ${esc(i.with)}` : ''}</div><h1>${esc(i.role || 'Interview')}${i.company ? ` · ${esc(i.company)}` : ''}</h1></div>
<div class="row"><button class="btn" data-act="edit">Edit details</button><button class="btn" data-act="practice">Practice with Margot</button><button class="btn ${c ? '' : 'primary'}" data-act="make" data-busy="Researching and writing…">${c ? 'Make it again' : 'Make my cheat sheet'}</button><button class="btn" data-act="print">Print</button></div></div>
<span data-progress="cheat" class="small muted"></span>
${!c ? '<div class="empty"><b>No cheat sheet yet.</b><span class="muted small">We’ll read the company’s own website and the job posting, then outline answers using your real results.</span></div>' : `
${c.researchNote ? `<div class="note att">${esc(c.researchNote)}</div>` : ''}
<div class="grid">
<section class="card"><h2>The company</h2><p>${esc(c.company?.about || '')}</p>${(c.company?.recent || []).length ? `<b class="small">Recent</b><ul class="small" style="margin:0;padding-left:18px">${c.company.recent.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${(c.company?.values || []).length ? `<b class="small">What they care about</b><div class="row">${c.company.values.map((x) => tag(x, 'info')).join('')}</div>` : ''}</section>
<section class="card"><h2>The role</h2><p>${esc(c.role?.focus || '')}</p><ul class="small" style="margin:0;padding-left:18px">${(c.role?.theyNeed || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
</div>
<section class="card featured"><h2>Tell me about yourself</h2><p style="font-size:18px;line-height:28px">${esc(c.pitch || '')}</p></section>
<section class="stack"><h2>Likely questions</h2>${(c.questions || []).map((q) => `<details class="card tight" open><summary><b>${esc(q.q)}</b></summary><p style="margin-top:8px">${esc(q.answer)}</p>${q.from?.length ? `<span class="tiny muted">From your profile</span>` : ''}</details>`).join('')}</section>
<div class="grid">
<section class="card"><h2>Ask them</h2><ul style="margin:0;padding-left:18px">${(c.askThem || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
<section class="card"><h2>Watch-outs</h2><ul style="margin:0;padding-left:18px">${(c.watchOuts || []).map((x) => `<li>${esc(x)}</li>`).join('') || '<li class="muted">None.</li>'}</ul></section>
</div>`}
<section class="card"><h2>Your notes</h2><textarea id="notes" placeholder="Anything you want to remember. After the interview, jot down how it went.">${esc(i.notes || '')}</textarea></section>
</div>`;
    root.querySelector('#notes').onchange = (e) => call('interviews.update', { id, notes: e.target.value }).then(() => toast('Saved.'));
    root.__i = i;
  };
  on(root, {
    make: (b) => act(b, async () => { await call('interviews.cheat', { id }); paint(); }),
    print: () => window.print(),
    practice: () => app.openChat(null, `Let's practice for my ${root.__i.company} interview. Ask me one likely question at a time and give me feedback.`),
    edit: () => { const i = root.__i; modal(`<h2>Interview details</h2><div class="grid"><label class="field">Date and time<input type="datetime-local" id="d" value="${i.start ? new Date(new Date(i.start).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}"></label><label class="field">Round<input type="text" id="r" value="${esc(i.round || '')}"></label><label class="field">With<input type="text" id="w" value="${esc(i.with || '')}"></label><label class="field">Format<input type="text" id="f" value="${esc(i.format || '')}"></label></div><div class="row"><button class="btn primary" id="s">Save</button><button class="btn" data-close>Cancel</button><button class="btn danger" id="x">Delete interview</button></div>`, { onMount: (m, close) => { m.querySelector('#s').onclick = async () => { await call('interviews.update', { id, start: m.querySelector('#d').value ? new Date(m.querySelector('#d').value).toISOString() : null, round: m.querySelector('#r').value, with: m.querySelector('#w').value, format: m.querySelector('#f').value }); close(); paint(); }; m.querySelector('#x').onclick = async () => { if (confirm('Delete this interview?')) { await call('interviews.remove', { id }); close(); app.go('#/interviews'); } }; } }); },
  });
  root.innerHTML = `<div class="page">${working('Loading…')}</div>`;
  await paint();
}
