import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { createApi } from '../core/api.mjs';

export function tmpDir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'aw-')); }

export const RESUME_TEXT = `Jordan Lee
Portland, OR · jordan@example.com
Content Strategist, Meridian Parks Foundation, Mar 2021 – present
- Moved the website to a new content system, about 400 pages, on schedule.
- Run the publishing calendar for 6 programs.
Web Producer, Quill & Co., 2017 – 2020
- Built and launched 30 landing pages in WordPress.`;

/** A fake Claude that answers each task with fixed, realistic JSON. */
export function fakeClaude(overrides = {}) {
  const calls = [];
  const answer = (system, content) => {
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    for (const [k, fn] of Object.entries(overrides)) if (system.includes(k)) return fn(system, content);
    if (system.includes('You sort and read files')) {
      if (text.includes('JOB POSTING')) return { kind: 'job_posting', summary: 'A job you want', text: 'Content Strategist at Lumen Public Radio. Own the website and CMS.', jobPosting: { title: 'Content Strategist', company: 'Lumen Public Radio' } };
      if (text.includes('LINKEDIN')) return { kind: 'linkedin', summary: 'Your LinkedIn profile', text: 'Jordan Lee LinkedIn. Content Strategist Meridian Parks Foundation Jan 2021 - Present. Trained 12 coworkers to publish their own pages.' };
      return { kind: 'resume', summary: 'Your 2026 resume, 2 roles', text: RESUME_TEXT };
    }
    if (system.includes('You combine someone')) {
      const ids = [...text.matchAll(/\[(m_[a-f0-9]+)\]/g)].map((m) => m[1]);
      return {
        contact: { name: 'Jordan Lee', email: 'jordan@example.com', location: 'Portland, OR' },
        summary: 'Content strategist who runs websites for mission-driven groups.',
        roles: [
          { company: 'Meridian Parks Foundation', title: 'Content Strategist', start: '2021-03', end: 'present', sources: [ids[0]], bullets: [{ text: 'Moved the website to a new content system, about 400 pages, on schedule.', sources: [ids[0]] }, { text: 'Run the publishing calendar for 6 programs.', sources: [ids[0]] }, { text: 'Wrote and edited weekly stories for the website.', sources: [ids[0]] }, { text: 'Set up the monthly traffic report in Looker Studio.', sources: [ids[0]] }] },
          { company: 'Quill & Co.', title: 'Web Producer', start: '2017', end: '2020', sources: [ids[0]], bullets: [{ text: 'Built and launched 30 landing pages in WordPress.', sources: [ids[0]] }, { text: 'Kept the style guide up to date.', sources: [ids[0]] }] },
        ],
        education: [{ school: 'Portland State University', degree: 'BA', field: 'English', year: '2012', sources: [ids[0]] }],
        certifications: [],
        skills: [{ name: 'WordPress', sources: [ids[0]] }, { name: 'Content strategy', sources: [ids[0]] }, { name: 'SEO', sources: [ids[0]] }],
        conflicts: [{ label: 'Start date at Meridian Parks Foundation', company: 'Meridian Parks Foundation', field: 'start', options: [{ value: '2021-03', source: ids[0] }, { value: '2021-01', source: ids[1] || 'linkedin' }] }],
        underselling: [{ text: 'Trained 12 coworkers to publish their own pages.', company: 'Meridian Parks Foundation', source: ids[1] || 'linkedin' }],
      };
    }
    if (system.includes('You describe how a person writes')) return { guide: ['Short sentences.', 'Plain words.'], sampleLine: 'I moved our website to a new system and taught people to publish on their own.', sampleFrom: 'b_x' };
    if (system.includes('help someone describe the job they want')) return { summary: 'What these have in common: running a website for a mission-driven employer.', suggestedTitles: ['Website Manager', 'Editorial Manager'], ambiguous: [{ word: 'Development', meanings: ['Fundraising', 'Building software'] }], keywords: ['website', 'cms', 'content strategy', 'editorial calendar'], level: 'senior', payRange: '$85k to $105k' };
    if (system.includes('You judge whether a job fits')) {
      const bid = (text.match(/"id":"(b_[a-f0-9]+)"/) || [])[1];
      return { mustHaves: [{ want: 'Own the website', bulletId: bid, fit: 'direct' }, { want: 'Analytics dashboards', bulletId: 'b_fake', fit: 'direct' }], qualified: { ok: true, note: '' }, direction: { label: 'core', note: '' }, mission: { label: 'love', note: '' }, practical: { ok: true, note: '' }, verdict: 'strong', why: 'You run websites like this now.', gapQuestions: [] };
    }
    if (system.includes('You tailor a resume')) {
      const roles = JSON.parse(text.split('Profile: ').pop()).roles;
      return {
        summary: 'Content strategist who runs websites for mission-driven groups.',
        roles: roles.map((r, i) => ({ roleId: r.id, bullets: r.bullets.map((b, j) => ({ from: b.id, text: i === 0 && j === 0 ? 'Moved the website, 500 pages, to a new system.' : b.text, relevance: 5 - j })) })).concat([{ roleId: 'r_fake', bullets: [] }]),
        skills: ['WordPress', 'Kubernetes', 'SEO'], keywordsUsed: ['website'],
      };
    }
    if (system.includes('You write a cover letter')) {
      const bid = (text.match(/"id":"(b_[a-f0-9]+)"/) || [])[1];
      return { greeting: 'Dear Hiring Team,', paragraphs: ['Your post about growing the website caught my eye.', 'At Meridian I moved about 400 pages to a new system on schedule.', 'I am passionate about this.'], closing: 'Thank you,', factsUsed: [bid] };
    }
    if (system.includes('interview cheat sheet')) return { company: { about: 'A public radio station.', recent: [], values: [] }, role: { focus: 'Run the website', theyNeed: [] }, pitch: 'I run websites.', questions: [{ q: 'Tell me about a migration.', answer: 'The 400 page move.', from: ['b_nope'] }], askThem: ['What does success look like?'], watchOuts: [] };
    if (system.includes('App Wizard helper')) return { reply: 'Nice. Want me to add that?', proposals: [{ type: 'add_bullet', company: 'Meridian Parks Foundation', text: 'Built a monthly analytics report in Looker Studio.' }] };
    if (system.includes('preference rules')) return { rules: [{ text: "We'll rank public media jobs higher.", kind: 'boost', pattern: 'public radio', evidence: 3 }] };
    if (system.includes('resume design')) return { columns: 2, sidebar: 'left', fonts: ['Brice', 'Open Sans'], accent: '#1f4e79', sections: [], decorations: ['skill bars'], looksLike: 'modern' };
    if (system.includes('application question')) return { needsYou: true, why: 'This is personal.' };
    throw new Error('fakeClaude: no answer for ' + system.slice(0, 60));
  };
  const factory = () => ({
    ready: true,
    calls,
    json: async ({ system, content }) => { calls.push(system.slice(0, 40)); return structuredClone(answer(system, content)); },
    send: async () => 'OK',
  });
  factory.calls = calls;
  return factory;
}

const GH = {
  jobs: [
    { id: 101, title: 'Website Manager', absolute_url: 'https://boards.greenhouse.io/lumen/jobs/101', location: { name: 'Remote (US)' }, updated_at: new Date().toISOString(), first_published: new Date(Date.now() - 2 * 864e5).toISOString(), content: '&lt;p&gt;Lumen Public Radio is a nonprofit public radio station. Own the website and CMS. Run the editorial calendar. $95,000 - $115,000.&lt;/p&gt;', company_name: 'Lumen Public Radio' },
    { id: 102, title: 'Development Content Writer', absolute_url: 'https://boards.greenhouse.io/lumen/jobs/102', location: { name: 'Portland, OR' }, updated_at: new Date().toISOString(), first_published: new Date(Date.now() - 5 * 864e5).toISOString(), content: '&lt;p&gt;Write donor appeals and grant reports for our fundraising team. $70,000 - $80,000.&lt;/p&gt;', company_name: 'Lumen Public Radio' },
    { id: 103, title: 'Account Executive', absolute_url: 'https://boards.greenhouse.io/lumen/jobs/103', location: { name: 'Remote' }, updated_at: new Date().toISOString(), first_published: new Date().toISOString(), content: '&lt;p&gt;Sell sponsorships. Monthly quota.&lt;/p&gt;', company_name: 'Lumen Public Radio' },
    { id: 104, title: 'Senior Web Producer', absolute_url: 'https://boards.greenhouse.io/lumen/jobs/104', location: { name: 'Remote' }, updated_at: new Date().toISOString(), first_published: new Date(Date.now() - 1 * 864e5).toISOString(), content: '&lt;p&gt;Build pages in our CMS, keep the website fresh, content strategy. $98,000 - $112,000.&lt;/p&gt;', company_name: 'Lumen Public Radio' },
  ],
};

export function fakeFetch() {
  return async (url) => {
    url = String(url);
    if (url.includes('boards-api.greenhouse.io/v1/boards/lumen/jobs')) return json(GH);
    if (url.includes('boards-api.greenhouse.io')) return json({}, 404);
    return { ok: false, status: 404, statusText: 'Not found', text: async () => '', json: async () => ({}), headers: new Map() };
  };
}
function json(body, status = 200) { return { ok: status < 400, status, statusText: 'OK', json: async () => body, text: async () => JSON.stringify(body), headers: new Map([['content-type', 'application/json']]) }; }

export function newApi(opts = {}) {
  const base = tmpDir();
  const factory = opts.claude || fakeClaude();
  const api = createApi({ base, fetchImpl: opts.fetchImpl || fakeFetch(), claudeFactory: factory });
  return { api, base, factory };
}

/** Build a tiny .docx (just document.xml) for tests. */
export function makeDocx(paragraphs) {
  const xml = `<?xml version="1.0"?><w:document xmlns:w="x"><w:body>${paragraphs.map((p) => `<w:p>${p.startsWith('- ') ? '<w:pPr><w:numPr></w:numPr></w:pPr>' : ''}<w:r><w:t xml:space="preserve">${p.replace(/^- /, '')}</w:t></w:r></w:p>`).join('')}</w:body></w:document>`;
  return zipOne('word/document.xml', Buffer.from(xml));
}

function zipOne(name, data) {
  const comp = zlib.deflateRawSync(data);
  const nameBuf = Buffer.from(name);
  const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8); local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(nameBuf.length, 26);
  const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(8, 10); central.writeUInt32LE(comp.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(nameBuf.length, 28); central.writeUInt32LE(0, 42);
  const localPart = Buffer.concat([local, nameBuf, comp]);
  const centralPart = Buffer.concat([central, nameBuf]);
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10); end.writeUInt32LE(centralPart.length, 12); end.writeUInt32LE(localPart.length, 16);
  return Buffer.concat([localPart, centralPart, end]);
}
