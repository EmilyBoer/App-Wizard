import { test } from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { newApi, zipOne } from './helpers.mjs';
import { familyFromName, pdfFonts, docxFonts, fontStatus } from '../core/fonts.mjs';
import { fillTemplate, templateData, resumeHtml, letterHtml } from '../core/docs.mjs';
import { unzip } from '../core/files.mjs';

const b64 = (s) => Buffer.from(s).toString('base64');

test('font names from files become family names', () => {
  assert.equal(familyFromName('ABCDEF+TimesNewRomanPS-BoldMT'), 'Times New Roman');
  assert.equal(familyFromName('ArialMT'), 'Arial');
  assert.equal(familyFromName('Arial,Bold'), 'Arial');
  assert.equal(familyFromName('EBGaramond-Regular'), 'EB Garamond');
  assert.equal(familyFromName('OpenSans-SemiBold'), 'Open Sans');
  assert.equal(familyFromName('HelveticaNeue-Medium'), 'Helvetica Neue');
  assert.equal(familyFromName('QWERTY+Calibri-Light'), 'Calibri');
});

test('fonts are read from PDFs, including compressed parts', () => {
  const hidden = zlib.deflateSync(Buffer.from('<< /Type /Font /BaseFont /XYZABC+Garet-Book >>'));
  const pdf = Buffer.concat([Buffer.from('%PDF-1.7\n1 0 obj << /Type /Font /BaseFont /ABCDEF+Calibri-Bold >> endobj\n2 0 obj << /Type /ObjStm /Filter /FlateDecode /Length ' + hidden.length + ' >>\nstream\n'), hidden, Buffer.from('\nendstream endobj\n3 0 obj << /BaseFont /ABCDEF+Calibri >> endobj')]);
  const fonts = pdfFonts(pdf);
  assert.deepEqual(fonts.map((f) => f.family).sort(), ['Calibri', 'Garet']);
  assert.deepEqual(fonts.find((f) => f.family === 'Calibri').weights, [400, 700]);
});

test('what to do about each font', () => {
  assert.deepEqual(fontStatus('Lato'), { status: 'free', use: 'Lato' });
  assert.equal(fontStatus('Calibri').status, 'system');
  assert.equal(fontStatus('Calibri').use, 'Carlito');
  assert.equal(fontStatus('Calibri').exactWidths, true);
  assert.equal(fontStatus('Garet').status, 'missing');
  assert.equal(fontStatus('Garet').use, 'Work Sans');
  assert.equal(fontStatus('Garet', ['Garet']).status, 'uploaded');
});

test('template blanks, lists, show-if and separators', () => {
  const data = templateData({ contact: { name: 'A & B', email: 'a@b.co' }, roles: [{ title: 'T', company: 'C', start: '2020-03', end: 'present', bullets: [{ text: 'x' }, { text: 'y' }] }], skills: ['S1', 'S2', 'S3'] });
  const out = fillTemplate('<h1>{{name}}</h1>{{#phone}}P{{/phone}}{{^phone}}no phone{{/phone}}{{#roles}}[{{title}} {{dates}}:{{#bullets}}{{text}}{{^_last}};{{/_last}}{{/bullets}}]{{/roles}}{{#skills}}{{name}}{{^_last}}, {{/_last}}{{/skills}}{{#summary}}SUM{{/summary}}', data);
  assert.equal(out, '<h1>A &amp; B</h1>no phone[T Mar 2020 – Present:x;y]S1, S2, S3');
});

test('own design: fonts from the file, rebuild, preview, letter, and back to templates', async () => {
  const { api } = newApi();
  await api.call('auth.create', { name: 'Jordan Lee', email: 'jordan@example.com', password: 'longenough' });
  await api.call('materials.add', { files: [{ name: 'resume.txt', data: b64('RESUME Jordan Lee') }] });
  await api.call('profile.build');
  const pdf = '%PDF-1.4\n<< /Type /Font /BaseFont /AAAAAA+Garet-Book >>\n<< /Type /Font /BaseFont /BBBBBB+Calibri >>\n<< /Type /Font /BaseFont /CCCCCC+Lato-Bold >>';
  await api.call('materials.add', { files: [{ name: 'My Resume.pdf', data: b64(pdf) }], defer: true });
  const sources = await api.call('own.sources');
  assert.equal(sources[0].name, 'My Resume.pdf');
  const started = await api.call('own.start', { id: sources[0].id });
  const by = Object.fromEntries(started.fonts.map((f) => [f.family, f.status]));
  assert.deepEqual(by, { Garet: 'missing', Calibri: 'system', Lato: 'free' });

  const built = await api.call('own.build');
  assert.equal(built.rounds, 1);
  assert.deepEqual(built.leftOut, ['photo']);
  const g = await api.call('own.get');
  assert.equal(g.mode, 'own');

  // The person's own resume flows into the rebuilt design; unsafe bits are gone.
  const prev = await api.call('design.preview');
  assert.match(prev.html, /Moved the website to a new content system/);
  assert.match(prev.html, /EXPERIENCE/);
  assert.doesNotMatch(prev.html, /<script>alert|alert\(1\)|onclick/);
  assert.match(prev.html, /font-family:"Garet","Work Sans",sans-serif/);
  assert.match(prev.html, /Calibri","Carlito"/);
  assert.match(prev.html, /class="bg"/);
  // The side-by-side check uses the original's own words.
  const sample = await api.call('own.preview');
  assert.match(sample.html, /Original bullet one\./);

  // Uploading the missing font switches to the real one.
  const font = Buffer.alloc(200); font.writeUInt32BE(0x00010000, 0);
  await api.call('design.uploadFont', { name: 'Garet-Book.otf', data: font.toString('base64') });
  const after = await api.call('own.get');
  assert.equal(after.own.fonts.find((f) => f.family === 'Garet').status, 'uploaded');
  const prev2 = await api.call('design.preview');
  assert.match(prev2.html, /@font-face\{font-family:"Garet"/);

  const fixed = await api.call('own.refine', { notes: 'The name looks small' });
  assert.equal(fixed.rounds, 2);
  assert.deepEqual(fixed.lastFixes, ['Name was 2pt too small']);
  assert.equal(fixed.canUndo, true);

  await api.call('own.use', { on: false });
  assert.doesNotMatch((await api.call('design.preview')).html, /class="bg"/);
});

test('own design renders a cover letter with the same header', () => {
  const own = { template: '<div class="nm">{{name}}</div>{{#roles}}{{#bullets}}{{text}}{{/bullets}}{{/roles}}', css: '.nm{font-size:20pt}', letterHead: '<div class="nm">{{name}}</div>', margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }, fonts: [{ family: 'Lato', use: 'Lato', role: 'body' }] };
  const html = letterHtml({ greeting: 'Hi,', paragraphs: ['P1'], closing: 'Thanks,' }, { name: 'Jordan Lee' }, { mode: 'own', own }, { company: 'X', title: 'Y' });
  assert.match(html, /<div class="nm">Jordan Lee<\/div><div class="letter-body">/);
  assert.match(resumeHtml({ contact: { name: 'J' }, roles: [] }, { mode: 'own', own }), /class="nm">J</);
});

test('Word files: fonts in use, most used first', () => {
  const xml = '<w:document><w:body><w:p><w:r><w:rPr><w:rFonts w:ascii="Garamond" w:hAnsi="Garamond"/></w:rPr><w:t>Name</w:t></w:r></w:p><w:p><w:r><w:rPr><w:rFonts w:ascii="Calibri"/></w:rPr></w:r><w:r><w:rPr><w:rFonts w:ascii="Calibri"/></w:rPr></w:r></w:p></w:body></w:document>';
  const fonts = docxFonts(zipOne('word/document.xml', Buffer.from(xml)));
  assert.deepEqual(fonts.map((f) => f.family), ['Calibri', 'Garamond']);
  void unzip;
});
