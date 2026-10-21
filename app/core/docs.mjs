// Resume and cover letter pages: three built-in looks, fonts, minimum sizes,
// what to cut when it doesn't fit, file names and plain-text versions.

import { dateKey } from './profile.mjs';
import { GOOGLE as GOOGLE_FAMILIES } from './fonts.mjs';

export const FONTS = ['Inter', 'Lato', 'Open Sans', 'Roboto', 'Source Sans 3', 'Work Sans', 'Montserrat', 'Raleway', 'Lora', 'Merriweather', 'EB Garamond', 'Playfair Display'];
export const SERIF = new Set(['Lora', 'Merriweather', 'EB Garamond', 'Playfair Display']);

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
export const PRESETS = {
  classic: { label: 'Classic', note: 'Serif name, contact spread across the page, fine rules.', layout: 'single', header: 'left', contact: 'spread', icons: false, titles: 'rule', nameSize: 'large', fonts: { heading: 'Lora', body: 'Source Sans 3' }, accent: '#1F2A44', size: 10.5, spacing: 'balanced', margin: 0.7, dates: 'right', bullets: 'dot', skills: 'columns', sidebarTint: 'none' },
  modern: { label: 'Modern', note: 'A full-height tinted sidebar for contact and skills.', layout: 'sidebar-left', header: 'left', contact: 'spread', icons: true, titles: 'short', nameSize: 'xl', fonts: { heading: 'Montserrat', body: 'Open Sans' }, accent: '#1F4E79', size: 10, spacing: 'balanced', margin: 0.55, dates: 'right', bullets: 'dot', skills: 'list', sidebarTint: 'light' },
  executive: { label: 'Executive', note: 'Centered, formal and spacious, for senior roles.', layout: 'single', header: 'center', contact: 'spread', icons: false, titles: 'center', nameSize: 'large', nameUpper: true, fonts: { heading: 'Playfair Display', body: 'Source Sans 3' }, accent: '#222222', size: 10.5, spacing: 'balanced', margin: 0.8, dates: 'right', bullets: 'dot', skills: 'columns', sidebarTint: 'none' },
  minimal: { label: 'Minimal', note: 'Section names in the margin. Calm and airy.', layout: 'single', header: 'left', contact: 'spread', icons: false, titles: 'gutter', nameSize: 'xl', fonts: { heading: 'Work Sans', body: 'Work Sans' }, accent: '#111111', size: 10, spacing: 'roomy', margin: 0.75, dates: 'right', bullets: 'dash', skills: 'inline', sidebarTint: 'none' },
  compact: { label: 'Compact', note: 'Name and contact side by side. Fits a long history.', layout: 'single', header: 'split', contact: 'spread', icons: true, titles: 'rule', nameSize: 'large', fonts: { heading: 'Roboto', body: 'Roboto' }, accent: '#2B3A55', size: 10, spacing: 'compact', margin: 0.55, dates: 'right', bullets: 'dot', skills: 'inline', sidebarTint: 'none' },
  bold: { label: 'Bold', note: 'A full-width color band across the top.', layout: 'single', header: 'band', contact: 'spread', icons: true, titles: 'bar', nameSize: 'xl', fonts: { heading: 'Montserrat', body: 'Lato' }, accent: '#0F5257', size: 10, spacing: 'balanced', margin: 0.6, dates: 'right', bullets: 'dot', skills: 'tags', sidebarTint: 'none' },
  editorial: { label: 'Editorial', note: 'Big serif headings with a writer’s feel.', layout: 'single', header: 'left', contact: 'spread', icons: false, titles: 'plain', nameSize: 'xl', fonts: { heading: 'Playfair Display', body: 'Lato' }, accent: '#7A2E2E', size: 10.5, spacing: 'balanced', margin: 0.75, dates: 'below', bullets: 'dot', skills: 'inline', sidebarTint: 'none' },
  twotone: { label: 'Two-tone', note: 'A dark full-height sidebar with white text.', layout: 'sidebar-left', header: 'left', contact: 'spread', icons: true, titles: 'caps', nameSize: 'xl', fonts: { heading: 'Raleway', body: 'Lato' }, accent: '#2E4A44', size: 10, spacing: 'balanced', margin: 0.55, dates: 'below', bullets: 'dot', skills: 'list', sidebarTint: 'dark' },
};
/** Every design setting a person can change (a template sets all of them). */
export const DESIGN_KEYS = ['layout', 'header', 'contact', 'icons', 'titles', 'size', 'spacing', 'margin', 'dates', 'bullets', 'skills', 'sidebarTint', 'accent', 'order', 'hidden', 'sidebar', 'nameSize', 'nameUpper', 'fill'];
export const TEMPLATES = Object.fromEntries(Object.entries(PRESETS).map(([k, v]) => [k, { label: v.label, note: v.note, columns: v.layout === 'single' ? 1 : 2 }]));
export const SECTIONS = { summary: 'Summary', experience: 'Experience', skills: 'Skills', education: 'Education', certifications: 'Certifications' };
export const ACCENTS = ['#1F2A44', '#222222', '#1F4E79', '#0F5257', '#2E4A44', '#7A2E2E', '#5B3A8C', '#B5452A'];
// Space between sections, jobs and bullets (points), the gap under a section title, and line height.
const SPACING = { compact: { sec: 10, role: 7, li: 1, h: 4, lh: 1.3 }, balanced: { sec: 16, role: 11, li: 2.2, h: 6, lh: 1.38 }, roomy: { sec: 20, role: 14, li: 3.2, h: 8, lh: 1.45 } };
const NAME_SIZE = { standard: 2.4, large: 3.0, xl: 3.6 };

/** Fill in every design setting: the template's choices first, then what the person changed. */
export function normalizeDesign(d = {}) {
  const preset = PRESETS[d.template] || PRESETS.classic;
  const out = { ...preset, ...Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined && v !== null)) };
  out.fonts = { ...preset.fonts, ...(d.fonts || {}) };
  out.order = (d.order && d.order.length ? d.order : ['summary', 'experience', 'skills', 'education', 'certifications']).filter((k) => SECTIONS[k]);
  for (const k of Object.keys(SECTIONS)) if (!out.order.includes(k)) out.order.push(k);
  out.hidden = d.hidden || [];
  out.sidebar = d.sidebar || ['skills', 'education', 'certifications'];
  out.size = Math.max(MIN.body, Number(out.size) || 10.5);
  out.nameSize = NAME_SIZE[out.nameSize] ? out.nameSize : 'large';
  out.margin = Math.max(MIN.marginIn, Number(out.margin) || 0.6);
  out.accent = /^#[0-9a-f]{6}$/i.test(out.accent) ? out.accent : '#1F2A44';
  out.sidebarTint = out.sidebarTint === true ? 'light' : out.sidebarTint === false ? 'none' : ['none', 'light', 'dark'].includes(out.sidebarTint) ? out.sidebarTint : 'none';
  out.contact = out.contact === 'together' ? 'together' : 'spread';
  out.icons = Boolean(out.icons);
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

// Small line icons for contact details. Drawn, not text, so hiring systems skip them.
const ICON = {
  location: '<path d="M8 14.5s4.8-4.4 4.8-8A4.8 4.8 0 0 0 3.2 6.5c0 3.6 4.8 8 4.8 8z"/><circle cx="8" cy="6.4" r="1.7"/>',
  phone: '<path d="M4.6 2.2h2.1l1 2.9-1.4 1a7.4 7.4 0 0 0 3.6 3.6l1-1.4 2.9 1v2.1a1.4 1.4 0 0 1-1.5 1.4A10.9 10.9 0 0 1 3.2 3.7a1.4 1.4 0 0 1 1.4-1.5z"/>',
  email: '<rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="M2.6 4.6 8 8.8l5.4-4.2"/>',
  linkedin: '<rect x="2" y="2" width="12" height="12" rx="2.2"/><path d="M5.2 7.2v4M5.2 4.9v.1M8 11.2V7.2m0 2.1a2 2 0 0 1 4 0v1.9"/>',
  website: '<circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2.2 2.3 2.2 9.7 0 12M8 2c-2.2 2.3-2.2 9.7 0 12"/>',
};
const icon = (k) => `<svg class="ico" viewBox="0 0 16 16" aria-hidden="true">${ICON[k]}</svg>`;
const contactItems = (c) => [['location', c.location], ['phone', c.phone], ['email', c.email], ['linkedin', c.linkedin?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')], ['website', c.website?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')]].filter(([, v]) => v);
function contactHtml(c, d, cls) {
  return `<div class="contact ${cls}">${contactItems(c).map(([k, v]) => `<span class="ci">${d.icons ? icon(k) : ''}<span>${esc(v)}</span></span>`).join(cls === 'c-together' ? '<span class="sepx"> · </span>' : ' ')}</div>`;
}

/** Name and contact at the top, for one-column layouts and letters. */
function headerHtml(c, d, resume = {}) {
  const head = d.header === 'split' || d.header === 'band' || d.header === 'center' ? d.header : 'left';
  const name = `<div class="hd-name"><h1>${esc(c.name)}</h1>${resume.headline ? `<div class="headline">${esc(resume.headline)}</div>` : ''}</div>`;
  if (head === 'split') return `<header class="hd h-split">${name}${contactHtml(c, d, 'c-stack')}</header>`;
  // Five items with icons don't fit on one line: an even 3-column grid instead of a ragged wrap.
  const spread = d.icons && contactItems(c).length >= 5 ? 'c-grid' : 'c-spread';
  return `<header class="hd h-${head}">${name}${contactHtml(c, d, d.contact === 'together' ? 'c-together' : spread)}</header>`;
}

function headerCss(d, f, nameSize, m) {
  const a = d.accent;
  return `.hd{margin-bottom:calc(var(--k) * ${d.spacing === 'compact' ? 10 : 16}pt)}
h1{font-family:${f.head};font-size:${nameSize}pt;margin:0;color:${d.header === 'band' ? '#fff' : 'var(--name)'};letter-spacing:${d.nameUpper ? '.1em' : nameSize >= 30 ? '-.025em' : '-.015em'};line-height:1;font-weight:${d.nameUpper ? 600 : 700};${d.nameUpper ? 'text-transform:uppercase;' : ''}}
.headline{font-size:${d.size + 1.5}pt;color:var(--ink2);margin-top:5pt;letter-spacing:.01em}
.hd-name{margin-bottom:${Math.round(nameSize * 0.32)}pt}
.contact{font-size:${MIN.body}pt;color:var(--ink2);line-height:1.4}
.ci{white-space:nowrap;display:inline-flex;align-items:center}
.ico{width:.85em;height:.85em;margin-right:3.5pt;flex:none;fill:none;stroke:var(--icon);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
.c-spread{display:flex;justify-content:space-between;flex-wrap:wrap;gap:3pt 10pt}
.c-grid{display:grid;grid-template-columns:repeat(3,auto);justify-content:space-between;gap:4pt 14pt}
.c-together{display:flex;flex-wrap:wrap;align-items:center;row-gap:3pt}
.sepx{color:var(--muted);margin:0 6pt}
.c-stack{display:flex;flex-direction:column;gap:3.5pt}
.h-center{text-align:center}
.h-center .c-grid{justify-content:space-between}
.h-center .contact{border-top:.75pt solid var(--rule);border-bottom:.75pt solid var(--rule);padding:5pt 2pt;justify-content:${d.contact === 'together' ? 'center' : 'space-between'}}
.h-split{display:flex;justify-content:space-between;align-items:flex-end;gap:20pt;border-bottom:1.25pt solid ${a};padding-bottom:9pt}
.h-split .hd-name{margin:0}
.h-split .c-stack{align-items:flex-end;text-align:right}
.h-split .ci{flex-direction:row-reverse}.h-split .ico{margin:0 0 0 4.5pt}
.h-band{background:${a};margin:-${m}in -${m}in calc(var(--k) * 18pt);padding:${Math.max(0.45, m * 0.85)}in ${m}in ${Math.max(0.3, m * 0.55)}in;--ink2:rgba(255,255,255,.92);--icon:rgba(255,255,255,.85);--muted:rgba(255,255,255,.6)}
.h-band .headline{color:rgba(255,255,255,.85)}`;
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
  const a = d.accent, m = d.margin;
  const nameSize = Math.max(MIN.name, Math.round(d.size * (NAME_SIZE[d.nameSize] || NAME_SIZE.large)));
  const hs = Math.max(MIN.heading, d.size + 0.5);
  const c = resume.contact || {};
  const sidebarOn = d.layout !== 'single';
  const titles = d.titles === 'gutter' && sidebarOn ? 'caps' : d.titles;
  const inSide = (k) => sidebarOn && d.sidebar.includes(k);
  const when = (r) => `${esc(fmtDate(r.start))}${r.end ? ` – ${esc(fmtDate(r.end))}` : ''}`;
  const roles = (resume.roles || []).map((r) => `
<div class="role">${d.dates === 'below'
    ? `<div class="rt">${esc(r.title)}</div><div class="rc"><span class="co">${esc(r.company)}</span>${r.location ? `<span class="sepx"> · </span><span class="rl">${esc(r.location)}</span>` : ''}</div><div class="rd rd-below">${when(r)}</div>`
    : `<div class="rh"><span class="rt">${esc(r.title)}</span><span class="rd">${when(r)}</span></div><div class="rc"><span class="co">${esc(r.company)}</span>${r.location ? `<span class="sepx"> · </span><span class="rl">${esc(r.location)}</span>` : ''}</div>`}
<ul>${(r.bullets || []).map((b) => `<li>${esc(b.text)}</li>`).join('')}</ul></div>`).join('');
  const skillList = resume.skills || [];
  const skills = (side) => {
    if (!skillList.length) return '';
    const style = side && (d.skills === 'inline' || d.skills === 'columns') ? 'list' : d.skills;
    if (style === 'tags') return `<div class="tags">${skillList.map((x) => `<span class="tagx">${esc(x)}</span>`).join(' ')}</div>`;
    if (style === 'list') return `<ul class="sk-list">${skillList.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    if (style === 'columns') return `<ul class="sk-cols">${skillList.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    return `<p class="skills">${skillList.map((x) => `<span class="sk">${esc(x)}</span>`).join(' ')}</p>`;
  };
  const edu = (side) => (resume.education || []).map((e) => {
    const deg = `${esc(e.degree)}${e.field ? `, ${esc(e.field)}` : ''}`;
    return side ? `<div class="ed"><div class="rt">${deg}</div><div class="rc">${esc(e.school)}</div>${e.year ? `<div class="rd">${esc(e.year)}</div>` : ''}</div>`
      : `<div class="ed"><div class="rh"><span class="rt">${deg}</span>${e.year ? `<span class="rd">${esc(e.year)}</span>` : ''}</div><div class="rc">${esc(e.school)}</div></div>`;
  }).join('');
  const certs = (side) => (resume.certifications || []).map((x) => (side ? `<div class="ed"><div class="ct">${esc(x.name)}</div>${x.year ? `<div class="rd">${esc(x.year)}</div>` : ''}</div>`
    : `<div class="ed"><div class="rh"><span class="ct">${esc(x.name)}</span>${x.year ? `<span class="rd">${esc(x.year)}</span>` : ''}</div></div>`)).join('');
  const block = (k, side) => ({ summary: resume.summary ? `<p class="summary">${esc(resume.summary)}</p>` : '', experience: roles, skills: skills(side), education: edu(side), certifications: certs(side) })[k];
  const sec = (k, side) => { const b = block(k, side); return b && !d.hidden.includes(k) ? `<section class="sec sec-${k}"><h2><span>${SECTIONS[k]}</span></h2><div class="sec-body">${b}</div></section>` : ''; };
  const mainHtml = d.order.filter((k) => !inSide(k)).map((k) => sec(k, false)).join('');
  const sideHtml = d.order.filter(inSide).map((k) => sec(k, true)).join('');

  const titleCss = {
    rule: `text-transform:uppercase;letter-spacing:.13em;font-size:${hs - 0.5}pt;color:var(--acc);border-bottom:.75pt solid var(--rule);padding-bottom:3.5pt`,
    caps: `text-transform:uppercase;letter-spacing:.16em;font-size:${hs - 1}pt;color:var(--acc)`,
    short: `text-transform:uppercase;letter-spacing:.15em;font-size:${hs - 1}pt;color:var(--acc)`,
    bar: `color:var(--acc);border-left:3pt solid var(--acc);padding-left:7pt;text-transform:uppercase;letter-spacing:.1em;font-size:${hs - 0.5}pt;line-height:1.15`,
    plain: `color:var(--acc);font-size:${hs + 3.5}pt;font-weight:700;letter-spacing:-.01em;line-height:1.15`,
    center: `text-transform:uppercase;letter-spacing:.2em;font-size:${hs - 1}pt;color:var(--acc);display:flex;align-items:center;gap:12pt`,
    gutter: `text-transform:uppercase;letter-spacing:.14em;font-size:${hs - 1.5}pt;color:var(--acc);margin:0 !important;padding-top:1.5pt;line-height:1.3`,
  }[titles] || '';
  const extraTitle = titles === 'center' ? 'h2::before,h2::after{content:"";flex:1;border-top:.75pt solid var(--rule)}'
    : titles === 'short' ? 'h2::after{content:"";display:block;width:20pt;height:2pt;background:var(--acc);margin-top:5pt}'
      : titles === 'gutter' ? '.single .sec{display:grid;grid-template-columns:1.3in 1fr;column-gap:16pt}' : '';
  const bulletCss = d.bullets === 'dash' ? 'ul.b,.role ul{list-style:none;padding-left:12pt}.role li{position:relative}.role li::before{content:"–";position:absolute;left:-11pt;color:var(--acc)}'
    : d.bullets === 'none' ? '.role ul{list-style:none;padding-left:0}'
      : '.role ul{list-style:none;padding-left:11pt}.role li{position:relative}.role li::before{content:"";position:absolute;left:-9.5pt;top:.62em;width:3.2pt;height:3.2pt;border-radius:50%;background:var(--acc)}';

  // Columns (inches) for sidebar layouts: the tint runs edge to edge, full height, on every page.
  const cw = page.wIn - 2 * m, gap = 0.42, sideW = +(cw * 0.31).toFixed(2);
  const stripW = (m + sideW + gap / 2).toFixed(3);
  const tint = d.sidebarTint;
  const strip = sidebarOn && tint !== 'none' ? `<div class="strip" style="${d.layout === 'sidebar-left' ? 'left' : 'right'}:0;width:${stripW}in;background:${tint === 'dark' ? a : `${a}12`}"></div>` : '';
  const sideNamecard = `<header class="hd-main"><h1>${esc(c.name)}</h1>${resume.headline ? `<div class="headline">${esc(resume.headline)}</div>` : ''}</header>`;
  const contactSec = `<section class="sec sec-contact"><h2><span>Contact</span></h2><div class="sec-body">${contactHtml(c, d, 'c-stack')}</div></section>`;
  const layout = sidebarOn
    ? `<div class="cols ${d.layout}">${sideNamecard}<aside class="side ${tint === 'dark' ? 'dark' : ''}">${contactSec}${sideHtml}</aside><div class="main">${mainHtml}</div></div>`
    : `${headerHtml(c, d, resume)}<div class="single">${mainHtml}</div>`;
  const pagePx = Math.round(page.hIn * 96);

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(c.name)} Resume</title>${link}<style>
${css}
@page{size:${page.w} ${page.h};margin:0}
*{box-sizing:border-box}
html{background:#fff}
body{margin:0;--k:1;--acc:${a};--name:${titles === 'plain' || d.header === 'band' ? a : d.accent === '#111111' || d.accent === '#222222' ? '#111' : a};--ink:#1c2130;--ink2:#454c5c;--muted:#7a8091;--rule:#d3d7df;--icon:${a};font-family:${f.body};font-size:${d.size}pt;line-height:${sp.lh};color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact;font-kerning:normal;text-rendering:optimizeLegibility;font-variant-numeric:lining-nums;-webkit-font-smoothing:antialiased}
.page{position:relative;z-index:1;width:${page.w};padding:${m}in;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.strip{position:fixed;top:0;bottom:0;z-index:0}
${headerCss(d, f, nameSize, m)}
h2{font-family:${f.head};font-size:${hs}pt;margin:0 0 calc(var(--k) * ${sp.h}pt);font-weight:700;break-after:avoid;line-height:1.2;${titleCss}}
${extraTitle}
.sec + .sec{margin-top:calc(var(--k) * ${sp.sec}pt)}
.summary{color:var(--ink2)${titles === 'plain' ? ';font-size:' + (d.size + 0.5) + 'pt' : ''}}
.role{break-inside:avoid-page}
.role + .role{margin-top:calc(var(--k) * ${sp.role}pt)}
.rh{display:flex;justify-content:space-between;gap:12pt;align-items:baseline}
.rt{font-weight:700;color:var(--ink);font-size:${d.size + 0.5}pt;letter-spacing:-.003em}
.rc{color:var(--ink2);margin-top:1pt}
.co{font-weight:600;color:var(--acc)}
.rl{color:var(--ink2)}
.rd{font-size:${MIN.body}pt;color:var(--muted);white-space:nowrap;font-variant-numeric:tabular-nums}
.rd-below{margin-top:1pt${titles === 'plain' ? ';font-style:italic' : ''}}
.role ul{margin:calc(var(--k) * 3.5pt) 0 0}
.role li + li{margin-top:calc(var(--k) * ${sp.li}pt)}
${bulletCss}
p{margin:0}
.ed + .ed{margin-top:calc(var(--k) * 6pt)}
.ct{font-weight:600;color:var(--ink)}
.sk-list{list-style:none;margin:0;padding:0}.sk-list li + li{margin-top:calc(var(--k) * 3pt)}
.sk-cols{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:calc(var(--k) * 3pt) 14pt}
.sk-cols li{position:relative;padding-left:10pt}.sk-cols li::before{content:"";position:absolute;left:0;top:.6em;width:3pt;height:3pt;border-radius:50%;background:var(--acc)}
.skills{line-height:1.6}
.sk{white-space:nowrap}
.sk:not(:last-child)::after{content:"";display:inline-block;width:3pt;height:3pt;border-radius:50%;background:var(--muted);margin:0 7pt;vertical-align:middle;opacity:.7}
.tags{display:flex;flex-wrap:wrap;gap:4pt}
.tagx{border:.75pt solid var(--rule);background:${a}0A;border-radius:2.5pt;padding:1.5pt 6.5pt;font-size:${MIN.body}pt;color:var(--ink)}
.cols{display:grid;column-gap:${gap}in;grid-template-columns:${d.layout === 'sidebar-left' ? `${sideW}in 1fr` : `1fr ${sideW}in`};grid-template-rows:auto 1fr;grid-template-areas:${d.layout === 'sidebar-left' ? '"side head" "side main"' : '"head side" "main side"'}}
.hd-main{grid-area:head;margin-bottom:calc(var(--k) * 18pt)}
.hd-main h1{color:var(--name)}
.main{grid-area:main;min-width:0}
.side{grid-area:side;min-width:0}
.side .sec + .sec{margin-top:calc(var(--k) * ${sp.sec + 2}pt)}
.side .c-stack{gap:6pt}.side .ci{white-space:normal;align-items:flex-start;word-break:break-word}.side .ico{margin-top:.2em}
.side .rt{font-size:${d.size}pt}
.side.dark{--ink:#fff;--ink2:rgba(255,255,255,.88);--muted:rgba(255,255,255,.68);--rule:rgba(255,255,255,.3);--acc:#fff;--icon:rgba(255,255,255,.85);color:#fff}
.side.dark .tagx{background:rgba(255,255,255,.08)}
@media screen{.page{min-height:${page.h}}}
</style></head><body>${strip}<div class="page">
${layout}
</div>${d.fill && maxPages(d) === 1 ? fillScript(pagePx) : ''}</body></html>`;
}

// When the resume is shorter than a page, open up the spacing (up to 1.6×) so it fills the page evenly.
function fillScript(pagePx) {
  return `<script>(function(){var r=document.documentElement,p=document.querySelector('.page');function fit(){r.style.setProperty('--k',1);p.style.minHeight='0';var H=${pagePx};if(p.scrollHeight>H-4){p.style.minHeight='';return;}var lo=1,hi=1.6;for(var i=0;i<9;i++){var m=(lo+hi)/2;r.style.setProperty('--k',m);if(p.scrollHeight<=H-6)lo=m;else hi=m;}r.style.setProperty('--k',lo);p.style.minHeight='';}fit();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);})();</script>`;
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
body{margin:0;--k:1;--acc:${design.accent};--name:${design.accent};--ink:#1c2130;--ink2:#454c5c;--muted:#7a8091;--rule:#d3d7df;--icon:${design.accent};font-family:${f.body};font-size:11pt;line-height:1.5;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact;font-kerning:normal;text-rendering:optimizeLegibility}
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
