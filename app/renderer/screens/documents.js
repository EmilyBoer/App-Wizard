import { call, esc, tag, act, toast, on, modal, aw, working, readFiles, dropZone } from '../lib.js';

const KIND = { resume: ['Resume', 'good', 'Used for your experience.'], linkedin: ['LinkedIn', 'good', 'Cross-checked with your resumes.'], review: ['Review', 'good', 'Used to find results you may be underselling.'], portfolio: ['Work sample', 'good', 'Used for results and skills.'], writing: ['Your writing', 'info', 'Used to learn how you write.'], personality: ['Personality', 'muted', 'Shapes your style and interview prep. Never listed as experience.'], job_posting: ['Job you want', 'att', 'Teaches us what jobs to find. Never treated as your experience.'], other: ['Other', 'muted', 'Kept for reference.'] };

export async function render(root, params, app, name) {
  if (name === 'doc' && params[0]) return viewer(root, params[0], app);
  const paint = async () => {
    const [docs, st] = await Promise.all([call('docs.list'), call('builder.status')]);
    const byJob = new Map();
    for (const d of docs) { if (!byJob.has(d.jobId)) byJob.set(d.jobId, []); byJob.get(d.jobId).push(d); }
    root.innerHTML = `<div class="page">
<div class="head"><div><h1>Documents</h1><p class="muted">Every resume and cover letter Job Wizard made for you, and every file you’ve given it.</p></div></div>
<section class="stack"><h2>Made by Job Wizard</h2>
${!docs.length ? '<div class="empty"><b>Nothing yet.</b><span class="muted small">Open a job and press Make my resume and letter, or let the morning batch do it.</span></div>' : `
<div class="list">${[...byJob.entries()].map(([jobId, ds]) => `<div class="item"><div class="grow"><div>${esc(ds[0].title)} · ${esc(ds[0].company)}</div><div class="small muted">${ds.map((d) => `<a href="#/doc/${d.id}">${d.kind === 'resume' ? 'Resume' : 'Cover letter'} v${d.version}</a> ${d.status === 'final' ? tag('Final', 'good') : tag('Draft', 'att')}`).join(' · ')}</div></div><a class="btn small" href="#/job/${encodeURIComponent(jobId)}">Job</a></div>`).join('')}</div>`}
</section>
<section class="stack"><div class="row between"><h2>Your files</h2>${st.profileStale ? '<button class="btn primary" data-act="rebuild" data-busy="Reading your new files…">Update my profile from new files</button>' : ''}</div>
<p class="muted small">Add anything that helps Job Wizard know you better: newer resumes, reviews, work samples, things you’ve written. The more it knows, the better your matches and documents.</p>
<section class="drop" id="drop" style="padding:20px"><div class="row"><b>Drop files here</b><label class="btn secondary">Choose files<input type="file" multiple class="sr" id="files" accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp"></label><button class="btn" data-act="paste">Paste text</button></div><div data-progress="materials" class="small muted" aria-live="polite"></div></section>
${st.materials.length ? `<div class="list">${st.materials.map((m) => { const [l, k, note] = KIND[m.kind] || KIND.other; return `<div class="item">${m.problem ? tag('Can’t read', 'alert') : tag(l, k)}<div class="grow"><div>${esc(m.name)}</div><div class="small muted">${esc(m.problem || [m.summary, note].filter(Boolean).join('. ').replace(/\.\./g, '.'))}</div></div>${m.problem ? '' : `<label class="small">This is <select data-kind="${m.id}" style="width:auto;padding:4px 8px">${Object.entries(KIND).map(([kk, [ll]]) => `<option value="${kk}" ${kk === m.kind ? 'selected' : ''}>${ll}</option>`).join('')}</select></label>`}<button class="btn small" data-act="rm" data-id="${m.id}">Remove</button></div>`; }).join('')}</div>` : ''}
</section></div>`;
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
  <section class="card quiet tight"><h3>Edit a line</h3><p class="small muted">Click any line in the ${isResume ? 'resume' : 'letter'} to change it. Your edits teach Job Wizard how you like things written.</p></section>
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
