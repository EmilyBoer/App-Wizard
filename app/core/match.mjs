// Fast, free matching that runs on every job before Claude sees any of them.
// 1. Hard filters: things the person said never to show.
// 2. A score from titles, the work they want, their example jobs and what they've liked or skipped.
// Only the top few go to Claude for a written explanation.

const words = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9$+#]+/g, ' ').split(' ').filter((w) => w.length > 1 && !STOP.has(w));
const STOP = new Set('the and for with you your our are will this that from have has into who what about their they them all can not but job role team work years year experience ability including other more such using use new across within strong skills'.split(' '));

export const EMPLOYER_TYPES = {
  Nonprofit: /\bnon-?profit|501\(c\)|foundation\b|charit|mission-driven/i,
  'Public media': /public (radio|media|broadcasting)|\bnpr\b|\bpbs\b|member station/i,
  Health: /health|hospital|clinic|medical|patient|care\b/i,
  Education: /universit|college|school|education|learning|academ/i,
  Government: /\bcity of\b|county|state of|federal|government|public sector|agency of/i,
  'Tech company': /\bsaas\b|software company|startup|platform|series [a-d]\b|venture/i,
  Agency: /\bagency\b|clients?\b.*\baccounts?\b|client services/i,
  Finance: /\bbank|financial services|fintech|investment|insurance|wealth/i,
};

export const WORK_TYPES = {
  'Writing and editing': /writ|edit|copy|content|story|editorial/i,
  'Running the website': /website|\bweb\b|cms|wordpress|drupal|aem|webflow|pages|site/i,
  'Strategy and planning': /strateg|plan|roadmap|prioriti/i,
  'Managing people': /manage (a|the)? ?team|direct reports|supervis|people manager|lead a team/i,
  'Fundraising and grants': /fundrais|donor|grant|development officer|philanthrop|annual fund/i,
  'Social media': /social media|community manag|instagram|tiktok|linkedin posts/i,
};

/** Pull a yearly pay range from text: "$85,000 - $105,000", "$85k–$105k", "$40/hour". */
export function parsePay(text) {
  const t = String(text || '');
  const m = t.match(/\$\s?(\d{2,3}(?:,\d{3})+|\d{2,3}(?:\.\d)?\s?[kK])\s*(?:-|–|—|to)\s*\$?\s?(\d{2,3}(?:,\d{3})+|\d{2,3}(?:\.\d)?\s?[kK])/);
  const val = (s) => { s = s.replace(/[,\s]/g, ''); return /k$/i.test(s) ? parseFloat(s) * 1000 : Number(s); };
  if (m) { const lo = val(m[1]), hi = val(m[2]); if (lo > 10000 && hi >= lo) return { min: lo, max: hi }; }
  const h = t.match(/\$\s?(\d{2,3}(?:\.\d{2})?)\s*(?:-|–|to)\s*\$?\s?(\d{2,3}(?:\.\d{2})?)\s*(?:\/|per\s)\s*(?:hr|hour)/i);
  if (h) return { min: Number(h[1]) * 2080, max: Number(h[2]) * 2080, hourly: true };
  const one = t.match(/\$\s?(\d{2,3}(?:\.\d{2})?)\s*(?:\/|per\s)\s*(?:hr|hour)/i);
  if (one) return { min: Number(one[1]) * 2080, max: Number(one[1]) * 2080, hourly: true };
  return null;
}

export function payLabel(pay) {
  if (!pay) return '';
  const k = (n) => `$${Math.round(n / 1000)}k`;
  return pay.min === pay.max ? k(pay.min) : `${k(pay.min)}–${k(pay.max)}`;
}

function isRemote(job) { return /remote/i.test(`${job.location} ${job.remote ? 'remote' : ''}`); }

/** Decide whether a job passes the person's hard rules. Returns { ok, reasons[] }. */
export function hardFilter(job, want, rules = []) {
  const reasons = [];
  const text = `${job.title}\n${job.description}`;
  const title = String(job.title || '').toLowerCase();
  const pay = parsePay(text);
  const strictPay = rules.some((r) => r.kind === 'pay-strict');
  const slack = strictPay ? 1 : 0.95;
  if (pay?.hourly && want.hourlyFloor) {
    if (pay.max / 2080 < want.hourlyFloor * slack) reasons.push(`Pays up to $${Math.round(pay.max / 2080)} an hour, under your $${want.hourlyFloor} an hour.`);
  } else if (want.payFloor && pay && pay.max < want.payFloor * slack) reasons.push(`Pay tops out at ${payLabel(pay)}, under your $${Math.round(want.payFloor / 1000)}k floor.`);
  // Kinds of work: hide only clear mismatches (most postings don't say).
  const types = want.jobType || [];
  if (types.length) {
    const head = `${job.title}\n${String(job.description || '').slice(0, 1500)}`;
    if (/\b(contract|contractor|freelance|temporary|1099|contract[- ]to[- ]hire)\b/i.test(head) && !types.includes('Contract')) reasons.push('A contract role, and you’re looking for other kinds of work.');
    if (/\bpart[- ]time\b/i.test(head) && !types.includes('Part-time')) reasons.push('Part-time, and you’re looking for other kinds of work.');
  }
  const where = (want.where || []).map((w) => w.toLowerCase());
  if (where.length) {
    const remoteOk = where.some((w) => w.includes('remote'));
    const places = where.filter((w) => !w.includes('remote')).map((w) => w.replace(/^(hybrid|on-?site)\s*(near|in)?\s*/, '').split(',')[0].trim()).filter(Boolean);
    const anyOnsite = where.some((w) => /on-?site/.test(w));
    const loc = String(job.location || '').toLowerCase();
    const okRemote = remoteOk && isRemote(job);
    const okPlace = places.some((p) => p && loc.includes(p));
    if (!okRemote && !okPlace && !(anyOnsite && !places.length) && loc) reasons.push(`Location: ${job.location}.`);
  }
  for (const d of want.dealBreakers || []) {
    const pattern = DEAL_PATTERNS[d] || new RegExp(`\\b${escape(d)}\\b`, 'i');
    if (pattern.test(text)) reasons.push(`Mentions ${d.toLowerCase()}.`);
  }
  for (const a of want.ambiguous || []) {
    if (!a.choice || a.choice === 'both') continue;
    const w = a.word.toLowerCase();
    if (!title.includes(w)) continue;
    const skip = a.choice === 'skip' || /skip|neither/i.test(a.choice);
    const other = (a.meanings || []).filter((m) => m !== a.choice);
    if (skip) reasons.push(`"${a.word}" in the title: you asked to skip these.`);
    else if (other.some((m) => meaningMatches(m, text)) && !meaningMatches(a.choice, text)) reasons.push(`"${a.word}" here means ${other[0].toLowerCase()}, not ${a.choice.toLowerCase()}.`);
  }
  for (const [type, feeling] of Object.entries(want.places || {})) {
    if (feeling === 'Avoid' && EMPLOYER_TYPES[type]?.test(`${job.company} ${text.slice(0, 3000)}`)) reasons.push(`Looks like ${type.toLowerCase()}, which you avoid.`);
  }
  for (const r of rules) {
    if (r.kind === 'hide' && r.pattern && r.active !== false && new RegExp(escape(r.pattern), 'i').test(`${job.title} ${job.company}`)) reasons.push(r.text);
  }
  return { ok: reasons.length === 0, reasons, pay };
}

const DEAL_PATTERNS = {
  'Sales targets': /\bquota|sales targets?|commission-based|revenue targets?/i,
  'Night or weekend shifts': /night shift|overnight|weekend(s)? required|weekend shifts?/i,
  Relocation: /must relocate|relocation required|relocate to/i,
  'Unpaid trial work': /unpaid (trial|test)|spec work/i,
  'On-call': /on-call|on call rotation|pager/i,
};

function meaningMatches(meaning, text) {
  const m = meaning.toLowerCase();
  if (/fundrais|donor/.test(m)) return /fundrais|donor|gift|philanthrop|grant|annual fund|major gifts/i.test(text);
  if (/software|engineer|code/.test(m)) return /software|engineer|javascript|python|code|api\b/i.test(text);
  if (/audio|radio|podcast/.test(m)) return /audio|podcast|radio|broadcast|on-air/i.test(text);
  if (/video/.test(m)) return /video|film|premiere|editing footage/i.test(text);
  if (/web|digital/.test(m)) return /website|web|cms|digital/i.test(text);
  return words(meaning).some((w) => text.toLowerCase().includes(w));
}

const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function overlap(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let n = 0; for (const w of A) if (B.has(w)) n++;
  return n / Math.sqrt(A.size * B.size);
}

/**
 * Score 0 to 100 and short reasons. Uses titles, work types, example jobs,
 * jobs they said yes/no to, learned boosts, freshness.
 */
export function scoreJob(job, want, learning = { events: [], rules: [] }) {
  const text = `${job.title}\n${String(job.description || '').slice(0, 6000)}`;
  const tw = words(job.title);
  const reasons = [];
  let s = 0;
  const titles = [...(want.titles || []), ...(want.suggestedTitles || []).filter((t) => t.accepted)].map((t) => (typeof t === 'string' ? t : t.title));
  const titleBest = Math.max(0, ...titles.map((t) => overlap(tw, words(t))));
  s += titleBest * 35; if (titleBest > 0.6) reasons.push('Title matches what you want');
  const work = want.work || [];
  work.slice(0, 2).forEach((w, i) => { if (WORK_TYPES[w]?.test(text)) { s += i === 0 ? 14 : 9; reasons.push(`Lots of ${w.toLowerCase()}`); } });
  const kw = (want.keywords || []).map((k) => k.toLowerCase());
  const hits = kw.filter((k) => text.toLowerCase().includes(k));
  s += Math.min(15, hits.length * 2.5);
  const jw = words(text);
  // Jobs that got interviews count most; a reach only a little.
  const WEIGHT = { interviewed: 1.15, fit: 1, reach: 0.6 };
  const liked = (want.examples || []).map((e) => ({ w: words(`${e.title} ${e.text}`.slice(0, 4000)), k: WEIGHT[e.kind] ?? 1 }));
  const yes = learning.events.filter((e) => e.type === 'job' && (e.value === 'yes' || e.value === 'applied' || e.value === 'interview')).map((e) => words(`${e.title} ${e.snippet || ''}`));
  const no = learning.events.filter((e) => e.type === 'job' && e.value === 'no').map((e) => words(`${e.title} ${e.snippet || ''}`));
  const likeSim = Math.max(0, ...liked.map((l) => overlap(jw, l.w) * l.k), ...yes.map((l) => overlap(jw, l)));
  const noSim = Math.max(0, ...no.map((l) => overlap(jw, l)));
  s += likeSim * 25; s -= noSim * 15;
  if (likeSim > 0.35) reasons.push('Similar to jobs you liked');
  for (const [type, feeling] of Object.entries(want.places || {})) {
    if (feeling === 'Love' && EMPLOYER_TYPES[type]?.test(`${job.company} ${text.slice(0, 3000)}`)) { s += 8; reasons.push(`${type}, which you love`); break; }
  }
  for (const r of learning.rules || []) {
    if (r.kind === 'boost' && r.pattern && r.active !== false && new RegExp(escape(r.pattern), 'i').test(text)) { s += 6; reasons.push(r.text); }
  }
  if (job.freshness === 'fresh') s += 5; else if (job.freshness === 'older') s -= 5;
  const score = Math.max(0, Math.min(100, Math.round(s)));
  return { score, reasons: [...new Set(reasons)].slice(0, 3) };
}

/** Filter + score a list. Returns kept (sorted best first) and hidden with reasons. */
export function rankJobs(jobs, want, learning) {
  const kept = [], hidden = [];
  for (const job of jobs) {
    const f = hardFilter(job, want, learning.rules || []);
    if (!f.ok) { hidden.push({ ...job, hiddenBecause: f.reasons, pay: f.pay }); continue; }
    const { score, reasons } = scoreJob(job, want, learning);
    kept.push({ ...job, score, scoreReasons: reasons, pay: f.pay });
  }
  kept.sort((a, b) => b.score - a.score || (a.ageDays ?? 999) - (b.ageDays ?? 999));
  return { kept, hidden };
}

export function bucket(score) { return score >= 60 ? 'strong' : score >= 40 ? 'good' : score >= 25 ? 'maybe' : 'weak'; }
