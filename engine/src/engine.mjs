// Pull jobs from every source the user has, clean them up and merge them.
//
// A "source" is what identifyWebsite() returns, or written by hand:
//   { source: 'greenhouse', board: 'anthropic' }
//   { source: 'webpage', url: 'https://example.org/careers' }

import { READERS } from './sources.mjs';
import { parseJobUrl } from './detect.mjs';
import { isExpired, FRESH_DAYS, RECENT_DAYS } from './job.mjs';

/** Read one source. Never throws: problems come back in `error`. */
export async function readSource(spec, opts = {}) {
  const type = spec.source || (spec.kind === 'webpage' ? 'webpage' : null);
  const reader = READERS[type];
  if (!reader) return { spec, jobs: [], error: `No reader for "${type}"` };
  try {
    const arg = type === 'webpage' ? spec.url : spec.board;
    const jobs = await reader(arg, opts);
    return { spec, jobs, error: null };
  } catch (err) {
    const notFound = err.status === 404 ? ' (board not found: check the name in the careers link)' : '';
    return { spec, jobs: [], error: `${err.message}${notFound}` };
  }
}

const norm = (s) => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** Same company and title: possibly the same job listed in two places. */
export function sameJobKey(job) {
  return `${norm(job.company)}|${norm(job.title)}`;
}

/**
 * Locations are written differently everywhere ("Remote", "Remote - US",
 * "Portland, OR"). Treat two as the same place when either is blank, both are
 * remote, or they start with the same word.
 */
export function samePlace(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return true;
  if (x.includes('remote') && y.includes('remote')) return true;
  return x.split(' ')[0] === y.split(' ')[0];
}

const SOURCE_RANK = { greenhouse: 0, lever: 0, ashby: 0, smartrecruiters: 0, workable: 0, webpage: 1 };

/**
 * Merge duplicates. Keeps the copy from the company's own hiring system when there
 * is one (most trustworthy), and the earliest posted date seen anywhere.
 */
export function dedupe(jobs) {
  const groups = new Map(); // company|title -> list of kept jobs in different places
  for (const job of jobs) {
    const key = sameJobKey(job);
    const list = groups.get(key) || [];
    groups.set(key, list);
    const at = list.findIndex((k) => samePlace(k.location, job.location));
    if (at < 0) { list.push({ ...job, alsoAt: [] }); continue; }
    const seen = list[at];
    const jobWins = (SOURCE_RANK[job.source] ?? 2) < (SOURCE_RANK[seen.source] ?? 2);
    const winner = jobWins
      ? { ...job, alsoAt: [...seen.alsoAt, seen.url] }
      : { ...seen, alsoAt: [...seen.alsoAt, job.url] };
    // The job has existed since the EARLIEST date anyone listed it.
    const earliest = [seen.postedAt, job.postedAt].filter(Boolean).sort()[0] || null;
    if (earliest) winner.postedAt = earliest;
    const ages = [seen.ageDays, job.ageDays].filter((a) => a !== null);
    if (ages.length) {
      winner.ageDays = Math.max(...ages);
      winner.freshness = winner.ageDays <= FRESH_DAYS ? 'fresh' : winner.ageDays <= RECENT_DAYS ? 'recent' : 'older';
    }
    list[at] = winner;
  }
  return [...groups.values()].flat();
}

/**
 * Read many sources a few at a time, drop expired jobs, merge duplicates and
 * sort newest first. Returns the jobs plus a per-source report.
 */
export async function fetchAll(specs, { concurrency = 4, fetchImpl, now = new Date(), maxAgeDays = null } = {}) {
  const results = [];
  let next = 0;
  async function worker() {
    while (next < specs.length) {
      const i = next++;
      results[i] = await readSource(specs[i], { fetchImpl, now });
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, specs.length) }, worker));

  let jobs = results.flatMap((r) => r.jobs).filter((j) => !isExpired(j, now));
  if (maxAgeDays !== null) jobs = jobs.filter((j) => j.ageDays === null || j.ageDays <= maxAgeDays);
  jobs = dedupe(jobs).sort((a, b) => (a.ageDays ?? 9999) - (b.ageDays ?? 9999));

  const report = results.map((r) => ({
    source: r.spec.source || 'webpage',
    board: r.spec.board || r.spec.url,
    jobs: r.jobs.length,
    error: r.error,
  }));
  return { jobs, report };
}

/**
 * Is this job link still open? Looks the job up in its company's LIVE list.
 * Answers: { open: true|false|null, reason, job? }  (null = can't tell from this link)
 */
export async function checkJobLink(link, { fetchImpl, now } = {}) {
  const parsed = parseJobUrl(link);
  if (!parsed) return { open: null, reason: "This link isn't from a hiring system we can check yet. Open it and look for an Apply button." };
  const { jobs, error } = await readSource({ source: parsed.source, board: parsed.board }, { fetchImpl, now });
  if (error) return { open: null, reason: `Couldn't read ${parsed.board}'s job list: ${error}` };
  const job = jobs.find((j) => String(j.id).endsWith(`:${parsed.jobId}`));
  if (!job) return { open: false, reason: `Not in ${parsed.board}'s current openings, so it has closed.` };
  const age = job.freshness === 'older' ? ` Posted ${job.ageDays} days ago, so it may be an evergreen or slow-moving role.` : '';
  return { open: true, reason: `Still open.${age}`, job };
}
