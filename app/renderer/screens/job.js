import { call, esc, tag, act, toast, on, modal, posted, VERDICT, STATUS_TAG, working, aw } from '../lib.js';

const FIT = { direct: ['Direct', 'var(--good)'], related: ['Related', 'var(--info)'], gap: ['Gap', 'var(--attention)'] };

export async function render(root, [jobId], app) {
  let profile = await call('profile.get');
  const bulletText = (id) => { for (const r of profile.roles) for (const b of r.bullets) if (b.id === id) return b.text; return null; };
  const paint = async () => {
    const j = await call('jobs.get', { id: jobId });
    const m = j.match;
    const resume = j.documents.find((d) => d.kind === 'resume'), letter = j.documents.find((d) => d.kind === 'letter');
    const t = j.tracker;
    root.innerHTML = `<div class="page"><div class="split">
<section class="main">
  <a href="#/dashboard" class="small">← All jobs</a>
  <div><div class="row">${t ? tag(trLabel(t.status), STATUS_TAG[t.status]) : ''}${m ? tag(VERDICT[m.verdict]?.[0] || m.verdict, VERDICT[m.verdict]?.[1] || 'muted') : ''}<span class="small muted">${esc(posted(j))}</span></div>
  <h1>${esc(j.title)}</h1><div style="font-size:18px">${esc([j.company, j.location, j.payText].filter(Boolean).join(' · '))}</div>
  ${j.url ? `<a href="${esc(j.url)}" target="_blank" rel="noopener" class="small">Open the posting</a>` : ''}</div>
  ${j.hiddenBecause?.length ? `<div class="note att">Hidden from your matches: ${esc(j.hiddenBecause.join(' '))}</div>` : ''}
  ${!j.description ? `<section class="card featured"><h2>Paste the job description</h2><p class="muted">${j.fromAlert ? `${esc(j.fromAlert)} doesn’t let us read the job. ` : ''}Open the posting, copy the description, and paste it here so we can check the fit and write your application.</p>
  <div class="grid"><input type="text" id="tt" value="${esc(j.title)}" placeholder="Title"><input type="text" id="tc" value="${esc(j.company)}" placeholder="Company"><input type="text" id="tl" value="${esc(j.location || '')}" placeholder="Location"></div><textarea id="td" style="min-height:180px"></textarea><button class="btn primary" data-act="settext" style="align-self:flex-start">Save</button></section>` : ''}

  ${j.description ? `<section class="stack"><h2>Why it’s a match</h2>
  ${m ? `<p>${esc(m.why)}</p>
  <div class="fitgrid">
    <div><div class="small muted">Qualified</div><b style="color:${m.qualified?.ok ? 'var(--good)' : 'var(--attention)'}">${m.qualified?.ok ? '✓ Yes' : 'Partly'}</b><div class="small">${(m.mustHaves || []).filter((x) => x.fit !== 'gap').length} of ${(m.mustHaves || []).length} must-haves</div></div>
    <div><div class="small muted">Direction</div><b>${esc(cap(m.direction?.label))}</b><div class="small">${esc(m.direction?.note || '')}</div></div>
    <div><div class="small muted">Mission</div><b>${esc(cap(m.mission?.label))}</b><div class="small">${esc(m.mission?.note || '')}</div></div>
    <div><div class="small muted">Practical</div><b style="color:${m.practical?.ok ? 'var(--good)' : 'var(--attention)'}">${m.practical?.ok ? '✓ Passes' : 'Check'}</b><div class="small">${esc(m.practical?.note || '')}</div></div>
  </div>
  <div class="scrollx"><table class="t"><thead><tr><th>They want</th><th>From your profile</th><th>Fit</th></tr></thead><tbody>
  ${(m.mustHaves || []).map((x) => `<tr><td>${esc(x.want)}</td><td class="${x.bulletId ? '' : 'muted'}">${esc(bulletText(x.bulletId) || 'Not in your profile yet')}</td><td style="color:${FIT[x.fit]?.[1]};font-weight:600">${FIT[x.fit]?.[0] || ''}</td></tr>`).join('')}
  </tbody></table></div>
  ${(m.gapQuestions || []).length ? `<div class="note info"><b>Have you done this?</b> ${m.gapQuestions.map(esc).join(' ')} <button class="btn link" data-act="chat">Tell the wizard</button></div>` : ''}
  <button class="btn link" data-act="explain" data-force="1" style="align-self:flex-start">Check again</button>`
  : `<div class="row"><span class="muted">${esc((j.scoreReasons || []).join(' · '))}</span><button class="btn secondary" data-act="explain" data-busy="Checking the fit…">Check the fit</button></div>`}
  </section>

  <section class="stack"><h2>Your application</h2>
  <div class="list">
    <div class="item">${resume ? tag(resume.status === 'final' ? 'Done' : 'Draft', resume.status === 'final' ? 'good' : 'att') : tag('Not yet', 'muted')}<div class="grow"><div>Tailored resume</div><div class="small muted">${resume ? `${esc(resume.checks?.length ? resume.checks[0] : 'Every line traced to your profile.')}` : 'Built only from your profile.'}</div></div>${resume ? `<a href="#/doc/${resume.id}">Review</a>` : ''}</div>
    <div class="item">${letter ? tag(letter.checks?.length ? 'Check' : letter.status === 'final' ? 'Done' : 'Draft', letter.checks?.length ? 'att' : letter.status === 'final' ? 'good' : 'att') : tag('Not yet', 'muted')}<div class="grow"><div>Cover letter</div><div class="small muted">${letter ? esc(letter.checks?.length ? letter.checks.join(' ') : 'In your voice, every fact checked.') : 'In your voice.'}</div></div>${letter ? `<a href="#/doc/${letter.id}">Review</a>` : ''}</div>
    <div class="item" style="background:var(--spark-soft)">${tag('Your call', 'spark')}<div class="grow"><div>Form answers</div><div class="small">Saved answers are filled in for you. Anything personal that you haven’t saved, we ask you. <a href="#/setup/8">Your saved answers</a></div></div></div>
  </div>
  <div class="row">
    ${resume ? `<button class="btn primary big" data-act="apply">Open and fill application</button>` : `<button class="btn primary big" data-act="make" data-busy="Writing your application…">Make my resume and letter</button>`}
    ${resume ? '<button class="btn" data-act="make" data-busy="Writing…">Make a new version</button>' : ''}
    <button class="btn secondary" data-act="cheat">Make interview cheat sheet</button>
    <span data-progress="docs" class="small muted"></span>
  </div>
  <div class="row">${t && t.status !== 'applied' ? '<button class="btn small" data-act="applied">I applied</button>' : ''}${!t ? '<button class="btn small" data-act="save">Save to tracker</button>' : ''}<button class="btn small" data-act="no">Not for me</button></div>
  </section>

  <details class="card"><summary><b>Job description</b></summary><div class="small" style="white-space:pre-wrap;margin-top:12px">${esc(j.description)}</div><button class="btn small" data-act="edittext" style="align-self:flex-start">Edit description</button></details>` : ''}
</section>
<aside class="side card quiet" style="position:sticky;top:84px"><h2>Chat about this job</h2><p class="small muted">Ask anything: how you fit, what to say about a gap, what to ask them. If you mention something new about your experience, we’ll offer to add it.</p><button class="btn secondary" data-act="chat">Ask the wizard</button></aside>
</div></div>`;
  };
  on(root, {
    explain: (b) => act(b, async () => { await call('jobs.explain', { id: jobId, force: Boolean(b.dataset.force) }); paint(); }),
    make: (b) => act(b, async () => { await call('docs.make', { jobId }); profile = await call('profile.get'); paint(); app.refresh(); }, { done: 'Your resume and letter are ready to check.' }),
    settext: () => saveText(),
    edittext: async () => { const j = await call('jobs.get', { id: jobId }); modal(`<h2>Job description</h2><textarea id="d2" style="min-height:320px">${esc(j.description)}</textarea><div class="row"><button class="btn primary" id="s2">Save</button><button class="btn" data-close>Cancel</button></div>`, { onMount: (m, close) => { m.querySelector('#s2').onclick = async () => { await call('jobs.setText', { id: jobId, text: m.querySelector('#d2').value }); close(); paint(); }; } }); },
    chat: () => app.openChat(jobId),
    save: async () => { await call('tracker.add', { jobId }); toast('Saved to your tracker.'); paint(); },
    applied: async () => { const j = await call('jobs.get', { id: jobId }); await call('tracker.status', { id: j.tracker.id, status: 'applied' }); toast('Marked as applied. We’ll remind you to follow up in a week.'); paint(); app.refresh(); },
    no: () => modal(`<h2>Not for you?</h2><p class="muted">Tell us why and we’ll show fewer like it.</p><div class="row" id="rs">${['Wrong kind of work', 'Too junior', 'Too senior', 'Pay too low', 'Location', 'Type of employer', 'Title was misleading', 'Something else'].map((r) => `<button class="chip" aria-pressed="false">${r}</button>`).join('')}</div><div class="row"><button class="btn primary" id="sn">Save</button><button class="btn" data-close>Cancel</button></div>`, {
      onMount: (m, close) => {
        m.querySelectorAll('#rs .chip').forEach((c) => (c.onclick = () => c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true')));
        m.querySelector('#sn').onclick = async () => { const reasons = [...m.querySelectorAll('#rs [aria-pressed=true]')].map((c) => c.textContent.replace(/^✓\s*/, '')); const r = await call('jobs.rate', { id: jobId, value: 'no', reasons }); close(); toast(r.newRules?.length ? `Learned: ${r.newRules[0].text}` : 'Got it. We’ll show fewer like this.'); app.go('#/dashboard'); };
      },
    }),
    cheat: async (b) => { const iv = await call('interviews.forJob', { jobId }); app.go(`#/interview/${iv.id}`); void b; },
    apply: async () => {
      const j = await call('jobs.get', { id: jobId });
      modal(`<h2>Apply</h2><ol class="stack-s" style="padding-left:20px;margin:0">
<li>Download your files: ${j.documents.filter((d) => d.status).slice(0, 2).map((d) => `<a href="#/doc/${d.id}" data-close>${esc(d.file)}.pdf</a>`).join(' and ')}.</li>
<li>Open the application. With the Job Wizard browser extension, press its button on the form to fill it in. <a href="#/help/extension" data-close>Set up the extension</a></li>
<li>Check everything, answer anything marked “needs you”, and press submit yourself.</li>
<li>Come back and press <b>I applied</b> (the extension does this for you).</li></ol>
<div class="row"><button class="btn primary" id="open">Open the application</button><button class="btn" data-close>Close</button></div>`, { onMount: (m) => { m.querySelector('#open').onclick = () => aw.open(j.url); } });
    },
  });
  async function saveText() {
    await call('jobs.setText', { id: jobId, text: root.querySelector('#td').value, title: root.querySelector('#tt').value, company: root.querySelector('#tc').value, location: root.querySelector('#tl').value });
    toast('Saved.'); paint();
  }
  root.innerHTML = `<div class="page">${working('Loading…')}</div>`;
  await paint();
}
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
const trLabel = (s) => ({ found: 'Found', saved: 'Saved', ready: 'Ready to apply', applied: 'Applied', interviewing: 'Interviewing', offer: 'Offer', rejected: 'Not moving forward', skipped: 'Skipped', closed: 'Closed' })[s] || s;
