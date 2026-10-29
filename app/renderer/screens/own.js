// Keep your own resume design: pick the file, sort out its fonts, rebuild it and compare with the original.
// Used by setup (one step per screen) and by Profile, Resume design.
import { call, esc, tag, toast, act, readFiles, working, aw } from '../lib.js';

// One click listener per container, whatever is drawn in it now.
function bind(el, handlers) {
  el._acts = handlers;
  if (el._bound) return;
  el._bound = true;
  el.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); const fn = b && el.contains(b) && el._acts?.[b.dataset.act]; if (fn) { e.preventDefault(); Promise.resolve(fn(b, e)).catch(() => {}); } });
}

const PAGE = { w: 816, h: 1056 };

/** Is this font installed on this computer? (Compare text width against two fallbacks.) */
export function installed(family) {
  const c = document.createElement('canvas').getContext('2d');
  const text = 'mmmmmmmmmmlliWWQ@#0123456789';
  return ['monospace', 'serif', 'sans-serif'].some((fb) => {
    c.font = `72px ${fb}`; const base = c.measureText(text).width;
    c.font = `72px "${family}", ${fb}`; return c.measureText(text).width !== base;
  });
}

// ---------- which resume ----------
export function sourceList(sources, chosen) {
  if (!sources.length) return '<div class="note att">To keep your design, add your resume as a PDF or Word file (or a screenshot of it) in the first step.</div>';
  if (sources.length === 1) return `<p class="small muted">From <b>${esc(sources[0].name)}</b>.</p><input type="hidden" name="src" value="${sources[0].id}">`;
  return `<b class="small">Which resume has the look you want?</b><div class="stack-s">${sources.map((s, i) => `<label class="radio"><input type="radio" name="src" value="${s.id}" ${(chosen ? s.id === chosen : i === 0) ? 'checked' : ''}>${esc(s.name)}</label>`).join('')}</div>`;
}

// ---------- fonts ----------
const STATUS = {
  free: ['Ready', 'good', 'A free font. We load it for you.'],
  uploaded: ['Uploaded', 'good', 'Your font file is saved in Margot.'],
  here: ['On this computer', 'good', 'Works here. If you use Margot on another computer, upload the font file.'],
  missing: ['Needs the font file', 'att', ''],
};

export async function fontsPanel(el, { compact = false, onChange } = {}) {
  const { own } = await call('own.get');
  const fonts = own?.fonts || [];
  const status = (f) => (f.status === 'system' ? (installed(f.family) ? 'here' : 'missing') : f.status);
  const needs = fonts.filter((f) => status(f) === 'missing');
  el.innerHTML = !fonts.length
    ? `<div class="note info">${own?.fromImage ? 'This is a picture, so the fonts aren’t listed inside it. We’ll name them when we rebuild your design, and you can upload them then in Profile, Resume design.' : 'We couldn’t find font names in this file. We’ll name them when we rebuild your design.'}</div>`
    : `<div class="list">${fonts.map((f) => { const s = status(f); const [label, kind, note] = STATUS[s]; return `<div class="item own-font">
  <div class="grow"><div class="own-font-name" style="font-family:'${esc(f.family)}','${esc(f.use)}',sans-serif">${esc(f.family)}</div>
  <div class="small muted">${s === 'missing' ? `Until you upload it, we use <b>${esc(f.use)}</b>${f.exactWidths ? ', which has the same letter widths, so lines break the same way' : ', the closest free match'}.` : esc(note)}${f.guessed ? ' <span class="tiny">(identified by looking at your resume)</span>' : ''}</div></div>
  ${tag(label, kind)}${s === 'missing' ? `<label class="btn small secondary">Upload<input type="file" class="sr" multiple accept=".ttf,.otf,.woff,.woff2" data-upload="${esc(f.family)}"></label>` : ''}</div>`; }).join('')}</div>
${needs.length ? `<details class="small"${compact ? '' : ' open'}><summary>Where do I find font files?</summary><div class="stack-s" style="padding-top:8px">
<div><b>Mac:</b> open Font Book, find the font, right-click it and choose Show in Finder. Upload every file for it (regular, bold, italic).</div>
<div><b>Windows:</b> open C:\\Windows\\Fonts, copy the font’s files to your desktop, then upload them.</div>
<div><b>Canva or a paid font:</b> Canva doesn’t let you download its fonts. If you bought the font, use the files you got. Otherwise the closest match works well.</div>
<div class="tiny muted">Only upload fonts you’re allowed to use. They stay in Margot and go into your PDFs.</div></div></details>` : ''}`;
  el.querySelectorAll('[data-upload]').forEach((inp) => (inp.onchange = async () => {
    const files = await readFiles(inp.files);
    let ok = 0;
    for (const f of files) { try { const r = await call('design.uploadFont', f); ok++; if (r.warning) toast(r.warning, true); } catch (e) { toast(e.message, true); } }
    if (ok) toast(`${inp.dataset.upload} uploaded.`);
    await fontsPanel(el, { compact, onChange }); onChange?.();
  }));
  return { needs: needs.length, total: fonts.length };
}

// ---------- rebuild and compare ----------
/** Build (if needed), check against the original once, then show both side by side with ways to fix. */
export async function compareView(el, { auto = true, onSettled } = {}) {
  let st = await call('own.get');
  if (!st.own) { el.innerHTML = '<div class="note att">Pick the resume whose look you want to keep first.</div>'; return; }
  const progressLine = '<span data-progress="own" class="small muted"></span>';
  if (!st.own.template) {
    el.innerHTML = working('Rebuilding your design. This takes about a minute…') + progressLine;
    try { st.own = await call('own.build'); } catch (e) { el.innerHTML = `<div class="note alert">${esc(e.message)}</div><div class="row"><button class="btn secondary" data-act="retry">Try again</button></div>`; bind(el, { retry: () => compareView(el, { auto, onSettled }) }); return; }
    if (auto && aw.snapshot) {
      el.innerHTML = working('Checking it against your original and fixing differences…') + progressLine;
      try { st.own = await call('own.refine', { snapshot: await snapshot() }); } catch { /* the first rebuild is still fine */ }
    }
  }
  await paint();

  async function paint() {
    const [orig, prev] = await Promise.all([call('own.original'), call('own.preview')]);
    const o = st.own;
    el.innerHTML = `<div class="own-compare">
  <figure><figcaption>Your original</figcaption><div class="own-sheet" id="own-orig"></div></figure>
  <figure><figcaption>Our rebuild <span class="tiny muted">with the same words</span></figcaption><div class="own-sheet"><div class="own-scale"><iframe id="own-frame" title="Rebuilt design" scrolling="no"></iframe></div></div></figure>
</div>
${o.note ? `<p class="small">${esc(o.note)}</p>` : ''}
${o.lastFixes?.length ? `<div class="note info small"><b>Just fixed:</b> ${o.lastFixes.map(esc).join('; ')}</div>` : ''}
${o.leftOut?.length ? `<p class="small muted">Left out on purpose: ${o.leftOut.map(esc).join(', ')}. Hiring systems can’t read graphics, so they can hurt more than help.</p>` : ''}
<div class="card tight stack-s"><label class="field">See something different? Tell us.<textarea id="own-notes" placeholder="e.g. The name should be bigger, the dates are bold in my original, there’s more space between jobs" style="min-height:70px"></textarea></label>
<div class="row"><button class="btn secondary" data-act="fix" data-busy="Fixing…">Fix it</button>${aw.snapshot ? '<button class="btn" data-act="again" data-busy="Comparing…">Compare again</button>' : ''}${o.canUndo ? '<button class="btn" data-act="undo">Undo last fix</button>' : ''}<button class="btn link" data-act="rebuild" data-busy="Rebuilding…">Start the rebuild over</button>${progressLine}</div></div>`;
    // the original: PDF in the browser's viewer, a picture as is, Word as a note
    const box = el.querySelector('#own-orig');
    if (orig?.mime === 'application/pdf') { const url = URL.createObjectURL(new Blob([Uint8Array.from(atob(orig.base64), (c) => c.charCodeAt(0))], { type: 'application/pdf' })); box.innerHTML = `<iframe src="${url}#toolbar=0&navpanes=0&view=FitH" title="Your original resume" class="own-pdf"></iframe>`; }
    else if (orig?.mime?.startsWith('image/')) box.innerHTML = `<img src="data:${orig.mime};base64,${orig.base64}" alt="Your original resume">`;
    else box.innerHTML = `<div class="note muted small" style="margin:16px">Word files can’t be shown here. Open ${esc(orig?.name || 'your resume')} next to this window to compare.</div>`;
    const frame = el.querySelector('#own-frame');
    frame.srcdoc = prev.html;
    const fit = () => { const sheet = frame.closest('.own-sheet'); const sc = sheet.clientWidth / PAGE.w; frame.style.width = PAGE.w + 'px'; frame.style.height = PAGE.h + 'px'; frame.parentElement.style.transform = `scale(${sc})`; sheet.style.height = PAGE.h * sc + 'px'; };
    frame.onload = fit; new ResizeObserver(fit).observe(el.querySelector('.own-compare'));
    bind(el, {
      fix: (b) => act(b, async () => { const notes = el.querySelector('#own-notes').value.trim(); if (!notes) throw new Error('Tell us what looks different first.'); st.own = await call('own.refine', { notes, snapshot: await snapshot() }); await paint(); }),
      again: (b) => act(b, async () => { st.own = await call('own.refine', { snapshot: await snapshot() }); await paint(); }),
      undo: async () => { await call('own.undo'); st = await call('own.get'); await paint(); },
      rebuild: (b) => act(b, async () => { st.own = await call('own.build'); await paint(); }),
    });
    onSettled?.(st.own);
  }
}

async function snapshot() {
  if (!aw.snapshot) return null;
  const { html } = await call('own.preview');
  return aw.snapshot({ html, width: PAGE.w, height: PAGE.h });
}
