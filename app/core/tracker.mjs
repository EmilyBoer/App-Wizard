// The tracker: every job found, saved, applied to or advanced, with the exact
// documents used. Checks for duplicates before anything is added.

import { id } from './store.mjs';
import { payLabel } from './match.mjs';

export const STATUSES = ['found', 'saved', 'ready', 'applied', 'interviewing', 'offer', 'rejected', 'skipped', 'closed'];
export const STATUS_LABEL = { found: 'Found', saved: 'Saved', ready: 'Ready to apply', applied: 'Applied', interviewing: 'Interviewing', offer: 'Offer', rejected: 'Not moving forward', skipped: 'Skipped', closed: 'Closed' };

const key = (s) => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export function findDuplicate(tracker, job) {
  return tracker.list.find((t) => (job.url && t.url === job.url) || (key(t.company) === key(job.company) && key(t.title) === key(job.title)));
}

export function addToTracker(tracker, job, { status = 'found', fit = null } = {}) {
  const dup = findDuplicate(tracker, job);
  if (dup) return { entry: dup, duplicate: true };
  const now = new Date().toISOString();
  const entry = {
    id: id('t_'), jobId: job.id || null, company: job.company, title: job.title, url: job.url || '', location: job.location || '',
    salary: job.pay ? payLabel(job.pay) : '', source: job.source || 'manual', dateFound: now, dateApplied: null, status,
    fit: fit?.verdict || null, rationale: fit?.why || '', score: job.score ?? null,
    resumeDocId: null, letterDocId: null, followUps: [], notes: '', history: [{ at: now, status }],
  };
  tracker.list.unshift(entry);
  return { entry, duplicate: false };
}

export function setStatus(tracker, entryId, status, note) {
  const e = tracker.list.find((t) => t.id === entryId);
  if (!e) throw new Error('Not in your tracker.');
  if (!STATUSES.includes(status)) throw new Error('Unknown status.');
  e.status = status;
  const at = new Date().toISOString();
  if (status === 'applied' && !e.dateApplied) {
    e.dateApplied = at;
    const due = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    e.followUps.push({ id: id('f_'), due, note: 'Follow up if you haven’t heard back.', done: false });
  }
  e.history.push({ at, status, note: note || '' });
  return e;
}

export function dueFollowUps(tracker, today = new Date().toISOString().slice(0, 10)) {
  return tracker.list.flatMap((t) => t.followUps.filter((f) => !f.done && f.due <= today).map((f) => ({ ...f, entryId: t.id, company: t.company, title: t.title })));
}

export function toCsv(tracker) {
  const cols = ['company', 'title', 'status', 'salary', 'location', 'url', 'dateFound', 'dateApplied', 'fit', 'rationale', 'resumeFile', 'letterFile', 'notes'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...tracker.list.map((t) => cols.map((c) => esc(t[c])).join(','))].join('\n');
}
