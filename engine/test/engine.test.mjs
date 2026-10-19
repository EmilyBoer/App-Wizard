import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  identifyWebsite, parseJobUrl, fetchAll, checkJobLink, dedupe, makeJob, jobPostingsFromHtml,
} from '../src/index.mjs';

const NOW = new Date('2026-10-19T12:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000).toISOString();

// A fake fetch: maps URL prefixes to bodies. Anything else is a 404.
function fakeFetch(routes) {
  return async (url) => {
    const hit = Object.keys(routes).find((prefix) => url.startsWith(prefix));
    if (!hit) return { ok: false, status: 404, text: async () => 'not found' };
    const body = routes[hit];
    return { ok: true, status: 200, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) };
  };
}

// Shapes follow each system's public list (Greenhouse checked against a live board).
const GREENHOUSE = {
  jobs: [
    { id: 111, title: 'Web Producer', company_name: 'Acme', location: { name: 'Remote - US' }, absolute_url: 'https://job-boards.greenhouse.io/acme/jobs/111', first_published: daysAgo(3), updated_at: daysAgo(1), application_deadline: null, content: '&lt;p&gt;Run our CMS &amp;amp; publishing.&lt;/p&gt;', metadata: [] },
    { id: 222, title: 'Content Designer', company_name: 'Acme', location: { name: 'Portland, OR' }, absolute_url: 'https://job-boards.greenhouse.io/acme/jobs/222', first_published: daysAgo(45), updated_at: daysAgo(2), application_deadline: null, content: '', metadata: [] },
  ],
};
const LEVER = [
  { id: 'abc-123', text: 'Digital Producer', categories: { location: 'New York, NY' }, workplaceType: 'hybrid', hostedUrl: 'https://jobs.lever.co/beta/abc-123', createdAt: Date.parse(daysAgo(20)), descriptionPlain: 'Ship pages.' },
];
const ASHBY = {
  jobs: [
    { id: 'u-1', title: 'Web Producer', location: 'Remote', isRemote: true, jobUrl: 'https://jobs.ashbyhq.com/acme/u-1', publishedAt: daysAgo(10), isListed: true, descriptionPlain: 'Same job, listed twice.' },
    { id: 'u-2', title: 'Hidden role', location: 'Remote', isRemote: true, jobUrl: 'https://jobs.ashbyhq.com/acme/u-2', publishedAt: daysAgo(1), isListed: false },
  ],
};
const CAREERS_PAGE = `<html><head><script type="application/ld+json">
  {"@context":"https://schema.org","@graph":[
    {"@type":"JobPosting","title":"Philanthropy Coordinator","datePosted":"${daysAgo(5)}","validThrough":"${daysAgo(-30)}",
     "hiringOrganization":{"name":"KXYZ Radio"},"jobLocation":{"address":{"addressLocality":"Portland","addressRegion":"OR"}},
     "url":"https://kxyz.example/jobs/1","description":"<p>Donor events.</p>"},
    {"@type":"JobPosting","title":"Closed Role","datePosted":"${daysAgo(60)}","validThrough":"${daysAgo(10)}",
     "hiringOrganization":{"name":"KXYZ Radio"},"url":"https://kxyz.example/jobs/2"}
  ]}</script></head><body></body></html>`;
const EMBED_PAGE = '<html><body><script src="https://boards.greenhouse.io/embed/job_board/js?for=acme"></script></body></html>';

const routes = {
  'https://boards-api.greenhouse.io/v1/boards/acme/jobs': GREENHOUSE,
  'https://api.lever.co/v0/postings/beta': LEVER,
  'https://api.ashbyhq.com/posting-api/job-board/acme': ASHBY,
  'https://kxyz.example/careers': CAREERS_PAGE,
  'https://acme.example/careers': EMBED_PAGE,
  'https://nothing.example/': '<html><body>No jobs here</body></html>',
};
const fetchImpl = fakeFetch(routes);

test('identifies hiring-system links directly', async () => {
  assert.deepEqual(
    (({ kind, source, board }) => ({ kind, source, board }))(await identifyWebsite('job-boards.greenhouse.io/acme', { fetchImpl })),
    { kind: 'board', source: 'greenhouse', board: 'acme' },
  );
  assert.equal((await identifyWebsite('https://jobs.lever.co/beta', { fetchImpl })).source, 'lever');
  assert.equal((await identifyWebsite('https://jobs.ashbyhq.com/acme', { fetchImpl })).source, 'ashby');
});

test('finds a hiring system embedded in a careers page', async () => {
  const r = await identifyWebsite('https://acme.example/careers', { fetchImpl });
  assert.equal(r.kind, 'board');
  assert.equal(r.source, 'greenhouse');
  assert.equal(r.board, 'acme');
});

test('reads job data from an ordinary careers page', async () => {
  const r = await identifyWebsite('https://kxyz.example/careers', { fetchImpl });
  assert.equal(r.kind, 'webpage');
  assert.equal(r.count, 2);
});

test('sends LinkedIn to email alerts and flags unreadable sites honestly', async () => {
  const li = await identifyWebsite('linkedin.com/jobs', { fetchImpl });
  assert.equal(li.kind, 'alerts');
  assert.match(li.suggestion, /forward them to your App Wizard inbox/);
  const none = await identifyWebsite('https://nothing.example/', { fetchImpl });
  assert.equal(none.kind, 'unsupported');
});

test('pulls, cleans, merges and sorts jobs from every source', async () => {
  const specs = [
    { source: 'greenhouse', board: 'acme' },
    { source: 'lever', board: 'beta' },
    { source: 'ashby', board: 'acme' },
    { kind: 'webpage', url: 'https://kxyz.example/careers' },
    { source: 'lever', board: 'missing' },
  ];
  const { jobs, report } = await fetchAll(specs, { fetchImpl, now: NOW });

  // The Greenhouse and Ashby "Web Producer" are one job, kept once.
  const producers = jobs.filter((j) => j.title === 'Web Producer');
  assert.equal(producers.length, 1);
  assert.equal(producers[0].alsoAt.length, 1);
  // Earliest posted date wins (Ashby listed it 10 days ago, Greenhouse 3).
  assert.equal(producers[0].ageDays, 10);

  // Unlisted Ashby roles and expired webpage roles never appear.
  assert.ok(!jobs.some((j) => j.title === 'Hidden role'));
  assert.ok(!jobs.some((j) => j.title === 'Closed Role'));

  // Freshness labels.
  assert.equal(jobs.find((j) => j.title === 'Content Designer').freshness, 'older');
  assert.equal(jobs.find((j) => j.title === 'Digital Producer').freshness, 'recent');
  assert.equal(jobs.find((j) => j.title === 'Philanthropy Coordinator').freshness, 'fresh');

  // Newest first.
  const ages = jobs.map((j) => j.ageDays);
  assert.deepEqual(ages, [...ages].sort((a, b) => a - b));

  // A bad board is reported, not fatal.
  const bad = report.find((r) => r.board === 'missing');
  assert.match(bad.error, /board not found/);

  // Descriptions are plain text.
  const gh = jobs.find((j) => j.title === 'Web Producer');
  assert.ok(!/[<>]/.test(gh.description));
});

test('max age filter drops older postings', async () => {
  const { jobs } = await fetchAll([{ source: 'greenhouse', board: 'acme' }], { fetchImpl, now: NOW, maxAgeDays: 30 });
  assert.deepEqual(jobs.map((j) => j.title), ['Web Producer']);
});

test('parses job links from each system', () => {
  assert.deepEqual(parseJobUrl('https://job-boards.greenhouse.io/acme/jobs/111'), { source: 'greenhouse', board: 'acme', jobId: '111' });
  assert.deepEqual(parseJobUrl('https://jobs.lever.co/beta/abc-123'), { source: 'lever', board: 'beta', jobId: 'abc-123' });
  assert.deepEqual(parseJobUrl('https://jobs.ashbyhq.com/acme/u-1'), { source: 'ashby', board: 'acme', jobId: 'u-1' });
  assert.equal(parseJobUrl('https://example.com/whatever'), null);
});

test('checks whether a job link is still open', async () => {
  const open = await checkJobLink('https://job-boards.greenhouse.io/acme/jobs/111', { fetchImpl, now: NOW });
  assert.equal(open.open, true);
  const old = await checkJobLink('https://job-boards.greenhouse.io/acme/jobs/222', { fetchImpl, now: NOW });
  assert.equal(old.open, true);
  assert.match(old.reason, /45 days ago/);
  const closed = await checkJobLink('https://job-boards.greenhouse.io/acme/jobs/999', { fetchImpl, now: NOW });
  assert.equal(closed.open, false);
  const unknown = await checkJobLink('https://example.com/jobs/1', { fetchImpl, now: NOW });
  assert.equal(unknown.open, null);
});

test('jobPostingsFromHtml handles arrays and bad JSON', () => {
  const html = '<script type="application/ld+json">not json</script><script type="application/ld+json">[{"@type":"JobPosting","title":"A"},{"@type":"Organization"}]</script>';
  assert.deepEqual(jobPostingsFromHtml(html).map((p) => p.title), ['A']);
});

test('dedupe keeps distinct jobs apart', () => {
  const a = makeJob({ source: 'lever', board: 'x', jobId: 1, company: 'X', title: 'Producer', location: 'NYC', postedAt: daysAgo(1) }, NOW);
  const b = makeJob({ source: 'lever', board: 'x', jobId: 2, company: 'X', title: 'Producer', location: 'Austin', postedAt: daysAgo(1) }, NOW);
  assert.equal(dedupe([a, b]).length, 2);
});
