// Every action the app can take, in one table. The desktop window, the local
// web preview, the morning run and the browser extension all call these.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Accounts, id } from './store.mjs';
import { makeClaude } from './claude.mjs';
import * as ai from './ai.mjs';
import { prepareFile, fontInfo, mimeFor } from './files.mjs';
import { mergeProfile, settleConflict, decideUnderselling, addBullet, pendingCount, yearsOfExperience, similar } from './profile.mjs';
import { rankJobs, parsePay, payLabel, bucket, EMPLOYER_TYPES, WORK_TYPES } from './match.mjs';
import { recordEvent, learnFromNo, learnFromYes, learnFromEdit, writingEdits, mergeRules, learningSummary } from './learn.mjs';
import { addToTracker, setStatus, findDuplicate, dueFollowUps, toCsv, STATUSES, STATUS_LABEL } from './tracker.mjs';
import { resumeHtml, letterHtml, fileName, resumeText, letterText, matchFont, FONTS, TEMPLATES, cutOnce, expectedText, readableCheck, maxPages, pageSize } from './docs.mjs';
import { jobsFromAlertEmail, parseIcs, researchCompany } from './intake.mjs';
import { ARTICLES, searchHelp } from './help.mjs';
import { identifyWebsite, fetchAll, checkJobLink, readSource, parseJobUrl, makeJob } from '../../engine/src/index.mjs';

export const SETUP_STEPS = ['Your account', 'Your materials', 'Your experience', 'Your voice', 'Resume design', 'What you want', 'Job sites', 'Standard answers', 'Rate 10 real jobs', 'All set'];

export const STANDARD_QUESTIONS = [
  { key: 'authorized', question: 'Are you legally authorized to work in the United States?', type: 'choice', options: ['Yes', 'No'] },
  { key: 'sponsorship', question: 'Will you now or in the future require visa sponsorship?', type: 'choice', options: ['No', 'Yes'] },
  { key: 'salary', question: 'What are your salary expectations?', type: 'text', personal: true },
  { key: 'start', question: 'When can you start?', type: 'text' },
  { key: 'relocate', question: 'Are you willing to relocate?', type: 'choice', options: ['No', 'Yes', 'Open to it for the right role'], personal: true },
  { key: 'leaving', question: 'Why are you leaving (or why did you leave) your current role?', type: 'text', personal: true },
  { key: 'hear', question: 'How did you hear about this job?', type: 'text' },
  { key: 'pronouns', question: 'Pronouns (optional)', type: 'text', personal: true },
  { key: 'gender', question: 'Gender (voluntary self-identification)', type: 'choice', options: ['Decline to self-identify', 'Woman', 'Man', 'Non-binary', 'Prefer to describe'], personal: true },
  { key: 'race', question: 'Race / ethnicity (voluntary self-identification)', type: 'choice', options: ['Decline to self-identify', 'American Indian or Alaska Native', 'Asian', 'Black or African American', 'Hispanic or Latino', 'Native Hawaiian or Other Pacific Islander', 'White', 'Two or more races'], personal: true },
  { key: 'veteran', question: 'Veteran status', type: 'choice', options: ['I am not a protected veteran', 'I identify as one or more of the classifications of protected veteran', 'I don’t wish to answer'], personal: true },
  { key: 'disability', question: 'Disability status', type: 'choice', options: ['No, I do not have a disability', 'Yes, I have a disability (or previously had a disability)', 'I don’t wish to answer'], personal: true },
];

export function createApi({ base, fetchImpl = fetch, claudeFactory = makeClaude, now = () => new Date(), onEvent = () => {} }) {
  const accounts = new Accounts(base);
  let session = null; // { account, store }
  const sessionFile = path.join(base, 'session.json');
  try { const s = JSON.parse(fs.readFileSync(sessionFile, 'utf8')); const a = accounts.list().find((x) => x.id === s.id); if (a) session = { account: accounts.public(a), store: accounts.storeFor(a.id) }; } catch {}

  const busy = new Map();
  const store = () => { if (!session) throw new UserError('Please log in.'); return session.store; };
  const claude = () => {
    const s = store().get('settings');
    const c = claudeFactory({ apiKey: s.claudeKey || process.env.ANTHROPIC_API_KEY, model: s.model, fastModel: s.fastModel, fetchImpl });
    if (!c.ready) throw new UserError('Add your Claude API key in Profile, Settings to use this. (Help: Setting up your Claude API key)');
    return c;
  };
  const setLogin = (acct) => { session = { account: acct, store: accounts.storeFor(acct.id) }; fs.writeFileSync(sessionFile, JSON.stringify({ id: acct.id })); return acct; };
  const jobById = (jid) => { const j = store().get('jobs').list.find((x) => x.id === jid); if (!j) throw new UserError('That job is no longer in your list.'); return j; };
  const saveJob = (job) => store().update('jobs', (js) => { const i = js.list.findIndex((x) => x.id === job.id); if (i >= 0) js.list[i] = job; else js.list.unshift(job); });
  const progress = (task, text) => onEvent({ type: 'progress', task, text });
  async function once(key, fn) { if (busy.has(key)) return busy.get(key); const p = fn().finally(() => busy.delete(key)); busy.set(key, p); return p; }

  const methods = {
    // ----- account -----
    'auth.status': () => ({ loggedIn: Boolean(session), account: session?.account || null, hasAccounts: accounts.list().length > 0 }),
    'auth.create': (a) => { const acct = setLogin(accounts.create(a)); store().update('profile', (p) => { p.contact = { ...p.contact, name: acct.name, email: acct.email }; }); store().update('setup', (s) => { s.done = [...new Set([...s.done, 1])]; s.step = 2; }); return acct; },
    'auth.login': (a) => setLogin(accounts.login(a)),
    'auth.logout': () => { session = null; try { fs.unlinkSync(sessionFile); } catch {} return true; },

    // ----- overview -----
    'app.overview': () => {
      const s = store();
      const tracker = s.get('tracker'), jobs = s.get('jobs'), setup = s.get('setup'), settings = s.get('settings'), profile = s.get('profile');
      const counts = Object.fromEntries(STATUSES.map((k) => [k, tracker.list.filter((t) => t.status === k).length]));
      return {
        account: session.account, setup: { ...setup, steps: SETUP_STEPS },
        hasKey: Boolean(settings.claudeKey || process.env.ANTHROPIC_API_KEY),
        counts, followUps: dueFollowUps(tracker), lastFetch: jobs.lastFetch, newJobs: jobs.list.filter((j) => !j.rated && !j.hiddenBecause && (j.score == null || j.score >= 25)).length,
        pending: pendingCount(profile), learning: learningSummary(s.get('learning')), lastBatch: settings.lastBatch || null,
      };
    },
    'setup.go': ({ step, at }) => store().update('setup', (s) => { if (step) s.step = step; if (at) s.at = at; }),
    'setup.done': ({ step }) => store().update('setup', (s) => { s.done = [...new Set([...s.done, step])]; s.step = Math.max(s.step, Math.min(step + 1, 10)); }),

    // ----- settings -----
    'settings.get': () => { const s = store().get('settings'); return { ...s, claudeKey: s.claudeKey ? `••••${s.claudeKey.slice(-4)}` : '', hasKey: Boolean(s.claudeKey) }; },
    'settings.save': (patch) => store().update('settings', (s) => { for (const k of ['model', 'fastModel', 'morningHour', 'morningCount', 'morningOn']) if (k in patch) s[k] = patch[k]; if (patch.claudeKey && !patch.claudeKey.startsWith('••••')) s.claudeKey = patch.claudeKey.trim(); }) && methods['settings.get'](),
    'settings.testKey': async () => { await claude().send({ system: 'Reply with OK.', content: 'Say OK', fast: true, maxTokens: 5 }); return { ok: true }; },

    // ----- materials -----
    'materials.list': () => store().get('materials').list.map(({ text, ...m }) => ({ ...m, chars: (text || '').length })),
    'materials.add': async ({ files = [], text, name }) => {
      if (text) files = [...files, { name: name || 'Pasted text.txt', data: Buffer.from(text).toString('base64') }];
      const added = [];
      for (const f of files) {
        const prepared = prepareFile(f);
        const rec = { id: id('m_'), name: f.name, mime: prepared.mime, added: now().toISOString(), kind: 'other', summary: '', text: prepared.text || '', problem: prepared.problem || null };
        if (!prepared.problem) {
          progress('materials', `Reading ${f.name}…`);
          try {
            const read = await ai.readMaterial(claude(), prepared);
            Object.assign(rec, { kind: read.kind, summary: read.summary, text: read.text || rec.text });
            if (read.kind === 'job_posting') {
              rec.movedTo = 'want';
              store().update('want', (w) => { w.examples.push({ id: id('x_'), title: read.jobPosting?.title || '', company: read.jobPosting?.company || '', text: rec.text, from: rec.id }); });
            }
            if (read.kind === 'writing') store().update('voice', (v) => { v.samples.push({ id: id('s_'), name: f.name, text: rec.text, from: rec.id }); });
          } catch (e) { rec.problem = e instanceof UserError || e.name === 'ClaudeError' ? e.message : `We couldn't read this: ${e.message}`; }
        }
        store().update('materials', (m) => { m.list.push(rec); });
        added.push(rec);
      }
      return added.map(({ text, ...m }) => m);
    },
    'materials.setKind': ({ id: mid, kind }) => {
      let rec;
      store().update('materials', (m) => { rec = m.list.find((x) => x.id === mid); if (rec) { rec.kind = kind; delete rec.movedTo; } });
      if (rec && kind !== 'job_posting') store().update('want', (w) => { w.examples = w.examples.filter((x) => x.from !== mid); });
      if (rec && kind === 'job_posting') store().update('want', (w) => { if (!w.examples.some((x) => x.from === mid)) w.examples.push({ id: id('x_'), title: '', company: '', text: rec.text, from: mid }); });
      return rec;
    },
    'materials.remove': ({ id: mid }) => { store().update('materials', (m) => { m.list = m.list.filter((x) => x.id !== mid); }); store().update('want', (w) => { w.examples = w.examples.filter((x) => x.from !== mid); }); return true; },

    // ----- profile -----
    'profile.get': () => ({ ...store().get('profile'), years: yearsOfExperience(store().get('profile')) }),
    'profile.build': () => once('profile.build', async () => {
      const mats = store().get('materials').list;
      if (!mats.some((m) => ['resume', 'linkedin'].includes(m.kind))) throw new UserError('Add at least one resume or your LinkedIn first.');
      progress('profile', 'Putting your work history together…');
      const draft = await ai.buildProfile(claude(), mats, store().get('profile'));
      const merged = mergeProfile(store().get('profile'), draft);
      store().set('profile', merged);
      return merged;
    }),
    'profile.settle': ({ conflictId, value }) => store().set('profile', settleConflict(store().get('profile'), conflictId, value)),
    'profile.undersell': ({ itemId, decision, text }) => store().set('profile', decideUnderselling(store().get('profile'), itemId, decision, text)),
    'profile.setContact': (c) => store().update('profile', (p) => { p.contact = { ...p.contact, ...c }; }),
    'profile.setSummary': ({ text }) => store().update('profile', (p) => { p.summary = text; p.summaryApproved = true; }),
    'profile.addRole': (r) => store().update('profile', (p) => { p.roles.unshift({ id: id('r_'), company: r.company, title: r.title, start: r.start, end: r.end || 'present', location: r.location || '', bullets: [], sources: ['you'], manual: true }); }),
    'profile.updateRole': ({ roleId, ...patch }) => store().update('profile', (p) => { const r = p.roles.find((x) => x.id === roleId); if (r) for (const k of ['company', 'title', 'start', 'end', 'location']) if (k in patch) { r[k] = patch[k]; r.settled = { ...(r.settled || {}), [k]: patch[k] }; } }),
    'profile.removeRole': ({ roleId }) => store().update('profile', (p) => { p.roles = p.roles.filter((r) => r.id !== roleId); }),
    'profile.addBullet': ({ company, text }) => { const p = store().get('profile'); const b = addBullet(p, company, text); store().set('profile', p); return b; },
    'profile.updateBullet': ({ bulletId, text }) => store().update('profile', (p) => { for (const r of p.roles) for (const b of r.bullets) if (b.id === bulletId) { b.text = text; b.confirmed = true; } }),
    'profile.removeBullet': ({ bulletId }) => store().update('profile', (p) => { for (const r of p.roles) r.bullets = r.bullets.filter((b) => b.id !== bulletId); }),
    'profile.addSkill': ({ name }) => store().update('profile', (p) => { if (!p.skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) p.skills.push({ name, sources: ['you'] }); p.removedSkills = (p.removedSkills || []).filter((s) => s.toLowerCase() !== name.toLowerCase()); }),
    'profile.removeSkill': ({ name }) => store().update('profile', (p) => { p.skills = p.skills.filter((s) => s.name !== name); p.removedSkills = [...new Set([...(p.removedSkills || []), name])]; }),
    'profile.addEducation': (e) => store().update('profile', (p) => { p.education.push({ id: id('e_'), ...e, sources: ['you'] }); }),
    'profile.removeEducation': ({ id: eid }) => store().update('profile', (p) => { p.education = p.education.filter((e) => e.id !== eid); }),

    // ----- voice -----
    'voice.get': () => store().get('voice'),
    'voice.useResume': ({ on }) => store().update('voice', (v) => { v.useResume = Boolean(on); }),
    'voice.addFile': async ({ file }) => {
      const prepared = prepareFile(file);
      if (prepared.problem) throw new UserError(prepared.problem);
      const text = prepared.text || (await ai.readMaterial(claude(), prepared)).text;
      store().update('voice', (v) => { v.samples.push({ id: id('s_'), name: file.name, text }); });
      return true;
    },
    'voice.addSample': ({ text, name }) => store().update('voice', (v) => { v.samples.push({ id: id('s_'), name: name || 'Pasted writing', text }); }),
    'voice.removeSample': ({ id: sid }) => store().update('voice', (v) => { v.samples = v.samples.filter((s) => s.id !== sid); }),
    'voice.save': (patch) => store().update('voice', (v) => { if (patch.dials) v.dials = { ...v.dials, ...patch.dials }; if (patch.never) v.never = patch.never; }),
    'voice.generate': async () => {
      const v = store().get('voice');
      // No writing samples? Learn from how their resume is written.
      const samples = v.samples.length ? v.samples : store().get('materials').list.filter((m) => m.kind === 'resume' && m.text).slice(0, 1).map((m) => ({ name: 'Your resume', text: m.text }));
      const out = await ai.voiceGuide(claude(), { samples, dials: v.dials, never: v.never, profile: store().get('profile'), edits: writingEdits(store().get('learning')) });
      return store().update('voice', (x) => { x.guide = out.guide || []; x.sampleLine = out.sampleLine; x.sampleRating = null; });
    },
    'voice.rate': ({ rating, note }) => store().update('voice', (v) => {
      v.sampleRating = rating;
      if (rating === 'yes' && v.sampleLine) v.approvedLines.push(v.sampleLine);
      if (note) v.notes.push(note);
      if (note) v.guide = [...(v.guide || []), `They said about a draft: "${note}"`];
    }),

    // ----- design -----
    'design.get': () => ({ ...store().get('design'), fonts_available: FONTS, templates: TEMPLATES, years: yearsOfExperience(store().get('profile')) }),
    'design.save': (patch) => store().update('design', (d) => { for (const k of ['template', 'paper', 'length', 'yearsBack', 'accent']) if (k in patch) d[k] = patch[k]; if (patch.fonts) d.fonts = { ...d.fonts, ...patch.fonts }; }),
    'design.uploadFont': ({ name, data }) => {
      const info = fontInfo(data);
      const family = info.family || name.replace(/\.(ttf|otf|woff2?)$/i, '').replace(/[-_](Regular|Bold|Italic|Medium|Light|SemiBold).*/i, '');
      store().update('design', (d) => { d.customFonts = [...d.customFonts.filter((f) => f.family !== family), { family, name, mime: mimeFor(name), base64: Buffer.isBuffer(data) ? data.toString('base64') : data, embeddable: info.embeddable, restriction: info.restriction }]; });
      return { family, embeddable: info.embeddable, warning: info.embeddable ? null : `${family} says it can't be placed inside PDFs. Your PDF may show a different font on other computers. We suggest using ${matchFont(family)} instead.` };
    },
    'design.removeFont': ({ family }) => store().update('design', (d) => { d.customFonts = d.customFonts.filter((f) => f.family !== family); for (const k of ['heading', 'body']) if (d.fonts[k] === family) d.fonts[k] = 'Inter'; }),
    'design.importCanva': async ({ name, data }) => {
      const prepared = prepareFile({ name, data });
      if (prepared.problem) throw new UserError(prepared.problem);
      if (prepared.mime !== 'application/pdf') throw new UserError('Export your Canva design as a PDF (Share, Download, PDF Standard) and drop that in.');
      const look = await ai.readDesign(claude(), prepared);
      const fontsFound = (look.fonts || []).slice(0, 2);
      const heading = matchFont(fontsFound[0]), body = matchFont(fontsFound[1] || fontsFound[0]);
      const missing = fontsFound.filter((f) => !FONTS.some((x) => x.toLowerCase() === String(f).toLowerCase()));
      const template = look.columns === 2 ? 'modern' : look.looksLike === 'compact' ? 'compact' : 'classic';
      store().update('design', (d) => { d.template = template; d.fonts = { heading, body }; d.accent = /^#[0-9a-f]{6}$/i.test(look.accent) ? look.accent : d.accent; d.canva = { name, base64: prepared.base64, fontsFound, missing, decorations: look.decorations || [], sections: look.sections || [], imported: now().toISOString(), approved: false }; });
      return { template, fonts: { heading, body }, fontsFound, missing, decorations: look.decorations || [] };
    },
    'design.approveCanva': ({ approved }) => store().update('design', (d) => { if (d.canva) d.canva.approved = approved; if (!approved) d.canva = null; }),
    'design.preview': () => {
      const p = store().get('profile');
      const resume = { contact: p.contact, summary: p.summary, roles: p.roles.slice(0, 4).map((r) => ({ ...r, bullets: r.bullets.slice(0, 4) })), skills: p.skills.slice(0, 10).map((s) => s.name), education: p.education, certifications: p.certifications };
      if (!resume.roles.length) Object.assign(resume, SAMPLE_RESUME(p.contact));
      return { html: resumeHtml(resume, store().get('design')), resume };
    },

    // ----- what you want -----
    'want.get': () => store().get('want'),
    'want.save': (patch) => store().update('want', (w) => { for (const k of ['titles', 'work', 'places', 'payFloor', 'where', 'level', 'jobType', 'dealBreakers', 'ambiguous', 'keywords', 'suggestedTitles']) if (k in patch) w[k] = patch[k]; }),
    'want.addExample': async ({ input, kind = 'fit', file }) => {
      if (!['interviewed', 'fit', 'reach'].includes(kind)) kind = 'fit';
      let ex;
      if (file) {
        const prepared = prepareFile(file);
        if (prepared.problem) throw new UserError(prepared.problem);
        if (prepared.text) ex = { title: prepared.text.split('\n').find((l) => l.trim())?.slice(0, 100) || file.name, company: '', text: prepared.text };
        else { const read = await ai.readMaterial(claude(), prepared); ex = { title: read.jobPosting?.title || file.name, company: read.jobPosting?.company || '', text: read.text }; }
      } else {
        input = String(input || '').trim();
        if (!input) throw new UserError('Paste a job link or the job text.');
        if (/^https?:\/\/\S+$/.test(input)) {
          const parsed = parseJobUrl(input);
          if (parsed) {
            const r = await checkJobLink(input, { fetchImpl });
            if (r.job) ex = { title: r.job.title, company: r.job.company, text: r.job.description, url: input };
          }
          if (!ex) {
            if (/linkedin\.com|indeed\.com|glassdoor\.com|ziprecruiter\.com/.test(input)) throw new UserError("That site doesn't let us read the job. Open it, copy the job description, and paste the text here instead.");
            try { const res = await fetchImpl(input, { headers: { 'user-agent': 'AppWizard/0.1' } }); const html = await res.text(); const { htmlText } = await import('./files.mjs'); ex = { title: (html.match(/<title>([^<]*)/i)?.[1] || '').trim(), company: '', text: htmlText(html).slice(0, 12000), url: input }; } catch { throw new UserError("We couldn't open that link. Paste the job's text instead."); }
            if (ex.text.length < 400) throw new UserError("We couldn't read the job on that page. Copy the job description and paste the text here instead.");
          }
          // Watch this company's live job list from now on.
          if (parsed) store().update('sites', (st) => { if (!st.list.some((x) => x.kind === 'board' && x.source === parsed.source && x.board === parsed.board)) st.list.push({ id: id('site_'), input: input, name: ex.company || parsed.board, label: ex.company || parsed.board, kind: 'board', source: parsed.source, board: parsed.board, auto: true, added: now().toISOString() }); });
        } else ex = { title: input.split('\n').find((l) => l.trim())?.slice(0, 100) || 'Job', company: '', text: input };
      }
      const rec = { id: id('x_'), kind, ...ex };
      store().update('want', (w) => { w.examples.push(rec); });
      return rec;
    },
    'want.setExample': ({ id: xid, ...patch }) => store().update('want', (w) => { const x = w.examples.find((e) => e.id === xid); if (x) for (const k of ['kind', 'title', 'company']) if (k in patch) x[k] = patch[k]; }),
    'want.removeExample': ({ id: xid }) => store().update('want', (w) => { w.examples = w.examples.filter((x) => x.id !== xid); }),
    'want.analyze': async () => {
      const w = store().get('want');
      if (!w.examples.length && !w.titles.length) throw new UserError('Add a few jobs you like or some titles first.');
      const out = await ai.understandWants(claude(), { examples: w.examples, profile: store().get('profile'), titles: w.titles });
      return store().update('want', (x) => {
        x.summary = out.summary;
        x.reachNote = out.reach || '';
        x.keywords = out.keywords || [];
        if (!x.titles.length) x.titles = [...new Set((out.titles || []).length ? out.titles : x.examples.filter((e) => e.kind !== 'reach').map((e) => String(e.title || '').split(/\s+(?:at|·|-|–|\|)\s+/)[0].trim()).filter((t) => t && t.length < 60))].slice(0, 6);
        for (const t of out.employerTypes || []) if (EMPLOYER_TYPES[t] && !x.places[t]) x.places[t] = 'Love';
        const prev = new Map((x.suggestedTitles || []).map((t) => [t.title, t]));
        x.suggestedTitles = (out.suggestedTitles || []).filter((t) => !x.titles.includes(t)).map((t) => prev.get(t) || { title: t, accepted: null });
        const choices = new Map((x.ambiguous || []).map((a) => [a.word.toLowerCase(), a.choice]));
        x.ambiguous = (out.ambiguous || []).map((a) => ({ ...a, choice: choices.get(a.word.toLowerCase()) ?? null }));
        if (!x.payFloor && out.payRange) { const p = parsePay(out.payRange.replace(/k/g, 'k ')); if (p) x.payFloor = p.min; }
        if (!x.level.length && ['mid', 'senior', 'lead', 'manager'].includes(out.level)) x.level = [out.level[0].toUpperCase() + out.level.slice(1)];
      });
    },
    'want.options': () => ({ employerTypes: Object.keys(EMPLOYER_TYPES), workTypes: Object.keys(WORK_TYPES), dealBreakers: ['Sales targets', 'Night or weekend shifts', 'Relocation', 'Unpaid trial work', 'On-call'] }),

    // ----- builder (first-run setup on one screen) -----
    'builder.status': () => {
      const s = store();
      const mats = s.get('materials').list, p = s.get('profile'), w = s.get('want'), settings = s.get('settings');
      const by = (k) => w.examples.filter((e) => (e.kind || 'fit') === k).map(({ text, ...e }) => e);
      const hasResume = mats.some((m) => ['resume', 'linkedin'].includes(m.kind));
      return {
        hasKey: Boolean(settings.claudeKey || process.env.ANTHROPIC_API_KEY),
        materials: mats.map(({ text, ...m }) => m),
        hasResume, profileBuilt: p.roles.length > 0,
        profileStale: hasResume && mats.some((m) => ['resume', 'linkedin', 'review', 'portfolio'].includes(m.kind) && !m.inProfile),
        profile: { contact: p.contact, roles: p.roles.map((r) => ({ title: r.title, company: r.company, start: r.start, end: r.end, results: r.bullets.length })), skills: p.skills.map((x) => x.name), years: yearsOfExperience(p), checks: pendingCount(p) },
        interviewed: by('interviewed'), fit: by('fit'), reach: by('reach'),
        voice: { samples: s.get('voice').samples.map((x) => ({ id: x.id, name: x.name, words: String(x.text || '').split(/\s+/).length })), sampleLine: s.get('voice').sampleLine || '', useResume: Boolean(s.get('voice').useResume) },
        want: { summary: w.summary, reachNote: w.reachNote || '', titles: w.titles, suggestedTitles: w.suggestedTitles, ambiguous: w.ambiguous, payFloor: w.payFloor, where: w.where, dealBreakers: w.dealBreakers },
        sites: s.get('sites').list,
        ready: hasResume && w.examples.filter((e) => e.kind !== 'reach').length >= 2,
        done: s.get('setup').done.includes(10),
      };
    },
    'builder.buildProfile': async () => {
      const r = await methods['profile.build']();
      store().update('materials', (m) => { for (const x of m.list) x.inProfile = true; });
      return r;
    },
    'builder.analyze': () => once('builder.analyze', async () => {
      const st = methods['builder.status']();
      if (!st.hasResume) throw new UserError('Add your resume first.');
      if (st.profileStale || !st.profileBuilt) { progress('builder', 'Reading your resume…'); await methods['builder.buildProfile'](); }
      if (store().get('want').examples.length) { progress('builder', 'Working out your sweet spot…'); await methods['want.analyze'](); }
      return methods['builder.status']();
    }),
    'builder.findJobs': () => once('builder.findJobs', async () => {
      const sites = store().get('sites').list.filter((x) => x.kind === 'board' || x.kind === 'webpage');
      if (!sites.length) return { found: 0, noSites: true };
      progress('builder', 'Finding live jobs…');
      const r = await methods['jobs.refresh']();
      return { found: r.kept, hidden: r.hidden, report: r.report };
    }),
    'builder.complete': async () => {
      store().update('setup', (x) => { x.done = [...new Set([...x.done, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])]; x.step = 10; });
      try { await methods['voice.generate'](); } catch {}
      return true;
    },
    'builder.answers': () => { const a = store().get('answers').list; const get = (k) => a.find((x) => x.key === k)?.answer || ''; return { salary: get('salary'), relocate: get('relocate'), relocateCities: get('relocateCities'), start: get('start') }; },

    // ----- job sites -----
    'sites.list': () => store().get('sites').list,
    'sites.presets': async () => JSON.parse(fs.readFileSync(new URL('../../engine/presets.json', import.meta.url), 'utf8')),
    'sites.add': async ({ url, name }) => {
      const found = await identifyWebsite(url, { fetchImpl });
      const rec = { id: id('site_'), input: url, name: name || found.label, ...found, added: now().toISOString() };
      store().update('sites', (s) => { if (!s.list.some((x) => x.input === url)) s.list.push(rec); });
      return rec;
    },
    'sites.remove': ({ id: sid }) => store().update('sites', (s) => { s.list = s.list.filter((x) => x.id !== sid); }),

    // ----- standard answers -----
    'answers.get': () => { const saved = store().get('answers').list; return STANDARD_QUESTIONS.map((q) => ({ ...q, answer: saved.find((a) => a.key === q.key)?.answer ?? '' })).concat(saved.filter((a) => !STANDARD_QUESTIONS.some((q) => q.key === a.key))); },
    'answers.save': ({ key, question, answer }) => store().update('answers', (a) => { const i = a.list.findIndex((x) => x.key === key); const rec = { key: key || id('q_'), question, answer, approved: now().toISOString() }; if (i >= 0) a.list[i] = rec; else a.list.push(rec); }),

    // ----- jobs -----
    'jobs.refresh': () => once('jobs.refresh', async () => {
      const sites = store().get('sites').list.filter((s) => s.kind === 'board' || s.kind === 'webpage');
      if (!sites.length) throw new UserError('Add a job site in Setup, Job sites first (company career pages work best).');
      progress('jobs', `Checking ${sites.length} job site${sites.length > 1 ? 's' : ''}…`);
      const specs = sites.map((s) => (s.kind === 'board' ? { source: s.source, board: s.board } : { source: 'webpage', url: s.url }));
      const { jobs, report } = await fetchAll(specs, { fetchImpl, now: now(), maxAgeDays: 60 });
      return rerank(jobs, report);
    }),
    'jobs.rerank': () => rerank(null),
    'jobs.list': ({ view = 'matches' } = {}) => {
      const js = store().get('jobs');
      const list = view === 'hidden' ? js.list.filter((j) => j.hiddenBecause) : js.list.filter((j) => !j.hiddenBecause && (view === 'all' || !['no'].includes(j.rated)));
      return { jobs: list.map(slimJob), lastFetch: js.lastFetch, report: js.report, hiddenCount: js.list.filter((j) => j.hiddenBecause).length };
    },
    'jobs.get': ({ id: jid }) => { const j = jobById(jid); const t = findDuplicate(store().get('tracker'), j); const docs = store().get('documents').list.filter((d) => d.jobId === jid); return { ...j, payText: j.pay ? payLabel(j.pay) : '', tracker: t || null, documents: docs.map(slimDoc) }; },
    'jobs.addLink': async ({ url, title, company, text }) => {
      let job = null;
      const parsed = parseJobUrl(url || '');
      if (parsed) { const r = await checkJobLink(url, { fetchImpl }); if (r.open === false) throw new UserError(`That job has closed: ${r.reason}`); job = r.job || null; }
      if (!job) job = makeJob({ source: 'manual', board: new URL(url || 'https://manual.local').hostname, jobId: id(''), company: company || '', title: title || 'Job', location: '', url: url || '', description: text || '', postedAt: now().toISOString() }, now());
      if (!job.description && text) job.description = text;
      job.addedBy = 'you';
      saveJob(job); rerank(null);
      return slimJob(store().get('jobs').list.find((x) => x.id === job.id) || job);
    },
    'jobs.addAlert': async ({ text }) => {
      const found = jobsFromAlertEmail(text);
      if (!found.length) throw new UserError("We didn't find any job links in that. Copy the whole alert email, including the links, and paste again.");
      const added = [];
      for (const f of found.slice(0, 40)) {
        const parsed = parseJobUrl(f.url);
        let job = null;
        if (parsed) { try { const r = await checkJobLink(f.url, { fetchImpl }); if (r.open === false) continue; job = r.job; } catch {} }
        if (!job) job = makeJob({ source: 'alert', board: f.site, jobId: f.url.replace(/\W+/g, '').slice(-24), company: f.company, title: f.title || `${f.site} job`, location: '', url: f.url, description: '', postedAt: now().toISOString() }, now());
        job.fromAlert = f.site; job.needsText = !job.description;
        saveJob(job); added.push(job.id);
      }
      rerank(null);
      return { added: added.length, needText: store().get('jobs').list.filter((j) => added.includes(j.id) && j.needsText).length };
    },
    'jobs.setText': ({ id: jid, text, title, company, location }) => { const j = jobById(jid); Object.assign(j, { description: text || j.description, title: title || j.title, company: company || j.company, location: location ?? j.location, needsText: !(text || j.description) }); delete j.match; saveJob(j); rerank(null); return slimJob(j); },
    'jobs.explain': ({ id: jid, force }) => once(`explain:${jid}`, async () => {
      const j = jobById(jid);
      if (j.match && !force) return j.match;
      if (!j.description) throw new UserError("We don't have this job's description yet. Paste it in first.");
      const m = await ai.explainMatch(claude(), { profile: store().get('profile'), want: store().get('want'), job: j, rules: store().get('learning').rules.filter((r) => r.active !== false) });
      j.match = { ...m, at: now().toISOString() }; saveJob(j);
      return j.match;
    }),
    'jobs.rate': ({ id: jid, value, reasons = [] }) => {
      const j = jobById(jid);
      j.rated = value; j.ratedReasons = reasons; saveJob(j);
      const learning = store().get('learning'), want = store().get('want');
      recordEvent(learning, { type: 'job', value, reasons, title: j.title, company: j.company, snippet: String(j.description || '').slice(0, 600), jobId: j.id });
      const newRules = value === 'no' ? learnFromNo(learning, want, j, reasons) : value === 'yes' ? learnFromYes(learning, want, j) : [];
      store().set('learning', learning);
      const t = store().get('tracker');
      if (value === 'yes' || value === 'maybe') { const { entry } = addToTracker(t, j, { status: 'saved', fit: j.match }); if (entry.status === 'skipped') setStatus(t, entry.id, 'saved'); }
      if (value === 'no') { const d = findDuplicate(t, j); if (d && ['found', 'saved'].includes(d.status)) setStatus(t, d.id, 'skipped', reasons.join(', ')); }
      store().set('tracker', t);
      if (newRules.length) rerank(null);
      return { newRules, learned: describeLearning(store().get('learning')) };
    },
    'jobs.sample': ({ count = 10 } = {}) => {
      const js = store().get('jobs').list.filter((j) => !j.hiddenBecause);
      const unrated = js.filter((j) => !j.rated).slice(0, count);
      const rated = js.filter((j) => j.rated && j.ratedInSetup);
      return { jobs: [...rated, ...unrated].slice(0, count).map(slimJob), learned: describeLearning(store().get('learning')) };
    },
    'jobs.markSetupRated': ({ id: jid }) => { const j = jobById(jid); j.ratedInSetup = true; saveJob(j); return true; },

    // ----- tracker -----
    'tracker.list': () => ({ list: store().get('tracker').list, statuses: STATUSES, labels: STATUS_LABEL }),
    'tracker.add': ({ jobId }) => { const t = store().get('tracker'); const j = jobById(jobId); const r = addToTracker(t, j, { status: 'saved', fit: j.match }); store().set('tracker', t); return r; },
    'tracker.addManual': (f) => { const t = store().get('tracker'); const r = addToTracker(t, { ...f, source: 'manual' }, { status: f.status || 'applied' }); if (f.status === 'applied') setStatus(t, r.entry.id, 'applied'); store().set('tracker', t); return r; },
    'tracker.status': ({ id: tid, status, note }) => {
      const t = store().get('tracker'); const e = setStatus(t, tid, status, note); store().set('tracker', t);
      if (['applied', 'interviewing', 'offer'].includes(status)) { const l = store().get('learning'); recordEvent(l, { type: 'job', value: status === 'applied' ? 'applied' : 'interview', title: e.title, company: e.company }); store().set('learning', l); }
      return e;
    },
    'tracker.update': ({ id: tid, ...patch }) => store().update('tracker', (t) => { const e = t.list.find((x) => x.id === tid); if (e) for (const k of ['notes', 'salary', 'location', 'url']) if (k in patch) e[k] = patch[k]; }),
    'tracker.followUp': ({ id: tid, followId, done, due, note }) => store().update('tracker', (t) => { const e = t.list.find((x) => x.id === tid); if (!e) return; if (followId) { const f = e.followUps.find((x) => x.id === followId); if (f) f.done = done; } else e.followUps.push({ id: id('f_'), due, note: note || 'Follow up', done: false }); }),
    'tracker.remove': ({ id: tid }) => store().update('tracker', (t) => { t.list = t.list.filter((x) => x.id !== tid); }),
    'tracker.csv': () => toCsv(store().get('tracker')),

    // ----- documents -----
    'docs.make': ({ jobId }) => once(`docs:${jobId}`, async () => {
      const j = jobById(jobId);
      if (!j.description) throw new UserError("We need the job's description first. Paste it on the job page.");
      const s = store();
      const profile = s.get('profile'), want = s.get('want'), voice = s.get('voice'), design = s.get('design');
      if (!profile.roles.length) throw new UserError('Finish Your experience in setup first.');
      const c = claude();
      progress('docs', 'Checking the fit…');
      const match = j.match || await methods['jobs.explain']({ id: jobId });
      progress('docs', 'Tailoring your resume…');
      const resume = await ai.tailorResume(c, { profile, want, voice, job: j, match, edits: writingEdits(s.get('learning')), limits: { yearsBack: design.yearsBack } });
      progress('docs', 'Writing your cover letter…');
      const letter = await ai.writeLetter(c, { profile, voice, job: j, match, want });
      const version = s.get('documents').list.filter((d) => d.jobId === jobId && d.kind === 'resume').length + 1;
      const name = profile.contact?.name;
      const rdoc = { id: id('d_'), jobId, kind: 'resume', version, created: now().toISOString(), data: resume, cuts: [], file: fileName(name, 'Resume', j), checks: resume.checks, status: 'draft', company: j.company, title: j.title };
      const ldoc = { id: id('d_'), jobId, kind: 'letter', version, created: now().toISOString(), data: letter, file: fileName(name, 'Cover_Letter', j), checks: letter.checks, status: 'draft', company: j.company, title: j.title };
      s.update('documents', (d) => { d.list.unshift(rdoc, ldoc); });
      const t = s.get('tracker'); const { entry } = addToTracker(t, j, { status: 'ready', fit: match });
      entry.resumeDocId = rdoc.id; entry.letterDocId = ldoc.id; entry.resumeFile = rdoc.file + '.pdf'; entry.letterFile = ldoc.file + '.pdf';
      if (['found', 'saved', 'skipped'].includes(entry.status)) setStatus(t, entry.id, 'ready');
      s.set('tracker', t);
      return { resume: slimDoc(rdoc), letter: slimDoc(ldoc) };
    }),
    'docs.list': () => store().get('documents').list.map(slimDoc),
    'docs.get': ({ id: did }) => { const d = docById(did); return { ...d, html: renderDoc(d) }; },
    'docs.cutOnce': ({ id: did }) => { const d = docById(did); if (!d.original) d.original = structuredClone(d.data); const r = cutOnce(d.data, store().get('design')); if (!r) return { done: true }; d.data = r.resume; d.cuts = [...(d.cuts || []), r.cut]; saveDoc(d); return { done: false, cut: r.cut, html: renderDoc(d) }; },
    'docs.resetCuts': ({ id: did }) => { const d = docById(did); if (d.original) { d.data = structuredClone(d.original); d.cuts = []; saveDoc(d); } return { html: renderDoc(d) }; },
    'docs.editLine': ({ id: did, path: p, text }) => {
      const d = docById(did);
      if (!d.original) d.original = structuredClone(d.data);
      let before = '', bulletId = null;
      if (d.kind === 'resume') {
        if (p === 'summary') { before = d.data.summary; d.data.summary = text; }
        else { const [ri, bi] = p.split('.').map(Number); const b = d.data.roles[ri]?.bullets[bi]; if (!b) throw new UserError('Line not found.'); before = b.text; b.text = text; bulletId = b.from; }
      } else { const i = Number(p); before = d.data.paragraphs[i]; d.data.paragraphs[i] = text; }
      d.edited = true; saveDoc(d);
      const l = store().get('learning'); learnFromEdit(l, { before, after: text, docType: d.kind, bulletId }); store().set('learning', l);
      return { html: renderDoc(d), offerProfile: d.kind === 'resume' && bulletId ? { bulletId, text } : null };
    },
    'docs.check': ({ id: did, extracted, pages }) => {
      const d = docById(did);
      const result = d.kind === 'resume' ? readableCheck(extracted, expectedText(d.data)) : { ok: true, missing: [] };
      d.readable = result.ok; d.pages = pages; saveDoc(d);
      return result;
    },
    'docs.text': ({ id: did }) => { const d = docById(did); const j = store().get('jobs').list.find((x) => x.id === d.jobId); return d.kind === 'resume' ? resumeText(d.data) : letterText(d.data, j); },
    'docs.approve': ({ id: did }) => { const d = docById(did); d.status = 'final'; saveDoc(d); return slimDoc(d); },
    'docs.pdfSaved': ({ id: did, file }) => { const d = docById(did); d.pdfPath = file; d.status = d.status === 'draft' ? 'final' : d.status; saveDoc(d); return slimDoc(d); },
    'docs.limits': () => { const d = store().get('design'); return { maxPages: maxPages(d), page: pageSize(d) }; },

    // ----- morning batch -----
    'batch.run': ({ reason = 'manual' } = {}) => once('batch', async () => {
      const s = store(), settings = s.get('settings');
      const log = [];
      try { const r = await methods['jobs.refresh'](); log.push(`Checked job sites: ${r.kept} matches, ${r.hidden} hidden.`); } catch (e) { log.push(e.message); }
      const tracker = s.get('tracker');
      const docsFor = new Set(s.get('documents').list.map((d) => d.jobId));
      const all = s.get('jobs').list.filter((j) => !j.hiddenBecause && j.description && !docsFor.has(j.id));
      // Jobs you said yes or maybe to come first, then the best new matches.
      const saved = all.filter((j) => ['yes', 'maybe'].includes(j.rated) && ['saved', 'found'].includes(findDuplicate(tracker, j)?.status));
      const best = all.filter((j) => !j.rated && !findDuplicate(tracker, j) && j.score >= 40);
      const fresh = [...saved, ...best].slice(0, settings.morningCount || 3);
      for (const j of fresh) {
        try { await methods['docs.make']({ jobId: j.id }); log.push(`Ready: ${j.title} at ${j.company}.`); } catch (e) { log.push(`${j.title} at ${j.company}: ${e.message}`); }
      }
      s.update('settings', (x) => { x.lastBatch = { at: now().toISOString(), reason, log, made: fresh.length }; });
      onEvent({ type: 'batch', log });
      return { log, made: fresh.length };
    }),

    // ----- interviews -----
    'interviews.list': () => store().get('interviews').list.sort((a, b) => String(a.start).localeCompare(String(b.start))),
    'interviews.add': (f) => { const rec = { id: id('i_'), created: now().toISOString(), notes: '', cheat: null, ...f }; store().update('interviews', (x) => { x.list.push(rec); }); if (f.trackerId) methods['tracker.status']({ id: f.trackerId, status: 'interviewing', note: f.round || 'Interview' }); return rec; },
    'interviews.update': ({ id: iid, ...patch }) => store().update('interviews', (x) => { const i = x.list.find((y) => y.id === iid); if (i) Object.assign(i, patch); }),
    'interviews.remove': ({ id: iid }) => store().update('interviews', (x) => { x.list = x.list.filter((y) => y.id !== iid); }),
    'interviews.fromIcs': ({ text }) => {
      const events = parseIcs(text);
      if (!events.length) throw new UserError("We couldn't find an event in that file.");
      const t = store().get('tracker');
      return events.map((ev) => {
        const hay = `${ev.title} ${ev.description} ${ev.organizer}`.toLowerCase();
        const match = t.list.find((e) => hay.includes(String(e.company).toLowerCase()));
        return methods['interviews.add']({ start: ev.start, end: ev.end, title: ev.title, location: ev.location, with: ev.organizer, details: ev.description, trackerId: match?.id || null, company: match?.company || '', role: match?.title || '' });
      });
    },
    'interviews.cheat': ({ id: iid }) => once(`cheat:${iid}`, async () => {
      const s = store();
      const iv = s.get('interviews').list.find((x) => x.id === iid);
      if (!iv) throw new UserError('Interview not found.');
      const entry = s.get('tracker').list.find((t) => t.id === iv.trackerId);
      const job = (entry && s.get('jobs').list.find((j) => j.id === entry.jobId || (j.company === entry.company && j.title === entry.title))) || { title: iv.role || entry?.title || '', company: iv.company || entry?.company || '', description: iv.jobText || '', url: entry?.url || '' };
      progress('cheat', `Reading about ${job.company}…`);
      const research = await researchCompany(job.url || '', job.company, { fetchImpl });
      progress('cheat', 'Writing your cheat sheet…');
      const cheat = await ai.cheatSheet(claude(), { profile: s.get('profile'), job, interview: { round: iv.round, with: iv.with, format: iv.format, start: iv.start }, research: research.text, voice: s.get('voice') });
      cheat.researchNote = research.note; cheat.at = now().toISOString();
      s.update('interviews', (x) => { const i = x.list.find((y) => y.id === iid); i.cheat = cheat; });
      return cheat;
    }),
    'interviews.forJob': ({ jobId }) => {
      const j = jobById(jobId); const t = store().get('tracker');
      let { entry } = addToTracker(t, j, { status: 'interviewing', fit: j.match }); store().set('tracker', t);
      const existing = store().get('interviews').list.find((i) => i.trackerId === entry.id);
      return existing || methods['interviews.add']({ trackerId: entry.id, company: j.company, role: j.title, start: null, round: 'Interview' });
    },

    // ----- chat -----
    'chat.history': () => store().get('chat').messages.slice(-60),
    'chat.send': async ({ text, jobId }) => {
      const s = store();
      s.update('chat', (c) => { c.messages.push({ id: id('c_'), role: 'user', text, at: now().toISOString(), jobId: jobId || null }); });
      const msgs = s.get('chat').messages.filter((m) => (jobId ? m.jobId === jobId : !m.jobId));
      const help = searchHelp(text).filter((a) => a.score >= 4).slice(0, 2).map((a) => ARTICLES.find((x) => x.id === a.id));
      const job = jobId ? jobById(jobId) : null;
      const out = await ai.chat(claude(), { messages: msgs, profile: s.get('profile'), want: s.get('want'), job, rules: s.get('learning').rules, help });
      const reply = { id: id('c_'), role: 'assistant', text: out.reply || '…', proposals: (out.proposals || []).map((p) => ({ ...p, id: id('p_'), status: 'open' })), at: now().toISOString(), jobId: jobId || null, helpLinks: help.filter(Boolean).map((a) => ({ id: a.id, title: a.title })) };
      s.update('chat', (c) => { c.messages.push(reply); c.messages = c.messages.slice(-400); });
      return reply;
    },
    'chat.decide': ({ messageId, proposalId, accept, text }) => {
      const s = store(); let proposal;
      s.update('chat', (c) => { const m = c.messages.find((x) => x.id === messageId); proposal = m?.proposals?.find((p) => p.id === proposalId); if (proposal) proposal.status = accept ? 'accepted' : 'declined'; });
      if (!proposal || !accept) return { ok: true };
      if (proposal.type === 'add_bullet') { const p = s.get('profile'); addBullet(p, proposal.company, text || proposal.text, 'chat'); s.set('profile', p); }
      if (proposal.type === 'rule') s.update('learning', (l) => { l.rules.push({ id: id('rule_'), active: true, source: 'you', kind: 'note', pattern: '', text: text || proposal.text, created: now().toISOString() }); });
      return { ok: true };
    },

    // ----- learning -----
    'learning.get': () => { const l = store().get('learning'); return { rules: l.rules, summary: learningSummary(l), lastReview: l.lastReview, edits: writingEdits(l).slice(-10).reverse() }; },
    'learning.toggle': ({ id: rid, active }) => store().update('learning', (l) => { const r = l.rules.find((x) => x.id === rid); if (r) r.active = active; }) && rerank(null),
    'learning.remove': ({ id: rid }) => store().update('learning', (l) => { l.rules = l.rules.filter((x) => x.id !== rid); }) && rerank(null),
    'learning.add': ({ text }) => store().update('learning', (l) => { l.rules.push({ id: id('rule_'), active: true, source: 'you', kind: 'note', pattern: '', text, created: now().toISOString() }); }),
    'learning.review': async () => { const s = store(); const l = s.get('learning'); const out = await ai.summarizeLearning(claude(), { events: l.events, rules: l.rules, want: s.get('want') }); const added = mergeRules(l, out.rules); s.set('learning', l); rerank(null); return { added }; },

    // ----- help -----
    'help.search': ({ q }) => searchHelp(q),
    'help.get': ({ id: aid }) => ARTICLES.find((a) => a.id === aid) || null,

    // ----- browser extension -----
    'ext.token': ({ reset } = {}) => { let tok; store().update('settings', (s) => { if (!s.extensionToken || reset) s.extensionToken = crypto.randomBytes(16).toString('hex'); tok = s.extensionToken; }); return tok; },
    'ext.fill': ({ url }) => {
      const s = store(); const p = s.get('profile'); const answers = methods['answers.get']();
      const [first, ...rest] = String(p.contact?.name || '').split(/\s+/);
      const t = s.get('tracker');
      const host = (() => { try { return new URL(url).hostname; } catch { return ''; } })();
      const entry = t.list.find((e) => e.url && url && (url.startsWith(e.url) || e.url.startsWith(url))) || t.list.find((e) => e.url && host && e.url.includes(host) && ['ready', 'saved'].includes(e.status));
      const docs = s.get('documents').list;
      const resume = entry?.resumeDocId ? docs.find((d) => d.id === entry.resumeDocId) : null;
      const letter = entry?.letterDocId ? docs.find((d) => d.id === entry.letterDocId) : null;
      const current = p.roles[0];
      return {
        fields: { firstName: first || '', lastName: rest.join(' '), fullName: p.contact?.name || '', email: p.contact?.email || '', phone: p.contact?.phone || '', location: p.contact?.location || '', linkedin: p.contact?.linkedin || '', website: p.contact?.website || '', currentCompany: current?.company || '', currentTitle: current?.title || '' },
        answers: answers.filter((a) => a.answer).map((a) => ({ key: a.key, question: a.question, answer: a.answer })),
        job: entry ? { company: entry.company, title: entry.title, trackerId: entry.id } : null,
        resume: resume ? { file: resume.file + '.pdf', pdfBase64: readIfExists(resume.pdfPath), text: resumeText(resume.data) } : null,
        letter: letter ? { file: letter.file + '.pdf', pdfBase64: readIfExists(letter.pdfPath), text: letterText(letter.data) } : null,
      };
    },
    'ext.answer': async ({ question, url }) => {
      const s = store();
      const saved = methods['answers.get']().filter((a) => a.answer);
      const hit = saved.find((a) => similar(a.question, question, 0.6));
      if (hit) return { needsYou: false, answer: hit.answer, saved: true };
      const fill = methods['ext.fill']({ url });
      const job = fill.job ? s.get('jobs').list.find((j) => j.company === fill.job.company && j.title === fill.job.title) : null;
      return ai.draftAnswer(claude(), { question, profile: s.get('profile'), voice: s.get('voice'), job, answers: saved });
    },
    'ext.submitted': ({ trackerId }) => trackerId ? methods['tracker.status']({ id: trackerId, status: 'applied', note: 'Filled with the extension' }) : null,
  };

  function rerank(fresh, report) {
    const s = store();
    const js = s.get('jobs');
    const old = new Map(js.list.map((j) => [j.id, j]));
    let all = fresh ? fresh.map((j) => ({ ...(old.get(j.id) || {}), ...j, firstSeen: old.get(j.id)?.firstSeen || now().toISOString() })) : js.list;
    if (fresh) for (const j of js.list) if (!all.some((x) => x.id === j.id) && (j.rated || j.addedBy || j.fromAlert)) all.push(j);
    all = all.map(({ hiddenBecause, score, scoreReasons, ...j }) => j);
    const { kept, hidden } = rankJobs(all, s.get('want'), s.get('learning'));
    const list = [...kept, ...hidden].slice(0, 800);
    s.set('jobs', { list, lastFetch: fresh ? now().toISOString() : js.lastFetch, report: report || js.report });
    // jobs that disappeared from a live list close in the tracker
    if (fresh) s.update('tracker', (t) => { for (const e of t.list) if (e.jobId && ['found', 'saved', 'ready'].includes(e.status) && old.has(e.jobId) && !list.some((j) => j.id === e.jobId) && !String(e.jobId).startsWith('manual') && !String(e.jobId).startsWith('alert')) { e.status = 'closed'; e.history.push({ at: now().toISOString(), status: 'closed', note: 'No longer on the company’s list' }); } });
    return { kept: kept.length, hidden: hidden.length, report: report || js.report };
  }

  const docById = (did) => { const d = store().get('documents').list.find((x) => x.id === did); if (!d) throw new UserError('Document not found.'); return d; };
  const saveDoc = (d) => store().update('documents', (x) => { const i = x.list.findIndex((y) => y.id === d.id); if (i >= 0) x.list[i] = d; });
  const renderDoc = (d) => {
    const design = store().get('design');
    if (d.kind === 'resume') return resumeHtml(d.data, design);
    const job = store().get('jobs').list.find((j) => j.id === d.jobId) || { company: d.company, title: d.title };
    return letterHtml(d.data, store().get('profile').contact, design, job, { date: new Date(d.created) });
  };

  async function call(method, args = {}) {
    const fn = methods[method];
    if (!fn) throw new UserError(`Unknown action: ${method}`);
    return fn(args || {});
  }
  return { call, methods, get session() { return session; }, store };
}

export class UserError extends Error { constructor(m) { super(m); this.name = 'UserError'; } }

function slimJob(j) {
  return { id: j.id, title: j.title, company: j.company, location: j.location, url: j.url, source: j.source, postedAt: j.postedAt, ageDays: j.ageDays, freshness: j.freshness, score: j.score, bucket: j.score != null ? bucket(j.score) : null, scoreReasons: j.scoreReasons, hiddenBecause: j.hiddenBecause, pay: j.pay ? payLabel(j.pay) : '', rated: j.rated || null, ratedReasons: j.ratedReasons || [], verdict: j.match?.verdict || null, why: j.match?.why || '', needsText: j.needsText || !j.description, fromAlert: j.fromAlert || null, snippet: String(j.description || '').slice(0, 280) };
}
function slimDoc(d) { return { id: d.id, jobId: d.jobId, kind: d.kind, version: d.version, created: d.created, file: d.file, checks: d.checks, status: d.status, company: d.company, title: d.title, cuts: d.cuts || [], readable: d.readable ?? null, pages: d.pages ?? null, edited: Boolean(d.edited), pdfPath: d.pdfPath || null }; }

function readIfExists(file) {
  try { return file && fs.existsSync(file) ? fs.readFileSync(file).toString('base64') : null; } catch { return null; }
}

function describeLearning(l) {
  return l.rules.filter((r) => r.active !== false).slice(-5).map((r) => r.text);
}

function SAMPLE_RESUME(contact) {
  return {
    contact: { name: contact?.name || 'Your Name', email: contact?.email || 'you@email.com', location: 'Your City, ST' },
    summary: 'This is a preview with sample text. Your real resume uses your profile.',
    roles: [
      { title: 'Your Current Title', company: 'Current Employer', start: '2021', end: 'present', bullets: [{ text: 'Your strongest result for the job will go here.' }, { text: 'Another result that matches what the job needs.' }, { text: 'A third line showing a tool or skill they asked for.' }] },
      { title: 'Earlier Title', company: 'Earlier Employer', start: '2017', end: '2021', bullets: [{ text: 'A result from this role.' }, { text: 'Another result from this role.' }] },
    ],
    skills: ['Skill one', 'Skill two', 'Skill three', 'Skill four'],
    education: [{ degree: 'Your Degree', field: 'Field', school: 'Your School', year: '2012' }],
  };
}
