// Resume and cover letter pages: three built-in looks, fonts, minimum sizes,
// what to cut when it doesn't fit, file names and plain-text versions.

import { dateKey } from './profile.mjs';

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
  classic: { label: 'Classic', note: 'Clean and traditional. Safe everywhere.', layout: 'single', header: 'left', titles: 'rule', fonts: { heading: 'Inter', body: 'Inter' }, accent: '#1F2A44', size: 10.5, spacing: 'balanced', margin: 0.6, dates: 'right', bullets: 'dot', skills: 'inline', sidebarTint: false },
  modern: { label: 'Modern', note: 'A sidebar for skills and education.', layout: 'sidebar-left', header: 'left', titles: 'caps', fonts: { heading: 'Montserrat', body: 'Open Sans' }, accent: '#1F4E79', size: 10, spacing: 'balanced', margin: 0.55, dates: 'right', bullets: 'dot', skills: 'list', sidebarTint: true },
  executive: { label: 'Executive', note: 'Centered and polished, for senior roles.', layout: 'single', header: 'center', titles: 'rule', fonts: { heading: 'Playfair Display', body: 'Source Sans 3' }, accent: '#222222', size: 10.5, spacing: 'balanced', margin: 0.7, dates: 'right', bullets: 'dot', skills: 'inline', sidebarTint: false },
  minimal: { label: 'Minimal', note: 'Lots of white space, nothing extra.', layout: 'single', header: 'left', titles: 'plain', fonts: { heading: 'Work Sans', body: 'Work Sans' }, accent: '#111111', size: 10.5, spacing: 'roomy', margin: 0.75, dates: 'right', bullets: 'dash', skills: 'inline', sidebarTint: false },
  compact: { label: 'Compact', note: 'Fits a long history on one page.', layout: 'single', header: 'split', titles: 'caps', fonts: { heading: 'Roboto', body: 'Roboto' }, accent: '#2B3A55', size: 10, spacing: 'compact', margin: 0.5, dates: 'right', bullets: 'dot', skills: 'inline', sidebarTint: false },
  bold: { label: 'Bold', note: 'A color band up top that stands out.', layout: 'single', header: 'band', titles: 'bar', fonts: { heading: 'Montserrat', body: 'Lato' }, accent: '#0F5257', size: 10.5, spacing: 'balanced', margin: 0.55, dates: 'right', bullets: 'dot', skills: 'tags', sidebarTint: false },
  editorial: { label: 'Editorial', note: 'Serif headings with a writer’s feel.', layout: 'single', header: 'left', titles: 'rule', fonts: { heading: 'Merriweather', body: 'Lato' }, accent: '#7A2E2E', size: 10.5, spacing: 'balanced', margin: 0.65, dates: 'below', bullets: 'dot', skills: 'inline', sidebarTint: false },
  twotone: { label: 'Two-tone', note: 'A tinted sidebar on the right.', layout: 'sidebar-right', header: 'left', titles: 'caps', fonts: { heading: 'Raleway', body: 'Lato' }, accent: '#2E5E4E', size: 10, spacing: 'balanced', margin: 0.55, dates: 'below', bullets: 'dot', skills: 'tags', sidebarTint: true },
};
export const TEMPLATES = Object.fromEntries(Object.entries(PRESETS).map(([k, v]) => [k, { label: v.label, note: v.note, columns: v.layout === 'single' ? 1 : 2 }]));
export const SECTIONS = { summary: 'Summary', experience: 'Experience', skills: 'Skills', education: 'Education', certifications: 'Certifications' };
export const ACCENTS = ['#1F2A44', '#222222', '#1F4E79', '#0F5257', '#2E5E4E', '#7A2E2E', '#5B3A8C', '#B5452A'];
const SPACING = { compact: { sec: 7, role: 5, li: 1, lh: 1.2 }, balanced: { sec: 11, role: 8, li: 2, lh: 1.28 }, roomy: { sec: 15, role: 11, li: 3, lh: 1.38 } };

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
  out.margin = Math.max(MIN.marginIn, Number(out.margin) || 0.6);
  out.accent = /^#[0-9a-f]{6}$/i.test(out.accent) ? out.accent : '#1F2A44';
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

function fontFaces(design, fontBase) {
  const families = [...new Set([design.fonts?.heading, design.fonts?.body].filter(Boolean))];
  const custom = (design.customFonts || []).filter((f) => families.includes(f.family));
  const builtin = families.filter((f) => FONTS.includes(f));
  let css = custom.map((f) => `@font-face{font-family:"${f.family}";src:url(data:${f.mime};base64,${f.base64});font-weight:${f.weight || '100 900'};font-style:normal;}`).join('\n');
  // Bundled fonts if present (npm run fonts), else Google Fonts.
  const link = builtin.length ? `<link rel="stylesheet" href="${fontBase ? `${fontBase}/fonts.css` : `https://fonts.googleapis.com/css2?${builtin.map((f) => `family=${encodeURIComponent(f)}:ital,wght@0,400;0,600;0,700;1,400`).join('&')}&display=swap`}">` : '';
  return { link, css };
}

function contactLine(c) {
  return [c.location, c.phone, c.email, c.linkedin?.replace(/^https?:\/\/(www\.)?/, ''), c.website?.replace(/^https?:\/\//, '')].filter(Boolean).map(esc).join('<span class="dot"> · </span>');
}

function headerHtml(c, d) {
  const items = [c.location, c.phone, c.email, c.linkedin?.replace(/^https?:\/\/(www\.)?/, ''), c.website?.replace(/^https?:\/\//, '')].filter(Boolean).map(esc);
  if (d.header === 'split') return `<header class="h-split"><h1>${esc(c.name)}</h1><div class="contact">${items.map((x) => `<div>${x}</div>`).join('')}</div></header>`;
  return `<header class="h-${d.header}"><h1>${esc(c.name)}</h1><div class="contact">${items.join('<span class="dot"> · </span>')}</div></header>`;
}

function headerCss(d, head, fb, nameSize) {
  const a = d.accent;
  return `header{margin-bottom:${d.spacing === 'compact' ? 6 : 10}pt}
h1{font-family:"${head}",${fb};font-size:${nameSize}pt;margin:0 0 3pt;color:${a};letter-spacing:-.01em;line-height:1.1;font-weight:700}
.contact{font-size:${MIN.body}pt;color:#3b4256}
.h-center{text-align:center}
.h-split{display:flex;justify-content:space-between;align-items:flex-end;gap:16pt;border-bottom:1.5pt solid ${a};padding-bottom:6pt}
.h-split .contact{text-align:right;line-height:1.35}
.h-band{background:${a};color:#fff;padding:12pt 14pt;border-radius:3pt}
.h-band h1{color:#fff}
.h-band .contact{color:#fff;opacity:.92}
.h-band .dot{color:#fff;opacity:.6}`;
}

/** Resume HTML from the design settings. Reading order in the HTML = reading order for hiring systems. */
export function resumeHtml(resume, design, { fontBase } = {}) {
  const d = normalizeDesign(design);
  const page = pageSize(d);
  const { link, css } = fontFaces(d, fontBase);
  const head = d.fonts.heading || 'Inter', body = d.fonts.body || 'Inter';
  const fb = (f) => (SERIF.has(f) ? 'Georgia, serif' : 'Arial, sans-serif');
  const sp = SPACING[d.spacing] || SPACING.balanced;
  const a = d.accent;
  const nameSize = Math.max(MIN.name, Math.round(d.size * 2.1));
  const hSize = Math.max(MIN.heading, d.size + 0.5);
  const c = resume.contact || {};
  const sidebarOn = d.layout !== 'single';
  const when = (r) => `${esc(fmtDate(r.start))}${r.end ? ` – ${esc(fmtDate(r.end))}` : ''}`;
  const roles = (resume.roles || []).map((r) => `
<div class="role">
  ${d.dates === 'below'
    ? `<div class="title">${esc(r.title)}</div><div class="co">${esc(r.company)}</div><div class="when">${when(r)}${r.location ? ` · ${esc(r.location)}` : ''}</div>`
    : `<div class="role-head"><div><span class="title">${esc(r.title)}</span><span class="co"> · ${esc(r.company)}</span></div><div class="when">${when(r)}</div></div>${r.location ? `<div class="where">${esc(r.location)}</div>` : ''}`}
  <ul>${(r.bullets || []).map((b) => `<li>${esc(b.text)}</li>`).join('')}</ul>
</div>`).join('');
  const skillList = resume.skills || [];
  const inSide = (k) => sidebarOn && d.sidebar.includes(k);
  const skillsStyle = d.skills === 'inline' && inSide('skills') ? 'list' : d.skills;
  const blocks = {
    summary: resume.summary ? `<p class="summary">${esc(resume.summary)}</p>` : '',
    experience: roles,
    skills: skillList.length ? (skillsStyle === 'tags' ? `<div class="tags">${skillList.map((x) => `<span class="tagx">${esc(x)}</span>`).join(' ')}</div>` : skillsStyle === 'list' ? `<div class="skill-list">${skillList.map((x) => `<div>${esc(x)}</div>`).join('')}</div>` : `<p class="skills">${skillList.map(esc).join(' · ')}</p>`) : '',
    education: (resume.education || []).map((e) => `<div class="edu"><strong>${esc(e.degree)}${e.field ? `, ${esc(e.field)}` : ''}</strong><br>${esc(e.school)}${e.year ? ` · ${esc(e.year)}` : ''}</div>`).join(''),
    certifications: (resume.certifications || []).map((x) => `<div class="edu">${esc(x.name)}${x.year ? ` · ${esc(x.year)}` : ''}</div>`).join(''),
  };
  const sec = (k) => (blocks[k] && !d.hidden.includes(k) ? `<section class="sec-${k}"><h2>${SECTIONS[k]}</h2>${blocks[k]}</section>` : '');
  const mainHtml = d.order.filter((k) => !inSide(k)).map(sec).join('');
  const sideHtml = d.order.filter((k) => inSide(k)).map(sec).join('');
  const titleCss = {
    rule: `text-transform:uppercase;letter-spacing:.08em;color:${a};border-bottom:1px solid #c9ceda;padding-bottom:2pt`,
    caps: `text-transform:uppercase;letter-spacing:.12em;color:${a}`,
    bar: `color:${a};border-left:3.5pt solid ${a};padding-left:6pt;text-transform:uppercase;letter-spacing:.06em`,
    plain: `color:${a};font-size:${hSize + 1}pt`,
  }[d.titles] || '';
  const bulletCss = d.bullets === 'dash' ? `ul{list-style:none;padding-left:12pt}li{position:relative}li::before{content:"–";position:absolute;left:-10pt;color:${a}}` : d.bullets === 'none' ? 'ul{list-style:none;padding-left:0}' : `ul{padding-left:14pt}li::marker{color:${a}}`;
  const grid = sidebarOn ? `<div class="cols ${d.layout}"><div class="main">${mainHtml}</div><aside class="side">${sideHtml}</aside></div>` : mainHtml + sideHtml;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(c.name)} Resume</title>${link}<style>
${css}
@page{size:${page.w} ${page.h};margin:${d.margin}in}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff}
body{font-family:"${body}",${fb(body)};font-size:${d.size}pt;line-height:${sp.lh};color:#1d2333;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:calc(${page.w} - ${d.margin * 2}in)}
${headerCss(d, head, fb(head), nameSize)}
h2{font-family:"${head}",${fb(head)};font-size:${hSize}pt;margin:${sp.sec}pt 0 ${Math.round(sp.sec / 2)}pt;font-weight:700;break-after:avoid;${titleCss}}
.role{margin-bottom:${sp.role}pt;break-inside:avoid-page}
.role-head{display:flex;justify-content:space-between;gap:8pt;align-items:baseline}
.title{font-weight:700}.co{font-weight:600}
.when,.where{font-size:${MIN.body}pt;color:#4a5168}
.role-head .when{white-space:nowrap}
ul{margin:${Math.max(1, sp.li + 1)}pt 0 0}
li{margin:0 0 ${sp.li}pt}
${bulletCss}
p{margin:0}
.edu{margin-bottom:4pt}
.skill-list div{margin-bottom:2pt}
.tags{display:flex;flex-wrap:wrap;gap:4pt}
.tagx{border:1px solid ${a}55;border-radius:3pt;padding:1pt 5pt;font-size:${MIN.body}pt}
.cols{display:grid;gap:18pt;grid-template-columns:${d.layout === 'sidebar-left' ? '30% 1fr' : '1fr 30%'};grid-template-areas:${d.layout === 'sidebar-left' ? '"side main"' : '"main side"'}}
.main{grid-area:main;min-width:0}.side{grid-area:side;min-width:0${d.sidebarTint ? `;background:${a}12;padding:4pt 10pt 10pt;border-radius:4pt` : ''}}
.side h2:first-child{margin-top:${d.sidebarTint ? 6 : 0}pt}
.main section:first-child h2{margin-top:${sidebarOn ? 0 : sp.sec}pt}
.dot{color:#9aa1b3}
@media screen{body{padding:${d.margin}in}}
</style></head><body><div class="page">
${headerHtml(c, d)}
${grid}
</div></body></html>`;
}

export function letterHtml(letter, resumeContact, design, job, { fontBase, date = new Date() } = {}) {
  design = normalizeDesign(design);
  const page = pageSize(design);
  const { link, css } = fontFaces(design, fontBase);
  const head = design.fonts.heading || 'Inter', body = design.fonts.body || 'Inter';
  const fb = (f) => (SERIF.has(f) ? 'Georgia, serif' : 'Arial, sans-serif');
  const c = resumeContact || {};
  const d = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(c.name)} Cover Letter</title>${link}<style>
${css}
@page{size:${page.w} ${page.h};margin:0.8in}
body{margin:0;font-family:"${body}",${fb(body)};font-size:11pt;line-height:1.45;color:#1d2333;-webkit-print-color-adjust:exact;print-color-adjust:exact}
${headerCss(design, head, fb(head), 22)}
header{margin-bottom:22pt}
p{margin:0 0 10pt}
.to{margin-bottom:14pt}
@media screen{body{padding:0.8in}}
</style></head><body>
${headerHtml(c, design)}
<p>${esc(d)}</p>
<p class="to">${esc(job.company)}<br>Re: ${esc(job.title)}</p>
<p>${esc(letter.greeting)}</p>
${letter.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n')}
<p>${esc(letter.closing)}<br>${esc(c.name)}</p>
</body></html>`;
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
