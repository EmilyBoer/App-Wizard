// Reading the files people drop in: Word, PDF, images, text. No extra packages.

import zlib from 'node:zlib';

const MIME = {
  pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  txt: 'text/plain', md: 'text/markdown', csv: 'text/csv', html: 'text/html', htm: 'text/html', rtf: 'text/rtf', json: 'application/json',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2',
};

export function mimeFor(name) { return MIME[String(name).toLowerCase().split('.').pop()] || 'application/octet-stream'; }

/** Minimal ZIP reader: returns { name: Buffer } for the entries asked for. */
export function unzip(buf, wanted = () => true) {
  const out = {};
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('Not a zip file');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nlen).toString('utf8');
    if (wanted(name)) {
      const lnlen = buf.readUInt16LE(local + 26), lxlen = buf.readUInt16LE(local + 28);
      const data = buf.slice(local + 30 + lnlen + lxlen, local + 30 + lnlen + lxlen + csize);
      out[name] = method === 8 ? zlib.inflateRawSync(data) : data;
    }
    p += 46 + nlen + xlen + clen;
  }
  return out;
}

const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

/** Text of a .docx, one line per paragraph, bullets kept as "- ". */
export function docxText(buf) {
  const files = unzip(buf, (n) => n === 'word/document.xml');
  const xml = files['word/document.xml']?.toString('utf8');
  if (!xml) throw new Error('This Word file looks empty or damaged.');
  return xml.split(/<\/w:p>/).map((p) => {
    const bullet = /<w:numPr>/.test(p) ? '- ' : '';
    const text = [...p.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br\/>/g)].map((m) => (m[1] !== undefined ? m[1] : m[0] === '<w:tab/>' ? '\t' : '\n')).join('');
    return text.trim() ? bullet + decode(text) : '';
  }).filter((l, i, a) => l || (a[i - 1] && a[i - 1] !== '')).join('\n').trim();
}

export function htmlText(html) {
  return decode(String(html).replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d|tr)>/gi, '\n').replace(/<li[^>]*>/gi, '- ').replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
}

/**
 * Turn an uploaded file into something Claude can read.
 * Returns { name, mime, text?, base64?, problem? }.
 */
export function prepareFile({ name, data }) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'base64');
  const mime = mimeFor(name);
  const ext = String(name).toLowerCase().split('.').pop();
  if (ext === 'heic' || ext === 'heif') return { name, mime, problem: "iPhone photos (HEIC) can't be read yet. Take a screenshot of it instead, or export it as JPEG." };
  if (ext === 'doc') return { name, mime, problem: 'Older Word files (.doc) can’t be read. In Word, use File, Save As, and pick .docx or PDF.' };
  if (ext === 'pages') return { name, mime, problem: 'Pages files can’t be read. In Pages, use File, Export To, PDF.' };
  if (buf.length > 30 * 1024 * 1024) return { name, mime, problem: 'This file is over 30 MB. Try a smaller version or a PDF.' };
  if (mime === 'application/pdf' || mime.startsWith('image/')) return { name, mime, base64: buf.toString('base64') };
  if (ext === 'docx') { try { return { name, mime, text: docxText(buf) }; } catch (e) { return { name, mime, problem: e.message }; } }
  if (mime === 'text/html') return { name, mime, text: htmlText(buf.toString('utf8')) };
  if (mime.startsWith('text/') || mime === 'application/json') return { name, mime, text: buf.toString('utf8') };
  return { name, mime, problem: "We can't read this kind of file. PDF, Word (.docx), text and screenshots all work." };
}

/**
 * Read a font's name and its embedding permission (OS/2 fsType).
 * Returns { family, embeddable, restriction } or throws for non-fonts.
 */
export function fontInfo(buf) {
  buf = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, 'base64');
  const tag = buf.slice(0, 4).toString('latin1');
  if (tag === 'wOFF' || tag === 'wOF2') {
    // Compressed web fonts: we can't read the tables without decompressing; assume allowed and say so.
    return { family: null, embeddable: true, restriction: 'unknown', note: 'Web font file; embedding flag not checked.' };
  }
  const sfnt = buf.readUInt32BE(0);
  if (![0x00010000, 0x4f54544f, 0x74727565].includes(sfnt)) throw new Error("This doesn't look like a font file.");
  const numTables = buf.readUInt16BE(4);
  const tables = {};
  for (let i = 0; i < numTables; i++) {
    const o = 12 + i * 16;
    tables[buf.slice(o, o + 4).toString('latin1')] = { offset: buf.readUInt32BE(o + 8), length: buf.readUInt32BE(o + 12) };
  }
  let fsType = 0;
  if (tables['OS/2']) fsType = buf.readUInt16BE(tables['OS/2'].offset + 8);
  let family = null;
  if (tables.name) {
    const base = tables.name.offset, count = buf.readUInt16BE(base + 2), strings = base + buf.readUInt16BE(base + 4);
    for (let i = 0; i < count; i++) {
      const r = base + 6 + i * 12;
      const platform = buf.readUInt16BE(r), nameId = buf.readUInt16BE(r + 6), len = buf.readUInt16BE(r + 8), off = buf.readUInt16BE(r + 10);
      if (nameId !== 1) continue;
      const raw = buf.slice(strings + off, strings + off + len);
      family = platform === 3 || platform === 0 ? Buffer.from(raw).swap16().toString('utf16le') : raw.toString('latin1');
      if (platform === 3) break;
    }
  }
  const restricted = (fsType & 0x000f) === 0x0002;
  return { family, embeddable: !restricted, restriction: restricted ? 'restricted' : (fsType & 0x0004) ? 'preview-print' : (fsType & 0x0008) ? 'editable' : 'installable' };
}
