import { call, esc, tag, toast, on, modal, STATUS_TAG } from '../lib.js';

export async function render(root, _p, app, name) {
  const embedded = name === 'embedded';
  let view = sessionStorage.getItem('aw-tracker-view') || 'board';
  let filter = 'active';
  const paint = async () => {
    const { list, statuses, labels } = await call('tracker.list');
    const active = ['saved', 'ready', 'applied', 'interviewing', 'offer'];
    const shown = list.filter((t) => filter === 'all' || (filter === 'active' ? active.includes(t.status) : t.status === filter));
    const today = new Date().toISOString().slice(0, 10);
    root.innerHTML = `<div class="${embedded ? 'stack' : 'page'}">
<div class="head"><div>${embedded ? '<h2>Your journey</h2>' : '<h1>Your journey</h1>'}<p class="muted small">Every job you’ve saved, applied to or heard back from, with the exact files you sent.</p></div>
<div class="row"><button class="btn" data-act="view">${view === 'board' ? 'Show as a table' : 'Show as a board'}</button><button class="btn" data-act="csv">Download as spreadsheet (CSV)</button><button class="btn secondary" data-act="addapplied">Add a job I applied to</button></div></div>
<div class="row">${['active', 'all', ...statuses].map((s) => `<button class="chip" aria-pressed="${filter === s}" data-act="filter" data-s="${s}">${s === 'active' ? 'Active' : s === 'all' ? 'Everything' : labels[s]} (${s === 'all' ? list.length : s === 'active' ? list.filter((t) => active.includes(t.status)).length : list.filter((t) => t.status === s).length})</button>`).join('')}</div>
${!list.length ? '<div class="empty"><b>Nothing tracked yet.</b><span class="muted small">Say yes to a job, make an application, or add one you applied to elsewhere.</span></div>' : view === 'board' ? `
<div class="kanban">${(filter === 'active' ? active : filter === 'all' ? statuses : [filter]).map((s) => { const items = shown.filter((t) => t.status === s); return `<div class="lane"><h3><span>${labels[s]}</span><span class="muted">${items.length}</span></h3>${items.map((t) => card(t, today)).join('') || '<span class="tiny muted">None</span>'}</div>`; }).join('')}</div>` : `
<div class="scrollx"><table class="t"><thead><tr><th>Job</th><th>Status</th><th>Fit</th><th>Pay</th><th>Found</th><th>Applied</th><th>Files</th><th>Next</th></tr></thead><tbody>
${shown.map((t) => `<tr><td><b>${t.jobId ? `<a href="#/job/${encodeURIComponent(t.jobId)}">${esc(t.title)}</a>` : esc(t.title)}</b><br><span class="small muted">${esc(t.company)}${t.location ? ` · ${esc(t.location)}` : ''}</span></td>
<td><select data-status="${t.id}" style="width:auto;padding:4px 8px">${statuses.map((s) => `<option value="${s}" ${s === t.status ? 'selected' : ''}>${labels[s]}</option>`).join('')}</select></td>
<td class="small">${esc(t.fit || '')}${t.rationale ? `<br><span class="muted">${esc(t.rationale)}</span>` : ''}</td><td class="small">${esc(t.salary || '')}</td><td class="small">${(t.dateFound || '').slice(0, 10)}</td><td class="small">${(t.dateApplied || '').slice(0, 10)}</td>
<td class="small">${t.resumeDocId ? `<a href="#/doc/${t.resumeDocId}">Resume</a>` : ''}${t.letterDocId ? ` · <a href="#/doc/${t.letterDocId}">Letter</a>` : ''}</td>
<td class="small">${nextFollow(t, today)} <button class="btn link small" data-act="open" data-id="${t.id}">Details</button></td></tr>`).join('')}
</tbody></table></div>`}
</div>`;
    root.querySelectorAll('[data-status]').forEach((s) => (s.onchange = async () => { await call('tracker.status', { id: s.dataset.status, status: s.value }); toast('Updated.'); paint(); app.refresh(); }));
    root.__list = list; root.__labels = labels; root.__statuses = statuses;
  };
  const card = (t, today) => `<button class="mini" data-act="open" data-id="${t.id}" style="text-align:left;cursor:pointer"><b>${esc(t.title)}</b><span class="muted">${esc(t.company)}</span>${t.salary ? `<span class="muted">${esc(t.salary)}</span>` : ''}${nextFollow(t, today) ? `<span>${nextFollow(t, today)}</span>` : ''}</button>`;
  on(root, {
    view: () => { view = view === 'board' ? 'table' : 'board'; try { sessionStorage.setItem('aw-tracker-view', view); } catch {} paint(); },
    filter: (b) => { filter = b.dataset.s; paint(); },
    csv: async () => { const csv = await call('tracker.csv'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `App_Wizard_Tracker_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); },
    addapplied: () => modal(`<h2>Add a job you applied to</h2><div class="grid"><label class="field">Job title<input type="text" id="at"></label><label class="field">Company<input type="text" id="ac"></label><label class="field">Link (optional)<input type="url" id="au"></label><label class="field">Pay (optional)<input type="text" id="as"></label></div><div class="row"><button class="btn primary" id="aadd">Add</button><button class="btn" data-close>Cancel</button></div>`, {
      onMount: (m, close) => { m.querySelector('#aadd').onclick = async () => { const r = await call('tracker.addManual', { title: m.querySelector('#at').value, company: m.querySelector('#ac').value, url: m.querySelector('#au').value, salary: m.querySelector('#as').value, status: 'applied' }); close(); toast(r.duplicate ? 'That job is already in your tracker.' : 'Added.'); paint(); }; },
    }),
    open: (b) => {
      const t = root.__list.find((x) => x.id === b.dataset.id);
      modal(`<div class="row between"><div>${tag(root.__labels[t.status], STATUS_TAG[t.status])}<h2 style="margin-top:6px">${esc(t.title)}</h2><div class="muted">${esc([t.company, t.location, t.salary].filter(Boolean).join(' · '))}</div></div></div>
${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener">Open the posting</a>` : ''}
${t.rationale ? `<div class="note muted"><b>Why it fit:</b> ${esc(t.rationale)}</div>` : ''}
<label class="field">Status<select id="st">${root.__statuses.map((s) => `<option value="${s}" ${s === t.status ? 'selected' : ''}>${root.__labels[s]}</option>`).join('')}</select></label>
<div class="stack-s"><b class="small">Files sent</b><span class="small">${t.resumeDocId ? `<a href="#/doc/${t.resumeDocId}" data-close>${esc(t.resumeFile || 'Resume')}</a>` : 'No resume made in Job Wizard.'}${t.letterDocId ? `<br><a href="#/doc/${t.letterDocId}" data-close>${esc(t.letterFile || 'Cover letter')}</a>` : ''}</span></div>
<div class="stack-s"><b class="small">Follow-ups</b>${t.followUps.map((f) => `<label class="radio"><input type="checkbox" data-f="${f.id}" ${f.done ? 'checked' : ''}>${esc(f.due)}: ${esc(f.note)}</label>`).join('') || '<span class="small muted">None.</span>'}<div class="row"><input type="date" id="fd" style="width:auto"><input type="text" id="fn" placeholder="What to do" style="flex:1 1 200px"><button class="btn small" id="fadd">Add</button></div></div>
<label class="field">Notes<textarea id="nt">${esc(t.notes)}</textarea></label>
<details><summary class="small">History</summary><ul class="small">${t.history.map((h) => `<li>${esc(h.at.slice(0, 10))}: ${esc(root.__labels[h.status] || h.status)}${h.note ? ` (${esc(h.note)})` : ''}</li>`).join('')}</ul></details>
<div class="row"><button class="btn primary" id="tsave">Save</button><button class="btn" data-close>Close</button><button class="btn danger" id="tdel">Remove from tracker</button></div>`, {
        onMount: (m, close) => {
          m.querySelectorAll('[data-f]').forEach((c) => (c.onchange = () => call('tracker.followUp', { id: t.id, followId: c.dataset.f, done: c.checked })));
          m.querySelector('#fadd').onclick = async () => { await call('tracker.followUp', { id: t.id, due: m.querySelector('#fd').value, note: m.querySelector('#fn').value }); close(); paint(); };
          m.querySelector('#tsave').onclick = async () => { if (m.querySelector('#st').value !== t.status) await call('tracker.status', { id: t.id, status: m.querySelector('#st').value }); await call('tracker.update', { id: t.id, notes: m.querySelector('#nt').value }); close(); toast('Saved.'); paint(); app.refresh(); };
          m.querySelector('#tdel').onclick = async () => { if (confirm('Remove this job from your tracker?')) { await call('tracker.remove', { id: t.id }); close(); paint(); } };
        },
      });
    },
  });
  await paint();
}
function nextFollow(t, today) {
  const f = t.followUps.find((x) => !x.done);
  if (!f) return '';
  return f.due <= today ? `<span style="color:var(--alert);font-weight:600">Follow up today</span>` : `<span class="muted">Follow up ${esc(f.due)}</span>`;
}
