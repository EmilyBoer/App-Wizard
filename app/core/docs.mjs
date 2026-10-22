// Resume and cover letter pages: three built-in looks, fonts, minimum sizes,
// what to cut when it doesn't fit, file names and plain-text versions.

import { dateKey } from './profile.mjs';
import { GOOGLE as GOOGLE_FAMILIES } from './fonts.mjs';

export const FONTS = ['Inter', 'Poppins', 'Lato', 'Open Sans', 'Roboto', 'Source Sans 3', 'Work Sans', 'Montserrat', 'Raleway', 'Lora', 'Source Serif 4', 'Merriweather', 'EB Garamond', 'Playfair Display'];
export const SERIF = new Set(['Lora', 'Source Serif 4', 'Merriweather', 'EB Garamond', 'Playfair Display']);

// Common Canva fonts and the closest included font.
export const FONT_MATCH = {
  'brice': 'Montserrat', 'league spartan': 'Montserrat', 'glacial indifference': 'Work Sans', 'canva sans': 'Inter', 'poppins': 'Montserrat',
  'arimo': 'Roboto', 'archivo': 'Work Sans', 'nunito': 'Lato', 'quicksand': 'Raleway', 'josefin sans': 'Raleway', 'oswald': 'Montserrat',
  'bebas neue': 'Montserrat', 'garet': 'Work Sans', 'now': 'Inter', 'helvetica': 'Inter', 'arial': 'Roboto', 'calibri': 'Lato', 'garamond': 'EB Garamond',
  'times new roman': 'Lora', 'georgia': 'Merriweather', 'playfair': 'Playfair Display', 'cormorant garamond': 'EB Garamond', 'libre baskerville': 'Lora',
  'dm serif display': 'Playfair Display', 'alice': 'Lora', 'cardo': 'EB Garamond',
};

export function matchFont(name) {
  if (!name) return 'Inter';
  const n = name.toLowerCase().replace(/[-_]?(bold|regular|light|medium|semibold|italic|black)\b/g, '').trim();
  const exact = FONTS.find((f) => f.toLowerCase() === n);
  if (exact) return exact;
  for (const [k, v] of Object.entries(FONT_MATCH)) if (n.includes(k)) return v;
  return /serif|garamond|times|book|roman|baskerville|bodoni|didot/.test(n) && !/sans/.test(n) ? 'Lora' : 'Inter';
}

export const MIN = { body: 10, heading: 11, name: 18, marginIn: 0.5, lineHeight: 1.2 };
// Templates are just good starting combinations of design settings. People can change any setting after.
// Fonts used here are all free Google Fonts.
export const PRESETS = {
  classic: { label: 'Classic', note: 'A monogram, a serif name and fine rules.', mono: 'circle', jobLine: 'one', layout: 'single', header: 'left', headerRule: 'hairline', contact: 'spread', icons: false, headline: true, nameStyle: 'bold', titles: 'rule', nameSize: 'large', fonts: { heading: 'Lora', body: 'Inter' }, accent: '#1B2A41', accent2: '#4F9BD9', size: 10, spacing: 'balanced', margin: 0.55, dates: 'right', bullets: 'dot', skills: 'columns', sidebarTint: 'none', pageTint: 'none' },
  timeline: { label: 'Timeline', note: 'A real timeline: every job on a connected line.', jobLine: 'one', layout: 'single', header: 'left', headerRule: 'hairline', contact: 'spread', icons: false, headline: true, nameStyle: 'bold', titles: 'rule', nameSize: 'large', fonts: { heading: 'Poppins', body: 'Inter' }, accent: '#0F4C5C', accent2: '#F29E5C', size: 10, spacing: 'balanced', margin: 0.55, dates: 'left', bullets: 'dot', skills: 'columns', sidebarTint: 'none', pageTint: 'none' },
  modern: { label: 'Modern', note: 'A soft sidebar with your initials, contact and skills.', mono: 'square', layout: 'sidebar-left', header: 'left', headerRule: 'none', contact: 'spread', icons: true, headline: true, nameStyle: 'split', titles: 'short', nameSize: 'xl', fonts: { heading: 'Poppins', body: 'Inter' }, accent: '#4B5A2E', accent2: '#C2A86A', size: 10, spacing: 'balanced', margin: 0.5, dates: 'right', bullets: 'dot', skills: 'tags', sidebarTint: 'light', pageTint: 'none' },
  executive: { label: 'Executive', note: 'Centered and formal, for senior roles.', jobLine: 'one', layout: 'single', header: 'center', headerRule: 'double', contact: 'spread', icons: false, headline: true, nameStyle: 'bold', nameUpper: true, titles: 'center', nameSize: 'large', fonts: { heading: 'Lora', body: 'Source Sans 3' }, accent: '#26282B', accent2: '#B08D57', size: 10, spacing: 'balanced', margin: 0.62, dates: 'right', bullets: 'dot', skills: 'columns', sidebarTint: 'none', pageTint: 'none' },
  minimal: { label: 'Minimal', note: 'Numbered sections in the margin and a large, light name.', numbers: true, jobLine: 'one', layout: 'single', header: 'left', headerRule: 'none', contact: 'together', icons: false, headline: true, nameStyle: 'light', titles: 'gutter', nameSize: 'xxl', fonts: { heading: 'Inter', body: 'Inter' }, accent: '#111111', accent2: '#F0705F', size: 10, spacing: 'balanced', margin: 0.58, dates: 'right', bullets: 'dash', skills: 'inline', sidebarTint: 'none', pageTint: 'none' },
  bold: { label: 'Bold', note: 'A deep color band with your initials in the background.', mono: 'watermark', jobLine: 'one', layout: 'single', header: 'band', headerRule: 'none', contact: 'spread', icons: true, headline: true, nameStyle: 'bold', titles: 'tint', nameSize: 'xl', fonts: { heading: 'Poppins', body: 'Inter' }, accent: '#45284F', accent2: '#E39AAE', size: 10, spacing: 'balanced', margin: 0.5, dates: 'right', bullets: 'dot', skills: 'tags', sidebarTint: 'none', pageTint: 'none' },
  editorial: { label: 'Editorial', note: 'Warm paper, big serif headings, a writer’s feel.', headlineStyle: 'italic', layout: 'single', header: 'left', headerRule: 'accent', contact: 'together', icons: false, headline: true, nameStyle: 'bold', titles: 'plain', nameSize: 'xl', fonts: { heading: 'Lora', body: 'Source Sans 3' }, accent: '#9C4A2F', accent2: '#D9B48F', size: 10, spacing: 'balanced', margin: 0.58, dates: 'below', bullets: 'dot', skills: 'inline', sidebarTint: 'none', pageTint: 'warm' },
  twotone: { label: 'Two-tone', note: 'A dark sidebar with white text.', mono: 'circle', layout: 'sidebar-left', header: 'left', headerRule: 'none', contact: 'spread', icons: true, headline: true, nameStyle: 'split', titles: 'caps', nameSize: 'xl', fonts: { heading: 'Poppins', body: 'Inter' }, accent: '#1F3B2D', accent2: '#C9A227', size: 10, spacing: 'balanced', margin: 0.5, dates: 'below', bullets: 'dot', skills: 'tags', sidebarTint: 'dark', pageTint: 'none' },
};
const RENAMED = { compact: 'timeline' };
/** Every design setting a person can change (a template sets all of them). */
export const DESIGN_KEYS = ['accent2', 'layout', 'header', 'headerRule', 'mono', 'headlineStyle', 'jobLine', 'numbers', 'contact', 'icons', 'headline', 'nameStyle', 'titles', 'size', 'spacing', 'margin', 'dates', 'bullets', 'skills', 'sidebarTint', 'pageTint', 'accent', 'order', 'hidden', 'sidebar', 'nameSize', 'nameUpper', 'fill'];
export const TEMPLATES = Object.fromEntries(Object.entries(PRESETS).map(([k, v]) => [k, { label: v.label, note: v.note, columns: v.layout === 'single' ? 1 : 2 }]));
export const SECTIONS = { summary: 'Summary', experience: 'Experience', skills: 'Skills', education: 'Education', certifications: 'Certifications' };
// Two-color palettes: a deep main color (name, section titles) and a highlight (bullets, bars, dots, badges, bubbles).
export const PALETTES = {
  'ink-sky': { name: 'Ink and sky', accent: '#1B2A41', accent2: '#4F9BD9' },
  'navy-coral': { name: 'Navy and coral', accent: '#14213D', accent2: '#EF6F61' },
  'teal-peach': { name: 'Teal and peach', accent: '#0F4C5C', accent2: '#F29E5C' },
  'forest-gold': { name: 'Forest and gold', accent: '#1F3B2D', accent2: '#C9A227' },
  'plum-blush': { name: 'Plum and blush', accent: '#45284F', accent2: '#E39AAE' },
  'clay-sand': { name: 'Clay and sand', accent: '#9C4A2F', accent2: '#D9B48F' },
  'olive-linen': { name: 'Olive and linen', accent: '#4B5A2E', accent2: '#C2A86A' },
  'charcoal-mint': { name: 'Charcoal and mint', accent: '#26282B', accent2: '#4DB38E' },
  'black-coral': { name: 'Black and coral', accent: '#111111', accent2: '#F0705F' },
  'charcoal-brass': { name: 'Charcoal and brass', accent: '#26282B', accent2: '#B08D57' },
};
export const ACCENTS = ['#23395B', '#1E1E1E', '#1D3557', '#1F6F6B', '#4A6B5C', '#24413B', '#9C4A2F', '#6B4E8C'];
// Space between sections, jobs and bullets (points), the gap under a section title, and line height.
// One spacing system. sec: between sections (also header to first section), role: between jobs and between
// education entries, h: under a section title, li: between bullets and list items, lh: line height.
const SPACING = { compact: { sec: 14, role: 9, li: 2, h: 6, lh: 1.32 }, balanced: { sec: 19, role: 12, li: 3, h: 8, lh: 1.38 }, roomy: { sec: 24, role: 15, li: 4, h: 10, lh: 1.46 } };
const NAME_SIZE = { standard: 2.6, large: 3.2, xl: 3.8, xxl: 4.4 };
const PAPER = { none: '#FFFFFF', warm: '#FBF7F1', cool: '#F5F8FB' };

/** Fill in every design setting: the template's choices first, then what the person changed. */
export function normalizeDesign(d = {}) {
  const template = RENAMED[d.template] || d.template;
  const preset = PRESETS[template] || PRESETS.classic;
  const out = { ...preset, ...Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined && v !== null)), template: PRESETS[template] ? template : 'classic' };
  out.fonts = { ...preset.fonts, ...(d.fonts || {}) };
  out.order = (d.order && d.order.length ? d.order : ['summary', 'experience', 'skills', 'education', 'certifications']).filter((k) => SECTIONS[k]);
  for (const k of Object.keys(SECTIONS)) if (!out.order.includes(k)) out.order.push(k);
  out.hidden = d.hidden || [];
  out.sidebar = d.sidebar || ['skills', 'education', 'certifications'];
  out.size = Math.max(MIN.body, Number(out.size) || 10);
  out.nameSize = NAME_SIZE[out.nameSize] ? out.nameSize : 'large';
  out.margin = Math.max(MIN.marginIn, Number(out.margin) || 0.6);
  out.accent = /^#[0-9a-f]{6}$/i.test(out.accent) ? out.accent : '#23395B';
  out.accent2 = /^#[0-9a-f]{6}$/i.test(out.accent2) ? out.accent2 : out.accent;
  out.sidebarTint = out.sidebarTint === true ? 'light' : out.sidebarTint === false ? 'none' : ['none', 'light', 'dark'].includes(out.sidebarTint) ? out.sidebarTint : 'none';
  out.pageTint = PAPER[out.pageTint] ? out.pageTint : 'none';
  out.contact = out.contact === 'together' ? 'together' : 'spread';
  out.headerRule = ['none', 'hairline', 'accent', 'double'].includes(out.headerRule) ? out.headerRule : 'none';
  out.mono = ['none', 'circle', 'square', 'watermark'].includes(out.mono) ? out.mono : 'none';
  out.headlineStyle = out.headlineStyle === 'italic' ? 'italic' : 'caps';
  out.jobLine = out.jobLine === 'one' ? 'one' : 'two';
  out.numbers = Boolean(out.numbers);
  out.nameStyle = ['bold', 'light', 'split'].includes(out.nameStyle) ? out.nameStyle : 'bold';
  if (out.header === 'split' && out.layout === 'single' && false) out.header = 'split';
  if (out.dates === 'left' && out.titles === 'gutter') out.dates = 'right';
  out.icons = Boolean(out.icons);
  out.headline = out.headline !== false;
  out.fill = out.fill !== false;
  return out;
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function fmtDate(d) {
  if (!d) return '';
  if (/present|now|current/i.test(d)) return 'Present';
  const m = String(d).match(/(\d{4})(?:-(\d{1,2}))?/);
  if (!m) return String(d);
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return m[2] ? `${mon[Number(m[2]) - 1]} ${m[1]}` : m[1];
}

export function pageSize(design) {
  return design.paper === 'a4' ? { w: '210mm', h: '297mm', wIn: 8.27, hIn: 11.69 } : { w: '8.5in', h: '11in', wIn: 8.5, hIn: 11 };
}

export function maxPages(design) { return design.length === 'one-half' ? 1.5 : 1; }

/** @font-face rules for uploaded fonts (every weight and style), plus a link for included fonts. */
export function fontFaces(families, customFonts = [], fontBase, extraGoogle = []) {
  families = [...new Set(families.filter(Boolean))];
  const want = new Set(families.map((f) => f.toLowerCase()));
  const custom = customFonts.filter((f) => want.has(String(f.family).toLowerCase()));
  const customFamilies = new Set(custom.map((f) => f.family.toLowerCase()));
  const builtin = families.filter((f) => !customFamilies.has(f.toLowerCase()) && (FONTS.includes(f) || extraGoogle.includes(f)));
  const css = custom.map((f) => `@font-face{font-family:"${f.family}";src:url(data:${f.mime};base64,${f.base64});font-weight:${f.weight || '100 900'};font-style:${f.italic ? 'italic' : 'normal'};}`).join('\n');
  // Bundled fonts if present, else Google Fonts.
  const link = builtin.length ? `<link rel="stylesheet" href="${fontBase ? `${fontBase}/fonts.css` : `https://fonts.googleapis.com/css2?${builtin.map((f) => `family=${encodeURIComponent(f)}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400`).join('&')}&display=swap`}">` : '';
  return { link, css };
}

/** How light a color is, 0 to 255. */
function lum(hex) { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); return r * 0.3 + g * 0.59 + b * 0.11; }

/** Mix a color toward white (or another color): amount 0 = the color, 1 = the other. Solid, so it prints evenly. */
function mix(hex, amount, toward = '#ffffff') {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [a, b] = [p(hex), p(toward)];
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * amount).toString(16).padStart(2, '0')).join('');
}

// Small line icons for contact details. Drawn, not text, so hiring systems skip them.
const ICON = {
  location: '<path d="M8 14.5s4.8-4.4 4.8-8A4.8 4.8 0 0 0 3.2 6.5c0 3.6 4.8 8 4.8 8z"/><circle cx="8" cy="6.4" r="1.7"/>',
  phone: '<path d="M4.6 2.2h2.1l1 2.9-1.4 1a7.4 7.4 0 0 0 3.6 3.6l1-1.4 2.9 1v2.1a1.4 1.4 0 0 1-1.5 1.4A10.9 10.9 0 0 1 3.2 3.7a1.4 1.4 0 0 1 1.4-1.5z"/>',
  email: '<rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="M2.6 4.6 8 8.8l5.4-4.2"/>',
  linkedin: '<rect x="2" y="2" width="12" height="12" rx="2.2"/><path d="M5.2 7.2v4M5.2 4.9v.1M8 11.2V7.2m0 2.1a2 2 0 0 1 4 0v1.9"/>',
  website: '<circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2.2 2.3 2.2 9.7 0 12M8 2c-2.2 2.3-2.2 9.7 0 12"/>',
};
const icon = (k) => `<svg class="ico" viewBox="0 0 16 16" aria-hidden="true">${ICON[k]}</svg>`;
const clean = (u) => String(u || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const contactItems = (c) => [['location', c.location], ['phone', c.phone], ['email', c.email], ['linkedin', clean(c.linkedin)], ['website', clean(c.website)]].filter(([, v]) => v);
function contactHtml(c, d, cls) {
  return `<div class="contact ${cls}">${contactItems(c).map(([k, v]) => `<span class="ci">${d.icons ? icon(k) : ''}<span>${esc(v)}</span></span>`).join(' ')}</div>`;
}
/** Headline under the name: what they set, else their most recent job title (always true to their history). */
function headlineOf(resume) {
  const c = resume.contact || {};
  if (resume.headline != null && resume.headline !== '') return resume.headline;
  if ('headline' in c) return c.headline || '';
  return resume.roles?.[0]?.title || '';
}
function nameHtml(name, d) {
  const parts = String(name || '').trim().split(/\s+/);
  if (d.nameStyle === 'split' && parts.length > 1) return `<span class="n-light">${esc(parts.slice(0, -1).join(' '))}</span> <span class="n-bold">${esc(parts.at(-1))}</span>`;
  return esc(name);
}

const initials = (name) => String(name || '').trim().split(/\s+/).filter(Boolean).map((w) => w[0]).filter((ch, i, a) => i === 0 || i === a.length - 1).join('').toUpperCase();

/** Name and contact at the top, for one-column layouts and letters. */
function headerHtml(c, d, resume = {}) {
  const head = ['split', 'band', 'center'].includes(d.header) ? d.header : 'left';
  const hl = d.headline ? headlineOf({ ...resume, contact: c }) : '';
  const nameBlock = `<div class="hd-name"><h1>${nameHtml(c.name, d)}</h1>${hl ? `<div class="headline ${d.headlineStyle === 'italic' ? 'it' : ''}">${esc(hl)}</div>` : ''}</div>`;
  const mono = (d.mono === 'circle' || d.mono === 'square') && head !== 'band' ? `<div class="mono mono-${d.mono}" aria-hidden="true">${esc(initials(c.name))}</div>` : '';
  const name = mono ? `<div class="hd-id">${mono}${nameBlock}</div>` : nameBlock;
  if (head === 'band') return `<header class="hd h-band ${d.mono === 'watermark' ? 'wm' : ''}" data-initials="${esc(initials(c.name))}">${nameBlock}${contactHtml(c, d, d.contact === 'together' ? 'c-together' : d.icons && contactItems(c).length >= 5 ? 'c-grid' : 'c-spread')}</header>`;
  if (head === 'split') return `<header class="hd h-split">${name}${contactHtml(c, d, 'c-stack')}</header>`;
  const spread = d.contact === 'together' ? 'c-together' : d.icons && contactItems(c).length >= 5 ? 'c-grid' : 'c-spread';
  return `<header class="hd h-${head} rule-${d.headerRule}">${name}${contactHtml(c, d, spread)}</header>`;
}

function headerCss(d, f, nameSize, m) {
  const a = d.accent, a2 = d.accent2 || d.accent;
  const onA2 = lum(a2) > 150 ? a : '#fff';
  const nameWeight = d.nameStyle === 'light' ? 300 : d.nameUpper ? 600 : 700;
  return `.hd{margin-bottom:calc(var(--k) * ${(SPACING[d.spacing] || SPACING.balanced).sec + 3}pt)}
h1{font-family:${f.head};font-size:${nameSize}pt;margin:0;color:var(--name);letter-spacing:${d.nameUpper ? '.14em' : nameSize >= 34 ? '-.03em' : '-.02em'};line-height:1.02;font-weight:${nameWeight};${d.nameUpper ? 'text-transform:uppercase;' : ''}}
.n-light{font-weight:300}.n-bold{font-weight:700}
.headline{font-family:${f.body};font-size:${d.size}pt;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--hl, var(--acc-text));margin-top:${Math.round(nameSize * 0.24)}pt}
.hd-name{margin-bottom:${Math.round(nameSize * 0.34)}pt}
.headline.it{font-family:${f.head};font-style:italic;text-transform:none;letter-spacing:0;font-weight:400;font-size:${d.size + 3}pt}
.hd-id{display:flex;align-items:center;gap:${Math.round(nameSize * 0.5)}pt;margin-bottom:${Math.round(nameSize * 0.34)}pt}
.hd-id .hd-name{margin:0}
.h-center .hd-id{flex-direction:column;gap:${Math.round(nameSize * 0.35)}pt}
.mono{flex:none;display:flex;align-items:center;justify-content:center;width:${Math.round(nameSize * 1.75)}pt;height:${Math.round(nameSize * 1.75)}pt;font-family:${f.head};font-weight:600;font-size:${Math.round(nameSize * 0.6)}pt;letter-spacing:.04em;line-height:1}
.mono-circle{border:1.75pt solid ${a2};color:${a};border-radius:50%}
.mono-square{background:${a2};color:${onA2};border-radius:${Math.round(nameSize * 0.3)}pt}
.wm{position:relative;overflow:hidden}.wm > *{position:relative;z-index:1}
.wm::after{content:attr(data-initials);position:absolute;right:${m * 0.5}in;top:-${Math.round(nameSize * 0.55)}pt;font-family:${f.head};font-weight:800;font-size:${Math.round(nameSize * 3.6)}pt;letter-spacing:-.05em;line-height:1;color:rgba(255,255,255,.07)}
.rule-double .contact,.h-center.rule-double .contact{border-top:2.25pt double var(--rule-strong);border-bottom:2.25pt double var(--rule-strong);padding:7pt 2pt}
.contact{font-size:${MIN.body}pt;color:var(--ink2);line-height:1.4}
.ci{white-space:nowrap;display:inline-flex;align-items:center}
.ico{width:.9em;height:.9em;margin-right:4pt;flex:none;fill:none;stroke:var(--icon);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.c-spread{display:flex;justify-content:space-between;flex-wrap:wrap;gap:3pt 10pt}
.c-grid{display:grid;grid-template-columns:repeat(3,auto);justify-content:space-between;gap:5pt 14pt}
.c-together{display:flex;flex-wrap:wrap;align-items:center;row-gap:3pt}
.c-together .ci + .ci::before{content:"";display:inline-block;width:.75pt;height:.95em;background:var(--rule-strong);margin:0 9pt}
.c-stack{display:flex;flex-direction:column;gap:4pt}
.rule-hairline .contact{border-top:.75pt solid var(--rule);padding-top:8pt}
.rule-accent .hd-name::after{content:"";display:block;width:34pt;height:3pt;background:${a2};margin-top:${Math.round(nameSize * 0.36)}pt}
.h-center{text-align:center}
.h-center .contact{border-top:.75pt solid var(--rule);border-bottom:.75pt solid var(--rule);padding:6pt 2pt}
.h-center .c-together{justify-content:center}
.h-split{display:flex;justify-content:space-between;align-items:flex-end;gap:24pt;border-bottom:.75pt solid var(--rule);padding-bottom:12pt}
.h-split .hd-name{margin:0}
.h-split .c-stack{align-items:flex-end;text-align:right}
.h-split .ci{flex-direction:row-reverse}.h-split .ico{margin:0 0 0 5pt}
.h-band{background:${a};box-shadow:inset 0 -5pt 0 ${a2};margin:-${m}in -${m}in calc(var(--k) * ${(SPACING[d.spacing] || SPACING.balanced).sec + 3}pt);padding:${Math.max(0.45, m * 0.8)}in ${m}in ${Math.max(0.3, m * 0.5)}in;--name:#fff;--ink2:rgba(255,255,255,.9);--icon:${a2};--acc-text:${a2};--hl:${a2};--rule:rgba(255,255,255,.25);--rule-strong:rgba(255,255,255,.4)}`;
}

/** Resume HTML from the design settings. Reading order in the HTML = reading order for hiring systems. */
export function resumeHtml(resume, design, { fontBase } = {}) {
  const d = normalizeDesign(design);
  if (d.mode === 'own' && d.own?.template) return ownResumeHtml(resume, d, { fontBase });
  const page = pageSize(d);
  const head = d.fonts.heading || 'Inter', body = d.fonts.body || 'Inter';
  const { link, css } = fontFaces([head, body], d.customFonts, fontBase);
  const fb = (x) => (SERIF.has(x) ? 'Georgia, serif' : 'Arial, Helvetica, sans-serif');
  const f = { head: `"${head}",${fb(head)}`, body: `"${body}",${fb(body)}` };
  const sp = SPACING[d.spacing] || SPACING.balanced;
  const a = d.accent, a2 = d.accent2 || d.accent, m = d.margin, s = d.size;
  const nameSize = Math.max(MIN.name, Math.round(s * (NAME_SIZE[d.nameSize] || NAME_SIZE.large)));
  const hs = Math.max(MIN.heading, s + 1);
  const c = resume.contact || {};
  const sidebarOn = d.layout !== 'single';
  const titles = d.titles === 'gutter' && sidebarOn ? 'caps' : d.titles;
  const timeline = d.dates === 'left' && !sidebarOn;
  const dates = d.dates === 'left' && sidebarOn ? 'right' : d.dates;
  const inSide = (k) => sidebarOn && d.sidebar.includes(k);
  const paper = PAPER[d.pageTint];
  const dark = (x) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16)); return r * 0.3 + g * 0.59 + b * 0.11 < 70; };
  // The accent as text: very dark accents read as ink; colorful ones keep their color.
  const accText = a;
  const when = (r) => `${esc(fmtDate(r.start))}${r.end ? ` – ${esc(fmtDate(r.end))}` : ''}`;
  const whenStack = (r) => `<span>${esc(fmtDate(r.start))}${r.end ? ' –' : ''}</span>${r.end ? `<span>${esc(fmtDate(r.end))}</span>` : ''}`;
  const coLine = (r) => `<div class="rc"><span class="co">${esc(r.company)}</span>${r.location ? `<span class="sepx"> · </span><span class="rl">${esc(r.location)}</span>` : ''}</div>`;
  const bullets = (r) => `<ul>${(r.bullets || []).map((b) => `<li>${esc(b.text)}</li>`).join('')}</ul>`;
  const oneLine = d.jobLine === 'one' && !sidebarOn;
  const roles = (resume.roles || []).map((r) => {
    const loc = r.location ? esc(r.location) : '';
    if (timeline) return `<div class="role tl"><div class="tl-rail"></div><div class="tl-body"><div class="tl-when">${when(r)}${loc ? `<span class="sepx"> · </span>${loc}` : ''}</div><div class="rt">${esc(r.title)}<span class="sepx"> · </span><span class="co">${esc(r.company)}</span></div>${bullets(r)}</div></div>`;
    if (dates === 'below') return `<div class="role"><div class="rt">${esc(r.title)}</div><div class="rc"><span class="co">${esc(r.company)}</span>${loc ? `<span class="sepx"> · </span><span class="rl">${loc}</span>` : ''}<span class="sepx"> · </span><span class="rd rd-below">${when(r)}</span></div>${bullets(r)}</div>`;
    if (oneLine) return `<div class="role"><div class="rh"><span class="rh-l"><span class="rt">${esc(r.title)}</span><span class="sepx"> · </span><span class="co">${esc(r.company)}</span></span><span class="rd">${loc ? `${loc}<span class="sepx"> · </span>` : ''}${when(r)}</span></div>${bullets(r)}</div>`;
    return `<div class="role"><div class="rh"><span class="rt">${esc(r.title)}</span><span class="rd">${when(r)}</span></div>${coLine(r)}${bullets(r)}</div>`;
  }).join('');
  const skillList = resume.skills || [];
  const skills = (side) => {
    if (!skillList.length) return '';
    const style = side && (d.skills === 'inline' || d.skills === 'columns') ? 'comma' : d.skills;
    if (style === 'tags') return `<div class="tags">${skillList.map((x) => `<span class="tagx">${esc(x)}</span>`).join(' ')}</div>`;
    if (style === 'comma') return `<p class="sk-comma">${skillList.map((x) => esc(x)).join(', ')}</p>`;
    if (style === 'list') return `<ul class="sk-list">${skillList.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    if (style === 'columns') return `<ul class="sk-cols">${skillList.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    return `<p class="skills">${skillList.map((x) => `<span class="sk">${esc(x)}</span>`).join(' ')}</p>`;
  };
  const yearRow = (main, sub, year, side) => {
    if (side) return `<div class="ed"><div class="et">${main}</div>${sub ? `<div class="es">${sub}</div>` : ''}${year ? `<div class="rd">${esc(year)}</div>` : ''}</div>`;
    if (timeline) return `<div class="ed tl"><div class="tl-rail"></div><div class="tl-body"><div class="rh"><span class="et">${main}</span>${year ? `<span class="rd">${esc(year)}</span>` : ''}</div>${sub ? `<div class="es">${sub}</div>` : ''}</div></div>`;
    return `<div class="ed"><div class="rh"><span class="et">${main}</span>${year ? `<span class="rd">${esc(year)}</span>` : ''}</div>${sub ? `<div class="es">${sub}</div>` : ''}</div>`;
  };
  const edu = (side) => (resume.education || []).map((e) => yearRow(`${esc(e.degree)}${e.field ? `, ${esc(e.field)}` : ''}`, esc(e.school), e.year, side)).join('');
  const certs = (side) => (resume.certifications || []).map((x) => yearRow(esc(x.name), '', x.year, side)).join('');
  const summary = resume.summary ? `<p class="summary">${esc(resume.summary)}</p>` : '';
  const skillsBlock = (side) => { const b = skills(side); return b; };
  const block = (k, side) => ({ summary, experience: roles, skills: skillsBlock(side), education: edu(side), certifications: certs(side) })[k];
  const sec = (k, side) => { const b = block(k, side); return b && !d.hidden.includes(k) ? `<section class="sec sec-${k}"><h2><span>${SECTIONS[k]}</span></h2><div class="sec-body">${b}</div></section>` : ''; };
  const mainHtml = d.order.filter((k) => !inSide(k)).map((k) => sec(k, false)).join('');
  const sideHtml = d.order.filter(inSide).map((k) => sec(k, true)).join('');

  const caps = (size, track) => `text-transform:uppercase;letter-spacing:${track}em;font-size:${size}pt;font-weight:700`;
  const titleCss = {
    rule: `${caps(Math.max(MIN.body, hs - 1), 0.16)};color:var(--acc-text);border-bottom:.75pt solid var(--rule);padding-bottom:5pt`,
    caps: `${caps(Math.max(MIN.body, hs - 1), 0.18)};color:var(--acc-text)`,
    short: `${caps(Math.max(MIN.body, hs - 1), 0.18)};color:var(--acc-text)`,
    bar: `${caps(Math.max(MIN.body, hs - 1), 0.14)};color:var(--acc-text);border-left:3pt solid ${a2};padding-left:8pt;line-height:1.1`,
    tint: `${caps(Math.max(MIN.body, hs - 1), 0.16)};color:${dark(a) ? a : mix(a, 0.2, '#000000')};background:${mix(a2, 0.87, paper)};padding:4pt 8pt;border-radius:2pt`,
    plain: `color:var(--acc-text);font-size:${hs + 3}pt;font-weight:600;letter-spacing:-.01em;line-height:1.15`,
    center: `${caps(Math.max(MIN.body, hs - 1), 0.24)};color:var(--acc-text);display:flex;align-items:center;gap:12pt`,
    gutter: `${caps(Math.max(MIN.body, hs - 1), 0.07)};color:var(--acc-text);margin:0 !important;padding-top:2pt;line-height:1.3`,
  }[titles] || '';
  const extraTitle = titles === 'center' ? 'h2::before,h2::after{content:"";flex:1;border-top:.75pt solid var(--rule)}'
    : titles === 'short' ? `h2::after{content:"";display:block;width:22pt;height:2.5pt;background:${a2};margin-top:6pt}`
      : titles === 'gutter' ? '.single .sec{display:grid;grid-template-columns:1.32in 1fr;column-gap:14pt}' : '';
  const numberCss = d.numbers && titles !== 'center' ? `.single,.main{counter-reset:sec}.single h2::before,.main h2::before{counter-increment:sec;content:counter(sec, decimal-leading-zero);font-weight:400;letter-spacing:.04em;color:${a2};margin-right:9pt}${titles === 'gutter' ? '.single h2::before{display:block;margin:0 0 2pt}' : ''}` : '';
  const bulletCss = d.bullets === 'dash' ? '.role ul{list-style:none;padding-left:13pt}.role li{position:relative}.role li::before{content:"–";position:absolute;left:-12pt;color:var(--muted)}'
    : d.bullets === 'none' ? '.role ul{list-style:none;padding-left:0}'
      : `.role ul{list-style:none;padding-left:12pt}.role li{position:relative}.role li::before{content:"";position:absolute;left:-10.5pt;top:calc(${sp.lh / 2}em - 1.8pt);width:3.6pt;height:3.6pt;border-radius:50%;background:${a2}}`;

  // Sidebar layouts: the color runs edge to edge, full height, on every page.
  const cw = page.wIn - 2 * m, gap = 0.5, sideW = +(cw * 0.32).toFixed(2);
  const stripW = (m + sideW + gap / 2).toFixed(3);
  const tint = d.sidebarTint;
  const sideBg = tint === 'dark' ? a : mix(a, 0.83, paper);
  const strip = sidebarOn && tint !== 'none' ? `<div class="strip" style="${d.layout === 'sidebar-left' ? 'left' : 'right'}:0;width:${stripW}in;background:${sideBg}"></div>` : '';
  const hl = d.headline ? headlineOf(resume) : '';
  const sideNamecard = `<header class="hd-main"><h1>${nameHtml(c.name, d)}</h1>${hl ? `<div class="headline ${d.headlineStyle === 'italic' ? 'it' : ''}">${esc(hl)}</div>` : ''}</header>`;
  const sideMono = d.mono === 'circle' || d.mono === 'square' ? `<div class="mono mono-${d.mono} side-mono" aria-hidden="true">${esc(initials(c.name))}</div>` : '';
  const contactSec = `${sideMono}<section class="sec sec-contact"><h2><span>Contact</span></h2><div class="sec-body">${contactHtml(c, d, 'c-stack')}</div></section>`;
  const layout = sidebarOn
    ? `<div class="cols ${d.layout}">${sideNamecard}<aside class="side ${tint === 'dark' ? 'dark' : ''}">${contactSec}${sideHtml}</aside><div class="main">${mainHtml}</div></div>`
    : `${headerHtml(c, d, resume)}<div class="single">${mainHtml}</div>`;
  const pagePx = Math.round(page.hIn * 96);
  const rule = d.pageTint === 'warm' ? '#E3DACB' : '#DCDFE6';

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(c.name)} Resume</title>${link}<style>
${css}
@page{size:${page.w} ${page.h};margin:0}
*{box-sizing:border-box}
html{background:${paper}}
body{margin:0;--k:1;--tight:3pt;--acc:${a};--acc-text:${accText};--hl:${lum(a2) < 160 ? a2 : a};--name:${a};--ink:#1C2130;--ink2:#4A5163;--muted:#7D8396;--rule:${rule};--rule-strong:#B9BECB;--icon:${a};font-family:${f.body};font-size:${s}pt;line-height:${sp.lh};color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact;font-kerning:normal;font-feature-settings:"kern","liga","calt";text-rendering:optimizeLegibility;font-variant-numeric:lining-nums;-webkit-font-smoothing:antialiased}
.page{position:relative;z-index:1;width:${page.w};padding:${m}in;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.strip{position:fixed;top:0;bottom:0;z-index:0}
${headerCss(d, f, nameSize, m)}
h2{font-family:${f.head};margin:0 0 calc(var(--k) * ${sp.h}pt);break-after:avoid;line-height:1.2;${titleCss}}
${extraTitle}
${numberCss}
.sec + .sec{margin-top:calc(var(--k) * ${sp.sec}pt)}
.summary{color:var(--ink2)}
.role{break-inside:avoid-page}
.role + .role{margin-top:calc(var(--k) * ${sp.role}pt)}
.rh{display:flex;justify-content:space-between;gap:12pt;align-items:baseline}
.rh-l{min-width:0}
.rh-l .co{font-size:${s + 1}pt}
.rt{font-weight:600;color:var(--ink);font-size:${s + 1}pt;letter-spacing:-.005em;line-height:1.3}
.rc{color:var(--ink2);margin-top:var(--tight)}
.co{font-weight:600;color:var(--ink2)}
.sepx{color:var(--muted)}
.rd{font-size:${MIN.body}pt;color:var(--muted);white-space:nowrap;font-variant-numeric:tabular-nums}
.rd-below{${titles === 'plain' ? 'font-style:italic' : ''}}
.role ul{margin:calc(var(--k) * ${sp.li + 3}pt) 0 0;padding:0}
.role li + li{margin-top:calc(var(--k) * ${sp.li}pt)}
${bulletCss}
p{margin:0}
.ed + .ed{margin-top:calc(var(--k) * ${sp.role}pt)}
/* Lines stacked inside one block (job title, company, school, year) always sit the same small distance apart. */
.ed > * + *,.tl-body > .rt{margin-top:var(--tight)}
.et,.es,.ct{line-height:1.35}
.et{font-weight:600;color:var(--ink)}
.es{color:var(--ink2)}
/* timeline: a slim rail with a dot for each job, dates above the title */
.tl{display:grid;grid-template-columns:10pt 1fr;column-gap:12pt}
.tl-rail{position:relative}
.role.tl .tl-rail::before{content:"";position:absolute;left:50%;top:.75em;bottom:calc(-1 * var(--k) * ${sp.role}pt - .75em);width:1pt;background:${mix(a2, 0.55, paper)};transform:translateX(-50%)}
.role.tl:last-child .tl-rail::before{display:none}
.role.tl .tl-rail::after{content:"";position:absolute;left:50%;top:.32em;width:7pt;height:7pt;border-radius:50%;background:${a2};box-shadow:0 0 0 2.5pt ${paper};transform:translateX(-50%)}
.tl-when{font-size:${MIN.body}pt;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--hl, var(--acc-text));font-variant-numeric:tabular-nums}
.tl-when .sepx{color:var(--muted)}
.sk-list{list-style:none;margin:0;padding:0}.sk-list li + li{margin-top:calc(var(--k) * ${sp.li}pt)}
.sk-cols{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:calc(var(--k) * ${sp.li}pt) 16pt}
.sk-cols li{position:relative;padding-left:11pt}.sk-cols li::before{content:"";position:absolute;left:0;top:calc(${sp.lh / 2}em - 1.6pt);width:3.2pt;height:3.2pt;border-radius:50%;background:${a2}}
.skills{line-height:1.7}
.sk{white-space:nowrap}
.sk.eol::after{display:none !important}
.sk:not(:last-child)::after{content:"";display:inline-block;width:3pt;height:3pt;border-radius:50%;background:var(--rule-strong);margin:0 8pt;vertical-align:middle}
.tags{display:flex;flex-wrap:wrap;gap:5pt 5pt}
.sk-comma{line-height:1.6;color:var(--ink2)}
.tagx{background:transparent;border:.9pt solid ${mix(a2, 0.35, paper)};border-radius:999px;padding:2pt 9pt;font-size:${MIN.body}pt;line-height:1.35;color:var(--ink)}
.cols{display:grid;column-gap:${gap}in;grid-template-columns:${d.layout === 'sidebar-left' ? `${sideW}in 1fr` : `1fr ${sideW}in`};grid-template-rows:auto 1fr;grid-template-areas:${d.layout === 'sidebar-left' ? '"side head" "side main"' : '"head side" "main side"'}}
.hd-main{grid-area:head;margin-bottom:calc(var(--k) * ${sp.sec + 3}pt)}
.hd-main h1{color:var(--name);margin-top:${d.mono === 'circle' || d.mono === 'square' ? '-.17em' : '-.09em'}}
.main{grid-area:main;min-width:0}
.side{grid-area:side;min-width:0}
.side .sec + .sec{margin-top:calc(var(--k) * ${sp.sec}pt)}
.side .c-stack{gap:7pt}.side .ci{white-space:normal;align-items:flex-start;word-break:break-word}.side .ico{margin-top:.22em}
.side-mono{width:58pt;height:58pt;font-size:21pt;margin-bottom:calc(var(--k) * ${sp.sec}pt)}
.side.dark .mono-circle{border-color:${a2};color:#fff}
.side .tagx{background:${tint === 'dark' ? 'rgba(255,255,255,.12)' : '#ffffff'};border-color:${tint === 'dark' ? 'transparent' : mix(a2, 0.6, paper)}}
.side.dark{--ink:#fff;--ink2:rgba(255,255,255,.86);--muted:rgba(255,255,255,.62);--rule:rgba(255,255,255,.25);--rule-strong:rgba(255,255,255,.4);--acc-text:${lum(a2) > 110 ? a2 : '#fff'};--icon:${lum(a2) > 110 ? a2 : '#fff'};color:#fff}
@media screen{html,body{min-height:100%}.page{min-height:${page.h}}}
</style></head><body>${strip}<div class="page">
${layout}
</div>${tidyScript()}${d.fill && maxPages(d) === 1 ? fillScript(pagePx) : ''}</body></html>`;
}

// No separator dot left hanging at the end of a line of skills.
function tidyScript() {
  return `<script>(function(){function t(){var s=document.querySelectorAll('.sk');for(var i=0;i<s.length;i++){s[i].classList.remove('eol');if(s[i+1]&&s[i+1].offsetTop>s[i].offsetTop+2)s[i].classList.add('eol');}}t();window.__tidy=t;if(document.fonts&&document.fonts.ready)document.fonts.ready.then(t);})();</script>`;
}

// When the resume is shorter than a page, open up the spacing (up to 1.5×) so it fills the page evenly.
function fillScript(pagePx) {
  return `<script>(function(){var r=document.documentElement,p=document.querySelector('.page');function fit(){r.style.setProperty('--k',1);p.style.minHeight='0';var H=${pagePx};if(p.scrollHeight>H-4){p.style.minHeight='';return;}var lo=1,hi=1.5;for(var i=0;i<9;i++){var m=(lo+hi)/2;r.style.setProperty('--k',m);if(p.scrollHeight<=H-6)lo=m;else hi=m;}r.style.setProperty('--k',lo);p.style.minHeight='';if(window.__tidy)window.__tidy();}fit();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);})();</script>`;
}

export function letterHtml(letter, resumeContact, design, job, { fontBase, date = new Date() } = {}) {
  design = normalizeDesign(design);
  const c = resumeContact || {};
  const d = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const page = pageSize(design);
  const bodyHtml = `<p>${esc(d)}</p>
<p class="to">${esc(job.company)}<br>Re: ${esc(job.title)}</p>
<p>${esc(letter.greeting)}</p>
${letter.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n')}
<p>${esc(letter.closing)}<br>${esc(c.name)}</p>`;
  if (design.mode === 'own' && design.own?.template) return ownLetterHtml(c, design, bodyHtml, { fontBase });
  const head = design.fonts.heading || 'Inter', body = design.fonts.body || 'Inter';
  const { link, css } = fontFaces([head, body], design.customFonts, fontBase);
  const fb = (x) => (SERIF.has(x) ? 'Georgia, serif' : 'Arial, Helvetica, sans-serif');
  const f = { head: `"${head}",${fb(head)}`, body: `"${body}",${fb(body)}` };
  // Letters use the resume's name, fonts and colors with a one-column header.
  const ld = { ...design, header: design.layout === 'single' ? design.header : 'left', nameSize: 'standard' };
  const m = 0.85;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(c.name)} Cover Letter</title>${link}<style>
${css}
@page{size:${page.w} ${page.h};margin:0}
*{box-sizing:border-box}
html{background:#fff}
body{margin:0;--k:1;--tight:3pt;--acc:${design.accent};--acc-text:${design.accent};--name:${design.accent};--ink:#1c2130;--ink2:#454c5c;--muted:#7a8091;--rule:#d3d7df;--rule-strong:#b9becb;--icon:${design.accent};font-family:${f.body};font-size:11pt;line-height:1.5;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact;font-kerning:normal;text-rendering:optimizeLegibility}
.page{width:${page.w};padding:${m}in;-webkit-box-decoration-break:clone;box-decoration-break:clone}
${headerCss(ld, f, 26, m)}
.hd{margin-bottom:26pt}
p{margin:0 0 10pt}
.to{margin-bottom:16pt}
</style></head><body><div class="page">
${headerHtml(c, ld)}
${bodyHtml}
</div></body></html>`;
}

// ---------- Your own design, rebuilt from your resume file ----------
// The rebuilt layout is a template with {{blanks}} plus its own CSS, so each tailored resume flows into the same design.

/** Fill a template: {{field}}, {{#list}}…{{/list}} (repeat or show-if), {{^field}}…{{/field}} (show-if-empty), {{.}}. */
export function fillTemplate(tpl, data) {
  const look = (stack, key) => {
    if (key === '.') return stack[0];
    const parts = key.split('.');
    for (const ctx of stack) {
      if (ctx && typeof ctx === 'object' && parts[0] in ctx) return parts.reduce((o, p) => (o == null ? o : o[p]), ctx);
    }
    return undefined;
  };
  const render = (t, stack) => t
    .replace(/\{\{([#^])\s*([\w.]+)\s*\}\}([\s\S]*?)\{\{\/\s*\2\s*\}\}/g, (_, type, key, inner) => {
      const v = look(stack, key);
      const empty = v == null || v === false || v === '' || (Array.isArray(v) && !v.length);
      if (type === '^') return empty ? render(inner, stack) : '';
      if (empty) return '';
      if (Array.isArray(v)) return v.map((item) => render(inner, [item, ...stack])).join('');
      return render(inner, typeof v === 'object' ? [v, ...stack] : stack);
    })
    .replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => { const v = look(stack, key); return v == null || typeof v === 'object' ? '' : esc(v); });
  return render(String(tpl || ''), [data]);
}

/** The data a rebuilt template can use. */
export function templateData(resume) {
  const c = resume.contact || {};
  const mark = (list) => list.map((x, i) => ({ ...x, _first: i === 0, _last: i === list.length - 1 }));
  const clean = (u) => String(u || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  return {
    name: c.name || '', headline: resume.headline || '', location: c.location || '', phone: c.phone || '', email: c.email || '', linkedin: clean(c.linkedin), website: clean(c.website),
    summary: resume.summary || '',
    roles: mark((resume.roles || []).map((r) => ({ title: r.title, company: r.company, location: r.location || '', start: fmtDate(r.start), end: r.end ? fmtDate(r.end) : '', dates: `${fmtDate(r.start)}${r.end ? ` – ${fmtDate(r.end)}` : ''}`, bullets: mark((r.bullets || []).map((b) => ({ text: b.text }))) }))),
    skills: mark((resume.skills || []).map((s) => ({ name: s }))),
    skillsText: (resume.skills || []).join(' · '),
    education: mark((resume.education || []).map((e) => ({ degree: e.degree || '', field: e.field || '', school: e.school || '', year: e.year || '' }))),
    certifications: mark((resume.certifications || []).map((x) => ({ name: x.name || '', year: x.year || '' }))),
  };
}

/** Remove anything that isn't layout from a rebuilt template: scripts, event handlers, outside links. */
export function cleanMarkup(s) {
  return String(s || '')
    .replace(/<\s*(script|style|iframe|object|embed|form|template|noscript)\b[\s\S]*?<\/\s*\1\s*>/gi, '')
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed|link|meta|base|form|template|noscript)\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/javascript:/gi, '').replace(/<img\b[^>]*>/gi, '');
}
export function cleanCss(s) {
  return String(s || '').replace(/@import[^;]*;?/gi, '').replace(/url\(\s*['"]?(?!data:)[^)]*\)/gi, 'none').replace(/expression\s*\(/gi, '').replace(/<\/?style[^>]*>/gi, '');
}

/** CSS font stacks: the original font first (if this computer has it or it was uploaded), then the closest free match. */
function ownFontCss(css, fonts = []) {
  let out = cleanCss(css);
  for (const f of fonts) {
    if (!f.family || f.use === f.family) continue;
    const name = f.family.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`(["']?)${name}\\1(?=\\s*[,;}!])`, 'gi'), `"${f.family}","${f.use}"`);
  }
  return out;
}

function ownShell(title, d, inner, { fontBase, extraCss = '', script = '' } = {}) {
  const own = d.own, page = pageSize(d);
  const mg = own.margin || {};
  const m = (k) => Math.max(0.3, Number(mg[k] ?? 0.6));
  const families = (own.fonts || []).flatMap((f) => [f.family, f.use]);
  const { link, css } = fontFaces(families, d.customFonts, fontBase, GOOGLE_FAMILIES);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>${link}<style>
${css}
@page{size:${page.w} ${page.h};margin:0}
*{box-sizing:border-box}
html{background:#fff}
body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-kerning:normal;text-rendering:optimizeLegibility}
.page{position:relative;z-index:1;width:${page.w};padding:${m('top')}in ${m('right')}in ${m('bottom')}in ${m('left')}in;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.bg{position:fixed;inset:0;z-index:0;pointer-events:none}
${ownFontCss(own.css, own.fonts)}
${extraCss}
</style></head><body>${own.background ? `<div class="bg">${cleanMarkup(own.background)}</div>` : ''}<div class="page">${inner}</div>${script}</body></html>`;
}

export function ownResumeHtml(resume, d, { fontBase } = {}) {
  const inner = cleanMarkup(fillTemplate(d.own.template, templateData(resume)));
  return ownShell(`${resume.contact?.name || ''} Resume`, d, inner, { fontBase });
}

function ownLetterHtml(c, d, bodyHtml, { fontBase } = {}) {
  const head = cleanMarkup(fillTemplate(d.own.letterHead || '<h1>{{name}}</h1><p>{{email}} {{phone}}</p>', templateData({ contact: c })));
  const body = (d.own.fonts || []).find((f) => f.role === 'body') || (d.own.fonts || [])[0];
  const bodyFont = body ? `"${body.family}","${body.use || body.family}",sans-serif` : 'inherit';
  return ownShell(`${c.name || ''} Cover Letter`, d, `${head}<div class="letter-body">${bodyHtml}</div>`, { fontBase, extraCss: `.letter-body{margin-top:24pt;font-family:${bodyFont};font-size:11pt;line-height:1.5;color:#1c2130}.letter-body p{margin:0 0 10pt}` });
}

/**
 * Make the resume one step shorter. Order:
 *  1. lowest-relevance bullet in the oldest role that still has more than 1 bullet
 *     (current role keeps at least 3)
 *  2. drop the oldest role beyond the "how far back" setting, then any oldest role
 *     except the current one (education/contact never cut)
 *  3. shorten the summary to its first sentence, then remove it
 * Returns { resume, cut } or null if nothing more can be cut.
 */
export function cutOnce(resume, design) {
  const r = structuredClone(resume);
  const roles = r.roles || [];
  const yearLimit = new Date().getFullYear() - (design.yearsBack || 15);
  // roles past the "how far back" setting go first
  for (let i = roles.length - 1; i > 0; i--) {
    const end = dateKey(roles[i].end);
    if (end !== 999999 && Math.floor(end / 100) < yearLimit) { const [gone] = roles.splice(i, 1); return { resume: r, cut: `Left out ${gone.title} at ${gone.company} (older than ${design.yearsBack} years).` }; }
  }
  for (let i = roles.length - 1; i >= 0; i--) {
    const min = i === 0 ? 3 : 1;
    const bl = roles[i].bullets || [];
    if (bl.length > min) {
      let worst = bl.length - 1;
      bl.forEach((b, j) => { if ((b.relevance ?? 3) < (bl[worst].relevance ?? 3)) worst = j; });
      const [gone] = bl.splice(worst, 1);
      return { resume: r, cut: `Cut a line from ${roles[i].company}: "${gone.text.slice(0, 60)}${gone.text.length > 60 ? '…' : ''}"` };
    }
  }
  if (r.summary && /[.!?]\s+\S/.test(r.summary)) { r.summary = r.summary.split(/(?<=[.!?])\s+/)[0]; return { resume: r, cut: 'Shortened the summary.' }; }
  if (roles.length > 1) { const gone = roles.pop(); return { resume: r, cut: `Left out ${gone.title} at ${gone.company}.` }; }
  if (r.summary) { r.summary = ''; return { resume: r, cut: 'Removed the summary.' }; }
  return null;
}

export function fileName(name, kind, job) {
  const part = (s) => String(s || '').normalize('NFKD').replace(/[^\w\s-]/g, '').trim().split(/\s+/).slice(0, 4).join('_');
  const [first, ...rest] = String(name || 'My').trim().split(/\s+/);
  return [part(first), part(rest.join(' ')), kind, part(job?.company), part(job?.title)].filter(Boolean).join('_');
}

export function resumeText(resume) {
  const c = resume.contact || {};
  const lines = [c.name, [c.location, c.phone, c.email, c.linkedin, c.website].filter(Boolean).join(' | '), ''];
  if (resume.summary) lines.push('SUMMARY', resume.summary, '');
  lines.push('EXPERIENCE');
  for (const r of resume.roles || []) {
    lines.push(`${r.title}, ${r.company}${r.location ? `, ${r.location}` : ''} | ${fmtDate(r.start)} – ${fmtDate(r.end)}`);
    for (const b of r.bullets || []) lines.push(`- ${b.text}`);
    lines.push('');
  }
  if ((resume.skills || []).length) lines.push('SKILLS', resume.skills.join(', '), '');
  if ((resume.education || []).length) { lines.push('EDUCATION'); for (const e of resume.education) lines.push([e.degree, e.field, e.school, e.year].filter(Boolean).join(', ')); }
  return lines.join('\n').trim();
}

export function letterText(letter, job) {
  return [letter.greeting, '', ...letter.paragraphs.flatMap((p) => [p, '']), letter.closing, letter.name].join('\n');
}

/** Words a hiring system should be able to read, in order. Used by the readability check. */
export function expectedText(resume) {
  return [resume.contact?.name, ...(resume.roles || []).flatMap((r) => [r.title, r.company, ...(r.bullets || []).map((b) => b.text)])].filter(Boolean);
}

/** Check extracted text contains every expected line, in order. */
export function readableCheck(extracted, expected) {
  const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
  const text = norm(extracted);
  let at = 0; const missing = [];
  for (const line of expected) {
    const i = text.indexOf(norm(line).slice(0, 50), at);
    if (i < 0) missing.push(line); else at = i;
  }
  return { ok: missing.length === 0, missing };
}
