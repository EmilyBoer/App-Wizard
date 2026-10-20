// Things people paste or drop in: job alert emails, single job links,
// calendar invites (.ics), and company pages for interview research.

import { htmlText } from './files.mjs';

/** Pull jobs out of a pasted or forwarded job alert email (LinkedIn, Indeed, Glassdoor, others). */
export function jobsFromAlertEmail(text) {
  const raw = String(text || '');
  const plain = /<html|<a\s/i.test(raw) ? raw : raw;
  const links = new Map();
  const add = (url, hint) => {
    url = url.replace(/&amp;/g, '&').replace(/[)\].,>]+$/, '');
    let clean = url;
    const li = url.match(/linkedin\.com\/(?:comm\/)?jobs\/view\/(\d+)/i);
    if (li) clean = `https://www.linkedin.com/jobs/view/${li[1]}/`;
    const indeed = url.match(/indeed\.com\/.*?[?&]jk=([a-f0-9]+)/i);
    if (indeed) clean = `https://www.indeed.com/viewjob?jk=${indeed[1]}`;
    if (!li && !indeed && !/greenhouse|lever\.co|ashbyhq|smartrecruiters|workable|glassdoor|ziprecruiter|careers|jobs/i.test(url)) return;
    if (/unsubscribe|settings|preferences|help|privacy|\.(png|jpg|gif)/i.test(url)) return;
    if (!links.has(clean)) links.set(clean, { url: clean, site: li ? 'LinkedIn' : indeed ? 'Indeed' : new URL(clean).hostname.replace(/^www\./, ''), hint: hint || '' });
  };
  // HTML anchors with their text
  for (const m of plain.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) add(m[1], htmlText(m[2]).slice(0, 120));
  // bare URLs in plain text, with the line before as the hint
  const lines = htmlText(plain).split('\n');
  lines.forEach((line, i) => { for (const m of line.matchAll(/https?:\/\/[^\s<>"']+/g)) add(m[0], (lines[i - 1] || '').trim().slice(0, 120)); });
  return [...links.values()].map((l) => {
    const parts = l.hint.split(/\s+(?:at|·|-|–|\|)\s+/);
    return { ...l, title: parts[0] || '', company: parts[1] || '' };
  });
}

/** Minimal .ics reader: returns interview-like events. */
export function parseIcs(text) {
  const unfolded = String(text).replace(/\r?\n[ \t]/g, '');
  const events = [];
  for (const block of unfolded.split('BEGIN:VEVENT').slice(1)) {
    const get = (k) => { const m = block.match(new RegExp(`^${k}(?:;[^:\\n]*)?:(.*)$`, 'm')); return m ? m[1].trim().replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';') : ''; };
    const start = icsDate(get('DTSTART'));
    if (!start) continue;
    events.push({ title: get('SUMMARY'), start, end: icsDate(get('DTEND')), location: get('LOCATION'), description: get('DESCRIPTION').slice(0, 2000), organizer: get('ORGANIZER').replace(/^mailto:/i, '') });
  }
  return events;
}

function icsDate(v) {
  const m = String(v).match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/);
  if (!m) return null;
  const [, y, mo, d, h = '09', mi = '00', s = '00', z] = m;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}${z ? 'Z' : ''}`;
  return z ? new Date(iso).toISOString() : iso;
}

/** Fetch a few of the company's own pages for interview research. */
export async function researchCompany(jobUrl, companyName, { fetchImpl = fetch } = {}) {
  const pages = [];
  let origin = null;
  try {
    const u = new URL(jobUrl);
    if (!/greenhouse|lever|ashby|smartrecruiters|workable|linkedin|indeed/.test(u.hostname)) origin = u.origin;
  } catch {}
  const guesses = origin ? [origin, `${origin}/about`, `${origin}/about-us`, `${origin}/news`] : [];
  for (const url of guesses) {
    try {
      const res = await fetchImpl(url, { headers: { 'user-agent': 'AppWizard/0.1' }, signal: AbortSignal.timeout(12000) });
      if (!res.ok) continue;
      const text = htmlText(await res.text()).slice(0, 4000);
      if (text.length > 200) pages.push(`From ${url}:\n${text}`);
    } catch {}
  }
  return { text: pages.join('\n\n'), sources: pages.length, note: pages.length ? '' : `We couldn't read ${companyName}'s own website, so the cheat sheet uses the job posting only. Paste anything you found into the notes to add it.` };
}
