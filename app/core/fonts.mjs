// Which fonts a resume file uses, read straight from the file, and what to do about each one.
// No extra packages: PDFs list their fonts by name (sometimes inside compressed streams); Word files list them in XML.

import zlib from 'node:zlib';
import { unzip } from './files.mjs';

// Fonts we always have (bundled or loaded for free from Google Fonts).
export const GOOGLE = ['Inter', 'Lato', 'Open Sans', 'Roboto', 'Source Sans 3', 'Work Sans', 'Montserrat', 'Raleway', 'Lora', 'Merriweather', 'EB Garamond', 'Playfair Display',
  'Arimo', 'Tinos', 'Cousine', 'Carlito', 'Caladea', 'Gelasio', 'Cormorant Garamond', 'Cormorant', 'Libre Baskerville', 'Libre Franklin', 'Source Serif 4', 'Poppins', 'Nunito', 'Nunito Sans',
  'Josefin Sans', 'Jost', 'Questrial', 'Didact Gothic', 'Crimson Pro', 'Crimson Text', 'PT Sans', 'PT Serif', 'Noto Sans', 'Noto Serif', 'Oswald', 'Bebas Neue', 'League Spartan',
  'Archivo', 'DM Sans', 'DM Serif Display', 'Rubik', 'Karla', 'Manrope', 'IBM Plex Sans', 'IBM Plex Serif', 'Fira Sans', 'Quicksand', 'Mulish', 'Barlow', 'Cabin', 'Alegreya',
  'Alice', 'Cardo', 'Spectral', 'Domine', 'Arvo', 'Bitter', 'Zilla Slab', 'Roboto Slab', 'Roboto Condensed', 'Abril Fatface', 'Prata', 'Marcellus', 'Tenor Sans', 'Lexend',
  'Outfit', 'Plus Jakarta Sans', 'Figtree', 'Sora', 'Urbanist', 'Space Grotesk', 'Hind', 'Heebo', 'Assistant', 'Overpass', 'Red Hat Display', 'Public Sans', 'Hanken Grotesk', 'Open Sans Condensed'];
const GOOGLE_LC = new Map(GOOGLE.map((f) => [f.toLowerCase(), f]));

// Fonts that come with Mac or Windows (or Microsoft Office). They work if the computer has them.
export const SYSTEM = ['Helvetica', 'Helvetica Neue', 'Arial', 'Times New Roman', 'Times', 'Georgia', 'Avenir', 'Avenir Next', 'Futura', 'Gill Sans', 'Optima', 'Baskerville', 'Didot',
  'Hoefler Text', 'Palatino', 'Palatino Linotype', 'Verdana', 'Trebuchet MS', 'Tahoma', 'Courier New', 'Calibri', 'Calibri Light', 'Cambria', 'Segoe UI', 'Garamond', 'Book Antiqua',
  'Century Gothic', 'Franklin Gothic', 'Franklin Gothic Book', 'Corbel', 'Candara', 'Constantia', 'Aptos', 'Arial Narrow', 'Bookman Old Style', 'Century', 'Lucida Grande', 'Charter', 'Iowan Old Style', 'Seravek', 'SF Pro'];
const SYSTEM_LC = new Map(SYSTEM.map((f) => [f.toLowerCase(), f]));

// Closest free font for common fonts we can't include. Some are drawn to the exact same widths, so line breaks match.
const ALIKE = [
  ['calibri', 'Carlito', true], ['cambria', 'Caladea', true], ['arial', 'Arimo', true], ['helvetica neue', 'Inter'], ['helvetica', 'Arimo', true], ['times new roman', 'Tinos', true], ['times', 'Tinos', true],
  ['courier', 'Cousine', true], ['georgia', 'Gelasio', true], ['adobe garamond', 'EB Garamond'], ['garamond', 'EB Garamond'], ['palatino', 'Crimson Pro'], ['book antiqua', 'Crimson Pro'],
  ['avenir', 'Nunito Sans'], ['futura', 'Jost'], ['gill sans', 'Lato'], ['century gothic', 'Didact Gothic'], ['proxima', 'Montserrat'], ['gotham', 'Montserrat'], ['brandon', 'Josefin Sans'],
  ['myriad', 'Source Sans 3'], ['minion', 'Crimson Pro'], ['didot', 'Playfair Display'], ['bodoni', 'Playfair Display'], ['baskerville', 'Libre Baskerville'], ['hoefler', 'Libre Baskerville'],
  ['franklin gothic', 'Libre Franklin'], ['segoe', 'Open Sans'], ['tahoma', 'PT Sans'], ['verdana', 'Open Sans'], ['trebuchet', 'Fira Sans'], ['optima', 'Tenor Sans'], ['aptos', 'Inter'],
  ['canva sans', 'Inter'], ['glacial indifference', 'Didact Gothic'], ['brice', 'Montserrat'], ['garet', 'Work Sans'], ['hk grotesk', 'Hanken Grotesk'], ['open sauce', 'Inter'], ['now', 'Inter'],
  ['the seasons', 'Playfair Display'], ['tt norms', 'Poppins'], ['sf pro', 'Inter'], ['constantia', 'Gelasio'], ['corbel', 'Open Sans'], ['candara', 'Lato'], ['lucida', 'Open Sans'],
  ['charter', 'Source Serif 4'], ['iowan', 'Source Serif 4'], ['seravek', 'Nunito Sans'], ['bookman', 'Crimson Pro'], ['century', 'Crimson Pro'], ['source sans pro', 'Source Sans 3'], ['source serif pro', 'Source Serif 4'],
];

/** Turn a font's internal name (ABCDEF+TimesNewRomanPS-BoldMT, Arial,Bold) into its family name (Times New Roman). */
export function familyFromName(raw) {
  let n = String(raw || '').replace(/^\/?/, '').replace(/^[A-Z]{6}\+/, '').replace(/#20/g, ' ');
  n = n.split(/[-,]/)[0];
  n = n.replace(/(PSMT|PS|MT)$/, '').replace(/[_]+/g, ' ');
  // Words run together (OpenSans, EBGaramond, TimesNewRoman) get their spaces back.
  if (!/\s/.test(n)) n = n.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
  n = n.replace(/\s+(Regular|Bold|Italic|Light|Medium|Semi ?Bold|Demi ?Bold|Black|Thin|Extra ?Light|Extra ?Bold|Book|Oblique|Condensed Bold)$/i, '').trim();
  const lc = n.toLowerCase();
  return GOOGLE_LC.get(lc) || SYSTEM_LC.get(lc) || n;
}

function weightOf(raw) {
  const s = String(raw).toLowerCase();
  if (/black|heavy/.test(s)) return 900; if (/extrabold|extra-bold|ultrabold/.test(s)) return 800; if (/semibold|demibold|demi/.test(s)) return 600;
  if (/bold/.test(s)) return 700; if (/medium/.test(s)) return 500; if (/extralight|ultralight/.test(s)) return 200; if (/light/.test(s)) return 300; if (/thin/.test(s)) return 100;
  return 400;
}

/** Font names inside a PDF, including ones in compressed object streams. */
export function pdfFonts(buf) {
  buf = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, 'base64');
  const texts = [buf.toString('latin1')];
  const raw = texts[0];
  // Inflate compressed streams (fonts often hide in object streams).
  const re = /stream\r?\n/g; let mm;
  while ((mm = re.exec(raw))) {
    const start = mm.index + mm[0].length;
    const end = raw.indexOf('endstream', start);
    if (end < 0) break;
    const dict = raw.slice(Math.max(0, mm.index - 300), mm.index);
    if (/\/FlateDecode/.test(dict) && !/\/(Image|FontFile|Length1)/.test(dict.slice(dict.lastIndexOf('<<')))) {
      try { const out = zlib.inflateSync(buf.subarray(start, end)); if (out.length < 4e6) texts.push(out.toString('latin1')); } catch { /* not a stream we need */ }
    }
    re.lastIndex = end;
  }
  const seen = new Map();
  for (const t of texts) for (const m of t.matchAll(/\/(?:BaseFont|FontName)\s*\/([^\s/<>[\]()]+)/g)) {
    const name = m[1];
    if (/^(Symbol|ZapfDingbats)$/.test(name)) continue;
    const family = familyFromName(name);
    if (!family || family.length < 2) continue;
    const f = seen.get(family) || { family, names: new Set(), weights: new Set(), italic: false };
    f.names.add(name.replace(/^[A-Z]{6}\+/, '')); f.weights.add(weightOf(name)); if (/italic|oblique/i.test(name)) f.italic = true;
    seen.set(family, f);
  }
  return [...seen.values()].map((f) => ({ family: f.family, names: [...f.names], weights: [...f.weights].sort(), italic: f.italic }));
}

/** Fonts a Word file actually uses (styles and text), most used first. */
export function docxFonts(buf) {
  buf = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, 'base64');
  const files = unzip(buf, (n) => /^word\/(document|styles|theme\/theme1)\.xml$/.test(n));
  const theme = files['word/theme/theme1.xml']?.toString('utf8') || '';
  const major = theme.match(/<a:majorFont>\s*<a:latin typeface="([^"]+)"/)?.[1];
  const minor = theme.match(/<a:minorFont>\s*<a:latin typeface="([^"]+)"/)?.[1];
  const count = new Map();
  for (const part of ['word/styles.xml', 'word/document.xml']) {
    const xml = files[part]?.toString('utf8') || '';
    for (const m of xml.matchAll(/<w:rFonts\b([^>]*)\/?>/g)) {
      const a = m[1];
      let f = a.match(/w:ascii="([^"]+)"/)?.[1] || a.match(/w:hAnsi="([^"]+)"/)?.[1];
      if (!f) { const t = a.match(/w:asciiTheme="([^"]+)"/)?.[1]; f = t ? (/major/.test(t) ? major : minor) : null; }
      if (f) count.set(f, (count.get(f) || 0) + (part.includes('document') ? 2 : 1));
    }
  }
  if (!count.size && minor) count.set(minor, 1);
  return [...count.entries()].sort((x, y) => y[1] - x[1]).map(([name]) => ({ family: familyFromName(name), names: [name], weights: [], italic: false }))
    .filter((f, i, all) => all.findIndex((g) => g.family === f.family) === i);
}

/** Word XML the rebuild needs: the layout parts, trimmed. */
export function docxLayoutXml(buf) {
  buf = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, 'base64');
  const files = unzip(buf, (n) => /^word\/(document|styles)\.xml$/.test(n));
  const strip = (s) => String(s || '').replace(/<w:rsid[^>]*\/>/g, '').replace(/\s(w:rsid\w*|w14:\w+|w15:\w+)="[^"]*"/g, '').replace(/<mc:AlternateContent>[\s\S]*?<\/mc:AlternateContent>/g, '');
  return { document: strip(files['word/document.xml']?.toString('utf8')).slice(0, 60000), styles: strip(files['word/styles.xml']?.toString('utf8')).slice(0, 25000) };
}

/** What to do about a font: included, free from Google, on most computers, or needs the file. */
export function fontStatus(family, uploaded = []) {
  const lc = String(family).toLowerCase();
  if (uploaded.some((u) => u.toLowerCase() === lc)) return { status: 'uploaded', use: family };
  if (GOOGLE_LC.has(lc)) return { status: 'free', use: GOOGLE_LC.get(lc) };
  const alike = closestFont(family);
  if (SYSTEM_LC.has(lc)) return { status: 'system', use: alike.family, exactWidths: alike.exact };
  return { status: 'missing', use: alike.family, exactWidths: alike.exact };
}

export function closestFont(family) {
  const lc = String(family).toLowerCase();
  if (GOOGLE_LC.has(lc)) return { family: GOOGLE_LC.get(lc), exact: true };
  const hit = ALIKE.find(([k]) => lc.includes(k));
  if (hit) return { family: hit[1], exact: Boolean(hit[2]) };
  return { family: /serif|garamond|times|roman|baskerville|bodoni|didot|book|antiqua|caslon|georgia/.test(lc) && !/sans/.test(lc) ? 'Source Serif 4' : 'Inter', exact: false };
}
