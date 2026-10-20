// Learning from what the person does. Every signal becomes an event; clear
// patterns become plain-language rules the person can see, turn off or delete
// in Profile. No hidden model: the rules ARE the learning.

import { id } from './store.mjs';

export function recordEvent(learning, event) {
  learning.events.push({ id: id('ev_'), at: new Date().toISOString(), ...event });
  if (learning.events.length > 2000) learning.events = learning.events.slice(-2000);
  return learning;
}

const TITLE_STOP = new Set(['senior', 'sr', 'junior', 'jr', 'lead', 'manager', 'associate', 'assistant', 'specialist', 'coordinator', 'director', 'i', 'ii', 'iii', 'of', 'and', 'the', '&', '-', 'remote', 'content', 'web', 'digital']);

/**
 * Immediate rules from a "no" with reasons. Conservative: proposes rules,
 * which become active only after two matching events or when the person confirms.
 */
export function learnFromNo(learning, want, job, reasons) {
  const proposals = [];
  if (reasons.includes('Pay too low') && !learning.rules.some((r) => r.kind === 'pay-strict')) {
    proposals.push({ kind: 'pay-strict', text: 'Your pay floor is firm: we drop jobs that top out under it instead of just flagging them.', pattern: '' });
  }
  if (reasons.includes('Wrong kind of work') || reasons.includes('Title was misleading')) {
    const tw = String(job.title).toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3 && !TITLE_STOP.has(w));
    const wantedWords = new Set((want.titles || []).join(' ').toLowerCase().split(/[^a-z]+/));
    for (const w of tw) {
      if (wantedWords.has(w)) continue;
      const seen = learning.events.filter((e) => e.type === 'job' && e.value === 'no' && (e.reasons || []).some((r) => /kind of work|misleading/.test(r)) && String(e.title).toLowerCase().includes(w)).length;
      if (seen >= 2 && !learning.rules.some((r) => r.pattern === w)) proposals.push({ kind: 'hide', pattern: w, text: `We'll hide jobs with "${w}" in the title. You've passed on ${seen} of them.` });
    }
  }
  if (reasons.includes('Type of employer')) {
    const seen = learning.events.filter((e) => e.type === 'job' && e.value === 'no' && (e.reasons || []).includes('Type of employer') && e.company === job.company).length;
    if (seen >= 1 && !learning.rules.some((r) => r.pattern === String(job.company).toLowerCase())) proposals.push({ kind: 'hide', pattern: String(job.company).toLowerCase(), text: `We'll stop showing jobs at ${job.company}.` });
  }
  for (const p of proposals) learning.rules.push({ id: id('rule_'), active: true, source: 'auto', created: new Date().toISOString(), ...p });
  return proposals;
}

export function learnFromYes(learning, want, job) {
  const words = String(job.title).toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3 && !TITLE_STOP.has(w));
  const added = [];
  for (const w of words) {
    const seen = learning.events.filter((e) => e.type === 'job' && ['yes', 'applied', 'interview'].includes(e.value) && String(e.title).toLowerCase().includes(w)).length;
    const wanted = (want.titles || []).some((t) => t.toLowerCase().includes(w));
    if (seen >= 2 && !wanted && !learning.rules.some((r) => r.pattern === w)) {
      const rule = { id: id('rule_'), active: true, source: 'auto', created: new Date().toISOString(), kind: 'boost', pattern: w, text: `We'll rank "${w}" jobs higher. You've said yes to ${seen}.` };
      learning.rules.push(rule); added.push(rule);
    }
  }
  return added;
}

/** Writing edits: kept as examples for the next draft, and offered back to the profile. */
export function learnFromEdit(learning, { before, after, docType, bulletId }) {
  if (!before || !after || before.trim() === after.trim()) return null;
  return recordEvent(learning, { type: 'edit', docType, before, after, bulletId });
}

export function writingEdits(learning) {
  return learning.events.filter((e) => e.type === 'edit').map((e) => ({ before: e.before, after: e.after }));
}

/** Merge rules suggested by Claude's weekly review, skipping ones we already have. */
export function mergeRules(learning, suggested) {
  const added = [];
  for (const r of suggested || []) {
    if (!r.text) continue;
    if (learning.rules.some((x) => x.text === r.text || (r.pattern && x.pattern === r.pattern && x.kind === r.kind))) continue;
    const rule = { id: id('rule_'), active: true, source: 'review', created: new Date().toISOString(), kind: r.kind || 'writing', pattern: r.pattern || '', text: r.text };
    learning.rules.push(rule); added.push(rule);
  }
  learning.lastReview = new Date().toISOString();
  return added;
}

export function learningSummary(learning) {
  const jobs = learning.events.filter((e) => e.type === 'job');
  return {
    yes: jobs.filter((e) => e.value === 'yes').length,
    no: jobs.filter((e) => e.value === 'no').length,
    edits: learning.events.filter((e) => e.type === 'edit').length,
    rules: learning.rules.filter((r) => r.active !== false).length,
  };
}
