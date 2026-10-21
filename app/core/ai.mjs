// Every job Claude does inside Job Wizard. Each one:
//  - gets only the facts it needs,
//  - must answer in a fixed JSON shape,
//  - is checked afterwards in code (see verify* functions) before anything is saved or shown.

import { fileBlock } from './claude.mjs';

const TRUTH = `Truth rules (never break these):
- Use only facts found in the person's own materials or approved profile. Never invent employers, titles, dates, numbers, skills, tools, degrees or results.
- Rewording, reordering and choosing what to emphasize is fine. Stretching the truth is not.
- If something would help but isn't in the materials, ask about it instead of writing it.
- Job postings the person wants are NOT their experience. Personality test results are NOT experience.`;

const STYLE = `Writing style: plain, warm, specific. Short sentences. No buzzwords ("passionate", "synergy", "leverage", "rockstar", "results-driven", "dynamic"). No em dashes.`;

// ---------- Materials ----------

export async function readMaterial(claude, file) {
  const system = `You sort files someone uploaded to set up their job search. Be quick: look, decide, summarize.
${TRUTH}
Decide what the file is:
- "resume": a resume or CV (any age)
- "linkedin": a LinkedIn profile PDF, LinkedIn data export, or screenshots of LinkedIn
- "review": a performance review, feedback, award or recommendation
- "portfolio": work samples, case studies, project write-ups
- "writing": something they wrote (cover letter, email, post) that shows how they write
- "personality": a personality or strengths test (CliftonStrengths, Myers-Briggs, DISC, Enneagram...)
- "job_posting": a job description for a role they might want (NOT their experience)
- "other"
Only for "job_posting" or "writing", also copy out the full text faithfully in "text". For every other kind, leave "text" empty: the file itself is read later.
Shape: {"kind": string, "summary": "one short sentence for the person, e.g. 'Your 2024 resume, 3 roles'", "text": "", "jobPosting": {"title": string, "company": string} | null}`;
  // Text we already have only needs its start to be sorted.
  const block = file.text != null && !file.base64 ? { type: 'text', text: `File: ${file.name}\n\n${String(file.text).slice(0, 4000)}` } : fileBlock(file);
  let out = await claude.json({ system, content: [block, { type: 'text', text: `File name: ${file.name}` }], maxTokens: 300, fast: true });
  const kinds = ['resume', 'linkedin', 'review', 'portfolio', 'writing', 'personality', 'job_posting', 'other'];
  if (!kinds.includes(out.kind)) out.kind = 'other';
  if ((out.kind === 'job_posting' || out.kind === 'writing') && file.text == null) {
    // Need the words for these two: copy them out (only these).
    const full = await claude.json({ system: `Copy out all the text of this file faithfully, keeping line breaks.\nShape: {"text": string}`, content: [fileBlock(file)], maxTokens: 6000, fast: true });
    out.text = full.text || '';
  }
  out.text = String(file.text ?? out.text ?? '');
  return out;
}

// ---------- Profile ----------

export async function buildProfile(claude, materials, current) {
  const usable = materials.filter((m) => ['resume', 'linkedin', 'review', 'portfolio', 'other'].includes(m.kind) && (m.text || m.raw));
  const system = `You combine someone's resumes, LinkedIn and other files into one accurate work history.
${TRUTH}
Rules:
- Each source is labeled with an id like [m_ab12]. Every role, bullet and skill lists the ids it came from in "sources".
- Merge the same role found in several files into one. Keep the clearest wording of each bullet; merge near-duplicates.
- When files disagree about a fact (start/end date, title, company name), add a "conflict" with each version and its source. Use the resume's version in the role for now.
- A result or accomplishment that appears in a review, LinkedIn, an older resume or portfolio but NOT in the newest resume goes in "underselling" (one sentence, their words, with source). Do not also put it in the role's bullets.
- Dates as "YYYY-MM" or "YYYY"; end "present" if current.
Shape: {
 "contact": {"name","email","phone","location","linkedin","website"},
 "summary": "2 sentences from their own materials, or empty",
 "roles": [{"company","title","start","end","location","sources":[],"bullets":[{"text","sources":[]}]}],
 "education": [{"school","degree","field","year","sources":[]}],
 "certifications": [{"name","year","sources":[]}],
 "skills": [{"name","sources":[]}],
 "conflicts": [{"label":"e.g. Start date at Meridian Parks Foundation","company","field":"start|end|title|company","options":[{"value","source"}]}],
 "underselling": [{"text","company","source"}]
}`;
  // Each file goes in as itself: PDFs and screenshots as documents, the rest as text.
  const content = usable.flatMap((m) => [
    { type: 'text', text: `----- [${m.id}] ${m.name} (${m.kind}) -----` },
    m.raw ? fileBlock({ name: m.name, mime: m.mime, base64: m.raw }) : { type: 'text', text: m.text },
  ]);
  if (current?.roles?.length) content.push({ type: 'text', text: `The person already approved this profile; keep their approved wording and choices unless a new file adds to it:\n${JSON.stringify(slimProfile(current))}` });
  return claude.json({ system, content, maxTokens: 12000, temperature: 0 });
}

export function slimProfile(p) {
  return {
    contact: p.contact, summary: p.summary,
    roles: (p.roles || []).map((r) => ({ id: r.id, company: r.company, title: r.title, start: r.start, end: r.end, location: r.location, bullets: (r.bullets || []).map((b) => ({ id: b.id, text: b.text })) })),
    education: p.education, certifications: p.certifications, skills: (p.skills || []).map((s) => s.name),
  };
}

// ---------- Voice ----------

export async function voiceGuide(claude, { samples, dials, never, profile, edits = [] }) {
  const system = `You describe how a person writes so cover letters and answers sound like them on a good day.
${TRUTH}
Dials are 0 to 4: formal(0)↔relaxed(4), short(0)↔detailed(4), modest(0)↔confident(4), plain(0)↔colorful(4).
Also write ONE sample sentence, first person, about a real result from their profile, in their voice.
Shape: {"guide": ["6 to 10 short rules about their voice"], "sampleLine": string, "sampleFrom": "bullet id used"}`;
  const content = `Dials: ${JSON.stringify(dials)}
Words they never use: ${never.join(', ') || 'none'}
Their writing:
${samples.map((s) => `---\n${s.text.slice(0, 4000)}`).join('\n')}
Edits they made to our drafts (before → after):
${edits.slice(-10).map((e) => `- "${e.before}" → "${e.after}"`).join('\n') || 'none yet'}
Profile bullets:
${(profile.roles || []).flatMap((r) => (r.bullets || []).map((b) => `[${b.id}] ${r.company}: ${b.text}`)).join('\n')}`;
  return claude.json({ system, content, maxTokens: 1500 });
}

// ---------- What you want ----------

export async function understandWants(claude, { examples, profile, titles }) {
  const system = `You help someone describe the jobs they should go after, from three kinds of real postings:
- "interviewed": jobs that recently got them an interview. Strongest signal: employers already said yes to this match.
- "fit": jobs they feel suit their background.
- "reach": a stretch they'd love. It shows direction, not the center of the search.
These postings are what they WANT or were considered for, never their experience.
Find what the interviewed and fit postings have in common: the day-to-day work, kind of employer, level, pay, location.
Say in one plain sentence what the reach adds (more senior? new field?).
Suggest up to 5 other job titles that describe the same work AND fit their real experience.
List words in these postings that can mean very different jobs (e.g. "development" = fundraising or software; "producer" = web, audio or video; "coordinator" = admin or program) with the meanings.
Pick 10 to 20 keywords that signal the right job.
Shape: {"summary": "one or two sentences: 'Your sweet spot: ...'", "reach": "one sentence or empty", "titles": ["the titles of the interviewed and fit postings, cleaned up"], "suggestedTitles": [string], "ambiguous": [{"word": string, "meanings": [string]}], "keywords": [string], "level": "mid|senior|lead|manager|unclear", "payRange": "e.g. $85k to $105k or empty", "employerTypes": ["Nonprofit|Public media|Health|Education|Government|Tech company|Agency|Finance that appear in interviewed or fit postings"]}`;
  const content = `Titles they already picked: ${titles.join(', ') || 'none'}
Their roles: ${(profile.roles || []).map((r) => `${r.title} at ${r.company}`).join('; ')}
Postings:
${examples.map((e, i) => `#${i + 1} [${e.kind || 'fit'}] ${e.title || ''} ${e.company || ''}\n${String(e.text || '').slice(0, 5000)}`).join('\n\n')}`;
  return claude.json({ system, content, maxTokens: 2000 });
}

// ---------- Matching ----------

export async function explainMatch(claude, { profile, want, job, rules }) {
  const system = `You judge whether a job fits a person, using only their real profile and what they told us they want. Be honest; a weak match is useful information.
${TRUTH}
Steps:
1. List the job's must-haves (max 7) and, for each, the profile bullet id that best shows it, or null. fit = "direct" (clearly done it), "related" (similar, transferable) or "gap".
2. qualified: true if most must-haves are direct or related.
3. direction: is the day-to-day work what they want? "core", "adjacent" or "off".
4. mission: does the employer type match what they love/avoid? "love", "fine", "avoid" or "neutral".
5. practical: pay, location, job type against their must-haves. ok true/false and a short note.
6. verdict: "strong", "good", "stretch" or "skip". why: 1 or 2 plain sentences for the person.
7. gapQuestions: up to 2 questions to ask them about gaps that they might actually have done (never assume they have).
Shape: {"mustHaves":[{"want","bulletId","fit"}], "qualified":{"ok":bool,"note"}, "direction":{"label","note"}, "mission":{"label","note"}, "practical":{"ok":bool,"note"}, "verdict", "why", "gapQuestions":[string]}`;
  const content = `What they want: ${JSON.stringify(slimWant(want))}
Learned preferences: ${(rules || []).map((r) => r.text).join(' | ') || 'none yet'}
Profile: ${JSON.stringify(slimProfile(profile))}
Job: ${job.title} at ${job.company} (${job.location || 'location not listed'})
${String(job.description || '').slice(0, 9000)}`;
  const out = await claude.json({ system, content, maxTokens: 2500, temperature: 0.1 });
  const ids = new Set(allBullets(profile).map((b) => b.id));
  out.mustHaves = (out.mustHaves || []).map((m) => ({ ...m, bulletId: ids.has(m.bulletId) ? m.bulletId : null, fit: m.bulletId && ids.has(m.bulletId) ? m.fit : 'gap' }));
  return out;
}

export function slimWant(w) {
  return { titles: w.titles, work: w.work, places: w.places, payFloor: w.payFloor, where: w.where, level: w.level, jobType: w.jobType, dealBreakers: w.dealBreakers, summary: w.summary, ambiguous: w.ambiguous };
}

export function allBullets(profile) {
  return (profile.roles || []).flatMap((r) => (r.bullets || []).map((b) => ({ ...b, roleId: r.id, company: r.company })));
}

// ---------- Resume ----------

export async function tailorResume(claude, { profile, want, voice, job, match, edits = [], limits }) {
  const system = `You tailor a resume for one job. You may only choose, reorder and reword the person's existing bullets.
${TRUTH}
${STYLE}
Rules:
- Every bullet you write names the profile bullet it came from ("from"). Keep every number, name and tool exactly as in the source. Do not add numbers.
- Job titles, company names and dates are copied exactly. Never change a title.
- Lead each role with the bullets that matter most for this job. Use the job's words only where the source bullet supports them.
- Include roles from the last ${limits.yearsBack} years. Current role: 3 to 6 bullets. Older roles: 1 to 4.
- Summary: 2 sentences, built only from the profile.
- Skills: up to 12, only from the profile's skills, most relevant first.
- Follow the person's past edits (they show what they like).
Shape: {"summary": string, "roles": [{"roleId": string, "bullets": [{"from": "bullet id", "text": string, "relevance": 1-5}]}], "skills": [string], "keywordsUsed": [string]}`;
  const content = `Job: ${job.title} at ${job.company}
${String(job.description || '').slice(0, 8000)}
Match notes: ${JSON.stringify(match || {})}
Voice: ${(voice.guide || []).join(' ')}
Words never to use: ${(voice.never || []).join(', ')}
Past edits (before → after): ${edits.slice(-12).map((e) => `"${e.before}" → "${e.after}"`).join(' | ') || 'none'}
Profile: ${JSON.stringify(slimProfile(profile))}`;
  const draft = await claude.json({ system, content, maxTokens: 5000, temperature: 0.2 });
  return verifyResume(draft, profile, voice);
}

const NUM = /\$?\d[\d,.]*\s*(?:%|k|m|x|\+)?/gi;
const nums = (s) => (String(s).match(NUM) || []).map((n) => n.replace(/[\s,]/g, '').toLowerCase());

/** Code check after Claude: drop anything not traceable to the profile. */
export function verifyResume(draft, profile, voice = {}) {
  const byId = new Map(allBullets(profile).map((b) => [b.id, b]));
  const roles = new Map((profile.roles || []).map((r) => [r.id, r]));
  const notes = [];
  const never = (voice.never || []).map((w) => w.toLowerCase());
  const outRoles = [];
  for (const r of draft.roles || []) {
    const role = roles.get(r.roleId);
    if (!role) { notes.push(`Dropped a role we couldn't find in your profile.`); continue; }
    const bullets = [];
    for (const b of r.bullets || []) {
      const src = byId.get(b.from);
      if (!src) { notes.push(`Dropped a line with no source: "${trim(b.text)}"`); continue; }
      let text = String(b.text || '').trim();
      const srcNums = new Set(nums(src.text));
      const extra = nums(text).filter((n) => !srcNums.has(n));
      if (extra.length) { notes.push(`Used your original wording because a number didn't match: "${trim(src.text)}"`); text = src.text; }
      const bad = never.find((w) => text.toLowerCase().includes(w));
      if (bad) { notes.push(`Used your original wording to avoid "${bad}".`); text = src.text; }
      text = text.replace(/\s*[—–]\s*/g, ', ');
      bullets.push({ from: b.from, text, relevance: Number(b.relevance) || 3 });
    }
    outRoles.push({ roleId: role.id, company: role.company, title: role.title, start: role.start, end: role.end, location: role.location, bullets });
  }
  // keep the person's role order (most recent first)
  const order = (profile.roles || []).map((r) => r.id);
  outRoles.sort((a, b) => order.indexOf(a.roleId) - order.indexOf(b.roleId));
  const skillNames = new Set((profile.skills || []).map((s) => s.name.toLowerCase()));
  const skills = (draft.skills || []).filter((s) => skillNames.has(String(s).toLowerCase()));
  if ((draft.skills || []).length !== skills.length) notes.push('Left out skills that aren’t in your profile.');
  const summaryNums = nums(draft.summary).filter((n) => !allBullets(profile).some((b) => nums(b.text).includes(n)));
  const summary = summaryNums.length ? (profile.summary || '') : String(draft.summary || '').replace(/\s*[—–]\s*/g, ', ');
  return { contact: profile.contact, summary, roles: outRoles, skills, education: profile.education || [], certifications: profile.certifications || [], keywordsUsed: draft.keywordsUsed || [], checks: notes };
}

const trim = (s) => (String(s).length > 70 ? String(s).slice(0, 67) + '…' : String(s));

// ---------- Cover letter ----------

export async function writeLetter(claude, { profile, voice, job, match, want }) {
  const system = `You write a cover letter in the person's own voice for one job.
${TRUTH}
${STYLE}
Rules:
- 220 to 320 words, 3 or 4 paragraphs. Open with something specific about this role or company from the posting, not "I am writing to apply".
- Use 2 or 3 real results from the profile; for each, name the bullet id you used in "factsUsed".
- Every number must appear in a bullet you list in factsUsed.
- Follow the voice guide. Never use the words they never use.
- Close plainly. No "I look forward to hearing from you at your earliest convenience".
Shape: {"greeting": "Dear Hiring Team,", "paragraphs": [string], "closing": "Thank you,", "factsUsed": [string]}`;
  const content = `Job: ${job.title} at ${job.company}
${String(job.description || '').slice(0, 7000)}
Why it fits: ${match?.why || ''}
Voice guide: ${(voice.guide || []).join(' ')}
Never use: ${(voice.never || []).join(', ')}
Lines they approved as sounding like them: ${(voice.approvedLines || []).slice(-5).join(' | ')}
What they want: ${want?.summary || ''}
Profile: ${JSON.stringify(slimProfile(profile))}`;
  const draft = await claude.json({ system, content, maxTokens: 2500, temperature: 0.5 });
  return verifyLetter(draft, profile, voice);
}

export function verifyLetter(draft, profile, voice = {}) {
  const bullets = allBullets(profile);
  const used = (draft.factsUsed || []).map((id) => bullets.find((b) => b.id === id)).filter(Boolean);
  const allowed = new Set([...used, ...bullets].flatMap((b) => nums(b.text)));
  const checks = [];
  const never = (voice.never || []).map((w) => w.toLowerCase());
  const paragraphs = (draft.paragraphs || []).map((p) => String(p).replace(/\s*[—–]\s*/g, ', '));
  for (const p of paragraphs) {
    for (const n of nums(p)) if (!allowed.has(n) && !/^20\d\d$/.test(n)) checks.push(`Check this number: "${n}" isn't in your profile.`);
    for (const w of never) if (p.toLowerCase().includes(w)) checks.push(`Uses "${w}", which you never say.`);
  }
  const words = paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
  return { greeting: draft.greeting || 'Dear Hiring Team,', paragraphs, closing: draft.closing || 'Thank you,', name: profile.contact?.name || '', factsUsed: used.map((b) => b.id), words, checks, ok: checks.length === 0 };
}

// ---------- Interview cheat sheet ----------

export async function cheatSheet(claude, { profile, job, interview, research, voice }) {
  const system = `You make a one-screen interview cheat sheet.
${TRUTH}
Company facts may only come from the research text or the job posting given. If unsure, leave it out.
Answers to likely questions use the person's real results (name bullet ids in "from").
Shape: {
 "company": {"about": "2 sentences", "recent": ["up to 3 recent things from the research"], "values": ["up to 3"]},
 "role": {"focus": "what this job is really about, 1 sentence", "theyNeed": ["up to 4"]},
 "pitch": "a 3 sentence 'tell me about yourself' in their voice",
 "questions": [{"q": string, "answer": "short outline in their voice", "from": ["bullet id"]}],
 "askThem": ["4 good questions to ask"],
 "watchOuts": ["gaps or tricky spots and how to handle them honestly"]
}`;
  const content = `Interview: ${JSON.stringify(interview || {})}
Job: ${job.title} at ${job.company}
${String(job.description || '').slice(0, 7000)}
Research (from the company's own pages):
${String(research || 'none').slice(0, 8000)}
Voice: ${(voice?.guide || []).join(' ')}
Profile: ${JSON.stringify(slimProfile(profile))}`;
  const out = await claude.json({ system, content, maxTokens: 4000, temperature: 0.3 });
  const ids = new Set(allBullets(profile).map((b) => b.id));
  out.questions = (out.questions || []).map((q) => ({ ...q, from: (q.from || []).filter((id) => ids.has(id)) }));
  return out;
}

// ---------- Chat ----------

export async function chat(claude, { messages, profile, want, job, rules, help = [] }) {
  const system = `You are the Job Wizard helper: kind, calm, practical, a little playful. You help with a job search.
${TRUTH}
You can see the person's profile and what they want. When they tell you something new about their experience, offer to add it: put it in "proposals" as {"type":"add_bullet","company": string,"text": string} written in their words. Never add it yourself.
When they tell you a preference about jobs ("no more agency jobs", "I'd move to Denver"), add {"type":"rule","text": "plain rule"} to proposals.
Ask at most one question at a time. Keep replies short.
Shape: {"reply": string, "proposals": [ ... ]}`;
  const context = `Profile: ${JSON.stringify(slimProfile(profile))}
Wants: ${JSON.stringify(slimWant(want))}
Learned: ${(rules || []).map((r) => r.text).join(' | ')}
Help articles that may answer app questions (use these for how-to questions; mention the article title):
${help.filter(Boolean).map((a) => `## ${a.title}\n${a.body}`).join('\n\n') || 'none'}
${job ? `Looking at job: ${job.title} at ${job.company}\n${String(job.description || '').slice(0, 4000)}` : ''}`;
  const convo = [{ role: 'user', content: `[Context for you, not from the person]\n${context}` }, { role: 'assistant', content: '{"reply":"Got it.","proposals":[]}' },
    ...messages.slice(-16).map((m) => ({ role: m.role, content: m.text }))];
  return claude.json({ system, content: convo, maxTokens: 1500, temperature: 0.5 });
}

// ---------- Learning ----------

export async function summarizeLearning(claude, { events, rules, want }) {
  const system = `You look at how someone reacted to jobs and drafts and write short, plain preference rules.
Only write a rule if at least two events support it. Each rule says what changes: "We'll hide...", "We'll rank ... higher", "We'll write ... ".
Shape: {"rules": [{"text": string, "kind": "hide|boost|writing", "pattern": "a word or short phrase to look for, lowercase, or empty", "evidence": number}]}`;
  const content = `What they want: ${JSON.stringify(slimWant(want))}
Current rules: ${rules.map((r) => r.text).join(' | ') || 'none'}
Events: ${JSON.stringify(events.slice(-80))}`;
  return claude.json({ system, content, maxTokens: 1500, fast: true });
}

// ---------- Application form answers ----------

export async function draftAnswer(claude, { question, profile, voice, job, answers }) {
  const system = `You draft an answer to one job application question, in the person's voice.
${TRUTH}
${STYLE}
If the question is about salary, why they're leaving, relocation, visa, disability, veteran status, demographics, or anything personal and they have no saved answer, do NOT answer: return {"needsYou": true, "why": "..."}.
Shape: {"needsYou": false, "answer": string, "from": ["bullet id"]} or {"needsYou": true, "why": string}`;
  const content = `Question: ${question}
Saved answers they approved: ${answers.map((a) => `Q: ${a.question} A: ${a.answer}`).join('\n') || 'none'}
Job: ${job ? `${job.title} at ${job.company}` : 'unknown'}
Voice: ${(voice.guide || []).join(' ')}
Profile: ${JSON.stringify(slimProfile(profile))}`;
  return claude.json({ system, content, maxTokens: 1000 });
}

// ---------- Canva design import ----------

export async function readDesign(claude, file) {
  const system = `You look at a resume design (a PDF exported from Canva) and describe its layout so it can be rebuilt as a clean, readable resume.
Shape: {"columns": 1 or 2, "sidebar": "left|right|none", "fonts": ["font names you can identify, heading first"], "accent": "#hex main accent color or #14213D", "sections": ["section names in reading order"], "decorations": ["photos, skill bars, icons, graphics you see"], "looksLike": "classic|modern|compact"}`;
  return claude.json({ system, content: [fileBlock(file), { type: 'text', text: 'Describe this resume design.' }], maxTokens: 800, temperature: 0 });
}
