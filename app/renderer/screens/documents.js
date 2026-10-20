import { call, esc, tag, act, toast, on, modal, aw, working } from '../lib.js';

export async function render(root, params, app, name) {
  if (name === 'doc' && params[0]) return viewer(root, params[0], app);
  const docs = await call('docs.list');
  const byJob = new Map();
  for (const d of docs) { const k = d.jobId; if (!byJob.has(k)) byJob.set(k, []); byJob.get(k).push(d); }
  root.innerHTML = `<div class="page">
<div class="head"><div><h1>Documents</h1><p class="muted">Every resume and cover letter App Wizard made for you, newest first. Each one is built only from your profile.</p></div><a class="btn" href="#/setup/5">Change resume design</a></div>
${!docs.length ? '<div class="empty"><b>No documents yet.</b><span class="muted small">Open a job and press Make my resume and letter, or let the morning batch do it.</span></div>' : `
<div class="list">${[...byJob.entries()].map(([jobId, ds]) => `<div class="item"><div class="grow"><div>${esc(ds[0].title)} · ${esc(ds[0].company)}</div><div class="small muted">${ds.map((d) => `<a href="#/doc/${d.id}">${d.kind === 'resume' ? 'Resume' : 'Cover letter'} v${d.version}</a> ${d.status === 'final' ? tag('Final', 'good') : tag('Draft', 'att')}`).join(' · ')}</div></div><a class="btn small" href="#/job/${encodeURIComponent(jobId)}">Job</a></div>`).join('')}</div>`}
</div>`;
}

async function viewer(root, docId, app) {
  root.innerHTML = `<div class="page">${working('Loading…')}</div>`;
  let doc = await call('docs.get', { id: docId });
  const limits = await call('docs.limits');
  const isResume = doc.kind === 'resume';
  const paint = () => {
    root.innerHTML = `<div class="page"><div class="split">
<section class="main">
  <a href="#/job/${encodeURIComponent(doc.jobId)}" class="small">← ${esc(doc.title)} · ${esc(doc.company)}</a>
  <div class="head"><div><div class="row">${tag(doc.status === 'final' ? 'Final' : 'Draft', doc.status === 'final' ? 'good' : 'att')}${doc.readable === true ? tag('Readable by hiring systems', 'good') : doc.readable === false ? tag('Readability problem', 'alert') : ''}</div><h1>${isResume ? 'Resume' : 'Cover letter'}</h1><p class="small muted" style="font-family:var(--mono)">${esc(doc.file)}.pdf</p></div>
  <div class="row"><button class="btn primary" data-act="pdf">Download PDF</button><button class="btn" data-act="copy">Copy text</button>${doc.status !== 'final' ? '<button class="btn secondary" data-act="approve">Looks good</button>' : ''}</div></div>
  <div id="fit" class="small muted" aria-live="polite"></div>
  <div class="paper-wrap"><iframe class="docframe" id="frame" title="${isResume ? 'Resume' : 'Cover letter'}" style="max-width:${limits.page.w};margin:0 auto;display:block"></iframe></div>
</section>
<aside class="side stack">
  <section class="card quiet tight"><h3>Edit a line</h3><p class="small muted">Click any line in the ${isResume ? 'resume' : 'letter'} to change it. Your edits teach App Wizard how you like things written.</p></section>
  ${(doc.checks || []).length ? `<section class="card tight"><h3>We checked it</h3><ul class="small" style="margin:0;padding-left:18px">${doc.checks.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></section>` : `<section class="card tight"><h3>We checked it</h3><p class="small">Every ${isResume ? 'line' : 'fact'} comes from your profile. Numbers match.</p></section>`}
  ${isResume && (doc.cuts || []).length ? `<section class="card tight"><h3>To fit ${limits.maxPages === 1 ? 'one page' : '1½ pages'}, we cut</h3><ul class="small" style="margin:0;padding-left:18px">${doc.cuts.map((c) => `<li>${esc(c)}</li>`).join('')}</ul><button class="btn small" data-act="uncut">Put everything back</button></section>` : ''}
  ${!aw.pdf ? '<p class="tiny muted">In the browser version, Download PDF opens the print window: choose “Save as PDF”.</p>' : ''}
</aside></div></div>`;
    const frame = root.querySelector('#frame');
    frame.srcdoc = doc.html;
    frame.onload = () => afterLoad(frame);
  };
  async function afterLoad(frame) {
    const d = frame.contentDocument;
    const pageH = inchesToPx(limits.page.h) - (isResume ? 96 : 154); // minus margins
    frame.style.height = Math.max(d.documentElement.scrollHeight + 24, 600) + 'px';
    // click-to-edit
    const lines = isResume ? [...d.querySelectorAll('li, .summary')] : [...d.querySelectorAll('p')].slice(3, -1);
    let idx = 0;
    lines.forEach((el) => {
      let path;
      if (isResume) {
        if (el.classList.contains('summary')) path = 'summary';
        else { const role = el.closest('.role'); const ri = [...d.querySelectorAll('.role')].indexOf(role); const bi = [...role.querySelectorAll('li')].indexOf(el); path = `${ri}.${bi}`; }
      } else path = String(idx++);
      el.style.cursor = 'text'; el.title = 'Click to edit';
      el.onmouseenter = () => (el.style.background = '#FFE8DF'); el.onmouseleave = () => (el.style.background = '');
      el.onclick = () => editLine(path, el.textContent);
    });
    if (!isResume) return;
    // fit to page: cut until it fits (max 20 steps)
    const fitEl = root.querySelector('#fit');
    const maxH = pageH * limits.maxPages;
    let h = d.querySelector('.page').scrollHeight, steps = 0;
    while (h > maxH && steps < 20) {
      fitEl.innerHTML = '<span class="spin"></span> Fitting to the page…';
      const r = await call('docs.cutOnce', { id: doc.id });
      if (r.done) break;
      steps++;
      doc = await call('docs.get', { id: doc.id });
      d.open(); d.write(doc.html); d.close();
      await new Promise((res) => setTimeout(res, 60));
      h = d.querySelector('.page').scrollHeight;
    }
    const pages = Math.max(1, Math.round((h / pageH) * 10) / 10);
    const check = await call('docs.check', { id: doc.id, extracted: d.body.innerText, pages });
    doc = await call('docs.get', { id: doc.id });
    if (steps) { paint(); return; }
    fitEl.textContent = `${pages <= 1 ? 'Fits on one page' : `About ${pages} pages`}. ${check.ok ? 'Hiring systems can read every line in order.' : `Some lines may be hard for hiring systems to read: ${check.missing.slice(0, 2).join('; ')}. Try the Classic layout for uploads.`}`;
  }
  function editLine(path, text) {
    modal(`<h2>Edit this line</h2><p class="muted small">Keep it true: change the wording, not the facts. To change a fact, fix it in your profile.</p><textarea id="lt" style="min-height:120px">${esc(text.trim())}</textarea><div class="row"><button class="btn primary" id="ls">Save</button><button class="btn" data-close>Cancel</button></div>`, {
      onMount: (m, close) => {
        m.querySelector('#ls').onclick = async () => {
          const r = await call('docs.editLine', { id: doc.id, path, text: m.querySelector('#lt').value.trim() });
          close();
          doc = await call('docs.get', { id: doc.id });
          paint();
          if (r.offerProfile) modal(`<h2>Use this wording from now on?</h2><p>Save it to your profile so every future resume starts from it.</p><blockquote style="margin:0;padding:12px 16px;background:var(--panel);border-radius:8px">${esc(r.offerProfile.text)}</blockquote><div class="row"><button class="btn primary" id="yes">Yes, save it</button><button class="btn" data-close>Just this resume</button></div>`, { onMount: (m2, c2) => { m2.querySelector('#yes').onclick = async () => { await call('profile.updateBullet', { bulletId: r.offerProfile.bulletId, text: r.offerProfile.text }); c2(); toast('Saved to your profile.'); }; } });
        };
      },
    });
  }
  on(root, {
    pdf: async (b) => {
      if (aw.pdf) {
        await act(b, async () => {
          const design = await call('design.get');
          const r = await aw.pdf({ html: doc.html, fileName: doc.file, paper: design.paper, ask: false });
          if (r.canceled) return;
          await call('docs.pdfSaved', { id: doc.id, file: r.file });
          if (isResume) await call('docs.check', { id: doc.id, extracted: r.text, pages: r.pages });
          toast(`Saved to ${r.file}`);
          aw.reveal?.(r.file);
          doc = await call('docs.get', { id: doc.id }); paint();
        });
      } else {
        const w = window.open('', '_blank');
        if (!w) return toast('Allow pop-ups to download the PDF.', true);
        w.document.write(doc.html.replace('</title>', `</title><script>document.title=${JSON.stringify(doc.file)};window.onload=()=>setTimeout(()=>print(),300)<\/script>`));
        w.document.close();
        await call('docs.pdfSaved', { id: doc.id, file: `${doc.file}.pdf` });
      }
      app.refresh();
    },
    copy: async () => { const t = await call('docs.text', { id: doc.id }); await navigator.clipboard.writeText(t).then(() => toast('Copied. Paste it into Word, Google Docs or a form.'), () => modal(`<h2>Plain text</h2><textarea style="min-height:360px">${esc(t)}</textarea><button class="btn" data-close>Close</button>`)); },
    approve: async () => { await call('docs.approve', { id: doc.id }); doc = await call('docs.get', { id: doc.id }); paint(); toast('Marked final.'); },
    uncut: async () => { await call('docs.resetCuts', { id: doc.id }); doc = await call('docs.get', { id: doc.id }); paint(); },
  });
  paint();
}
const inchesToPx = (v) => (String(v).endsWith('mm') ? (parseFloat(v) / 25.4) * 96 : parseFloat(v) * 96);
