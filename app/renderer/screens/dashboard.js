import { call, esc, tag, act, toast, on, modal, posted, ago, STATUS_TAG, sparkle, readFiles, dropZone } from '../lib.js';
import * as tracker from './tracker.js';

export async function render(root, _p, app) {
  let showWeak = false;
  const paint = async () => {
    const [o, { jobs, lastFetch, hiddenCount }, tr] = await Promise.all([call('app.overview'), call('jobs.list'), call('tracker.list')]);
    const unrated = jobs.filter((j) => !j.rated);
    const fresh = showWeak ? unrated : unrated.filter((j) => j.score == null || j.score >= 25 || j.fromAlert || j.addedBy);
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
${!o.hasKey ? `<div class="note att">Connect Claude in the <a href="#/claude">Claude tab</a> so we can read and write for you.</div>` : ''}
${o.pending ? `<div class="note info">${o.pending} thing${o.pending > 1 ? 's' : ''} in your experience to check. <a href="#/setup/3">Take a look</a></div>` : ''}
${o.followUps.length ? `<div class="note att"><b>Follow-ups due:</b> ${o.followUps.map((f) => `${esc(f.company)} (${esc(f.title)})`).join(', ')}. See them in Your journey below.</div>` : ''}
<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
${[['New matches', fresh.length, '#/journey'], ['Ready to apply', ready.length, '#/journey'], ['Applied', o.counts.applied, '#/journey'], ['Interviewing', o.counts.interviewing, '#/interviews'], ['Offers', o.counts.offer, '#/journey']].map(([l, n, h]) => `<a class="stat" href="${h}"><span class="small muted">${l}</span><b>${n || 0}</b></a>`).join('')}
</div>
${o.lastBatch ? `<details class="card quiet tight"><summary class="small"><b>Morning check</b> · ${esc(ago(o.lastBatch.at))} · ${o.lastBatch.made} made ready</summary><ul class="small">${o.lastBatch.log.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></details>` : ''}

${ready.length ? `<section class="stack"><h2>Ready for you to send</h2><div class="grid">${ready.map((t) => pipeCard(t)).join('')}</div></section>` : ''}

<section class="stack"><div class="row between"><h2>New matches</h2><span class="small muted">${lastFetch ? `Checked ${esc(ago(lastFetch))}` : ''}${weak ? ` · <button class="btn link" data-act="weak">Show ${weak} that fit less well</button>` : ''}${hiddenCount ? ` · <button class="btn link" data-act="hidden">${hiddenCount} hidden by your rules</button>` : ''}</span></div>
${fresh.length ? `<div class="grid">${fresh.slice(0, 24).map((j) => jobCard(j)).join('')}</div>` : (lastFetch
      // Locked copy (decisions log, 2026-10-28 10:17pm). "Widen my search" shows the matches that fit less well, or opens What you want.
      ? `<div class="empty">${sparkle(24)}<b>A quiet morning</b><span class="muted small">Nothing new is worth your time. We’ll look again tomorrow, or we can widen your search.</span>${weak ? '<button class="btn secondary" data-act="weak">Widen my search</button>' : '<a class="btn secondary" href="#/setup/6">Widen my search</a>'}</div>`
      : `<div class="empty">${sparkle(24)}<b>No new matches yet.</b><span class="muted small">Add jobs from a screenshot of a job alert, a link or an alert email, or watch more companies in Profile.</span></div>`)}</section>
<div id="board"></div>
</div>`;
    await tracker.render(root.querySelector('#board'), [], app, 'embedded');
  };
  const pipeCard = (t) => `<a class="job" href="${t.jobId ? `#/job/${encodeURIComponent(t.jobId)}` : '#/tracker'}"><div class="row between">${tag(tr_label(t.status), STATUS_TAG[t.status])}</div><div class="t">${esc(t.title)}</div><div class="small muted">${esc([t.company, t.salary, t.location].filter(Boolean).join(' · '))}</div>${t.status === 'ready' ? '<span class="small"><b>Resume and letter ready.</b> Check and send.</span>' : ''}</a>`;
  // No fit labels: one plain sentence about why, and the next step.
  const jobCard = (j) => { const href = `#/job/${encodeURIComponent(j.id)}`; return `<article class="job"><div class="row between">${j.needsText ? tag(j.fromAlert ? `From ${j.fromAlert}` : 'Added by you', 'muted') : '<span></span>'}<span class="score muted">${esc(posted(j))}</span></div><a class="t" href="${href}" style="text-decoration:none">${esc(j.title)}</a><div class="small muted">${esc([j.company, j.location, j.pay].filter(Boolean).join(' · '))}</div>${j.needsText ? `<span class="why">Paste the description so we can check the fit.</span><a class="btn small secondary" href="${href}">Paste the description</a>` : `<span class="why">${esc(j.why || (j.scoreReasons || []).join(' · '))}</span><a class="btn small primary" href="${href}/draft">Draft my application</a>`}</article>`; };
  on(root, {
    weak: () => { showWeak = true; paint(); },
    refresh: (b) => act(b, async () => { const r = await call('jobs.refresh'); toast(`${r.kept} matches, ${r.hidden} hidden by your rules.`); paint(); app.refresh(); }),
    batch: (b) => act(b, async () => { const r = await call('batch.run'); toast(`${r.made} application${r.made === 1 ? '' : 's'} ready.`); paint(); app.refresh(); }),
    hidden: async () => {
      const { jobs } = await call('jobs.list', { view: 'hidden' });
      modal(`<h2>Hidden by your rules</h2><p class="muted">These matched your job sites but broke a rule you set. Change rules in Profile, What we’ve learned, or in Setup, What you want.</p><div class="list">${jobs.slice(0, 60).map((j) => `<div class="item"><div class="grow"><div><a href="#/job/${encodeURIComponent(j.id)}" data-close>${esc(j.title)}</a> · ${esc(j.company)}</div><div class="small muted">${esc((j.hiddenBecause || []).join(' '))}</div></div></div>`).join('')}</div><button class="btn" data-close>Close</button>`, { wide: true });
    },
    add: () => modal(`<h2>Add jobs</h2>
<div class="stack-s"><b>A screenshot of a job alert</b><span class="small muted">From LinkedIn, Indeed, Google job alerts or any email listing jobs. Take a screenshot, then paste it here (Cmd+V) or choose the file.</span>
<div class="drop" id="shotdrop" style="padding:16px"><div class="row"><label class="btn secondary">Choose screenshots<input type="file" multiple class="sr" id="shots" accept=".png,.jpg,.jpeg,.webp,.gif"></label><span class="small muted">or press Cmd+V</span></div><span data-progress="jobs" class="small muted" aria-live="polite"></span></div></div>
<div class="stack-s"><b>A job link</b><span class="small muted">From a company site or hiring system. We check it’s still open.</span><div class="row"><input type="url" id="link" placeholder="https://…" style="flex:1 1 300px"><button class="btn secondary" id="addlink" data-busy="Checking…">Add</button></div></div>
<div class="stack-s"><b>A job alert email</b><span class="small muted">Open a LinkedIn, Indeed or other job alert email, select all, copy, and paste it here. <a href="#/help/alerts" data-close>How this works</a></span><textarea id="alert" style="min-height:140px"></textarea><button class="btn secondary" id="addalert" data-busy="Reading…" style="align-self:flex-start">Add jobs from email</button></div>
<div class="stack-s"><b>Or paste a job description</b><div class="grid"><input type="text" id="jt" placeholder="Job title"><input type="text" id="jc" placeholder="Company"></div><textarea id="jd" placeholder="Paste the job description"></textarea><button class="btn secondary" id="addtext" style="align-self:flex-start">Add job</button></div>
<button class="btn" data-close>Done</button>`, {
      onMount: (m, close) => {
        const readShots = async (files) => {
          const prog = m.querySelector('#shotdrop [data-progress]');
          prog.innerHTML = '<span class="spin"></span> Reading your screenshot…';
          try {
            const r = await call('jobs.addScreenshot', { files: await readFiles(files) });
            toast(`Added ${r.added} job${r.added === 1 ? '' : 's'} from ${r.sources.join(', ') || 'your screenshot'}.${r.dupes ? ` ${r.dupes} you already had.` : ''} Open each one to paste its description and check the fit.`);
            close(); paint(); app.refresh();
          } catch (e) { prog.textContent = ''; toast(e.message, true); }
        };
        dropZone(m.querySelector('#shotdrop'), m.querySelector('#shots'), readShots);
        const onPaste = (e) => { const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/')); if (files.length) { e.preventDefault(); readShots(files); } };
        document.addEventListener('paste', onPaste);
        new MutationObserver((_, obs) => { if (!m.isConnected) { document.removeEventListener('paste', onPaste); obs.disconnect(); } }).observe(document.body, { childList: true });
        m.querySelector('#addlink').onclick = (e) => act(e.target, async () => { const j = await call('jobs.addLink', { url: m.querySelector('#link').value.trim() }); close(); app.go(`#/job/${encodeURIComponent(j.id)}`); });
        m.querySelector('#addalert').onclick = (e) => act(e.target, async () => { const r = await call('jobs.addAlert', { text: m.querySelector('#alert').value }); toast(`Added ${r.added} job${r.added === 1 ? '' : 's'}.${r.needText ? ` ${r.needText} need the description pasted in to check the fit.` : ''}`); close(); paint(); });
        m.querySelector('#addtext').onclick = (e) => act(e.target, async () => { const j = await call('jobs.addLink', { title: m.querySelector('#jt').value, company: m.querySelector('#jc').value, text: m.querySelector('#jd').value }); close(); app.go(`#/job/${encodeURIComponent(j.id)}`); });
      },
    }),
  });
  await paint();
}
const tr_label = (s) => ({ found: 'Found', saved: 'Saved', ready: 'Ready to apply', applied: 'Applied', interviewing: 'Interviewing', offer: 'Offer', rejected: 'Not moving forward', skipped: 'Skipped', closed: 'Closed' })[s] || s;
