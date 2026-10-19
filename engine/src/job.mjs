// The one job shape every source is turned into.
//
// {
//   id:          "greenhouse:anthropic:5391376008"  (source:board:jobId, unique)
//   source:      "greenhouse" | "lever" | "ashby" | "smartrecruiters" | "workable" | "webpage"
//   board:       the company's board name on that system ("anthropic")
//   company:     "Anthropic"
//   title:       "Account Executive"
//   location:    "Singapore" (free text, as the company wrote it)
//   remote:      true | false | null (null = not stated)
//   url:         link to the posting
//   postedAt:    ISO date the job was first published (or null)
//   updatedAt:   ISO date it was last changed (or null)
//   expiresAt:   ISO date it closes, when the site says (or null)
//   description: plain text, when the source includes it (or "")
//   ageDays:     whole days since postedAt (or since updatedAt if no postedAt)
//   freshness:   "fresh" (≤14 days) | "recent" (15–30) | "older" (31+) | "unknown"
// }

export const FRESH_DAYS = 14;
export const RECENT_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Turn anything date-like (ISO string, epoch ms) into an ISO string, or null. */
export function toIso(value) {
  if (value === null || value === undefined || value === '') return null;
  const d = typeof value === 'number' ? new Date(value) : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Strip HTML tags and decode the common entities, for descriptions. */
export function htmlToText(html) {
  if (!html) return '';
  return String(html)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/<(br|\/p|\/li|\/h\d|\/div)\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
}

/** Build a job, filling in age and freshness. `now` is injectable for tests. */
export function makeJob(fields, now = new Date()) {
  const postedAt = toIso(fields.postedAt);
  const updatedAt = toIso(fields.updatedAt);
  const expiresAt = toIso(fields.expiresAt);
  const basis = postedAt || updatedAt;
  const ageDays = basis ? Math.max(0, Math.floor((now.getTime() - Date.parse(basis)) / DAY_MS)) : null;
  let freshness = 'unknown';
  if (ageDays !== null) freshness = ageDays <= FRESH_DAYS ? 'fresh' : ageDays <= RECENT_DAYS ? 'recent' : 'older';
  return {
    id: `${fields.source}:${fields.board}:${fields.jobId}`,
    source: fields.source,
    board: fields.board,
    company: fields.company || fields.board,
    title: (fields.title || '').trim(),
    location: (fields.location || '').trim(),
    remote: fields.remote ?? null,
    url: fields.url || '',
    postedAt,
    updatedAt,
    expiresAt,
    description: fields.description || '',
    ageDays,
    freshness,
  };
}

/** True when the site says the job has closed. */
export function isExpired(job, now = new Date()) {
  return Boolean(job.expiresAt) && Date.parse(job.expiresAt) < now.getTime();
}
