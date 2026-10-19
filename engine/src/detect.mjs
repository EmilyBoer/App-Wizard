// "Add a website": work out what a pasted link is and how App Wizard can read it.
//
// identifyWebsite(url) returns one of:
//   { kind: 'board', source: 'greenhouse', board: 'acme', label }   a hiring system we read directly
//   { kind: 'webpage', url, count, label }                          a page with job data we can read
//   { kind: 'alerts', site, label, suggestion }                     a big job site: use its email alerts
//   { kind: 'unsupported', url, label, suggestion }                 nothing readable yet (logged for later)

import { getText } from './http.mjs';
import { jobPostingsFromHtml } from './sources.mjs';

// Hiring systems, matched on a link's address OR inside a careers page's HTML
// (many company careers pages embed one of these).
const SYSTEMS = [
  { source: 'greenhouse', re: /(?:job-boards|boards)(?:\.eu)?\.greenhouse\.io\/(?:embed\/job_board(?:\/js)?\?for=)?([A-Za-z0-9_-]+)/i },
  { source: 'greenhouse', re: /boards-api\.greenhouse\.io\/v1\/boards\/([A-Za-z0-9_-]+)/i },
  { source: 'lever', re: /jobs(?:\.eu)?\.lever\.co\/([A-Za-z0-9_.-]+)/i },
  { source: 'lever', re: /api(?:\.eu)?\.lever\.co\/v0\/postings\/([A-Za-z0-9_.-]+)/i },
  { source: 'ashby', re: /jobs\.ashbyhq\.com\/([A-Za-z0-9_.%-]+)/i },
  { source: 'ashby', re: /api\.ashbyhq\.com\/posting-api\/job-board\/([A-Za-z0-9_.%-]+)/i },
  { source: 'smartrecruiters', re: /(?:jobs|careers)\.smartrecruiters\.com\/([A-Za-z0-9_-]+)/i },
  { source: 'workable', re: /apply\.workable\.com\/([A-Za-z0-9_-]+)/i },
];

// Words that show up after a hiring-system domain but are not a company name.
const NOT_A_BOARD = new Set(['embed', 'v1', 'api', 'jobs', 'j', 'api-docs', 'login']);

// Big job sites that don't offer a public list. Their own email alerts are the
// reliable, allowed way in: the user forwards them to their App Wizard inbox.
const ALERT_SITES = [
  { site: 'LinkedIn', re: /(^|\.)linkedin\.com$/i },
  { site: 'Indeed', re: /(^|\.)indeed\.[a-z.]+$/i },
  { site: 'Glassdoor', re: /(^|\.)glassdoor\.[a-z.]+$/i },
  { site: 'ZipRecruiter', re: /(^|\.)ziprecruiter\.com$/i },
];

export function normalizeUrl(input) {
  let s = String(input || '').trim();
  if (!s) throw new Error('Paste a website address.');
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  return new URL(s).toString();
}

/** Find a hiring system in a string (a URL or a page's HTML). */
export function findSystem(text) {
  for (const { source, re } of SYSTEMS) {
    const m = String(text).match(re);
    if (m && !NOT_A_BOARD.has(m[1].toLowerCase())) return { source, board: decodeURIComponent(m[1]) };
  }
  return null;
}

const label = (source, board) => `${board} on ${source[0].toUpperCase()}${source.slice(1)}`;

export async function identifyWebsite(input, { fetchImpl } = {}) {
  const url = normalizeUrl(input);
  const host = new URL(url).hostname;

  const direct = findSystem(url);
  if (direct) return { kind: 'board', ...direct, label: label(direct.source, direct.board) };

  const alertSite = ALERT_SITES.find((s) => s.re.test(host));
  if (alertSite) {
    return {
      kind: 'alerts', site: alertSite.site, label: alertSite.site,
      suggestion: `${alertSite.site} doesn't share its job list with other apps. Set up ${alertSite.site} job alerts and forward them to your App Wizard inbox, and we'll read every one.`,
    };
  }

  let html;
  try {
    html = await getText(url, { fetchImpl });
  } catch (err) {
    return {
      kind: 'unsupported', url, label: host,
      suggestion: `We couldn't open ${host} (${err.status || 'no response'}). If it sends email job alerts, forward them to your App Wizard inbox. We've noted the site so we can add it.`,
    };
  }

  const embedded = findSystem(html);
  if (embedded) return { kind: 'board', ...embedded, label: label(embedded.source, embedded.board) };

  const postings = jobPostingsFromHtml(html);
  if (postings.length) return { kind: 'webpage', url, count: postings.length, label: host };

  return {
    kind: 'unsupported', url, label: host,
    suggestion: `We can't read jobs from ${host} yet. If it sends email job alerts, forward them to your App Wizard inbox. We've noted the site so we can add it.`,
  };
}

/** Pull the hiring system, board and job ID out of a single job's link. */
export function parseJobUrl(input) {
  const url = normalizeUrl(input);
  const u = new URL(url);
  const parts = u.pathname.split('/').filter(Boolean);
  const host = u.hostname;
  if (/greenhouse\.io$/i.test(host)) {
    const jobsAt = parts.indexOf('jobs');
    if (jobsAt > 0 && parts[jobsAt + 1]) return { source: 'greenhouse', board: parts[jobsAt - 1], jobId: parts[jobsAt + 1] };
    const forBoard = u.searchParams.get('for'), tok = u.searchParams.get('token');
    if (forBoard && tok) return { source: 'greenhouse', board: forBoard, jobId: tok };
  }
  if (/lever\.co$/i.test(host) && parts.length >= 2) return { source: 'lever', board: parts[0], jobId: parts[1] };
  if (/ashbyhq\.com$/i.test(host) && parts.length >= 2) return { source: 'ashby', board: decodeURIComponent(parts[0]), jobId: parts[1] };
  if (/smartrecruiters\.com$/i.test(host) && parts.length >= 2) return { source: 'smartrecruiters', board: parts[0], jobId: parts[1].split('-')[0] };
  if (/workable\.com$/i.test(host)) {
    const j = parts.indexOf('j');
    if (j > 0 && parts[j + 1]) return { source: 'workable', board: parts[0], jobId: parts[j + 1] };
  }
  return null;
}
