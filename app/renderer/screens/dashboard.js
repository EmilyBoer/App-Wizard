import { call, esc, tag, act, toast, on, modal, posted, ago, BUCKET, VERDICT, STATUS_TAG, sparkle } from '../lib.js';
import * as tracker from './tracker.js';

export async function render(root, _p, app) {
  let showWeak = false;
  const paint = async () => {
    const [o, { jobs, lastFetch, hiddenCount }, tr] = await Promise.all([call('app.overview'), call('jobs.list'), call('tracker.list')]);
    const unrated = jobs.filter((j) => !j.rated);
    const fresh = showWeak ? unrated : unrated.filter((j) => j.score == null || j.score >= 25);
    const weak = unrated.length - fresh.length;
    const ready = tr.list.filter((t) => t.status === 'ready');
    const pipeline = tr.list.filter((t) => ['saved', 'ready'].includes(t.status));
    const applied = tr.list.filter((t) => ['applied', 'interviewing', 'offer'].includes(t.status));
    const name = (o.account?.name || '').split(' ')[0];
    const hour = new Date().getHours();
    root.innerHTML = `<div class="page">
<div class="head"><div><div class="eyebrow">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div><h1>Good ${hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}${name ? `, ${esc(name)}` : ''}.</h1>
<p class="muted">${ready.length ? `${ready.length} application${ready.length > 1 ? 's are' : ' is'} ready for you to check and send.` : fresh.length ? `${fresh.length} new match${fresh.length > 1 ? 'es' : ''} to look at.` : 'Nothing new yet. Check your job sites or add a job.'}</p></div>
<div class="row"><button class="btn" data-act="add">Add jobs</button><button class="btn secondary" data-act="refresh" data-busy="Checking job sites…">Check for new jobs</button><button class="btn primary" data-act="batch" data-busy="Getting applications ready…">Get applications ready</button></div></div>
${!o.hasKey ? `<div class="note att">Add your Claude API key in <a href="#/profile/settings">Profile, Claude and schedule</a> so Job Wizard can read and write for you.</div>` : ''}
${o.pending ? `<div class="note info">${o.pending} thing${o.pending > 1 ? 's' : ''} in your experience to check. <a href="#/setup/3">Take a look</a></div>` : ''}
${o.followUps.length ? `<div class="note att"><b>Follow-ups due:</b> ${o.followUps.map((f) => `${esc(f.company)} (${esc(f.title)})`).join(', ')}. See them in Your journey below.</div>` : ''}
<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
${[['New matches', fresh.length, '#/journey'], ['Ready to apply', ready.length, '#/journey'], ['Applied', o.counts.applied, '#/journey'], ['Interviewing', o.counts.interviewing, '#/interviews'], ['Offers', o.counts.offer, '#/journey']].map(([l, n, h]) => `<a class="stat" href="${h}"><span class="small muted">${l}</span><b>${n || 0}</b></a>`).join('')}
</div>
${o.lastBatch ? `<details class="card quiet tight"><summary class="small"><b>Morning batch</b> · ${esc(ago(o.lastBatch.at))} · ${o.lastBatch.made} made ready</summary><ul class="small">${o.lastBatch.log.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></details>` : ''}

${ready.length ? `<section class="stack"><h2>Ready for you to send</h2><div class="grid">${ready.map((t) => pipeCard(t)).join('')}</div></section>` : ''}

<section class="stack"><div class="row between"><h2>New matches</h2><span class="small muted">${lastFetch ? `Checked ${esc(ago(lastFetch))}` : ''}${weak ? ` · <button class="btn link" data-act="weak">Show ${weak} weaker match${weak > 1 ? 'es' : ''}</button>` : ''}${hiddenCount ? ` · <button class="btn link" data-act="hidden">${hiddenCount} hidden by your rules</button>` : ''}</span></div>
${fresh.length ? `<div class="grid">${fresh.slice(0, 24).map((j, i) => jobCard(j, i === 0)).join('')}</div>` : `<div class="empty">${sparkle(24)}<b>No new matches right now.</b><span class="muted small">Add companies to watch in Profile, or paste a job link or alert email with Add jobs.</span></div>`}</section>
<div id="board"></div>
</div>`;
    await tracker.render(root.querySelector('#board'), [], app, 'embedded');
  };
  const pipeCard = (t) => `<a class="job" href="${t.jobId ? `#/job/${encodeURIComponent(t.jobId)}` : '#/tracker'}"><div class="row between">${tag(tr_label(t.status), STATUS_TAG[t.status])}${t.fit ? tag((VERDICT[t.fit] || [t.fit])[0], (VERDICT[t.fit] || [0, 'muted'])[1]) : ''}</div><div class="t">${esc(t.title)}</div><div class="small muted">${esc([t.company, t.salary, t.location].filter(Boolean).join(' · '))}</div>${t.status === 'ready' ? '<span class="small"><b>Resume and letter ready.</b> Check and send.</span>' : ''}</a>`;
  const jobCard = (j, top) => `<a class="job ${top ? 'top' : ''}" href="#/job/${encodeURIComponent(j.id)}"><div class="row between">${j.verdict ? tag(VERDICT[j.verdict][0], VERDICT[j.verdict][1]) : j.bucket ? tag(BUCKET[j.bucket][0] + ' match', BUCKET[j.bucket][1]) : ''}<span class="score muted">${esc(posted(j))}</span></div><div class="t">${esc(j.title)}</div><div class="small muted">${esc([j.company, j.location, j.pay].filter(Boolean).join(' · '))}</div>${j.needsText ? '<span class="small" style="color:var(--attention)">Paste the description to check the fit.</span>' : `<span class="small">${esc(j.why || (j.scoreReasons || []).join(' · '))}</span>`}</a>`;
  on(root, {
    weak: () => { showWeak = true; paint(); },
    refresh: (b) => act(b, async () => { const r = await call('jobs.refresh'); toast(`${r.kept} matches, ${r.hidden} hidden by your rules.`); paint(); app.refresh(); }),
    batch: (b) => act(b, async () => { const r = await call('batch.run'); toast(`${r.made} application${r.made === 1 ? '' : 's'} ready.`); paint(); app.refresh(); }),
    hidden: async () => {
      const { jobs } = await call('jobs.list', { view: 'hidden' });
      modal(`<h2>Hidden by your rules</h2><p class="muted">These matched your job sites but broke a rule you set. Change rules in Profile, What we’ve learned, or in Setup, What you want.</p><div class="list">${jobs.slice(0, 60).map((j) => `<div class="item"><div class="grow"><div><a href="#/job/${encodeURIComponent(j.id)}" data-close>${esc(j.title)}</a> · ${esc(j.company)}</div><div class="small muted">${esc((j.hiddenBecause || []).join(' '))}</div></div></div>`).join('')}</div><button class="btn" data-close>Close</button>`, { wide: true });
    },
    add: () => modal(`<h2>Add jobs</h2>
<div class="stack-s"><b>A job link</b><span class="small muted">From a company site or hiring system. We check it’s still open.</span><div class="row"><input type="url" id="link" placeholder="https://…" style="flex:1 1 300px"><button class="btn secondary" id="addlink" data-busy="Checking…">Add</button></div></div>
<div class="stack-s"><b>A job alert email</b><span class="small muted">Open a LinkedIn, Indeed or other job alert email, select all, copy, and paste it here. <a href="#/help/alerts" data-close>How this works</a></span><textarea id="alert" style="min-height:140px"></textarea><button class="btn secondary" id="addalert" data-busy="Reading…" style="align-self:flex-start">Add jobs from email</button></div>
<div class="stack-s"><b>Or paste a job description</b><div class="grid"><input type="text" id="jt" placeholder="Job title"><input type="text" id="jc" placeholder="Company"></div><textarea id="jd" placeholder="Paste the job description"></textarea><button class="btn secondary" id="addtext" style="align-self:flex-start">Add job</button></div>
<button class="btn" data-close>Done</button>`, {
      onMount: (m, close) => {
        m.querySelector('#addlink').onclick = (e) => act(e.target, async () => { const j = await call('jobs.addLink', { url: m.querySelector('#link').value.trim() }); close(); app.go(`#/job/${encodeURIComponent(j.id)}`); });
        m.querySelector('#addalert').onclick = (e) => act(e.target, async () => { const r = await call('jobs.addAlert', { text: m.querySelector('#alert').value }); toast(`Added ${r.added} job${r.added === 1 ? '' : 's'}.${r.needText ? ` ${r.needText} need the description pasted in to check the fit.` : ''}`); close(); paint(); });
        m.querySelector('#addtext').onclick = (e) => act(e.target, async () => { const j = await call('jobs.addLink', { title: m.querySelector('#jt').value, company: m.querySelector('#jc').value, text: m.querySelector('#jd').value }); close(); app.go(`#/job/${encodeURIComponent(j.id)}`); });
      },
    }),
  });
  await paint();
}
const tr_label = (s) => ({ found: 'Found', saved: 'Saved', ready: 'Ready to apply', applied: 'Applied', interviewing: 'Interviewing', offer: 'Offer', rejected: 'Not moving forward', skipped: 'Skipped', closed: 'Closed' })[s] || s;
