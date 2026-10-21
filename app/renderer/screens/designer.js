// The resume editor: settings on the left, the resume changing live on the right.
import { call, esc, toast, readFiles } from '../lib.js';

const FONT_PAIRS = [
  ['Inter', 'Inter', 'Clean'], ['Montserrat', 'Open Sans', 'Modern'], ['Playfair Display', 'Source Sans 3', 'Elegant'], ['Merriweather', 'Lato', 'Warm'],
  ['Lora', 'Lato', 'Classic serif'], ['Work Sans', 'Work Sans', 'Simple'], ['Raleway', 'Lato', 'Light'], ['Roboto', 'Roboto', 'Neutral'], ['EB Garamond', 'EB Garamond', 'Traditional'],
];
const PAGE_PX = { letter: [816, 1056], a4: [794, 1123] };

export async function renderDesigner(el, { dark = false } = {}) {
  let d = await call('design.get');
  let thumbs = null;
  el.innerHTML = `<div class="designer${dark ? ' on-dark' : ''}">
  <aside class="dz-panel" aria-label="Resume design settings"></aside>
  <section class="dz-preview" aria-label="Live preview">
    <div class="row between dz-bar"><b id="dz-name"></b><span id="dz-fit" class="small muted" aria-live="polite"></span></div>
    <div class="dz-stage" id="dz-stage"><div class="dz-scale" id="dz-scale"><iframe id="dz-frame" title="Resume preview" scrolling="no"></iframe><div id="dz-breaks"></div></div></div>
  </section>
</div>`;
  const panel = el.querySelector('.dz-panel');
  const frame = el.querySelector('#dz-frame');

  const seg = (key, value, opts) => `<div class="seg" role="group">${opts.map(([v, l, icon]) => `<button type="button" data-set="${key}" data-val='${JSON.stringify(v)}' aria-pressed="${JSON.stringify(v) === JSON.stringify(value)}">${icon || ''}${l}</button>`).join('')}</div>`;
  const group = (id, title, body, open = true) => `<details class="dz-group" data-g="${id}" ${open ? 'open' : ''}><summary>${title}</summary><div class="dz-body">${body}</div></details>`;
  const icon = (kind) => ({
    single: '<svg width="22" height="28" viewBox="0 0 22 28" aria-hidden="true"><rect x="1" y="1" width="20" height="26" rx="2" fill="none" stroke="currentColor"/><rect x="4" y="5" width="14" height="2" fill="currentColor"/><rect x="4" y="10" width="14" height="1.5" fill="currentColor" opacity=".5"/><rect x="4" y="14" width="14" height="1.5" fill="currentColor" opacity=".5"/><rect x="4" y="18" width="10" height="1.5" fill="currentColor" opacity=".5"/></svg>',
    'sidebar-left': '<svg width="22" height="28" viewBox="0 0 22 28" aria-hidden="true"><rect x="1" y="1" width="20" height="26" rx="2" fill="none" stroke="currentColor"/><rect x="2" y="2" width="6" height="24" fill="currentColor" opacity=".25"/><rect x="10" y="5" width="9" height="2" fill="currentColor"/><rect x="10" y="10" width="9" height="1.5" fill="currentColor" opacity=".5"/><rect x="10" y="14" width="9" height="1.5" fill="currentColor" opacity=".5"/></svg>',
    'sidebar-right': '<svg width="22" height="28" viewBox="0 0 22 28" aria-hidden="true"><rect x="1" y="1" width="20" height="26" rx="2" fill="none" stroke="currentColor"/><rect x="14" y="2" width="6" height="24" fill="currentColor" opacity=".25"/><rect x="3" y="5" width="9" height="2" fill="currentColor"/><rect x="3" y="10" width="9" height="1.5" fill="currentColor" opacity=".5"/><rect x="3" y="14" width="9" height="1.5" fill="currentColor" opacity=".5"/></svg>',
  })[kind] || '';

  function paintPanel() {
    const openGroups = new Set([...panel.querySelectorAll('details[open]')].map((x) => x.dataset.g));
    const isOpen = (g, def) => (panel.children.length ? openGroups.has(g) : def);
    const pairOn = (h, b) => d.fonts.heading === h && d.fonts.body === b;
    const fonts = [...d.fonts_available, ...(d.customFonts || []).map((f) => f.family)];
    const sidebarOn = d.layout !== 'single';
    panel.innerHTML = `
${group('tpl', 'Template', `<div class="dz-thumbs">${Object.entries(d.presets).map(([k, p]) => `<button type="button" class="dz-thumb ${d.template === k ? 'on' : ''}" data-preset="${k}" aria-pressed="${d.template === k}"><div class="dz-mini"><iframe tabindex="-1" title="" scrolling="no" data-thumb="${k}"></iframe></div><b>${esc(p.label)}</b><span class="tiny muted">${esc(p.note)}</span></button>`).join('')}</div>
<label class="btn small" style="align-self:flex-start">Import a Canva design (PDF)<input type="file" class="sr" id="dz-canva" accept=".pdf"></label>${d.raw?.canva ? `<span class="tiny muted">Imported ${esc(d.raw.canva.name)}. ${(d.raw.canva.missing || []).length ? `Its ${esc(d.raw.canva.missing.join(', '))} font was swapped for the closest match.` : ''}</span>` : ''}`, isOpen('tpl', true))}
${group('layout', 'Layout', `${seg('layout', d.layout, [['single', 'One column', icon('single')], ['sidebar-left', 'Sidebar left', icon('sidebar-left')], ['sidebar-right', 'Sidebar right', icon('sidebar-right')]])}
${sidebarOn ? `<b class="small">In the sidebar</b><div class="row">${['skills', 'education', 'certifications', 'summary'].map((k) => `<label class="radio"><input type="checkbox" data-side="${k}" ${d.sidebar.includes(k) ? 'checked' : ''}>${esc(d.sections[k])}</label>`).join('')}</div><label class="radio" style="align-self:flex-start"><input type="checkbox" data-tint ${d.sidebarTint ? 'checked' : ''}>Tint the sidebar</label>` : ''}`, isOpen('layout', true))}
${group('sections', 'Sections', `<div class="dz-sections">${d.order.map((k, i) => `<div class="dz-sec ${d.hidden.includes(k) ? 'off' : ''}"><label class="radio" style="border:0;padding:0;background:none"><input type="checkbox" data-show="${k}" ${d.hidden.includes(k) ? '' : 'checked'} aria-label="Show ${esc(d.sections[k])}"></label><span class="grow">${esc(d.sections[k])}${sidebarOn && d.sidebar.includes(k) ? ' <span class="tiny muted">sidebar</span>' : ''}</span><button type="button" class="btn small" data-move="${k}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move ${esc(d.sections[k])} up">↑</button><button type="button" class="btn small" data-move="${k}" data-dir="1" ${i === d.order.length - 1 ? 'disabled' : ''} aria-label="Move ${esc(d.sections[k])} down">↓</button></div>`).join('')}</div>`, isOpen('sections', true))}
${group('look', 'Header and titles', `<b class="small">Name and contact</b>${seg('header', d.header, [['left', 'Left'], ['center', 'Centered'], ['split', 'Split'], ['band', 'Color band']])}
<b class="small">Section titles</b>${seg('titles', d.titles, [['rule', 'Line'], ['caps', 'Caps'], ['bar', 'Bar'], ['plain', 'Plain']])}`, isOpen('look', false))}
${group('color', 'Color', `<div class="row">${d.accents.map((c) => `<button type="button" class="swatch ${d.accent.toLowerCase() === c.toLowerCase() ? 'on' : ''}" data-set="accent" data-val='"${c}"' style="background:${c}" aria-label="Color ${c}" aria-pressed="${d.accent.toLowerCase() === c.toLowerCase()}"></button>`).join('')}<label class="swatch custom" title="Pick any color"><input type="color" id="dz-color" value="${esc(d.accent)}" aria-label="Pick any color"></label></div><span class="tiny muted">Dark colors print and read best.</span>`, isOpen('color', false))}
${group('fonts', 'Fonts', `<div class="dz-pairs">${FONT_PAIRS.filter(([h, b]) => fonts.includes(h) && fonts.includes(b)).map(([h, b, name]) => `<button type="button" class="dz-pair ${pairOn(h, b) ? 'on' : ''}" data-pair='${JSON.stringify([h, b])}' aria-pressed="${pairOn(h, b)}"><span style="font-family:'${h}',serif;font-weight:700;font-size:17px">${esc(h)}</span><span class="tiny muted" style="font-family:'${b}',sans-serif">${esc(name)} · ${esc(b)}</span></button>`).join('')}</div>
<div class="row-l"><label class="field">Headings<select data-font="heading">${fonts.map((f) => `<option ${f === d.fonts.heading ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></label><label class="field">Body<select data-font="body">${fonts.map((f) => `<option ${f === d.fonts.body ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></label></div>
<label class="btn small" style="align-self:flex-start">Upload your own font<input type="file" class="sr" id="dz-font" accept=".ttf,.otf,.woff,.woff2"></label><a class="tiny" href="#/help/custom-font">Help: adding a custom font</a>`, isOpen('fonts', false))}
${group('text', 'Text and spacing', `<b class="small">Text size</b>${seg('size', d.size, [[10, '10'], [10.5, '10.5'], [11, '11'], [11.5, '11.5']])}
<b class="small">Spacing</b>${seg('spacing', d.spacing, [['compact', 'Compact'], ['balanced', 'Balanced'], ['roomy', 'Roomy']])}
<b class="small">Margins</b>${seg('margin', d.margin, [[0.5, 'Narrow'], [0.6, 'Normal'], [0.75, 'Wide'], [1, 'Extra wide']])}
<span class="tiny muted">Text never goes below 10 point, so it stays readable.</span>`, isOpen('text', false))}
${group('details', 'Details', `<b class="small">Dates</b>${seg('dates', d.dates, [['right', 'On the right'], ['below', 'Under the title']])}
<b class="small">Bullets</b>${seg('bullets', d.bullets, [['dot', '• Dots'], ['dash', '– Dashes'], ['none', 'None']])}
<b class="small">Skills</b>${seg('skills', d.skills, [['inline', 'In a line'], ['list', 'A list'], ['tags', 'Boxes']])}`, isOpen('details', false))}
${group('page', 'Page', `<b class="small">Paper</b>${seg('paper', d.paper || 'letter', [['letter', 'US Letter'], ['a4', 'A4']])}
<b class="small">Length</b>${seg('length', d.length || 'one', [['one', 'One page'], ['one-half', 'Up to 1½ pages']])}${d.years >= 10 ? `<span class="tiny muted">You have ${d.years} years of experience, so 1½ pages is fine.</span>` : ''}
<b class="small">How far back</b>${seg('yearsBack', Number(d.yearsBack) || 15, [[10, '10 years'], [15, '15 years'], [50, 'Everything']])}`, isOpen('page', false))}
<button type="button" class="btn small" data-reset style="align-self:flex-start">Reset to the ${esc(d.presets[d.template]?.label || 'template')} defaults</button>`;
    if (thumbs) fillThumbs();
  }

  function fillThumbs() {
    panel.querySelectorAll('[data-thumb]').forEach((f) => { if (!f.srcdoc) f.srcdoc = thumbs[f.dataset.thumb]; });
  }

  let previewSeq = 0;
  async function paintPreview() {
    const seq = ++previewSeq;
    const { html } = await call('design.preview');
    if (seq !== previewSeq) return;
    el.querySelector('#dz-name').textContent = `${d.presets[d.template]?.label || 'Custom'}${isCustomized() ? ' (customized)' : ''}`;
    frame.srcdoc = html;
  }
  const isCustomized = () => Boolean(d.raw && ['layout', 'header', 'titles', 'size', 'spacing', 'margin', 'dates', 'bullets', 'skills', 'sidebarTint', 'accent', 'order', 'hidden', 'sidebar'].some((k) => k in d.raw));

  frame.onload = () => {
    const doc = frame.contentDocument;
    const [pw, ph] = PAGE_PX[d.paper === 'a4' ? 'a4' : 'letter'];
    const full = Math.max(ph, doc.documentElement.scrollHeight);
    frame.style.width = pw + 'px'; frame.style.height = full + 'px';
    fit();
    // page breaks and fit
    const contentH = ph - d.margin * 96 * 2;
    const used = doc.querySelector('.page')?.scrollHeight || 0;
    const pages = used / contentH;
    const limit = d.length === 'one-half' ? 1.5 : 1;
    const breaks = el.querySelector('#dz-breaks');
    breaks.innerHTML = Array.from({ length: Math.ceil(full / ph) - 1 }, (_, i) => `<div class="dz-break" style="top:${(i + 1) * ph}px"><span>Page ${i + 2}</span></div>`).join('');
    const fitEl = el.querySelector('#dz-fit');
    fitEl.innerHTML = pages <= limit ? `✓ ${limit === 1 ? 'Fits on one page' : 'Within 1½ pages'}` : `<span style="color:var(--attention)">About ${pages.toFixed(1)} pages. Each tailored resume is trimmed to fit.</span>`;
  };
  function fit() {
    const stage = el.querySelector('#dz-stage'), scaleBox = el.querySelector('#dz-scale');
    const [pw] = PAGE_PX[d.paper === 'a4' ? 'a4' : 'letter'];
    const scale = Math.min(1, (stage.clientWidth - 2) / pw);
    scaleBox.style.transform = `scale(${scale})`;
    scaleBox.style.width = pw + 'px';
    stage.style.height = (parseFloat(frame.style.height) || 1056) * scale + 'px';
  }
  const ro = new ResizeObserver(() => fit());
  ro.observe(el.querySelector('#dz-stage'));

  async function save(patch) {
    await call('design.save', patch);
    d = await call('design.get');
    paintPanel(); paintPreview();
  }

  panel.addEventListener('click', async (e) => {
    const b = e.target.closest('button, [data-preset]');
    if (!b) return;
    if (b.dataset.preset) { await call('design.applyPreset', { id: b.dataset.preset }); d = await call('design.get'); paintPanel(); paintPreview(); return; }
    if (b.dataset.set) return save({ [b.dataset.set]: JSON.parse(b.dataset.val) });
    if (b.dataset.pair) { const [heading, body] = JSON.parse(b.dataset.pair); return save({ fonts: { heading, body } }); }
    if (b.dataset.move) { const order = [...d.order]; const i = order.indexOf(b.dataset.move), j = i + Number(b.dataset.dir); [order[i], order[j]] = [order[j], order[i]]; return save({ order }); }
    if ('reset' in b.dataset) { await call('design.applyPreset', { id: d.template }); d = await call('design.get'); paintPanel(); paintPreview(); toast('Back to the template’s settings.'); }
  });
  panel.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.dataset.side) return save({ sidebar: t.checked ? [...new Set([...d.sidebar, t.dataset.side])] : d.sidebar.filter((x) => x !== t.dataset.side) });
    if ('tint' in t.dataset) return save({ sidebarTint: t.checked });
    if (t.dataset.show) return save({ hidden: t.checked ? d.hidden.filter((x) => x !== t.dataset.show) : [...d.hidden, t.dataset.show] });
    if (t.dataset.font) return save({ fonts: { [t.dataset.font]: t.value } });
    if (t.id === 'dz-color') return save({ accent: t.value });
    if (t.id === 'dz-font') { const [f] = await readFiles(t.files); try { const r = await call('design.uploadFont', f); toast(r.warning || `${r.family} is ready. Pick it under Fonts.`, Boolean(r.warning)); } catch (ex) { toast(ex.message, true); } d = await call('design.get'); paintPanel(); return; }
    if (t.id === 'dz-canva') { const [f] = await readFiles(t.files); toast('Looking at your design…'); try { await call('design.importCanva', f); toast('Imported. Check the preview.'); } catch (ex) { toast(ex.message, true); } d = await call('design.get'); paintPanel(); paintPreview(); }
  });

  paintPanel();
  paintPreview();
  call('design.thumbnails').then((t) => { thumbs = t; fillThumbs(); }).catch(() => {});
}
