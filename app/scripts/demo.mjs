// npm run demo: builds two sign-ins for showing Margo.
//   Jordan Ellis: a senior content strategist with everything filled in (resume, bullet vault, voice,
//   what they want, standard answers, real jobs, applications, cover letters, an interview cheat sheet).
//   Sam Rivera: a brand-new account that starts at the beginning of setup.
// Running it again rebuilds both from scratch. Nothing is sent to Claude: the writing is scripted.
//
// Data goes where `npm run web` keeps it (~/.app-wizard, or APP_WIZARD_DATA). For the desktop app,
// run: npm run demo -- --desktop

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApi } from '../core/api.mjs';
import { Accounts } from '../core/store.mjs';
import { makeJob } from '../../engine/src/index.mjs';
import * as D from './demo-data.mjs';

const desktop = process.argv.includes('--desktop');
const base = process.env.APP_WIZARD_DATA || (desktop
  ? path.join(os.homedir(), process.platform === 'darwin' ? 'Library/Application Support' : '.config', 'app-wizard', 'data')
  : path.join(os.homedir(), '.app-wizard'));
fs.mkdirSync(base, { recursive: true });

// ---------- start fresh: remove earlier demo accounts ----------
const accounts = new Accounts(base);
const keep = accounts.list().filter((a) => ![D.PERSON.email, D.BLANK.email].includes(a.email));
for (const a of accounts.list().filter((x) => !keep.includes(x))) fs.rmSync(path.join(base, 'users', a.id), { recursive: true, force: true });
accounts.save(keep);

// Reuse the Claude key from your own account, so the demo accounts can write live too.
let claudeKey = '';
for (const a of keep) { try { const s = JSON.parse(fs.readFileSync(path.join(base, 'users', a.id, 'settings.json'), 'utf8')); if (s.claudeKey) { claudeKey = s.claudeKey; break; } } catch {} }

// ---------- a scripted Claude that answers as Jordan ----------
const jobByText = (text) => D.JOBS.find((j) => text.includes(j.description.split('\n')[0])) || D.JOBS.find((j) => text.includes(j.title)) || D.JOBS.find((j) => text.includes(j.company));
const profileFrom = (text) => JSON.parse(text.slice(text.lastIndexOf('Profile: ') + 9));
const bulletsOf = (p) => p.roles.flatMap((r) => r.bullets.map((b) => ({ ...b, roleId: r.id })));
const findBullet = (p, needle) => bulletsOf(p).find((b) => b.text.includes(needle));
const score = (b, words) => words.reduce((n, w) => n + (b.text.toLowerCase().includes(w) ? 1 : 0), 0);

function answer(system, content) {
  const text = typeof content === 'string' ? content : content.map((c) => c.text || '').join('\n');
  if (system.includes('You sort files someone uploaded')) {
    if (/File name: LinkedIn/i.test(text)) return { kind: 'linkedin', summary: 'Your LinkedIn profile', text: '' };
    return { kind: 'resume', summary: 'Your 2026 resume, 3 roles', text: '' };
  }
  if (system.includes('You combine someone')) {
    const ids = [...text.matchAll(/\[(m_[a-f0-9]+)\]/g)].map((m) => m[1]);
    const [resume, linkedin] = [ids[0], ids[1] || ids[0]];
    return {
      contact: { name: D.PERSON.name, email: D.PERSON.email, phone: D.PERSON.phone, location: D.PERSON.location, linkedin: D.PERSON.linkedin, website: D.PERSON.website },
      summary: D.SUMMARY,
      roles: D.ROLES.map((r) => ({ company: r.company, title: r.title, start: r.start, end: r.end, location: r.location, sources: [resume, linkedin], bullets: r.bullets.map((t) => ({ text: t, sources: [resume] })) })),
      education: [{ ...D.EDUCATION, sources: [resume, linkedin] }],
      certifications: D.CERTS.map((c) => ({ ...c, sources: [resume] })),
      skills: D.SKILLS.map((name) => ({ name, sources: [resume] })),
      conflicts: [],
      underselling: [{ ...D.UNDERSELLING, source: linkedin }],
    };
  }
  if (system.includes('You describe how a person writes')) return { guide: D.VOICE.guide, sampleLine: D.VOICE.sampleLine };
  if (system.includes('describe the jobs they should go after')) return { summary: D.WANT.summary, reach: D.WANT.reachNote, titles: D.WANT.titles, suggestedTitles: D.WANT.suggestedTitles, keywords: D.WANT.keywords, level: 'senior', employerTypes: ['Tech company'] };
  if (system.includes('Pull the basic facts out of a job posting')) { const j = jobByText(text); return j ? { title: j.title, company: j.company, location: j.location, remote: /remote/i.test(j.location) ? 'remote' : 'onsite', pay: '', level: 'senior' } : { title: 'Senior Content Strategist', company: 'Tidewater Software', location: 'Remote', remote: 'remote', pay: '', level: 'senior' }; }
  if (system.includes('You judge whether a job fits')) {
    const j = jobByText(text); const f = D.FIT[j.key];
    const p = { roles: [] }; const ids = [...text.matchAll(/\[(b_[a-f0-9]+)\]|"id":"(b_[a-f0-9]+)"/g)].map((m) => m[1] || m[2]);
    void p;
    return { mustHaves: f.needs.map((want, i) => ({ want, bulletId: ids[i * 2] || null, fit: ids[i * 2] ? 'direct' : 'gap' })), qualified: { ok: f.verdict !== 'stretch', note: '' }, direction: f.direction, mission: f.mission, practical: { ok: j.key !== 'lightfield', note: j.key === 'lightfield' ? 'On-site in San Francisco.' : '' }, verdict: f.verdict, why: f.why, gapQuestions: f.gaps };
  }
  if (system.includes('You tailor a resume')) {
    const p = profileFrom(text); const j = jobByText(text);
    const words = j.description.toLowerCase().match(/[a-z]{4,}/g);
    const roles = p.roles.map((r, i) => ({ roleId: r.id, bullets: [...r.bullets].sort((a, b) => score(b, words) - score(a, words)).slice(0, i === 0 ? 6 : i === 1 ? 4 : 2).map((b, k) => ({ from: b.id, text: b.text, relevance: 5 - Math.min(k, 4) })) }));
    const skills = D.SKILLS.slice().sort((a, b) => (j.description.toLowerCase().includes(b.toLowerCase().split(' ')[0]) ? 1 : 0) - (j.description.toLowerCase().includes(a.toLowerCase().split(' ')[0]) ? 1 : 0)).slice(0, 12);
    return { summary: D.SUMMARY, roles, skills, keywordsUsed: D.WANT.keywords.filter((k) => j.description.toLowerCase().includes(k)) };
  }
  if (system.includes('You write a cover letter')) {
    const p = profileFrom(text); const j = jobByText(text); const paras = D.LETTERS[j.key];
    const facts = ['1.2M views', '60+ LinkedIn posts', 'Looker Studio', '40K to 210K', '38,000', '1,100 pages', '9K to 52K', '24 case studies', '300 help-center', '6-person team'].map((n) => findBullet(p, n)).filter((b) => b && paras.some((x) => x.includes(b.text.match(/\d[\d,.KM+]*/)?.[0] || '@@')));
    return { greeting: 'Dear Hiring Team,', paragraphs: paras, closing: 'Thank you,', factsUsed: facts.map((b) => b.id) };
  }
  if (system.includes('You write the top of an interview cheat sheet')) return D.CHEAT.brief;
  if (system.includes('You write the questions part of an interview cheat sheet')) {
    const p = profileFrom(text);
    return { groups: D.CHEAT.groups.map((g) => ({ ...g, questions: g.questions.map(({ match, ...q }) => ({ tips: [], flag: null, steps: [], yourStory: false, ...q, from: match ? [findBullet(p, match)?.id].filter(Boolean) : [] })) })) };
  }
  if (system.includes('You write the "homework" part')) return D.CHEAT.homework;
  if (system.includes('preference rules')) return { rules: [] };
  throw new Error('demo Claude: no scripted answer for ' + system.slice(0, 60));
}
const demoClaude = () => ({ ready: true, json: async ({ system, content }) => structuredClone(answer(system, content)), send: async () => 'OK' });
const offline = async () => { throw new Error('offline while building the demo'); };
const quietMail = { ready: true, sent: [], send: async (m) => { quietMail.sent.push(m); return { sent: true }; } };

const api = createApi({ base, fetchImpl: offline, claudeFactory: demoClaude, persistSession: false, mailer: quietMail, appUrl: 'http://127.0.0.1:4321/' });
const call = (m, a) => api.call(m, a);
const s = () => api.store();

// ---------- Jordan ----------
await call('auth.create', { name: D.PERSON.name, email: D.PERSON.email, password: D.PERSON.password });
await call('auth.verify', { token: quietMail.sent.at(-1).text.match(/#\/verify\/(\S+)/)[1] });
if (claudeKey) s().update('settings', (x) => { x.claudeKey = claudeKey; });

// Files, then the profile built from them (the real setup path).
await call('materials.add', { text: D.RESUME_TEXT, name: 'Jordan_Ellis_Resume_2026.txt' });
await call('materials.add', { text: D.LINKEDIN_TEXT, name: 'LinkedIn profile (Jordan Ellis).txt', kind: 'linkedin' });
await call('profile.build');
const under = s().get('profile').underselling.find((u) => u.status === 'pending');
if (under) await call('profile.undersell', { itemId: under.id, decision: 'added' });
await call('profile.setSummary', { text: D.SUMMARY });
await call('profile.setLinkedIn', { value: `https://${D.PERSON.linkedin}` }).catch(() => {});
s().update('profile', (p) => { p.contact = { ...p.contact, phone: D.PERSON.phone, website: D.PERSON.website, location: D.PERSON.location }; });

// Voice: a writing sample, a cover letter, the dials, and an approved sample line.
await call('voice.addSample', { text: D.WRITING_SAMPLE, name: 'Email to the marketing team (112 words)' });
await call('voice.addSample', { text: D.LETTER_SAMPLE, name: 'Cover letter (96 words)', kind: 'letter' });
s().update('voice', (v) => { v.dials = { formal: 3, detail: 1, confidence: 3, color: 2 }; v.never = [...new Set([...v.never, 'leverage', 'ninja', 'thought leader'])]; });
await call('voice.generate');
await call('voice.rate', { rating: 'yes' });
await call('settings.save', { letterWhen: 'always', morningHour: 7, morningCount: 3, morningOn: true });

// Resume design.
await call('design.save', { template: Object.keys((await call('design.get')).templates)[1] || 'classic', paper: 'letter', length: 'one', yearsBack: 10 });
s().update('design', (d) => { d.keep = false; });

// What they want, from real postings.
for (const ex of D.EXAMPLES) {
  const j = ex.key && D.JOBS.find((x) => x.key === ex.key);
  if (j) await call('want.addExample', { kind: ex.kind, url: j.url, text: j.description });
}
await call('want.analyze');
await call('want.save', { titles: D.WANT.titles, suggestedTitles: D.WANT.suggestedTitles, where: D.WANT.where, jobType: D.WANT.jobType, payFloor: D.WANT.payFloor, maxAgeDays: D.WANT.maxAgeDays, places: D.WANT.places, work: D.WANT.work, dealBreakers: D.WANT.dealBreakers, keywords: D.WANT.keywords, ambiguous: D.WANT.ambiguous, level: D.WANT.level });
s().update('want', (w) => { w.summary = D.WANT.summary; w.reachNote = D.WANT.reachNote; w.lookIn = { 'linkedin.com': 2, 'jobs.a16z.com': 1 }; });

// Standard answers and plain-language rules.
for (const [key, question, ans] of D.ANSWERS) await call('answers.save', { key, question, answer: ans });
for (const r of D.RULES) await call('learning.add', { text: r });

// Real jobs.
const now = new Date();
s().update('jobs', (js) => {
  js.list = D.JOBS.map((j) => Object.assign(makeJob({ source: 'link', board: j.board, jobId: j.jobId, company: j.company, title: j.title, location: j.location, remote: /remote/i.test(j.location) ? true : null, url: j.url, description: j.description, postedAt: j.postedAt }, now), { addedBy: j.key === 'zillow-studio' || j.key === 'lightfield' ? undefined : 'you' }));
  js.lastFetch = new Date(now.getTime() - 3 * 3600e3).toISOString();
});
await call('jobs.rerank');
const jobId = (key) => s().get('jobs').list.find((x) => x.title === D.JOBS.find((j) => j.key === key).title).id;
for (const j of D.JOBS) await call('jobs.explain', { id: jobId(j.key) });

// Resumes and cover letters for the four remote jobs; approved for the three already sent.
for (const key of ['a16z', 'webflow', 'zillow-agents', 'zillow-studio']) {
  const made = await call('docs.make', { jobId: jobId(key) });
  if (key !== 'zillow-studio') { await call('docs.approve', { id: made.resume.id }); if (made.letter) await call('docs.approve', { id: made.letter.id }); }
}
await call('jobs.rate', { id: jobId('lightfield'), value: 'no', reasons: ['On-site only'] });

// Applications, with dates that make sense.
const entry = (key) => s().get('tracker').list.find((t) => t.title === D.JOBS.find((j) => j.key === key).title);
for (const j of D.JOBS.filter((x) => ['applied', 'interviewing'].includes(x.status))) await call('tracker.status', { id: entry(j.key).id, status: 'applied' });
// The recruiter screen already happened; its notes feed the next round's sheet.
const screen = await call('interviews.forJob', { jobId: jobId('a16z') });
await call('interviews.update', { id: screen.id, start: '2026-11-10T20:00:00.000Z', end: '2026-11-10T20:30:00.000Z', round: 'Recruiter screen', with: 'a16z recruiting', format: 'Phone', notes: 'Went well. The team cares most about clips and testing. Comp band confirmed. Next: hiring manager, Dec 2.' });
const iv = await call('interviews.add', { trackerId: entry('a16z').id, company: 'Andreessen Horowitz', role: D.JOBS[0].title, start: '2026-12-02T18:00:00.000Z', round: 'Hiring manager interview, round 2', with: 'Frontier editorial lead', format: 'Video call' });
await call('interviews.update', { id: iv.id, end: '2026-12-02T18:45:00.000Z', theirTz: 'America/Los_Angeles', link: 'https://zoom.us/j/81244550193', meetingId: '812 4455 0193', passcode: 'frontier', scheduler: 'a16z recruiting', about: 'Runs editorial for Frontier. The role reports to them.', notes: '' });
await call('interviews.cheat', { id: iv.id });
s().update('interviews', (x) => { const i = x.list.find((y) => y.id === iv.id); i.cheat.researchNote = ''; }); // demo: no live research


s().update('tracker', (t) => {
  for (const j of D.JOBS) {
    const e = t.list.find((x) => x.title === j.title); if (!e) continue;
    const found = new Date(Math.max(Date.parse(j.postedAt) + 864e5, Date.parse(j.applied || now) - 2 * 864e5)).toISOString();
    e.dateFound = found;
    e.history = [{ at: found, status: 'saved' }];
    if (j.applied) {
      e.dateApplied = j.applied;
      e.history.push({ at: j.applied, status: 'applied', note: '' });
      e.followUps = [{ id: `f_${j.key}`, due: new Date(Date.parse(j.applied) + 7 * 864e5).toISOString().slice(0, 10), note: 'Follow up if you haven’t heard back.', done: j.key === 'a16z' }];
    }
    if (j.key === 'a16z') {
      e.history.push({ at: '2026-11-10T20:00:00.000Z', status: 'interviewing', note: 'Recruiter screen' }, { at: '2026-11-19T17:30:00.000Z', status: 'interviewing', note: 'Hiring manager interview booked for Dec 2' });
      e.notes = 'Recruiter said the team cares most about clips and testing. Comp band confirmed.';
    }
    if (j.key === 'zillow-agents') e.notes = 'Applied through the Zillow careers site.';
  }
});

await call('builder.complete');
await call('auth.logout');

// ---------- Sam: a blank account ----------
await call('auth.create', { name: D.BLANK.name, email: D.BLANK.email, password: D.BLANK.password });
if (claudeKey) s().update('settings', (x) => { x.claudeKey = claudeKey; });
await call('auth.logout');

const t = new Accounts(base);
const count = (who) => { const a = t.list().find((x) => x.email === who.email); const dir = path.join(base, 'users', a.id); const j = (n) => JSON.parse(fs.readFileSync(path.join(dir, `${n}.json`), 'utf8')); return { a, j }; };
const { j } = count(D.PERSON);
const p = j('profile');
console.log(`
Demo accounts are ready in ${base}

  Filled in:  ${D.PERSON.email}   password: ${D.PERSON.password}
              ${p.roles.length} jobs, ${p.roles.reduce((n, r) => n + r.bullets.length, 0)} bullets in the vault, ${j('jobs').list.length} real postings, ${j('tracker').list.filter((x) => ['applied', 'interviewing'].includes(x.status)).length} applications, ${j('documents').list.filter((d) => d.kind === 'letter').length} cover letters, ${j('interviews').list.filter((i) => i.cheat).length} interview cheat sheet

  Blank:      ${D.BLANK.email}    password: ${D.BLANK.password}
              starts at the beginning of setup
${claudeKey ? '\n  Both use the Claude key from your own account.' : '\n  No Claude key found in your own account; add one in Profile if you want live writing.'}
Run again any time to reset both.`);
