// The resume editor: settings on the left, the resume changing live on the right.
import { call, esc, toast, readFiles, modal, working } from '../lib.js';
import { sourceList, fontsPanel, compareView } from './own.js';

const FONT_PAIRS = [
  ['Inter', 'Inter', 'Clean'], ['Montserrat', 'Open Sans', 'Modern'], ['Playfair Display', 'Source Sans 3', 'Elegant'], ['Merriweather', 'Lato', 'Warm'],
  ['Lora', 'Lato', 'Classic serif'], ['Work Sans', 'Work Sans', 'Simple'], ['Raleway', 'Lato', 'Light'], ['Roboto', 'Roboto', 'Neutral'], ['EB Garamond', 'EB Garamond', 'Traditional'],
];
const PAGE_PX = { letter: [816, 1056], a4: [794, 1123] };

export async function renderDesigner(el, { dark = false } = {}) {
  let d = await call('design.get');
  let thumbs = null;
  let summary = (await call('profile.get').catch(() => ({})))?.summary || '';
  const hasKey = Boolean((await call('app.overview').catch(() => ({})))?.hasKey);
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
    const fonts = [...new Set([...d.fonts_available, ...(d.customFonts || []).map((f) => f.family)])];
    const sidebarOn = d.layout !== 'single';
    const own = d.mode === 'own' && d.ownBuilt;
    panel.innerHTML = `
${group('tpl', 'Template', `<div class="dz-thumbs">${d.ownBuilt ? `<button type="button" class="dz-thumb ${own ? 'on' : ''}" data-own aria-pressed="${own}"><div class="dz-mini"><iframe tabindex="-1" title="" scrolling="no" data-thumb="own"></iframe></div><b>Your own design</b><span class="tiny muted">Rebuilt from ${esc(d.ownFrom || 'your resume')}</span></button>` : ''}${Object.entries(d.presets).map(([k, p]) => `<button type="button" class="dz-thumb ${!own && d.template === k ? 'on' : ''}" data-preset="${k}" aria-pressed="${!own && d.template === k}"><div class="dz-mini"><img src="assets/templates/${k}.webp" alt="" loading="lazy"></div><b>${esc(p.label)}</b><span class="tiny muted">${esc(p.note)}</span></button>`).join('')}</div>
${d.ownBuilt ? '' : '<button type="button" class="btn small secondary" data-keepown style="align-self:flex-start">Keep my own resume’s design</button><span class="tiny muted">We rebuild the look of a resume you already have (a PDF, Word file, Canva export or screenshot), fonts and all.</span>'}`, isOpen('tpl', true))}
${group('summary', 'Summary', `<label class="field small">The short paragraph at the top of your resume<textarea id="dz-summary" rows="5" placeholder="Two or three sentences about the work you do.">${esc(summary)}</textarea></label>
<span class="tiny muted" id="dz-sumnote">${summary ? 'Edit it any way you like. It saves when you click away and shows on every resume.' : 'Write your own, or let us write one from your experience.'}</span>
<button type="button" class="btn small secondary" data-rewrite data-busy="Writing…" style="align-self:flex-start" ${hasKey ? '' : 'disabled'}>Write a new one from my experience</button>`, isOpen('summary', true))}
${own ? group('own', 'Your own design', `<div id="dz-ownfonts" class="stack"></div><div class="row"><button type="button" class="btn small secondary" data-compare>Compare with my original</button><button type="button" class="btn small" data-keepown>Rebuild from a different file</button></div><span class="tiny muted">To change colors, spacing or layout, pick a template instead. Your own design stays here.</span>`, true) : ''}
${own ? '' : group('layout', 'Layout', `${seg('layout', d.layout, [['single', 'One column', icon('single')], ['sidebar-left', 'Sidebar left', icon('sidebar-left')], ['sidebar-right', 'Sidebar right', icon('sidebar-right')]])}
${sidebarOn ? `<b class="small">In the sidebar</b><div class="row">${['skills', 'education', 'certifications', 'summary'].map((k) => `<label class="radio"><input type="checkbox" data-side="${k}" ${d.sidebar.includes(k) ? 'checked' : ''}>${esc(d.sections[k])}</label>`).join('')}</div><b class="small">Sidebar color</b>${seg('sidebarTint', d.sidebarTint, [['none', 'None'], ['light', 'Light tint'], ['dark', 'Dark, white text']])}` : ''}`, isOpen('layout', true))}
${(() => {
      const inSide = (k) => sidebarOn && d.sidebar.includes(k);
      const lists = sidebarOn ? [['Main column', d.order.filter((k) => !inSide(k))], ['Sidebar', d.order.filter(inSide)]] : [['', d.order]];
      const rows = (list) => list.map((k, i) => `<div class="dz-sec ${d.hidden.includes(k) ? 'off' : ''}"><label class="radio" style="border:0;padding:0;background:none"><input type="checkbox" data-show="${k}" ${d.hidden.includes(k) ? '' : 'checked'} aria-label="Show ${esc(d.sections[k])}"></label><span class="grow">${esc(d.sections[k])}</span><button type="button" class="btn small" data-move="${k}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move ${esc(d.sections[k])} up">↑</button><button type="button" class="btn small" data-move="${k}" data-dir="1" ${i === list.length - 1 ? 'disabled' : ''} aria-label="Move ${esc(d.sections[k])} down">↓</button></div>`).join('');
      return group('sections', 'Sections', lists.map(([name, list]) => `${name ? `<b class="small">${name}</b>` : ''}<div class="dz-sections">${rows(list) || '<span class="tiny muted">Nothing here yet.</span>'}</div>`).join('') + '<span class="tiny muted">Untick a section to hide it. Use the arrows to change the order.</span>', isOpen('sections', true));
    })()}
${own ? '' : group('look', 'Name, header and titles', `<b class="small">Name size</b>${seg('nameSize', d.nameSize, [['standard', 'Standard'], ['large', 'Large'], ['xl', 'Extra large']])}
<b class="small">Name style</b>${seg('nameStyle', d.nameStyle, [['bold', 'Bold'], ['split', 'Light first name'], ['light', 'Light']])}
<label class="radio" style="align-self:flex-start"><input type="checkbox" data-headline ${d.headline ? 'checked' : ''}>Headline under your name</label><span class="tiny muted">Set your headline in Profile, Your information. If it’s empty we use your most recent job title.</span>
<label class="radio" style="align-self:flex-start"><input type="checkbox" data-upper ${d.nameUpper ? 'checked' : ''}>Name in capitals</label>
${sidebarOn ? '<span class="tiny muted">With a sidebar, your name sits above the main column and your contact details go in the sidebar.</span>' : `<b class="small">Name and contact</b>${seg('header', d.header, [['left', 'Left'], ['center', 'Centered'], ['split', 'Split'], ['band', 'Color band']])}
${d.header === 'split' ? '' : `<b class="small">Contact line</b>${seg('contact', d.contact, [['spread', 'Spread across the page'], ['together', 'Grouped together']])}`}
${['left', 'center'].includes(d.header) ? `<b class="small">Under the name</b>${seg('headerRule', d.headerRule, [['none', 'Nothing'], ['hairline', 'Thin line'], ['accent', 'Short color bar']])}` : ''}`}
<label class="radio" style="align-self:flex-start"><input type="checkbox" data-icons ${d.icons ? 'checked' : ''}>Small icons next to contact details</label>
<b class="small">Section titles</b>${seg('titles', d.titles, [['rule', 'Underline'], ['caps', 'Capitals'], ['short', 'Short line'], ['tint', 'Color band'], ['bar', 'Side bar'], ['plain', 'Large'], ['center', 'Centered'], ['gutter', 'In the margin']])}`, isOpen('look', true))}
${own ? '' : group('color', 'Color', `<b class="small">Palette</b><div class="dz-pals">${Object.entries(d.palettes).map(([k, p]) => { const on = d.accent.toLowerCase() === p.accent.toLowerCase() && String(d.accent2).toLowerCase() === p.accent2.toLowerCase(); return `<button type="button" class="dz-pal ${on ? 'on' : ''}" data-pal='${JSON.stringify({ accent: p.accent, accent2: p.accent2 })}' aria-pressed="${on}" title="${esc(p.name)}"><span style="background:${p.accent}"></span><span style="background:${p.accent2}"></span><b class="tiny">${esc(p.name)}</b></button>`; }).join('')}</div>
<div class="row"><label class="field small">Main color<input type="color" id="dz-color" value="${esc(d.accent)}"></label><label class="field small">Highlight<input type="color" id="dz-color2" value="${esc(d.accent2)}"></label></div>
<span class="tiny muted">The main color is for your name and section titles; the highlight is for bullets, bars and badges.</span>
<b class="small">Paper</b>${seg('pageTint', d.pageTint, [['none', 'White'], ['warm', 'Warm cream'], ['cool', 'Cool gray']])}`, isOpen('color', true))}
${own ? '' : group('fonts', 'Fonts', `<div class="dz-pairs">${FONT_PAIRS.filter(([h, b]) => fonts.includes(h) && fonts.includes(b)).map(([h, b, name]) => `<button type="button" class="dz-pair ${pairOn(h, b) ? 'on' : ''}" data-pair='${JSON.stringify([h, b])}' aria-pressed="${pairOn(h, b)}"><span style="font-family:'${h}',serif;font-weight:700;font-size:17px">${esc(h)}</span><span class="tiny muted" style="font-family:'${b}',sans-serif">${esc(name)} · ${esc(b)}</span></button>`).join('')}</div>
<div class="row-l"><label class="field">Headings<select data-font="heading">${fonts.map((f) => `<option ${f === d.fonts.heading ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></label><label class="field">Body<select data-font="body">${fonts.map((f) => `<option ${f === d.fonts.body ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></label></div>
<label class="btn small" style="align-self:flex-start">Upload your own font<input type="file" class="sr" id="dz-font" accept=".ttf,.otf,.woff,.woff2"></label><a class="tiny" href="#/help/custom-font">Help: adding a custom font</a>`, isOpen('fonts', false))}
${own ? '' : group('text', 'Text and spacing', `<b class="small">Text size</b>${seg('size', d.size, [[10, '10'], [10.5, '10.5'], [11, '11'], [11.5, '11.5']])}
<b class="small">Spacing</b>${seg('spacing', d.spacing, [['compact', 'Compact'], ['balanced', 'Balanced'], ['roomy', 'Roomy']])}
<b class="small">Margins</b>${seg('margin', d.margin, [[0.5, 'Narrow'], [0.6, 'Normal'], [0.75, 'Wide'], [1, 'Extra wide']])}
<label class="radio" style="align-self:flex-start"><input type="checkbox" data-fill ${d.fill ? 'checked' : ''}>Spread out to fill the page</label>
<span class="tiny muted">Text never goes below 10 point, so it stays readable.</span>`, isOpen('text', false))}
${own ? '' : group('details', 'Details', `<b class="small">Dates</b>${seg('dates', d.dates, [['right', 'On the right'], ['below', 'Under the title'], ['left', 'In their own column']])}
<b class="small">Bullets</b>${seg('bullets', d.bullets, [['dot', '• Dots'], ['dash', '– Dashes'], ['none', 'None']])}
<b class="small">Skills</b>${seg('skills', d.skills, [['inline', 'In a line'], ['columns', 'Columns'], ['list', 'A list'], ['tags', 'Boxes']])}`, isOpen('details', false))}
${group('page', 'Page', `<b class="small">Paper</b>${seg('paper', d.paper || 'letter', [['letter', 'US Letter'], ['a4', 'A4']])}
<b class="small">Length</b>${seg('length', d.length || 'one', [['one', 'One page'], ['one-half', 'Up to 1½ pages']])}${d.years >= 10 ? `<span class="tiny muted">You have ${d.years} years of experience, so 1½ pages is fine.</span>` : ''}
<b class="small">How far back</b>${seg('yearsBack', Number(d.yearsBack) || 15, [[10, '10 years'], [15, '15 years'], [50, 'Everything']])}`, isOpen('page', false))}
${own ? '' : `<button type="button" class="btn small" data-reset style="align-self:flex-start">Reset to the ${esc(d.presets[d.template]?.label || 'template')} defaults</button>`}`;
    if (own) fontsPanel(panel.querySelector('#dz-ownfonts'), { compact: true, onChange: () => paintPreview() });
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
    el.querySelector('#dz-name').textContent = d.mode === 'own' && d.ownBuilt ? 'Your own design' : `${d.presets[d.template]?.label || 'Custom'}${isCustomized() ? ' (customized)' : ''}`;
    frame.srcdoc = html;
  }
  const isCustomized = () => Boolean(d.raw && d.keys.some((k) => k in d.raw));

  frame.onload = () => {
    const doc = frame.contentDocument;
    const [pw, ph] = PAGE_PX[d.paper === 'a4' ? 'a4' : 'letter'];
    const full = Math.max(ph, doc.documentElement.scrollHeight);
    frame.style.width = pw + 'px'; frame.style.height = full + 'px';
    fit();
    // page breaks and fit
    // The page box includes its margins, so its height against the paper height is the page count.
    const used = doc.querySelector('.page')?.scrollHeight || 0;
    const pages = used / ph;
    const limit = d.length === 'one-half' ? 1.5 : 1;
    const breaks = el.querySelector('#dz-breaks');
    breaks.innerHTML = Array.from({ length: Math.ceil(full / ph) - 1 }, (_, i) => `<div class="dz-break" style="top:${(i + 1) * ph}px"><span>Page ${i + 2}</span></div>`).join('');
    const fitEl = el.querySelector('#dz-fit');
    fitEl.innerHTML = pages <= limit ? `✓ ${limit === 1 ? 'Fits on one page' : 'Within 1½ pages'}` : `<span style="color:var(--attention)">About ${pages.toFixed(1)} pages. Each tailored resume is trimmed to fit.</span>`;
  };
  function fit() {
    const stage = el.querySelector('#dz-stage'), scaleBox = el.querySelector('#dz-scale');
    const [pw] = PAGE_PX[d.paper === 'a4' ? 'a4' : 'letter'];
    const pad = stage.clientWidth > 600 ? 40 : 16;
    const scale = Math.min(1, (stage.clientWidth - pad * 2) / pw);
    scaleBox.style.transform = `scale(${scale})`;
    scaleBox.style.width = pw + 'px';
    scaleBox.style.left = Math.max(pad, (stage.clientWidth - pw * scale) / 2) + 'px';
    scaleBox.style.top = pad + 'px';
    stage.style.height = (parseFloat(frame.style.height) || 1056) * scale + pad * 2 + 'px';
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
    if ('own' in b.dataset) { await call('own.use', { on: true }); d = await call('design.get'); paintPanel(); paintPreview(); return; }
    if ('keepown' in b.dataset) return keepOwnFlow();
    if ('compare' in b.dataset) { modal('<h2>Your original and our rebuild</h2><div id="own-cmp"></div>', { wide: true, onMount: (m) => compareView(m.querySelector('#own-cmp'), { onSettled: () => paintPreview() }) }); return; }
    if (b.dataset.preset) { await call('design.applyPreset', { id: b.dataset.preset }); d = await call('design.get'); paintPanel(); paintPreview(); return; }
    if (b.dataset.set) return save({ [b.dataset.set]: JSON.parse(b.dataset.val) });
    if (b.dataset.pal) return save(JSON.parse(b.dataset.pal));
    if (b.dataset.pair) { const [heading, body] = JSON.parse(b.dataset.pair); return save({ fonts: { heading, body } }); }
    if (b.dataset.move) {
      // Move within its own column (main or sidebar), so every click visibly changes the resume.
      const inSide = (k) => d.layout !== 'single' && d.sidebar.includes(k);
      const side = inSide(b.dataset.move);
      const group = d.order.filter((k) => inSide(k) === side);
      const i = group.indexOf(b.dataset.move), j = i + Number(b.dataset.dir);
      if (j < 0 || j >= group.length) return;
      [group[i], group[j]] = [group[j], group[i]];
      const other = d.order.filter((k) => inSide(k) !== side);
      return save({ order: side ? [...other, ...group] : [...group, ...other] });
    }
    if ('rewrite' in b.dataset) {
      b.classList.add('busy'); b.textContent = 'Writing…';
      try { summary = await call('profile.writeSummary', { replace: true }); toast('New summary written. Edit it any way you like.'); } catch (ex) { toast(ex.message, true); }
      paintPanel(); paintPreview(); return;
    }
    if ('reset' in b.dataset) { await call('design.applyPreset', { id: d.template }); d = await call('design.get'); paintPanel(); paintPreview(); toast('Back to the template’s settings.'); }
  });
  panel.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.id === 'dz-summary') {
      summary = t.value.trim();
      await call('profile.setSummary', { text: summary });
      const note = panel.querySelector('#dz-sumnote'); if (note) note.textContent = 'Saved. It shows on every resume.';
      return paintPreview();
    }
    if (t.dataset.side) return save({ sidebar: t.checked ? [...new Set([...d.sidebar, t.dataset.side])] : d.sidebar.filter((x) => x !== t.dataset.side) });
    if ('icons' in t.dataset) return save({ icons: t.checked });
    if ('headline' in t.dataset) return save({ headline: t.checked });
    if ('fill' in t.dataset) return save({ fill: t.checked });
    if ('upper' in t.dataset) return save({ nameUpper: t.checked });
    if (t.dataset.show) return save({ hidden: t.checked ? d.hidden.filter((x) => x !== t.dataset.show) : [...d.hidden, t.dataset.show] });
    if (t.dataset.font) return save({ fonts: { [t.dataset.font]: t.value } });
    if (t.id === 'dz-color') return save({ accent: t.value });
    if (t.id === 'dz-color2') return save({ accent2: t.value });
    if (t.id === 'dz-font') { const [f] = await readFiles(t.files); try { const r = await call('design.uploadFont', f); toast(r.warning || `${r.family} is ready. Pick it under Fonts.`, Boolean(r.warning)); } catch (ex) { toast(ex.message, true); } d = await call('design.get'); paintPanel(); return; }
    if (t.id === 'dz-canva') { const [f] = await readFiles(t.files); toast('Looking at your design…'); try { await call('design.importCanva', f); toast('Imported. Check the preview.'); } catch (ex) { toast(ex.message, true); } d = await call('design.get'); paintPanel(); paintPreview(); }
  });

  async function keepOwnFlow() {
    const m = modal(`<h2>Keep your own resume’s design</h2><div id="own-flow" class="stack"></div>`, { wide: true });
    const box = (m?.querySelector ? m : document).querySelector('#own-flow');
    const step1 = async () => {
      const sources = await call('own.sources');
      box.innerHTML = `${sourceList(sources)}<label class="btn small" style="align-self:flex-start">${sources.length ? 'Or add another file' : 'Add your resume'}<input type="file" class="sr" id="own-add" accept=".pdf,.docx,.png,.jpg,.jpeg"></label>
<p class="tiny muted">PDF works best (Canva: Share, Download, PDF Standard). Word files and screenshots work too.</p>
<div class="row"><button class="btn primary" id="own-next" ${sources.length ? '' : 'disabled'}>Continue</button></div>`;
      box.querySelector('#own-add').onchange = async (e) => { const files = await readFiles(e.target.files); box.innerHTML = working('Adding your file…'); try { await call('materials.add', { files }); } catch (ex) { toast(ex.message, true); } step1(); };
      box.querySelector('#own-next').onclick = async () => { const id = box.querySelector('input[name=src]:checked, input[name=src][type=hidden]')?.value; if (!id) return; await call('own.start', { id }); step2(); };
    };
    const step2 = async () => {
      box.innerHTML = '<h3>Your resume’s fonts</h3><div id="own-fonts"></div><div class="row"><button class="btn primary" id="own-build">Rebuild my design</button><span class="tiny muted">Missing fonts can be uploaded later.</span></div>';
      await fontsPanel(box.querySelector('#own-fonts'));
      box.querySelector('#own-build').onclick = async () => { box.innerHTML = '<div id="own-cmp"></div>'; await compareView(box.querySelector('#own-cmp'), { onSettled: async () => { d = await call('design.get'); thumbs = null; call('design.thumbnails').then((t) => { thumbs = t; fillThumbs(); }); paintPanel(); paintPreview(); } }); };
    };
    step1();
  }

  paintPanel();
  paintPreview();
  call('design.thumbnails').then((t) => { thumbs = t; fillThumbs(); }).catch(() => {});
}
