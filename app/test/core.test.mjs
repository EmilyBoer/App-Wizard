import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newApi, makeDocx, fakeClaude } from './helpers.mjs';
import { prepareFile, docxText, fontInfo } from '../core/files.mjs';
import { hardFilter, parsePay, scoreJob } from '../core/match.mjs';
import { verifyResume, verifyLetter } from '../core/ai.mjs';
import { cutOnce, fileName, matchFont, readableCheck, resumeHtml } from '../core/docs.mjs';
import { jobsFromAlertEmail, parseIcs } from '../core/intake.mjs';
import { similar, mergeProfile } from '../core/profile.mjs';
import { searchHelp } from '../core/help.mjs';

const b64 = (s) => Buffer.from(s).toString('base64');

async function setUpUser(api) {
  await api.call('auth.create', { name: 'Jordan Lee', email: 'jordan@example.com', password: 'longenough' });
  await api.call('materials.add', { files: [{ name: 'resume.txt', data: b64('RESUME Jordan Lee') }, { name: 'LinkedIn.txt', data: b64('LINKEDIN profile') }, { name: 'lumen-job.txt', data: b64('JOB POSTING Content Strategist') }] });
  await api.call('profile.build');
}

test('accounts: create, wrong password, login', async () => {
  const { api } = newApi();
  await api.call('auth.create', { name: 'Jordan Lee', email: 'Jordan@Example.com', password: 'longenough' });
  assert.equal(api.call('auth.status').then ? (await api.call('auth.status')).loggedIn : false, true);
  await api.call('auth.logout');
  await assert.rejects(api.call('auth.login', { email: 'jordan@example.com', password: 'nope' }), /don't match/);
  const a = await api.call('auth.login', { email: 'jordan@example.com', password: 'longenough' });
  assert.equal(a.name, 'Jordan Lee');
  await assert.rejects(api.call('auth.create', { name: 'X', email: 'jordan@example.com', password: 'longenough' }), /already an account/);
});

test('materials are sorted; a job posting moves to What you want', async () => {
  const { api } = newApi();
  await setUpUser(api);
  const mats = await api.call('materials.list');
  assert.deepEqual(mats.map((m) => m.kind).sort(), ['job_posting', 'linkedin', 'resume']);
  assert.equal(mats.find((m) => m.kind === 'job_posting').movedTo, 'want');
  const want = await api.call('want.get');
  assert.equal(want.examples.length, 1);
  // undo: it's actually not a job
  await api.call('materials.setKind', { id: mats.find((m) => m.kind === 'job_posting').id, kind: 'other' });
  assert.equal((await api.call('want.get')).examples.length, 0);
});

test('unreadable files get a plain reason', () => {
  assert.match(prepareFile({ name: 'photo.HEIC', data: b64('x') }).problem, /HEIC/);
  assert.match(prepareFile({ name: 'old.doc', data: b64('x') }).problem, /\.docx/);
});

test('Word files are read', () => {
  const buf = makeDocx(['Jordan Lee', '- Built 30 landing pages', 'Portland & Co.']);
  assert.equal(docxText(buf), 'Jordan Lee\n- Built 30 landing pages\nPortland & Co.');
  assert.match(prepareFile({ name: 'r.docx', data: buf }).text, /landing pages/);
});

test('profile: conflicts, underselling, settled choices survive a rebuild', async () => {
  const { api } = newApi();
  await setUpUser(api);
  let p = await api.call('profile.get');
  assert.equal(p.roles.length, 2);
  assert.equal(p.conflicts.length, 1);
  assert.equal(p.underselling[0].status, 'pending');
  await api.call('profile.settle', { conflictId: p.conflicts[0].id, value: '2021-01' });
  await api.call('profile.undersell', { itemId: p.underselling[0].id, decision: 'added' });
  p = await api.call('profile.get');
  assert.equal(p.roles[0].start, '2021-01');
  assert.ok(p.roles[0].bullets.some((b) => /Trained 12/.test(b.text)));
  const ids = p.roles[0].bullets.map((b) => b.id);
  await api.call('profile.build');
  p = await api.call('profile.get');
  assert.equal(p.roles[0].start, '2021-01', 'settled date kept');
  assert.equal(p.conflicts.filter((c) => c.chosen == null).length, 0, 'no repeat question');
  assert.equal(p.underselling.filter((u) => u.status === 'pending').length, 0, 'no repeat offer');
  assert.deepEqual(p.roles[0].bullets.map((b) => b.id).slice(0, ids.length), ids, 'bullet ids stable');
});

test('resume check: numbers must match, no made-up skills or roles', () => {
  const profile = { roles: [{ id: 'r1', company: 'A', title: 'T', start: '2020', end: 'present', bullets: [{ id: 'b1', text: 'Moved 400 pages.' }, { id: 'b2', text: 'Ran calendar.' }] }], skills: [{ name: 'WordPress' }] };
  const out = verifyResume({ summary: 'Did 900 things.', roles: [{ roleId: 'r1', bullets: [{ from: 'b1', text: 'Moved 500 pages — fast.' }, { from: 'zzz', text: 'Invented' }, { from: 'b2', text: 'Ran a passionate calendar.' }] }, { roleId: 'nope', bullets: [] }], skills: ['WordPress', 'Kubernetes'] }, profile, { never: ['passionate'] });
  assert.equal(out.roles.length, 1);
  assert.deepEqual(out.roles[0].bullets.map((b) => b.text), ['Moved 400 pages.', 'Ran calendar.']);
  assert.deepEqual(out.skills, ['WordPress']);
  assert.equal(out.summary, '');
  assert.ok(out.checks.length >= 4);
});

test('letter check flags numbers and banned words', () => {
  const profile = { roles: [{ id: 'r1', bullets: [{ id: 'b1', text: 'Moved 400 pages.' }] }] };
  const out = verifyLetter({ paragraphs: ['I moved 400 pages — and 900 more.', 'I am passionate.'], factsUsed: ['b1'] }, profile, { never: ['passionate'] });
  assert.equal(out.ok, false);
  assert.ok(out.checks.some((c) => c.includes('900')));
  assert.ok(out.checks.some((c) => c.includes('passionate')));
  assert.ok(!out.paragraphs[0].includes('—'));
});

test('matching: pay floor, deal-breakers, words that mean two things, avoid', () => {
  const want = { titles: ['Content Strategist'], payFloor: 85000, where: ['Remote'], dealBreakers: ['Sales targets'], ambiguous: [{ word: 'Development', meanings: ['Fundraising', 'Building software'], choice: 'Building software' }], places: { Agency: 'Avoid' } };
  assert.equal(parsePay('Pay: $70,000 – $80,000 a year').max, 80000);
  assert.equal(parsePay('$95k-$115k').min, 95000);
  assert.equal(hardFilter({ title: 'Writer', description: '$70,000 - $80,000', location: 'Remote' }, want).ok, false);
  assert.equal(hardFilter({ title: 'Account Executive', description: 'Monthly quota', location: 'Remote' }, want).ok, false);
  const dev = hardFilter({ title: 'Development Writer', description: 'Write donor appeals for our fundraising team', location: 'Remote' }, want);
  assert.equal(dev.ok, false); assert.match(dev.reasons[0], /fundraising/i);
  assert.equal(hardFilter({ title: 'Web Developer', description: 'javascript code', location: 'Remote' }, want).ok, true);
  assert.equal(hardFilter({ title: 'Content Lead', description: 'Our agency serves client accounts', location: 'Remote' }, want).ok, false);
  assert.equal(hardFilter({ title: 'Content Strategist', description: '', location: 'Denver, CO' }, want).ok, false);
  assert.equal(hardFilter({ title: 'Content Strategist', description: '', location: 'Remote - US' }, want).ok, true);
  const s1 = scoreJob({ title: 'Content Strategist', description: 'website cms' }, want);
  const s2 = scoreJob({ title: 'Data Engineer', description: 'spark' }, want);
  assert.ok(s1.score > s2.score);
});

test('jobs flow: refresh from a live list, filter, rate, learn, tracker', async () => {
  const { api } = newApi();
  await setUpUser(api);
  await api.call('want.save', { titles: ['Website Manager', 'Web Producer'], payFloor: 85000, where: ['Remote'], dealBreakers: ['Sales targets'], work: ['Running the website'] });
  await api.call('want.analyze');
  const want = await api.call('want.get');
  want.ambiguous[0].choice = 'Building software';
  await api.call('want.save', { ambiguous: want.ambiguous });
  const site = await api.call('sites.add', { url: 'https://boards.greenhouse.io/lumen' });
  assert.equal(site.kind, 'board');
  const r = await api.call('jobs.refresh');
  assert.equal(r.kept, 2); assert.equal(r.hidden, 2);
  const { jobs } = await api.call('jobs.list');
  assert.deepEqual(jobs.map((j) => j.title).sort(), ['Senior Web Producer', 'Website Manager']);
  const hidden = (await api.call('jobs.list', { view: 'hidden' })).jobs;
  assert.ok(hidden.every((j) => j.hiddenBecause.length));
  const m = await api.call('jobs.explain', { id: jobs[0].id });
  assert.equal(m.verdict, 'strong');
  assert.equal(m.mustHaves[1].bulletId, null, 'unknown bullet ids are dropped');
  assert.equal(m.mustHaves[1].fit, 'gap');
  const rated = await api.call('jobs.rate', { id: jobs[0].id, value: 'yes' });
  assert.ok(Array.isArray(rated.learned));
  const t = await api.call('tracker.list');
  assert.equal(t.list.length, 1); assert.equal(t.list[0].status, 'saved');
  await api.call('jobs.rate', { id: jobs[1].id, value: 'no', reasons: ['Pay too low'] });
  const l = await api.call('learning.get');
  assert.ok(l.rules.some((x) => x.kind === 'pay-strict'));
});

test('documents: tailored, checked, cut to fit, edits learned', async () => {
  const { api } = newApi();
  await setUpUser(api);
  await api.call('want.save', { titles: ['Website Manager'] });
  await api.call('sites.add', { url: 'https://boards.greenhouse.io/lumen' });
  await api.call('jobs.refresh');
  const job = (await api.call('jobs.list')).jobs.find((j) => j.title === 'Website Manager');
  const made = await api.call('docs.make', { jobId: job.id });
  const resume = await api.call('docs.get', { id: made.resume.id });
  assert.equal(resume.data.roles[0].bullets[0].text, 'Moved the website to a new content system, about 400 pages, on schedule.', 'invented number replaced');
  assert.ok(!resume.data.skills.includes('Kubernetes'));
  assert.ok(resume.html.includes('Jordan Lee'));
  assert.match(made.resume.file, /^Jordan_Lee_Resume_Lumen_Public_Radio_Website_Manager$/);
  const letter = await api.call('docs.get', { id: made.letter.id });
  assert.ok(letter.checks.some((c) => c.includes('passionate')));
  const tr = (await api.call('tracker.list')).list[0];
  assert.equal(tr.status, 'ready'); assert.equal(tr.resumeDocId, made.resume.id);
  const cut = await api.call('docs.cutOnce', { id: made.resume.id });
  assert.equal(cut.done, false);
  const edit = await api.call('docs.editLine', { id: made.resume.id, path: '0.0', text: 'Moved our whole website, about 400 pages, to a new system on schedule.' });
  assert.ok(edit.offerProfile);
  const l = await api.call('learning.get');
  assert.equal(l.edits.length, 1);
  const txt = await api.call('docs.text', { id: made.resume.id });
  assert.match(txt, /EXPERIENCE/);
});

test('cutting order: old roles past the limit, then low-relevance bullets, never the current role below 3', () => {
  const r = { summary: 'One. Two.', roles: [
    { company: 'Now', start: '2021', end: 'present', bullets: [1, 2, 3, 4].map((n) => ({ text: `n${n}`, relevance: 5 - n })) },
    { company: 'Old', start: '2000', end: '2005', bullets: [{ text: 'o' }] },
  ] };
  const d = { yearsBack: 15 };
  let step = cutOnce(r, d); assert.match(step.cut, /Old/);
  step = cutOnce(step.resume, d); assert.match(step.cut, /n4/);
  step = cutOnce(step.resume, d); assert.match(step.cut, /summary/);
  assert.equal(cutOnce(step.resume, d).cut, 'Removed the summary.');
});

test('alert emails, calendar invites, help search, fonts', () => {
  const email = `Content Strategist · Lumen Public Radio\nhttps://www.linkedin.com/comm/jobs/view/3999123456/?trackingId=abc\nWeb Producer - Quill\nhttps://www.linkedin.com/comm/jobs/view/3999000001/?x=1\nUnsubscribe https://www.linkedin.com/comm/unsubscribe?x`;
  const jobs = jobsFromAlertEmail(email);
  assert.equal(jobs.length, 2);
  assert.equal(jobs[0].url, 'https://www.linkedin.com/jobs/view/3999123456/');
  assert.equal(jobs[0].company, 'Lumen Public Radio');
  const ics = 'BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Interview: Content Strategist\nDTSTART:20261022T170000Z\nDTEND:20261022T174500Z\nLOCATION:Zoom\nDESCRIPTION:With Dana\\, Lumen Public Radio\nEND:VEVENT\nEND:VCALENDAR';
  const ev = parseIcs(ics);
  assert.equal(ev[0].start, '2026-10-22T17:00:00.000Z');
  assert.match(ev[0].description, /Dana, Lumen/);
  assert.equal(searchHelp('how do I edit my resume')[0].id, 'edit-resume');
  assert.equal(searchHelp('custom font canva')[0].id, 'custom-font');
  assert.equal(matchFont('Brice-Bold'), 'Montserrat');
  assert.equal(matchFont('Some Serif Display'), 'Lora');
  assert.throws(() => fontInfo(Buffer.from('not a font at all')), /font file/);
  assert.equal(fileName('Jordan Lee', 'Resume', { company: 'Lumen Public Radio', title: 'Website Manager' }), 'Jordan_Lee_Resume_Lumen_Public_Radio_Website_Manager');
  assert.ok(readableCheck('Jordan Lee Content Strategist Meridian moved pages', ['Jordan Lee', 'Content Strategist', 'Meridian']).ok);
  assert.ok(!readableCheck('Meridian Jordan Lee', ['Jordan Lee', 'Content Strategist']).ok);
  assert.ok(similar('Moved the website to a new system, 400 pages', 'Moved the website (400 pages) to a new system'));
});

test('chat proposals need a yes before changing the profile', async () => {
  const { api } = newApi();
  await setUpUser(api);
  const before = (await api.call('profile.get')).roles[0].bullets.length;
  const reply = await api.call('chat.send', { text: 'I built a Looker Studio report every month' });
  assert.equal((await api.call('profile.get')).roles[0].bullets.length, before);
  await api.call('chat.decide', { messageId: reply.id, proposalId: reply.proposals[0].id, accept: true });
  assert.equal((await api.call('profile.get')).roles[0].bullets.length, before + 1);
});

test('interviews: from a calendar file, cheat sheet only cites real bullets', async () => {
  const { api } = newApi();
  await setUpUser(api);
  await api.call('tracker.addManual', { company: 'Lumen Public Radio', title: 'Content Strategist', url: '', status: 'applied' });
  const [iv] = await api.call('interviews.fromIcs', { text: 'BEGIN:VEVENT\nSUMMARY:Lumen Public Radio interview\nDTSTART:20261022T170000Z\nEND:VEVENT' });
  assert.equal(iv.company, 'Lumen Public Radio');
  const cheat = await api.call('interviews.cheat', { id: iv.id });
  assert.deepEqual(cheat.questions[0].from, []);
  assert.match(cheat.researchNote, /couldn't read/);
  const tr = (await api.call('tracker.list')).list[0];
  assert.equal(tr.status, 'interviewing');
});

test('extension: fills from profile and saved answers; personal questions need you', async () => {
  const { api } = newApi();
  await setUpUser(api);
  await api.call('answers.save', { key: 'veteran', question: 'Veteran status', answer: 'I am not a protected veteran' });
  const fill = await api.call('ext.fill', { url: 'https://boards.greenhouse.io/lumen/jobs/101' });
  assert.equal(fill.fields.firstName, 'Jordan');
  assert.ok(fill.answers.some((a) => a.key === 'veteran'));
  const saved = await api.call('ext.answer', { question: 'Veteran status:', url: '' });
  assert.equal(saved.answer, 'I am not a protected veteran');
  const personal = await api.call('ext.answer', { question: 'What are your salary expectations?', url: '' });
  assert.equal(personal.needsYou, true);
});

test('design: Canva import picks a layout and swaps fonts', async () => {
  const { api } = newApi();
  await setUpUser(api);
  const r = await api.call('design.importCanva', { name: 'Resume.pdf', data: b64('%PDF-1.4 fake') });
  assert.equal(r.template, 'modern');
  assert.deepEqual(r.fonts, { heading: 'Montserrat', body: 'Open Sans' });
  assert.deepEqual(r.missing, ['Brice']);
  const prev = await api.call('design.preview');
  assert.match(prev.html, /Montserrat/);
  assert.match(prev.html, /grid-template-columns:1fr 30%/);
});

test('missing API key gives a plain message', async () => {
  const { api } = newApi({ claude: () => ({ ready: false }) });
  await api.call('auth.create', { name: 'A B', email: 'a@b.co', password: 'longenough' });
  await assert.rejects(api.call('voice.generate'), /Claude API key/);
});

test('mergeProfile keeps hand-added roles', () => {
  const saved = { roles: [{ id: 'r_m', company: 'Side Gig', title: 'Owner', manual: true, bullets: [] }] };
  const out = mergeProfile(saved, { roles: [{ company: 'A', title: 'B', start: '2020', end: 'present', bullets: [] }] });
  assert.ok(out.roles.some((r) => r.id === 'r_m'));
});

test('resume HTML keeps minimum sizes', () => {
  const html = resumeHtml({ contact: { name: 'A' }, roles: [] }, { template: 'compact', paper: 'a4', fonts: { heading: 'Lora', body: 'Lato' } });
  const sizes = [...html.matchAll(/font-size:(\d+(?:\.\d+)?)pt/g)].map((m) => Number(m[1]));
  assert.ok(Math.min(...sizes) >= 10);
  assert.match(html, /size:210mm 297mm/);
});

test('builder: one-question setup builds profile, wants and answers', async () => {
  const { api } = newApi();
  await api.call('auth.create', { name: 'Jordan Lee', email: 'j@example.com', password: 'longenough' });
  let st = await api.call('builder.status');
  assert.equal(st.hasResume, false);
  await api.call('materials.add', { files: [{ name: 'resume.txt', data: b64('RESUME Jordan') }] });
  st = await api.call('builder.status');
  assert.equal(st.profileStale, true);
  await api.call('builder.buildProfile');
  st = await api.call('builder.status');
  assert.equal(st.profileStale, false); assert.ok(st.profile.roles.length);
  await api.call('want.addExample', { input: 'https://boards.greenhouse.io/lumen/jobs/101', kind: 'interviewed' });
  await api.call('want.addExample', { input: 'Senior Web Producer\nOwn the CMS and the website.', kind: 'fit' });
  await api.call('want.addExample', { input: 'Director of Digital\nLead a team of 8.', kind: 'reach' });
  st = await api.call('builder.status');
  assert.equal(st.interviewed.length, 1); assert.equal(st.fit.length, 1); assert.equal(st.reach.length, 1);
  assert.equal(st.ready, true);
  assert.ok(st.sites.some((x) => x.board === 'lumen' && x.auto), 'company from a pasted job is watched automatically');
  await api.call('builder.analyze');
  await api.call('answers.save', { key: 'salary', question: 'What are your salary expectations?', answer: '$95k to $110k' });
  await api.call('answers.save', { key: 'relocate', question: 'Are you willing to relocate?', answer: 'Yes: Seattle' });
  const found = await api.call('builder.findJobs');
  assert.ok(found.found >= 1);
  await api.call('builder.complete');
  const o = await api.call('app.overview');
  assert.ok(o.setup.done.includes(10));
  const a = await api.call('builder.answers');
  assert.equal(a.salary, '$95k to $110k'); assert.equal(a.relocate, 'Yes: Seattle');
});

test('setup works before Claude is connected; files are read once it is', async () => {
  const fake = fakeClaude();
  let key = '';
  const { api } = newApi({ claude: (opts) => (key ? fake(opts) : { ready: false }) });
  await api.call('auth.create', { name: 'Jordan Lee', email: 'k@example.com', password: 'longenough' });
  const [m] = await api.call('materials.add', { files: [{ name: 'Jordan resume.pdf', data: b64('%PDF RESUME') }] });
  assert.equal(m.waiting, true); assert.equal(m.kind, 'resume');
  await api.call('want.addExample', { input: 'Web Producer\nOwn the CMS.', kind: 'fit' });
  await api.call('want.addExample', { input: 'https://boards.greenhouse.io/lumen/jobs/104', kind: 'interviewed' });
  let st = await api.call('builder.status');
  assert.equal(st.hasKey, false); assert.equal(st.hasResume, true); assert.equal(st.ready, true);
  key = 'sk-ant-test';
  st = await api.call('builder.analyze');
  assert.ok(st.profile.roles.length, 'profile built after connecting');
  assert.ok(st.materials.every((x) => !x.waiting));
  assert.ok(st.want.summary);
});

test('pasted jobs get their details; links teach where you look', async () => {
  const { api } = newApi();
  await api.call('auth.create', { name: 'Jordan Lee', email: 'p@example.com', password: 'longenough' });
  const a = await api.call('want.addExample', { url: 'https://www.linkedin.com/jobs/view/4000000001/', text: 'About the job\nSenior Web Producer at Northwind Health\nOwn the CMS.', kind: 'fit' });
  assert.equal(a.title, 'Senior Web Producer'); assert.equal(a.company, 'Northwind Health');
  await api.call('want.addExample', { url: 'https://boards.greenhouse.io/lumen/jobs/101', kind: 'interviewed' });
  await new Promise((r) => setTimeout(r, 20));
  const st = await api.call('builder.status');
  assert.equal(st.lookIn['linkedin.com'], 1); assert.equal(st.lookIn['boards.greenhouse.io'], 1);
  assert.ok(st.sites.some((x) => x.kind === 'alerts' && x.site === 'LinkedIn'), 'LinkedIn noted as a place they look');
  assert.ok(st.sites.some((x) => x.kind === 'board' && x.board === 'lumen'));
});
