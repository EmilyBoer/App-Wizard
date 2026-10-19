// Readers for each kind of job source. Each one returns the company's CURRENTLY
// OPEN jobs: these are live lists, so a closed job is simply not in them.
//
// Verified 2026-10-19: Greenhouse's list shape (title, location, absolute_url,
// updated_at, first_published). Lever, Ashby, SmartRecruiters and Workable follow
// their public docs but have not been run against live data yet: see README.

import { getJson, getText } from './http.mjs';
import { makeJob, htmlToText, isExpired } from './job.mjs';

const enc = encodeURIComponent;

// ---------- Greenhouse ----------
export async function readGreenhouse(board, { fetchImpl, now } = {}) {
  const data = await getJson(`https://boards-api.greenhouse.io/v1/boards/${enc(board)}/jobs?content=true`, { fetchImpl });
  return (data.jobs || []).map((j) => makeJob({
    source: 'greenhouse', board, jobId: j.id,
    company: j.company_name,
    title: j.title,
    location: j.location?.name,
    remote: /remote/i.test(j.location?.name || '') || /remote/i.test(JSON.stringify(j.metadata || '')) ? true : null,
    url: j.absolute_url,
    postedAt: j.first_published,
    updatedAt: j.updated_at,
    expiresAt: j.application_deadline,
    description: htmlToText(j.content),
  }, now));
}

// ---------- Lever ----------
export async function readLever(board, { fetchImpl, now } = {}) {
  const data = await getJson(`https://api.lever.co/v0/postings/${enc(board)}?mode=json`, { fetchImpl });
  return (Array.isArray(data) ? data : []).map((j) => makeJob({
    source: 'lever', board, jobId: j.id,
    title: j.text,
    location: j.categories?.location || (j.categories?.allLocations || []).join(', '),
    remote: j.workplaceType ? j.workplaceType === 'remote' : null,
    url: j.hostedUrl,
    postedAt: j.createdAt,
    description: j.descriptionPlain || htmlToText(j.description),
  }, now));
}

// ---------- Ashby ----------
export async function readAshby(board, { fetchImpl, now } = {}) {
  const data = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${enc(board)}?includeCompensation=true`, { fetchImpl });
  return (data.jobs || [])
    .filter((j) => j.isListed !== false)
    .map((j) => makeJob({
      source: 'ashby', board, jobId: j.id,
      title: j.title,
      location: j.location,
      remote: typeof j.isRemote === 'boolean' ? j.isRemote : null,
      url: j.jobUrl,
      postedAt: j.publishedAt,
      description: j.descriptionPlain || htmlToText(j.descriptionHtml),
    }, now));
}

// ---------- SmartRecruiters ----------
export async function readSmartRecruiters(board, { fetchImpl, now } = {}) {
  const data = await getJson(`https://api.smartrecruiters.com/v1/companies/${enc(board)}/postings?limit=100`, { fetchImpl });
  return (data.content || []).map((j) => makeJob({
    source: 'smartrecruiters', board, jobId: j.id,
    company: j.company?.name,
    title: j.name,
    location: [j.location?.city, j.location?.region, j.location?.country].filter(Boolean).join(', '),
    remote: typeof j.location?.remote === 'boolean' ? j.location.remote : null,
    url: `https://jobs.smartrecruiters.com/${board}/${j.id}`,
    postedAt: j.releasedDate,
  }, now));
}

// ---------- Workable ----------
export async function readWorkable(board, { fetchImpl, now } = {}) {
  const data = await getJson(`https://apply.workable.com/api/v1/widget/accounts/${enc(board)}`, { fetchImpl });
  return (data.jobs || []).map((j) => makeJob({
    source: 'workable', board, jobId: j.shortcode || j.id,
    company: data.name,
    title: j.title,
    location: [j.city, j.state, j.country].filter(Boolean).join(', '),
    remote: typeof j.telecommuting === 'boolean' ? j.telecommuting : null,
    url: j.url || j.shortlink,
    postedAt: j.published_on || j.created_at,
  }, now));
}

// ---------- Any web page with schema.org JobPosting data ----------
// Many career pages and job boards embed this so Google for Jobs can read them.
export function jobPostingsFromHtml(html) {
  const found = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    let parsed;
    try { parsed = JSON.parse(m[1].trim()); } catch { continue; }
    const stack = [parsed];
    while (stack.length) {
      const node = stack.pop();
      if (Array.isArray(node)) { stack.push(...node); continue; }
      if (!node || typeof node !== 'object') continue;
      const type = node['@type'];
      if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) found.push(node);
      if (node['@graph']) stack.push(node['@graph']);
      if (node.itemListElement) stack.push(node.itemListElement);
      if (node.item) stack.push(node.item);
    }
  }
  return found;
}

function placeOf(p) {
  const locs = Array.isArray(p.jobLocation) ? p.jobLocation : p.jobLocation ? [p.jobLocation] : [];
  return locs.map((l) => {
    const a = l.address || {};
    return [a.addressLocality, a.addressRegion, a.addressCountry?.name || a.addressCountry].filter(Boolean).join(', ');
  }).filter(Boolean).join(' · ');
}

export async function readWebpage(pageUrl, { fetchImpl, now } = {}) {
  const html = await getText(pageUrl, { fetchImpl });
  const host = new URL(pageUrl).hostname;
  return jobPostingsFromHtml(html).map((p, i) => makeJob({
    source: 'webpage', board: host,
    jobId: p.identifier?.value || p.identifier || p.url || `${p.title}-${i}`,
    company: p.hiringOrganization?.name,
    title: p.title,
    location: placeOf(p),
    remote: p.jobLocationType ? /TELECOMMUTE/i.test(p.jobLocationType) : null,
    url: p.url || pageUrl,
    postedAt: p.datePosted,
    expiresAt: p.validThrough,
    description: htmlToText(p.description),
  }, now)).filter((j) => !isExpired(j, now));
}

export const READERS = {
  greenhouse: readGreenhouse,
  lever: readLever,
  ashby: readAshby,
  smartrecruiters: readSmartRecruiters,
  workable: readWorkable,
  webpage: readWebpage,
};
