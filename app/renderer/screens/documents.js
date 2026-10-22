import { call, esc, tag, act, toast, on, modal, aw, working, readFiles, dropZone } from '../lib.js';

const KIND = { resume: ['Resume', 'good', 'Used for your experience.'], linkedin: ['LinkedIn', 'good', 'Cross-checked with your resumes.'], review: ['Review', 'good', 'Used to find results you may be underselling.'], portfolio: ['Work sample', 'good', 'Used for results and skills.'], writing: ['Your writing', 'info', 'Used to learn how you write.'], personality: ['Personality', 'muted', 'Shapes your style and interview prep. Never listed as experience.'], job_posting: ['Job you want', 'att', 'Teaches us what jobs to find. Never treated as your experience.'], other: ['Other', 'muted', 'Kept for reference.'] };

const isOpen = (k) => { try { return localStorage.getItem(`jw-fold-${k}`) !== '0'; } catch { return true; } };

export async function render(root, params, app, name) {
  if (name === 'doc' && params[0]) return viewer(root, params[0], app);
  const paint = async () => {
    const [docs, st] = await Promise.all([call('docs.list'), call('builder.status')]);
    const byJob = new Map();
    for (const d of docs) { if (!byJob.has(d.jobId)) byJob.set(d.jobId, []); byJob.get(d.jobId).push(d); }
    root.innerHTML = `<div class="page">
<div class="head"><div><h1>Documents</h1><p class="muted">Every resume and cover letter Job Wizard made for you, and every file you’ve given it.</p></div></div>
<details class="fold" data-fold="made" ${isOpen('made') ? 'open' : ''}><summary><h2>Made by Job Wizard</h2><span class="muted small">${docs.length} document${docs.length === 1 ? '' : 's'}</span></summary><div class="stack">
${!docs.length ? '<div class="empty"><b>Nothing yet.</b><span class="muted small">Open a job and press Make my resume and letter, or let the morning batch do it.</span></div>' : `
<div class="list">${[...byJob.entries()].map(([jobId, ds]) => `<div class="item"><div class="grow"><div>${esc(ds[0].title)} · ${esc(ds[0].company)}</div><div class="small muted">${ds.map((d) => `<a href="#/doc/${d.id}">${d.kind === 'resume' ? 'Resume' : 'Cover letter'} v${d.version}</a> ${d.status === 'final' ? tag('Final', 'good') : tag('Draft', 'att')}`).join(' · ')}</div></div><a class="btn small" href="#/job/${encodeURIComponent(jobId)}">Job</a></div>`).join('')}</div>`}
</div></details>
<details class="fold" data-fold="files" ${isOpen('files') ? 'open' : ''}><summary><h2>Your files</h2><span class="muted small">${st.materials.length} file${st.materials.length === 1 ? '' : 's'}</span></summary><div class="stack">
${st.profileStale ? '<div class="row"><button class="btn primary" data-act="rebuild" data-busy="Reading your new files…">Update my profile from new files</button></div>' : ''}
<p class="muted small">Add anything that helps Job Wizard know you better: newer resumes, reviews, work samples, things you’ve written. The more it knows, the better your matches and documents.</p>
<section class="drop" id="drop" style="padding:20px"><div class="row"><b>Drop files here</b><label class="btn secondary">Choose files<input type="file" multiple class="sr" id="files" accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp"></label><button class="btn" data-act="paste">Paste text</button></div><div data-progress="materials" class="small muted" aria-live="polite"></div></section>
${st.materials.length ? `<div class="list">${st.materials.map((m) => { const [l, k, note] = KIND[m.kind] || KIND.other; return `<div class="item">${m.problem ? tag('Can’t read', 'alert') : tag(l, k)}<div class="grow"><div>${esc(m.name)}</div><div class="small muted">${esc(m.problem || [m.summary, note].filter(Boolean).join('. ').replace(/\.\./g, '.'))}</div></div>${m.problem ? '' : `<label class="small">This is <select data-kind="${m.id}" style="width:auto;padding:4px 8px">${Object.entries(KIND).map(([kk, [ll]]) => `<option value="${kk}" ${kk === m.kind ? 'selected' : ''}>${ll}</option>`).join('')}</select></label>`}<button class="btn small" data-act="rm" data-id="${m.id}">Remove</button></div>`; }).join('')}</div>` : ''}
</div></details></div>`;
    root.querySelectorAll('details.fold').forEach((d) => d.addEventListener('toggle', () => { try { localStorage.setItem(`jw-fold-${d.dataset.fold}`, d.open ? '1' : '0'); } catch {} }));
    dropZone(root.querySelector('#drop'), root.querySelector('#files'), async (files) => {
      root.querySelector('[data-progress]').innerHTML = `<span class="spin"></span> Reading ${files.length} file${files.length > 1 ? 's' : ''}…`;
      try { await call('materials.add', { files: await readFiles(files) }); } catch (e) { toast(e.message, true); }
      paint();
    });
    root.querySelectorAll('[data-kind]').forEach((x) => (x.onchange = async () => { await call('materials.setKind', { id: x.dataset.kind, kind: x.value }); paint(); }));
  };
  on(root, {
    rm: async (b) => { await call('materials.remove', { id: b.dataset.id }); paint(); },
    rebuild: (b) => act(b, async () => { await call('builder.buildProfile'); toast('Your profile is updated.'); paint(); app.refresh(); }),
    paste: () => modal(`<h2>Paste text</h2><label class="field">Name it (optional)<input type="text" id="pn"></label><textarea id="pt" style="min-height:220px"></textarea><div class="row"><button class="btn primary" id="pa">Add</button><button class="btn" data-close>Cancel</button></div>`, { onMount: (m, close) => { m.querySelector('#pa').onclick = (e) => act(e.target, async () => { const text = m.querySelector('#pt').value.trim(); if (!text) throw new Error('Paste something first.'); await call('materials.add', { text, name: (m.querySelector('#pn').value.trim() || 'Pasted text') + '.txt' }); close(); paint(); }); } }),
  });
  await paint();
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
  ${isResume ? `<section class="card tight"><h3>New wordings</h3><p class="small muted">See which lines are new wording and which came straight from your library. Approved wordings are saved for future resumes.</p><button class="btn small secondary" data-act="review" style="align-self:flex-start">Review lines</button></section>` : ''}
  <section class="card quiet tight"><h3>Edit a line</h3><p class="small muted">Click any line in the ${isResume ? 'resume' : 'letter'} to change it. Your edits teach Job Wizard how you like things written.</p></section>
  ${(doc.checks || []).length ? `<section class="card tight"><h3>We checked it</h3><ul class="small" style="margin:0;padding-left:18px">${doc.checks.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></section>` : `<section class="card tight"><h3>We checked it</h3><p class="small">Every ${isResume ? 'line' : 'fact'} comes from your profile. Numbers match.</p></section>`}
  ${isResume && (doc.cuts || []).length ? `<section class="card tight"><h3>To fit ${limits.maxPages === 1 ? 'one page' : '1½ pages'}, we cut</h3><ul class="small" style="margin:0;padding-left:18px">${doc.cuts.map((c) => `<li>${esc(c)}</li>`).join('')}</ul><button class="btn small" data-act="uncut">Put everything back</button></section>` : ''}
  ${!aw.pdf ? '<p class="tiny muted">In the browser version, Download PDF opens the print window: choose “Save as PDF”.</p>' : ''}
</aside></div></div>`;
    const frame = root.querySelector('#frame');
    frame.srcdoc = doc.html;
    frame.onload = () => afterLoad(frame);
  };
  let autoReviewed = false;
  async function afterLoad(frame) {
    if (isResume && !doc.reviewed && doc.status !== 'final' && !autoReviewed) { autoReviewed = true; call('docs.review', { id: doc.id }).then((r) => { if (r.open) reviewLines(); }).catch(() => {}); }
    const d = frame.contentDocument;
    // Resume pages hold their own margins, so the whole paper height is the limit.
    const pageH = inchesToPx(limits.page.h) - (isResume ? 0 : 154);
    const used = () => { const pg = d.querySelector('.page'); if (!pg) return d.documentElement.scrollHeight; const mh = pg.style.minHeight; pg.style.minHeight = '0'; const v = pg.scrollHeight; pg.style.minHeight = mh; return v; };
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
    let h = used(), steps = 0;
    while (h > maxH + 2 && steps < 20) {
      fitEl.innerHTML = '<span class="spin"></span> Fitting to the page…';
      const r = await call('docs.cutOnce', { id: doc.id });
      if (r.done) break;
      steps++;
      doc = await call('docs.get', { id: doc.id });
      d.open(); d.write(doc.html); d.close();
      await new Promise((res) => setTimeout(res, 60));
      h = used();
    }
    const pages = Math.max(1, Math.round((h / pageH) * 10) / 10);
    const check = await call('docs.check', { id: doc.id, extracted: d.body.innerText, pages });
    doc = await call('docs.get', { id: doc.id });
    if (steps) { paint(); return; }
    fitEl.textContent = `${pages <= 1 ? 'Fits on one page' : `About ${pages} pages`}. ${check.ok ? 'Hiring systems can read every line in order.' : `Some lines may be hard for hiring systems to read: ${check.missing.slice(0, 2).join('; ')}. Try the Classic layout for uploads.`}`;
  }
  // Line-by-line review: what's straight from your library, and new wordings to approve, edit or turn down.
  async function reviewLines() {
    const r = await call('docs.review', { id: doc.id });
    const news = r.jobs.flatMap((j) => j.lines).filter((l) => l.kind === 'new');
    modal(`<h2>Review your new resume</h2><p class="muted">We reworded ${news.length} line${news.length === 1 ? '' : 's'} for this job. Facts and numbers always match your original. Approve the ones you like and they’re saved to your bullet library for next time.</p><div id="rv" class="stack"></div>
<div class="row"><button class="btn primary" data-done>Approve the rest and finish</button><button class="btn" data-close>Finish later</button></div>`, { wide: true, onMount: (m, close) => {
      const box = m.querySelector('#rv');
      const draw = (res) => {
        box.innerHTML = res.jobs.map((j) => { const lib = j.lines.filter((l) => l.kind === 'library').length; const nw = j.lines.filter((l) => l.kind === 'new'); return `<section class="stack-s"><h3>${esc(j.title)} <span class="muted" style="font-weight:400">· ${esc(j.company)}</span></h3>
${lib ? `<p class="small muted">${lib} line${lib === 1 ? '' : 's'} straight from your library.</p>` : ''}
${nw.map((l) => `<div class="card tight rv-line ${l.decision || ''}" data-path="${l.path}"><div class="row between"><span class="tag ${l.decision === 'approved' ? 'good' : l.decision === 'rejected' ? 'muted' : 'info'}">${l.decision === 'approved' ? 'Approved' : l.decision === 'rejected' ? 'Using your original' : 'New wording'}</span></div>
<div class="rv-new">${esc(l.text)}</div><div class="small muted"><b>Your original:</b> ${esc(l.original)}</div>
<div class="rv-edit hidden"><textarea rows="3">${esc(l.text)}</textarea></div>
<div class="row"><button class="btn small secondary" data-rv="approve">Approve</button><button class="btn small" data-rv="edit">Edit</button><button class="btn small" data-rv="reject">Use my original</button></div></div>`).join('')}</section>`; }).join('') || '<p class="muted">Every line came straight from your library. Nothing new to review.</p>';
      };
      draw(r);
      box.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-rv]'); if (!b) return;
        const card = b.closest('[data-path]'), path = card.dataset.path;
        if (b.dataset.rv === 'edit' && card.querySelector('.rv-edit').classList.contains('hidden')) { card.querySelector('.rv-edit').classList.remove('hidden'); b.textContent = 'Save edit'; card.querySelector('textarea').focus(); return; }
        try {
          await call('docs.reviewLine', { id: doc.id, path, decision: b.dataset.rv, text: card.querySelector('textarea').value });
          draw(await call('docs.review', { id: doc.id }));
        } catch (ex) { toast(ex.message, true); }
      });
      m.querySelector('[data-done]').onclick = async () => { await call('docs.reviewDone', { id: doc.id, approveRest: true }); close(); doc = await call('docs.get', { id: doc.id }); paint(); toast('Reviewed. Approved wordings are saved to your bullet library.'); };
    } });
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
          { const saved = await call('docs.pdfSaved', { id: doc.id, file: r.file }); if (saved.addedToLibrary) toast(`${saved.addedToLibrary} new wording${saved.addedToLibrary > 1 ? 's' : ''} added to your bullet library.`); }
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
    review: () => reviewLines(),
    approve: async () => { const r = await call('docs.approve', { id: doc.id }); doc = await call('docs.get', { id: doc.id }); paint(); toast(r.addedToLibrary ? `Marked final. ${r.addedToLibrary} new wording${r.addedToLibrary > 1 ? 's' : ''} added to your bullet library.` : 'Marked final.'); },
    uncut: async () => { await call('docs.resetCuts', { id: doc.id }); doc = await call('docs.get', { id: doc.id }); paint(); },
  });
  paint();
}
const inchesToPx = (v) => (String(v).endsWith('mm') ? (parseFloat(v) / 25.4) * 96 : parseFloat(v) * 96);
