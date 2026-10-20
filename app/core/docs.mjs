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
export const TEMPLATES = {
  classic: { label: 'Classic', note: 'One column. Safest for every hiring system.', columns: 1 },
  modern: { label: 'Modern', note: 'Two columns with a sidebar.', columns: 2 },
  compact: { label: 'Compact', note: 'Fits more on one page.', columns: 1 },
};

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

/** Resume HTML. Reading order in the HTML = reading order for hiring systems. */
export function resumeHtml(resume, design, { fontBase } = {}) {
  const t = design.template || 'classic';
  const page = pageSize(design);
  const { link, css } = fontFaces(design, fontBase);
  const head = design.fonts?.heading || 'Inter', body = design.fonts?.body || 'Inter';
  const fallback = (f) => (SERIF.has(f) ? 'Georgia, serif' : 'Arial, sans-serif');
  const compact = t === 'compact';
  const accent = design.accent || '#14213D';
  const size = Math.max(MIN.body, compact ? 10 : 10.5);
  const c = resume.contact || {};
  const roles = (resume.roles || []).map((r) => `
<section class="role">
  <div class="role-head"><div><span class="title">${esc(r.title)}</span><span class="co"> · ${esc(r.company)}</span></div><div class="when">${esc(fmtDate(r.start))}${r.end ? ` – ${esc(fmtDate(r.end))}` : ''}</div></div>
  ${r.location ? `<div class="where">${esc(r.location)}</div>` : ''}
  <ul>${(r.bullets || []).map((b) => `<li>${esc(b.text)}</li>`).join('')}</ul>
</section>`).join('');
  const edu = (resume.education || []).map((e) => `<div class="edu"><strong>${esc(e.degree)}${e.field ? `, ${esc(e.field)}` : ''}</strong><br>${esc(e.school)}${e.year ? ` · ${esc(e.year)}` : ''}</div>`).join('');
  const certs = (resume.certifications || []).map((x) => `<div class="edu">${esc(x.name)}${x.year ? ` · ${esc(x.year)}` : ''}</div>`).join('');
  const skills = (resume.skills || []).length ? `<p class="skills">${resume.skills.map(esc).join(t === 'modern' ? '<br>' : ' · ')}</p>` : '';
  const main = `${resume.summary ? `<section><h2>Summary</h2><p class="summary">${esc(resume.summary)}</p></section>` : ''}<section><h2>Experience</h2>${roles}</section>`;
  const side = `${skills ? `<section><h2>Skills</h2>${skills}</section>` : ''}${edu ? `<section><h2>Education</h2>${edu}</section>` : ''}${certs ? `<section><h2>Certifications</h2>${certs}</section>` : ''}`;
  const layout = t === 'modern'
    ? `<div class="grid"><div class="main">${main}</div><aside class="side">${side}</aside></div>`
    : `${main}${side}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(c.name)} Resume</title>${link}<style>
${css}
@page{size:${page.w} ${page.h};margin:${MIN.marginIn}in}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff}
body{font-family:"${body}",${fallback(body)};font-size:${size}pt;line-height:${compact ? 1.2 : 1.28};color:#1d2333}
.page{width:calc(${page.w} - ${MIN.marginIn * 2}in)}
header{${t === 'modern' ? `border-bottom:2px solid ${accent};padding-bottom:6pt;` : ''}margin-bottom:${compact ? 6 : 10}pt}
h1{font-family:"${head}",${fallback(head)};font-size:${compact ? 19 : 22}pt;margin:0 0 2pt;color:${accent};letter-spacing:-.01em;line-height:1.1}
.contact{font-size:${Math.max(MIN.body, 10)}pt;color:#3b4256}
h2{font-family:"${head}",${fallback(head)};font-size:${MIN.heading}pt;text-transform:uppercase;letter-spacing:.08em;color:${accent};margin:${compact ? 7 : 11}pt 0 ${compact ? 3 : 5}pt;${t === 'classic' ? 'border-bottom:1px solid #c9ceda;padding-bottom:2pt;' : ''}break-after:avoid}
section{break-inside:auto}
.role{margin-bottom:${compact ? 5 : 8}pt;break-inside:avoid-page}
.role-head{display:flex;justify-content:space-between;gap:8pt;align-items:baseline}
.title{font-weight:700}.co{font-weight:600}
.when,.where{font-size:${MIN.body}pt;color:#4a5168;white-space:nowrap}
ul{margin:${compact ? 2 : 3}pt 0 0;padding-left:14pt}
li{margin:0 0 ${compact ? 1 : 2}pt}
p{margin:0}
.edu{margin-bottom:4pt}
.grid{display:grid;grid-template-columns:${t === 'modern' ? '1fr 30%' : '1fr'};gap:16pt}
.side{order:${t === 'modern' ? 2 : 0}}
.dot{color:#9aa1b3}
@media screen{body{padding:${MIN.marginIn}in}}
</style></head><body><div class="page">
<header><h1>${esc(c.name)}</h1><div class="contact">${contactLine(c)}</div></header>
${layout}
</div></body></html>`;
}

export function letterHtml(letter, resumeContact, design, job, { fontBase, date = new Date() } = {}) {
  const page = pageSize(design);
  const { link, css } = fontFaces(design, fontBase);
  const head = design.fonts?.heading || 'Inter', body = design.fonts?.body || 'Inter';
  const fb = (f) => (SERIF.has(f) ? 'Georgia, serif' : 'Arial, sans-serif');
  const accent = design.accent || '#14213D';
  const c = resumeContact || {};
  const d = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(c.name)} Cover Letter</title>${link}<style>
${css}
@page{size:${page.w} ${page.h};margin:0.8in}
body{margin:0;font-family:"${body}",${fb(body)};font-size:11pt;line-height:1.45;color:#1d2333}
h1{font-family:"${head}",${fb(head)};font-size:22pt;margin:0 0 2pt;color:${accent};line-height:1.1}
.contact{font-size:10pt;color:#3b4256;margin-bottom:22pt}
p{margin:0 0 10pt}
.to{margin-bottom:14pt}
@media screen{body{padding:0.8in}}
</style></head><body>
<h1>${esc(c.name)}</h1><div class="contact">${contactLine(c)}</div>
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
