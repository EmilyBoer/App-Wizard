// The demo person and their search. Jordan Ellis is fictional, and so are the three employers
// on their resume. The jobs are real postings that were open in November 2026 (links can close);
// Jordan's applications to them are made up for the demo.

export const PERSON = {
  name: 'Jordan Ellis',
  email: 'jordan.ellis@example.com',
  password: 'MargoDemo2026',
  phone: '(503) 555-0148',
  location: 'Portland, OR',
  linkedin: 'linkedin.com/in/jordan-ellis-margo-demo',
  website: 'jordanellis.example.com',
};

export const BLANK = { name: 'Sam Rivera', email: 'sam.rivera@example.com', password: 'MargoBlank2026' };

export const SUMMARY = 'Senior content strategist who builds content programs for B2B software companies: the strategy, the editorial calendar, and the systems that let a small team publish like a big one. I write the high-stakes pieces myself and tie every piece to pipeline.';

export const ROLES = [
  {
    company: 'Tidewater Software', title: 'Senior Content Strategist', start: '2021-04', end: 'present', location: 'Remote',
    bullets: [
      'Built the content strategy and editorial calendar for a 6-person team publishing 3 long-form pieces a week.',
      'Grew organic blog traffic from 40K to 210K monthly visits in 2 years.',
      'Launched the Ops Notes newsletter and grew it to 38,000 subscribers with a 46% open rate.',
      'Ghostwrote 60+ LinkedIn posts and 12 essays for the CEO and CTO.',
      'Rebuilt 300 help-center articles around search data, cutting support tickets by 18%.',
      'Ran the customer story program: 24 case studies, each sourced, interviewed and written in-house.',
      'Set up the content dashboard in Looker Studio that ties every piece to pipeline.',
      'Wrote the voice and style guide used by 40 marketers, product writers and freelancers.',
      'Started a short-form video series with product marketing that reached 1.2M views on LinkedIn and X.',
    ],
  },
  {
    company: 'Canopy Commerce', title: 'Content Strategist', start: '2019-01', end: '2021-03', location: 'Seattle, WA',
    bullets: [
      'Planned and shipped the content for 4 product launches, from landing pages to launch emails.',
      'Moved 1,100 pages from WordPress to Contentful with no loss in search rankings.',
      'Grew the brand’s LinkedIn following from 9K to 52K with a weekly video series.',
      'Managed a bench of 15 freelance writers and editors.',
      'Created the SEO brief template that cut editing time per article by a third.',
    ],
  },
  {
    company: 'Fieldnote Media', title: 'Content Producer', start: '2017-06', end: '2018-12', location: 'Portland, OR',
    bullets: [
      'Produced 5 stories a week across web, newsletter and social.',
      'Ran show notes and clips for the Fieldnote podcast; 2 episodes reached the Apple Podcasts Technology top 100.',
      'Edited guest essays from 30+ outside contributors.',
    ],
  },
];

// Found on LinkedIn but missing from the resume; Jordan said yes to adding it.
export const UNDERSELLING = { company: 'Tidewater Software', text: 'Mentored 3 junior writers, 2 of whom were promoted to content strategist.' };

export const SKILLS = ['Content strategy', 'Editorial calendars', 'SEO', 'Answer-engine optimization (AEO)', 'Ghostwriting', 'Newsletter growth', 'Customer stories', 'Style guides', 'Social media strategy', 'Short-form video', 'Contentful', 'WordPress', 'Webflow', 'HubSpot', 'Looker Studio', 'Google Analytics 4', 'Figma'];
export const EDUCATION = { school: 'University of Oregon', degree: 'BA', field: 'Journalism', year: '2017' };
export const CERTS = [{ name: 'HubSpot Content Marketing Certification', year: '2024' }, { name: 'Google Analytics 4 Certification', year: '2023' }];

export const RESUME_TEXT = [
  `${PERSON.name}`,
  `${PERSON.location} · ${PERSON.email} · ${PERSON.phone} · ${PERSON.linkedin}`,
  '',
  SUMMARY,
  '',
  ...ROLES.flatMap((r) => [`${r.title}, ${r.company}, ${r.location}, ${r.start} – ${r.end}`, ...r.bullets.map((b) => `- ${b}`), '']),
  `Education: ${EDUCATION.degree}, ${EDUCATION.field}, ${EDUCATION.school}, ${EDUCATION.year}`,
  `Certifications: ${CERTS.map((c) => `${c.name} (${c.year})`).join('; ')}`,
  `Skills: ${SKILLS.join(', ')}`,
].join('\n');

export const LINKEDIN_TEXT = `Jordan Ellis · Senior Content Strategist at Tidewater Software · Portland, Oregon
About: I build content programs that make small teams sound big, and I still write the hard pieces myself.
Experience
Senior Content Strategist, Tidewater Software, Apr 2021 – Present
- ${UNDERSELLING.text}
- Grew the blog from 40K to 210K monthly visits.
Content Strategist, Canopy Commerce, Jan 2019 – Mar 2021
Content Producer, Fieldnote Media, Jun 2017 – Dec 2018
Education: University of Oregon, BA Journalism`;

export const WRITING_SAMPLE = `Subject: What we learned from 18 months of Ops Notes

Short version: people read the newsletter because it is useful on a Tuesday morning, not because it is clever.

We tried a lot. Long essays did fine. Hot takes did badly. The issues that won every time were the ones where an ops lead could copy something straight into their own work: a checklist, a template, a before-and-after.

So that is the plan for next year. One useful thing per issue, said plainly, with a real example from a real customer. If we can't name the example, we don't run the piece.

Happy to walk anyone through the numbers.`;

export const LETTER_SAMPLE = `Dear Hiring Team,

Your post says you want someone who can "make the complicated feel obvious." That has been most of my job for the last five years.

At Tidewater I rebuilt our help center around what people actually searched for, and support tickets dropped. I also run a newsletter that ops leads read on purpose, which is rarer than it should be.

I'd like to do the same work for your customers. Thank you for reading.

Jordan Ellis`;

export const ANSWERS = [
  ['salary', 'What are your salary expectations?', '$150,000 to $175,000 base, depending on the full package.'],
  ['relocate', 'Are you willing to relocate?', 'No'],
  ['relocateCities', 'Where would you relocate?', ''],
  ['start', 'Estimated earliest start date', 'Two weeks after an offer'],
  ['authorized', 'Are you legally authorized to work in the United States?', 'Yes'],
  ['sponsorship', 'Will you now or in the future require visa sponsorship?', 'No'],
  ['portfolio', 'Portfolio or website', PERSON.website],
  ['linkedinUrl', 'LinkedIn profile', `https://${PERSON.linkedin}`],
  ['hearAbout', 'How did you hear about this role?', 'The company’s careers page'],
  ['remoteSetup', 'Do you have a home office set up for remote work?', 'Yes, with a dedicated desk and fast internet.'],
  ['timezone', 'What time zone do you work in?', 'Pacific (PT). Happy to overlap with Eastern mornings.'],
];

const DAY = 864e5;
const at = (iso) => new Date(iso).toISOString();

// Real postings. Descriptions are short summaries of each listing, not copies.
export const JOBS = [
  {
    key: 'a16z', company: 'Andreessen Horowitz', board: 'a16z', jobId: '8042143003', title: 'Partner 20, Social Media Lead, Frontier',
    location: 'United States (Remote)', postedAt: at('2026-10-22T17:00:00Z'),
    url: 'https://jobs.a16z.com/jobs/andreessen-horowitz/8042143003--partner-20-social-media-lead-frontier',
    description: `Partner 20, Social Media Lead, Frontier at Andreessen Horowitz (a16z)
Remote, United States, with West Coast hours and occasional travel for offsites and events. $199,000 - $232,000, plus carry and bonus eligibility.
Grow a16z Frontier's social channels and be its online brand voice. Adapt existing content (podcast appearances, investment announcements, events, editorial pieces) into social posts, and create social-native content like clips and campaigns. Test content ideas with the audience development lead and report what works. Oversee the short-form clips operation. Advise the Frontier team and portfolio companies on social strategy. The role reports into editorial.
Looking for: hands-on experience owning social for a high-growth brand; range across text, video and design; adapting voice across platforms and audiences; strong with analytics; works well across teams; curious about technology. Experience inside a content operation is especially welcome.`,
    status: 'interviewing', applied: '2026-10-27T16:20:00Z',
  },
  {
    key: 'webflow', company: 'Webflow', board: 'webflow', jobId: 'content-strategy-orchestration-lead', title: 'Content Strategy & Orchestration Lead',
    location: 'United States (Remote)', postedAt: at('2026-11-16T17:00:00Z'),
    url: 'https://remowork.life/jobs/6afba5f55199c1ff1b0eeb77/content-strategy-and-orchestration-lead',
    description: `Content Strategy & Orchestration Lead at Webflow
Remote, United States. $150,000 - $224,000. A new position reporting to the Director of Brand Engagement.
Shape Webflow's editorial direction and write the stories that bring it to life. Translate audience needs, Webflow's point of view and business priorities into a clear content strategy and editorial calendar, and orchestrate content across channels with brand, product marketing and social.
Looking for: 8+ years in content marketing, editorial or content strategy, ideally in B2B SaaS, and a portfolio of published long-form and short-form work.`,
    status: 'applied', applied: '2026-11-18T18:05:00Z',
  },
  {
    key: 'zillow-agents', company: 'Zillow', board: 'zillow', jobId: 'senior-content-strategist-agents', title: 'Senior Content Strategist, Zillow For Agents',
    location: 'United States (Remote)', postedAt: at('2026-11-05T17:00:00Z'),
    url: 'https://dailyremote.com/remote-content-strategist-jobs',
    description: `Senior Content Strategist at Zillow (Zillow For Agents)
Remote, United States. $89,200 - $150,000.
Lead the social and content strategy for Zillow For Agents: social-first content for real estate professionals, community building, influencer and ambassador programs, and working across teams to amplify agents' voices. Strong writing and storytelling that makes complex topics approachable. 5 to 10 years of experience.`,
    status: 'applied', applied: '2026-11-09T19:40:00Z',
  },
  {
    key: 'zillow-studio', company: 'Zillow', board: 'zillow', jobId: 'senior-content-manager-studio-z', title: 'Senior Content Manager, Studio Z (Search and AI Discovery)',
    location: 'United States (Remote)', postedAt: at('2026-11-04T18:32:05Z'),
    url: 'https://www.themuse.com/jobs/zillow/senior-content-manager',
    description: `Senior Content Manager at Zillow, Studio Z
Remote, United States. Full-time individual contributor reporting to the director of Studio Z Content. $120,000 - $175,000.
Lead the Content team's work in search and AI-powered discovery: content strategy shaped by SEO and generative engine optimization (GEO), using performance data to improve the work and show its value. Minimum of 7 years of related experience.`,
    status: 'ready',
  },
  {
    key: 'lightfield', company: 'Lightfield', board: 'Lightfield', jobId: 'b7b4cc0a-fd54-4b85-a065-e98f0978924d', title: 'Head of Content',
    location: 'San Francisco, CA (On-site)', postedAt: at('2026-08-19T17:00:00Z'),
    url: 'https://jobs.a16z.com/jobs/lightfield/b7b4cc0a-fd54-4b85-a065-e98f0978924d--head-of-content',
    description: `Head of Content at Lightfield (an a16z portfolio company)
Full-time, on-site in San Francisco. $210,000 - $260,000 plus equity.
Build the content engine: founder thought leadership, customer stories, SEO and AI answer-engine visibility, newsletters and a creator program. Build the editorial calendar, briefs, standards and a bench of outside writers, and still write the high-stakes pieces yourself. Reports to the Head of GTM.`,
    status: 'skipped',
  },
];

// Fresh matches Jordan hasn't acted on yet (real postings, November 2026).
JOBS.push(
  {
    key: 'webflow-social', company: 'Webflow', board: 'webflow', jobId: 'social-media-lead', title: 'Social Media Lead',
    location: 'United States (Remote)', postedAt: at('2026-11-20T17:00:00Z'),
    url: 'https://www.builtinboston.com/job/social-media-lead/6732807',
    description: `Social Media Lead at Webflow
Remote, United States. Full-time. $121,000 - $219,000.
Lead Webflow's social strategy across LinkedIn, X, Instagram, YouTube and emerging platforms: how the brand shows up, what stories it tells and how the audience grows. Drive always-on content and product and brand moments, and work across teams so the best ideas break through. 7 to 10 years in social media, brand storytelling or digital content strategy.`,
    status: 'new',
  },
  {
    key: 'zillow-social', company: 'Zillow', board: 'zillow', jobId: 'senior-specialist-corporate-social', title: 'Senior Specialist, Corporate Social Media & Content Strategy',
    location: 'United States (Remote)', postedAt: at('2026-11-08T17:00:00Z'),
    url: 'https://www.builtincolorado.com/job/senior-specialist-corporate-social-media/8646276',
    description: `Senior Specialist, Corporate Social Media & Content Strategy at Zillow
Remote, United States. Full-time. $86,000 - $145,000.
Shape how Zillow shows up on LinkedIn, Instagram, YouTube and emerging platforms: platform-native storytelling that connects the brand, business priorities and culture. Own day-to-day content planning, publishing and approvals on corporate channels. Sits on the Communications team. 5+ years in social media, digital communications or content strategy.`,
    status: 'new',
  },
  {
    key: 'elastic', company: 'Elastic', board: 'elastic', jobId: 'regional-content-strategist-public-sector', title: 'Regional Content Strategist, Global Public Sector',
    location: 'United States (Remote)', postedAt: at('2026-11-21T17:00:00Z'),
    url: 'https://stillopen.work/remote-content-and-media-jobs',
    description: `Regional Content Strategist, Global Public Sector at Elastic
Remote, United States. Full-time. $89,100 - $140,900.
Plan and write content for Elastic's public sector audience: thought leadership, customer stories and campaign content for government and education buyers, working with field marketing and sales. B2B software content experience.`,
    status: 'new',
  },
);

// Why each job fits (what Margo's matching would say), by job key.
export const FIT = {
  a16z: { verdict: 'good', why: 'You’ve owned social and short-form for a fast-growing brand and you work inside a content operation, which they call out. The stretch: your social work has been B2B software, not crypto or deep tech.', direction: { label: 'stretch', note: 'More social-led than your current role.' }, mission: { label: 'love', note: 'Technology and founders.' }, needs: ['Owning social for a high-growth brand', 'Short-form clips', 'Analytics', 'Adapting voice across platforms'], gaps: ['Have you posted as a brand on X, not just LinkedIn?'] },
  webflow: { verdict: 'strong', why: 'This is your job now, at a bigger brand: content strategy, the editorial calendar and writing the stories, for a B2B SaaS audience. You have the 8+ years they ask for.', direction: { label: 'core', note: '' }, mission: { label: 'love', note: 'B2B SaaS.' }, needs: ['Content strategy', 'Editorial calendar', 'Long- and short-form writing', 'B2B SaaS'], gaps: [] },
  'zillow-agents': { verdict: 'good', why: 'You’ve grown audiences and run creator-style video for B2B buyers, which maps well to agents. It pays less than you want at the top of the range.', direction: { label: 'core', note: '' }, mission: { label: 'fine', note: 'Real estate is new to you.' }, needs: ['Social-first content', 'Community building', 'Storytelling'], gaps: ['Any experience with ambassador or influencer programs?'] },
  'zillow-studio': { verdict: 'strong', why: 'You rebuilt 300 help articles around search data and grew organic traffic fivefold. They want exactly that, applied to AI-powered search.', direction: { label: 'core', note: '' }, mission: { label: 'fine', note: '' }, needs: ['SEO and GEO', 'Performance data', 'Content strategy'], gaps: [] },
  'webflow-social': { verdict: 'good', why: 'You’ve grown LinkedIn from 9K to 52K and run a short-form series, for a B2B software audience like Webflow’s. They want 7 to 10 years focused on social; yours is broader content.', direction: { label: 'stretch', note: 'More social-led than your current role.' }, mission: { label: 'love', note: 'B2B SaaS.' }, needs: ['Social strategy across platforms', 'Audience growth', 'Brand storytelling'], gaps: [] },
  'zillow-social': { verdict: 'good', why: 'Platform-native storytelling and owning a content calendar are what you do now. The top of the range is close to your floor.', direction: { label: 'core', note: '' }, mission: { label: 'fine', note: '' }, needs: ['Content planning and publishing', 'LinkedIn', 'Storytelling'], gaps: [] },
  elastic: { verdict: 'good', why: 'B2B software content, customer stories and thought leadership are your core work. Public sector buyers are new to you.', direction: { label: 'core', note: '' }, mission: { label: 'fine', note: 'Government and education buyers.' }, needs: ['B2B content strategy', 'Customer stories', 'Thought leadership'], gaps: ['Have you written for government buyers before?'] },
  lightfield: { verdict: 'stretch', why: 'Strong on the work, but it’s on-site in San Francisco and you only want remote.', direction: { label: 'reach', note: 'Head of Content is a step up.' }, mission: { label: 'love', note: '' }, needs: ['Founder thought leadership', 'Customer stories', 'SEO and AEO'], gaps: [] },
};

// Cover letters in Jordan's voice. {n} markers are checked against real bullets by Margo.
export const LETTERS = {
  a16z: ['Frontier’s feed already has the hard part: smart people saying new things. The job, as I read it, is getting those ideas to the people who should hear them, in the shape each platform rewards.',
    'At Tidewater I started a short-form video series with product marketing that reached 1.2M views on LinkedIn and X, cut almost entirely from longer pieces we had already made. I also ghostwrote 60+ LinkedIn posts and 12 essays for our CEO and CTO, so I’m used to sounding like someone else and keeping their edge.',
    'I work inside the content operation, not next to it. I set up the dashboard that ties every piece to pipeline, and I’d bring the same habit to Frontier: test a format, look at what happened, keep what works.',
    'I’d love to talk about where you want Frontier’s voice to go next.'],
  webflow: ['“Shape the editorial direction and write the stories that bring it to life” is the job I’ve been doing at Tidewater, and the part I like most is that it’s both.',
    'I built our content strategy and editorial calendar for a 6-person team publishing 3 long-form pieces a week. Organic blog traffic grew from 40K to 210K monthly visits in 2 years, and the Ops Notes newsletter grew to 38,000 subscribers with a 46% open rate.',
    'Before that I moved 1,100 pages from WordPress to Contentful at Canopy Commerce, so I know what it takes to keep a big site coherent while the story changes. Webflow’s audience builds for the web for a living; I’d write for them the way I’d want to be written for.',
    'Thank you for reading. I’d be glad to share the pieces I’m proudest of.'],
  'zillow-agents': ['Agents are small businesses with a phone in one hand. Content for them has to be useful in the time it takes to park the car.',
    'At Canopy Commerce I grew the brand’s LinkedIn following from 9K to 52K with a weekly video series, and at Tidewater I ran 24 customer stories from first call to publish. Both taught me the same thing: people share content that makes them look good to their own audience.',
    'I’d bring that to Zillow For Agents, with a plan built around what agents already post and the questions their clients ask.',
    'Thanks for considering me.'],
  'zillow-studio': ['Search is turning into answers, and the brands that get cited are the ones that wrote the clearest page on the subject. That’s the work this role describes, and it’s the work I like best.',
    'At Tidewater I rebuilt 300 help-center articles around search data, cutting support tickets by 18%, and grew organic blog traffic from 40K to 210K monthly visits in 2 years. I set up the Looker Studio dashboard that ties every piece to pipeline, so performance data is how I argue for the work.',
    'I’d bring the same rigor to Studio Z’s search and AI discovery content, and I’d write a lot of it myself.',
    'Thank you for your time.'],
};

export const CHEAT = {
  talkingPoints: [
    'I already work the way this role is described: inside a content operation, turning long pieces into social that travels.',
    'I test and measure. Every piece I publish is tied to pipeline in a dashboard I built.',
    'I can sound like someone else and keep their edge: years of ghostwriting for our CEO and CTO.',
  ],
  company: {
    about: 'Andreessen Horowitz (a16z) is a venture capital firm that backs technology founders. Frontier is one of its focus areas, with its own editorial and social presence.',
    recent: ['The posting describes an editorial content operation with podcasts, investment announcements and events to draw from.', 'Social Media Lead roles were posted across several a16z teams this fall, so social is a firm-wide push.', 'The role reports into editorial, not marketing.'],
    values: ['Being always online and current on internet culture', 'Both strategizing and building hands-on', 'Low ego, high empathy', 'Learning constantly'],
  },
  role: {
    focus: 'Be Frontier’s voice online: turn what the firm already says into social that travels, and run the clips operation.',
    theyNeed: [
      { need: 'Owned social for a high-growth brand', match: '1.2M views' },
      { need: 'Short-form video and clips', match: '1.2M views' },
      { need: 'Analytics and testing', match: 'Looker Studio' },
      { need: 'Range of voice across platforms', match: 'Ghostwrote' },
      { need: 'Working inside a content operation', match: '6-person team' },
      { need: 'Advising others on their social presence', match: '' },
    ],
  },
  pitch: 'I’m a content strategist who works more and more on the social end of things. At Tidewater I run the content program and started a short-form video series that reached 1.2M views on LinkedIn and X, mostly cut from pieces we’d already made. And I’m good at sounding like someone else: I’ve ghostwritten for our CEO and CTO for years.',
  pitchLong: 'I started as a content producer at Fieldnote Media, making five stories a week and running clips for our podcast. That’s where I learned that the best social starts as something longer. At Canopy Commerce I grew our LinkedIn from 9K to 52K with a weekly video series and managed a bench of freelance writers. For the last five years at Tidewater I’ve run the content program for a 6-person team: the strategy, the calendar, the newsletter, and the dashboard that ties it all to pipeline. The short-form series I started there reached 1.2M views. Frontier’s role is the part of my job I like most, done for an audience I care about: founders and the people building new technology.',
  stories: [
    { title: 'The short-form series', match: '1.2M views', situation: 'We published 3 long pieces a week and almost nobody saw them on social.', action: 'With product marketing, I started cutting 30 to 60 second clips from pieces we already had, tested hooks each week and kept a running list of what worked.', result: 'The series reached 1.2M views on LinkedIn and X.', usefulFor: ['a program you built', 'creativity', 'working across teams'] },
    { title: 'Ghostwriting for the founders', match: 'Ghostwrote', situation: 'Our CEO and CTO had strong opinions and no time to post.', action: 'I interviewed them for 20 minutes a week, kept their phrases, drafted, and let them cut anything that didn’t sound like them.', result: '60+ LinkedIn posts and 12 essays, all in their voices.', usefulFor: ['voice', 'working with executives', 'taking feedback'] },
    { title: 'The dashboard that ended the argument', match: 'Looker Studio', situation: 'Leadership saw content as a cost with no clear return.', action: 'I built a Looker Studio dashboard that tied every piece to pipeline and reviewed it monthly with sales.', result: 'Every piece is now measured the same way, and we cut formats that didn’t pull their weight.', usefulFor: ['data', 'testing', 'influencing without authority'] },
    { title: 'Growing LinkedIn from 9K to 52K', match: '9K to 52K', situation: 'Canopy’s LinkedIn was a place for press releases.', action: 'I launched a weekly video series with real merchants and a consistent format.', result: 'Followers grew from 9K to 52K.', usefulFor: ['audience growth', 'consistency', 'community'] },
    { title: 'Help center rebuilt around search', match: '300 help-center', situation: 'Customers couldn’t find answers, so they filed tickets.', action: 'I rewrote 300 articles around what people actually searched for.', result: 'Support tickets dropped 18%.', usefulFor: ['a failure you fixed', 'research', 'clear writing'] },
  ],
  questions: [
    { category: 'About you', q: 'Walk us through your background.', answer: 'Use the two-minute version: Fieldnote, Canopy, Tidewater, then why Frontier.', match: '1.2M views' },
    { category: 'About you', q: 'Why this role, and why a16z?', answer: 'It’s the part of my job I like best, at a place that already makes great long-form. The job is distribution, and I know how to do that well.', match: '' },
    { category: 'The role', q: 'Tell us about a social program you built from scratch.', answer: 'The short-form series: why we started, how we picked clips, what reached 1.2M views and what flopped.', match: '1.2M views' },
    { category: 'The role', q: 'How would you run the clips operation?', answer: 'A weekly rhythm: pick from what editorial already made, cut 3 versions of each hook, post, review on Friday, keep what works.', match: '1.2M views' },
    { category: 'The role', q: 'How would you adapt a long essay for X versus LinkedIn?', answer: 'X: the sharpest single claim, a thread only if the argument needs it. LinkedIn: the story behind it, with a clear takeaway.', match: '' },
    { category: 'How you work', q: 'How do you decide what to test, and how do you know it worked?', answer: 'One hypothesis a week, one metric that matters, keep or kill after two weeks. The dashboard makes it visible to everyone.', match: 'Looker Studio' },
    { category: 'How you work', q: 'How do you write as someone else?', answer: 'Interview first, keep their phrases, never put words in their mouth they wouldn’t say. Then let them cut.', match: 'Ghostwrote' },
    { category: 'How you work', q: 'How would you work with editorial?', answer: 'Social adapts editorial’s work, it doesn’t compete with it. Shared rules make speed possible, like the style guide used by 40 people at Tidewater.', match: 'style guide' },
    { category: 'How you work', q: 'Tell us about a time something didn’t work.', answer: 'Hot takes on the newsletter did badly. I said so, showed the numbers, and we moved to one useful thing per issue.', match: '38,000' },
    { category: 'The company', q: 'Which accounts in tech do you admire, and why?', answer: 'Pick two you genuinely follow. Say what they do well in one line each, and one thing you’d borrow.', match: '' },
    { category: 'The company', q: 'What would you do in your first 30 days?', answer: 'Listen and audit: what Frontier has already made, what has worked, who the voices are. Ship small tests in week two.', match: '' },
  ],
  tough: [
    { q: 'You haven’t worked in venture or crypto. Why should we take that risk?', answer: 'Say it plainly: I haven’t. I learn audiences fast; at Canopy I learned merchants from zero. The skill here is distribution, and that transfers.' },
    { q: 'Your X experience looks lighter than your LinkedIn.', answer: 'True. Name what you’d try in month one and how you’d measure it. Don’t overclaim.' },
    { q: 'This is a step toward social and away from strategy. Is that what you want?', answer: 'Yes: strategy is still the job, just aimed at distribution. Owning a channel end to end is what I want next.' },
    { q: 'What’s your biggest weakness?', answer: 'I can hold onto a format too long because I like it. The dashboard keeps me honest.' },
  ],
  askThem: [
    { category: 'The role', q: 'What does a great first 90 days look like for Frontier’s social?' },
    { category: 'The role', q: 'How do the clips get made today, and what slows them down?' },
    { category: 'The team', q: 'Who would I work with most closely, day to day?' },
    { category: 'The team', q: 'How does editorial decide what to make, and where does social come in?' },
    { category: 'Success', q: 'How will you know, a year from now, that this hire worked?' },
    { category: 'Success', q: 'Which accounts do you admire, inside or outside venture?' },
    { category: 'The company', q: 'How does the team decide what to stop doing?' },
  ],
  pay: 'Posted range is $199,000 to $232,000 plus carry and bonus. Your saved answer is $150,000 to $175,000, which is below this range. If asked, say you’re comfortable within their posted range and want to learn more about the full package. Don’t name a number first.',
  closing: 'Thank you. From everything we talked about, this is the work I want to be doing, and I think I can make Frontier’s ideas travel further from week one.',
  thankYou: 'Hi [Name],\n\nThank you for the time today. I enjoyed hearing how Frontier works with editorial, and the clips question has stuck with me: I’d start by cutting three hooks from the last month’s pieces and seeing which one travels.\n\nIf it would help, I’m happy to share a few examples from the series we built at Tidewater.\n\nThanks again,\nJordan',
  watchOuts: ['Crypto and deep tech are new to you. Say so, and show how fast you learned Canopy’s merchant audience.', 'Your X experience is lighter than LinkedIn. Be specific about what you’d try in the first month.', 'Don’t talk about Tidewater’s numbers as yours alone: say “we” for team results.'],
};

export const VOICE = {
  guide: ['Short sentences. One idea each.', 'Starts with the reader’s problem, not with “I”.', 'Concrete numbers, never adjectives about results.', 'Dry humor, a little, never at anyone’s expense.', 'Plain words: “use”, not “leverage”.', 'Ends with a simple next step.', 'No exclamation points in professional writing.'],
  sampleLine: 'I rebuilt our help center around what people actually searched for, and support tickets dropped 18%.',
};

export const WANT = {
  titles: ['Senior Content Strategist', 'Content Strategy Lead', 'Head of Content', 'Senior Content Marketing Manager', 'Editorial Lead'],
  suggestedTitles: [{ title: 'Content Design Lead', why: 'Your help-center and style guide work', kept: false }, { title: 'Social Media Lead', why: 'Your short-form and LinkedIn growth', kept: true }],
  where: ['Remote'], jobType: ['Full-time'], payFloor: 140000, maxAgeDays: 45,
  places: { 'Tech company': 'Love', Finance: 'Fine', Health: 'Fine', Education: 'Fine', Agency: 'Avoid', Nonprofit: 'Fine' },
  work: ['Strategy and planning', 'Writing and editing', 'Social media'],
  dealBreakers: ['Sales targets', 'Relocation'],
  summary: 'Your sweet spot: senior content strategy at a B2B software company, owning the editorial calendar and writing the important pieces yourself, fully remote.',
  reachNote: 'The reach adds a step up to running the whole content function.',
  keywords: ['content strategy', 'editorial calendar', 'b2b saas', 'seo', 'newsletter', 'thought leadership', 'customer stories', 'short-form video', 'aeo', 'ghostwriting', 'brand voice', 'social'],
  ambiguous: [{ word: 'Content', meanings: ['Marketing content', 'Product and UX content'], chosen: 'Marketing content' }],
  level: ['senior', 'lead'],
};

export const EXAMPLES = [
  { kind: 'interviewed', key: 'a16z' },
  { kind: 'fit', key: 'webflow' }, { kind: 'fit', key: 'zillow-studio' }, { kind: 'fit', key: 'zillow-agents' }, { kind: 'reach', key: 'lightfield' },
];

export const RULES = ['Hide agency and client-services roles.', 'Rank B2B software companies higher.', 'Remote only: skip on-site and hybrid roles.'];
export const DAYS = DAY;
