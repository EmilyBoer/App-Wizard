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

// Jordan's a16z cheat sheet, written the way Margo writes one. `match` picks the real profile line it rests on.
export const CHEAT = {
  brief: {
    subtitle: 'Hiring manager interview with the Frontier editorial lead, after the recruiter screen on Nov 10. 45 minutes on video.',
    interviewer: {
      name: 'Frontier editorial lead', short: 'the editorial lead',
      glance: ['Runs editorial for a16z Frontier', 'This role reports to them', 'Owns the pieces you would turn into social', 'Likely cares about: voice, speed, clips, what works'],
      details: [
        'Your future manager: the posting says the Social Media Lead reports into editorial, so this is the person you would work with every day.',
        'Owns the source material: podcast appearances, investment announcements, events and editorial pieces are what social will adapt.',
        'Name not shared yet: the recruiter called them the Frontier editorial lead. Add their name in Edit details once you have it, and make the sheet again.',
      ],
      caresAbout: ['Whether you can sound like Frontier on every platform', 'How fast you can turn long pieces into clips', 'How you decide what worked'],
      meansForYou: 'They will be listening for someone who makes editorial’s work travel, not someone who competes with it. Your Tidewater series, cut from pieces you had already published, is the exact shape of this job. Lead with it.',
    },
    news: {
      title: 'a16z is building out social across its teams',
      glance: ['Social Media Lead roles posted across several a16z teams this fall', 'Frontier’s role reports into editorial', 'Pay posted: $199K–$232K + carry and bonus'],
      details: ['Firm-wide push: the same Partner 20 Social Media Lead title was posted for more than one a16z team, so social is a priority, not an experiment.', 'Editorial-led: this role sits with editorial, which tells you social is expected to carry the firm’s ideas, not just announce news.'],
      other: 'Check the a16z and Frontier channels the morning of the interview for anything new you can mention.',
      howToUse: 'It looks like social is getting real investment across the firm. I’d love to hear how Frontier wants to sound compared with the other teams.',
    },
    land: [
      { title: 'I turn long pieces into social that travels.', proof: 'At Tidewater I started a short-form series cut from pieces we had already published. It reached 1.2M views on LinkedIn and X.' },
      { title: 'I can sound like someone else and keep their edge.', proof: '60+ LinkedIn posts and 12 essays ghostwritten for our CEO and CTO.' },
      { title: 'I test, then keep what works.', proof: 'I built the Looker Studio dashboard that ties every piece to pipeline, and we cut formats that didn’t pull their weight.' },
    ],
    onPaper: [
      { source: 'Cover letter', says: 'I started a short-form video series with product marketing that reached 1.2M views on LinkedIn and X, cut almost entirely from longer pieces we had already made.', youSay: 'That was a team effort with product marketing. I started it and ran the editing calendar; they owned the product angles.' },
      { source: 'Cover letter', says: 'I work inside the content operation, not next to it.', youSay: 'I run the content program at Tidewater, so social has always been part of the operation I plan, not a separate team.' },
    ],
    notOnPaper: [
      { topic: 'Running X as a brand account', youSay: 'Most of my brand work has been on LinkedIn. On X I’d start by studying what Frontier’s founders already do well, then test formats for a month before settling.' },
      { topic: 'Crypto or deep tech', youSay: 'I haven’t worked in venture or crypto. I learned Canopy’s merchants from zero, and the skill here is distribution, which carries over.' },
      { topic: 'Advising founders on their social', youSay: 'I’ve coached our CEO and CTO on their LinkedIn for years. I’d bring the same approach to portfolio founders: their voice, a simple rhythm, one useful thing per post.' },
    ],
    logistics: {
      glance: ['Posted: $199K–$232K + carry + bonus', 'Your saved range ($150K–$175K) is below it', 'Say: comfortable within their range', 'Remote, West Coast hours, some travel', 'Authorized, no sponsorship'],
      salary: 'a16z posted $199,000 to $232,000 base, plus carry and bonus. Your saved answer is $150,000 to $175,000, which is below their whole range. Don’t name your old number here.',
      salaryScript: 'From the posting, I’m comfortable within your range, and I’d like to learn more about how carry and bonus work for this role.',
      location: 'Remote in the US with West Coast hours and occasional travel for offsites and events. You’re in Portland, so the hours work.',
      locationScript: 'I’m in Portland, so West Coast hours are easy, and I’m happy to travel for offsites and events.',
      authorization: 'Yes, no sponsorship needed.',
      notes: ['Who sets pay: hiring managers rarely set the number. Give the line above, then “Happy to work out details with recruiting.”', 'Levers besides base: carry, bonus, title level, start date.'],
      yourCall: 'Update your saved salary answer before the next application. It undersells you for roles like this one.',
    },
    ask: {
      glance: ['What should social do for Frontier in year one?', 'How clips get made today', 'How editorial and social decide together', 'Accounts they admire', 'Next steps'],
      list: ['What do you want Frontier’s social to do in the first year: reach, community, or something else?', 'How do clips get made today, and what slows them down?', 'How do you and the team decide what gets made, and where would social come in?', 'Which accounts do you admire, inside or outside venture?', 'What would make you say, a year from now, that this hire worked?', 'What are the next steps?'],
      tip: 'It’s 45 minutes. Pick three. The first two matter most.',
    },
    after: ['Send a thank-you the same day, with one specific thing they said.', 'Write down what you learned in Your notes. The next round’s sheet reads them.', 'Update your journey with the date and next steps.'],
    thankYou: 'Hi [Name],\n\nThank you for the time today. I enjoyed hearing how Frontier works with editorial, and [one thing they said] has stuck with me. My first instinct would be to cut three hooks from last month’s pieces and see which one travels.\n\nHappy to share examples from the series we built at Tidewater if useful.\n\nThanks again,\nJordan',
  },
  groups: [
    { title: 'Opening', questions: [
      { q: 'Tell me about yourself.', match: '1.2M views', glance: ['Content strategist, more and more on the social end', 'Fieldnote: 5 stories a week + podcast clips', 'Canopy: LinkedIn 9K → 52K with video', 'Tidewater: run the program, 1.2M-view series', 'Good at sounding like someone else'], answer: ['I’m a content strategist who keeps ending up on the social end of things. I started at Fieldnote Media making five stories a week and cutting clips for our podcast, which is where I learned that the best social starts as something longer.', 'At Canopy Commerce I grew our LinkedIn from 9K to 52K with a weekly video series. For the last five years at Tidewater I’ve run the content program for a six-person team, and the short-form series I started there reached 1.2M views.', 'And I’m good at sounding like someone else. I’ve ghostwritten for our CEO and CTO for years.'], tips: [{ label: 'For the editorial lead specifically', text: 'End with: “Making Frontier’s ideas travel further is the part of my job I like most.”' }, { label: 'If they want more', text: 'The Ops Notes newsletter: 38,000 subscribers, 46% open rate.' }], yourStory: true },
      { q: 'Why a16z, and why this role?', match: '', glance: ['The hard part already exists: smart people saying new things', 'The job is distribution', 'Editorial-led social = how I work', 'Founders + new technology = audience I care about'], answer: ['Frontier already has the hard part: smart people saying new things, in podcasts, essays and announcements. The job is getting those ideas to the people who should hear them, in the shape each platform rewards. That’s the work I like most.', 'I also like that it sits with editorial. That’s how I’ve always worked: social carries the best pieces further instead of running its own show.'], tips: [{ label: 'Keep it light', text: 'You don’t need to know the portfolio. Say you’re excited to learn it.' }] },
      { q: 'Why are you looking to leave Tidewater?', match: '', glance: ['Only if asked', 'Good place, good team', 'Want to own a channel end to end', 'Want an audience of builders'], answer: ['It’s been a great five years, and I’m proud of the program we built. I’m looking for a role where I own a channel end to end, for an audience of builders and founders. This is that.'], tips: [{ label: 'Short version', text: '“I want to own a channel end to end, for this kind of audience.”' }] },
    ] },
    { title: 'Social and short-form', questions: [
      { q: 'Tell us about a social program you built from scratch.', match: '1.2M views', glance: ['Problem: 3 long pieces a week, nobody saw them on social', 'Started cutting 30–60s clips from existing pieces', 'Tested hooks weekly, kept a list of what worked', 'Result: 1.2M views on LinkedIn + X'], answer: ['At Tidewater we published three long pieces a week, and almost nobody saw them on social. So with product marketing I started cutting 30 to 60 second clips from pieces we already had.', 'Every week we tested a few hooks and kept a running list of what worked: questions beat statements, faces beat slides, and the first two seconds decided everything. The series reached 1.2M views on LinkedIn and X.'], steps: ['Pick a long piece', 'Cut 3 hooks', 'Post + watch', 'Keep what works'], tips: [{ label: 'Why it lands', text: 'It’s the job description in miniature: adapt existing content, run clips, test, report.' }], flag: { label: 'The facts', text: 'Say “we” for the series results. Product marketing was part of it.' }, yourStory: true },
      { q: 'How would you run the clips operation?', match: '1.2M views', glance: ['Weekly rhythm, not one-offs', 'Start from what editorial already made', '3 cuts per piece, different hooks', 'Friday review: keep, change, stop', 'Templates so it’s fast'], answer: ['As a weekly rhythm. On Monday we pick from what editorial already made: a podcast, an essay, an announcement. Each piece gets three cuts with different hooks. They go out through the week, and on Friday we look at what happened and decide what to keep.', 'I’d set up simple templates for captions and framing so a clip takes an hour, not a day.'], steps: ['Monday: pick pieces', 'Cut 3 hooks each', 'Post through the week', 'Friday: review'], tips: [{ label: 'Good question back', text: '“Who cuts the clips today, and what tools do they use?”' }] },
      { q: 'How would you adapt one essay for X versus LinkedIn?', match: '', glance: ['X: the sharpest single claim', 'Thread only if the argument needs it', 'LinkedIn: the story behind it + a takeaway', 'Same idea, different shape'], answer: ['Same idea, different shape. On X I’d lead with the sharpest single claim in the essay, and only make a thread if the argument really needs the steps. On LinkedIn I’d tell the story behind it and end with a clear takeaway people can use.'], tips: [{ label: 'Plain English', text: 'A “thread” is a chain of short posts on X that reads top to bottom.' }] },
      { q: 'How do you write as someone else?', match: 'Ghostwrote', glance: ['Interview first, 20 minutes a week', 'Keep their phrases', 'Never put words in their mouth', 'They cut anything that doesn’t sound like them', '60+ posts + 12 essays for CEO and CTO'], answer: ['I interview first, usually 20 minutes a week, and keep their actual phrases. I never put words in their mouth they wouldn’t say. Then they cut anything that doesn’t sound like them.', 'That’s how I wrote 60+ LinkedIn posts and 12 essays for our CEO and CTO without anyone noticing a second voice.'], tips: [{ label: 'Why it lands', text: 'The role advises founders and the Frontier team on social. This is that skill.' }], yourStory: true },
    ] },
    { title: 'Working with editorial', questions: [
      { q: 'How would you work with me and the editorial team?', match: 'style guide', glance: ['Social carries editorial’s work further', 'In early: see pieces before they publish', 'Shared rules make speed possible', 'Style guide used by 40 people at Tidewater'], answer: ['Social should carry editorial’s work further, not compete with it. What works best is seeing pieces a few days before they publish, so the clips and posts are ready on launch day.', 'Shared rules make that fast. At Tidewater I wrote the voice and style guide used by 40 marketers, product writers and freelancers, so nobody had to guess.'], tips: [{ label: 'Tone', text: 'This is their home turf. Offer the system, then ask how they work today.' }] },
      { q: 'What if a post we’re proud of does badly?', match: '38,000', glance: ['Look at the first two seconds or first line', 'Change the hook, not the idea', 'Ops Notes: hot takes did badly → one useful thing per issue'], answer: ['Usually the idea is fine and the hook isn’t. I’d re-cut it with a different first line or first two seconds and try again.', 'When something keeps not working, I say so with the numbers. On the Ops Notes newsletter, hot takes did badly, so we moved to one useful thing per issue. It grew to 38,000 subscribers.'] },
      { q: 'How do you handle sign-off when many people have opinions?', match: 'style guide', glance: ['Agree who approves before we start', 'Style guide answers most questions', 'Review window with a deadline'], answer: ['Agree who approves, who reviews and who just gets told before we start. A good style guide answers most questions before they’re asked. And a short review window, after which silence counts as yes, keeps things moving.'] },
      { q: 'How would you advise portfolio founders on social?', match: 'Ghostwrote', glance: ['Their voice, not ours', 'A simple rhythm they can keep', 'One useful thing per post', 'Same approach as CEO/CTO at Tidewater'], answer: ['Start with their voice, not ours. Then a rhythm they can actually keep, like two posts a week, and one useful thing per post. It’s the same approach I’ve used with our CEO and CTO.'] },
    ] },
    { title: 'Measuring what works', questions: [
      { q: 'How do you decide what to test, and how do you know it worked?', match: 'Looker Studio', glance: ['One idea a week, one number that matters', 'Keep or stop after two weeks', 'Dashboard everyone can see', 'Looker Studio, tied to pipeline at Tidewater'], answer: ['One idea a week and one number that matters, decided before we post. After two weeks we keep it or stop it.', 'At Tidewater I built a Looker Studio dashboard that ties every piece to pipeline, so the whole team sees the same numbers. For Frontier, the number might be reach to builders or follows from founders rather than pipeline.'], steps: ['Pick one idea', 'Pick one number', 'Run 2 weeks', 'Keep or stop'], yourStory: true },
      { q: 'What numbers would you report to me each month?', match: '', glance: ['Reach to the right people', 'Saves + shares over likes', 'Follower growth from the audience we want', 'What we’ll do differently'], answer: ['A short page: how many of the right people we reached, saves and shares (they mean more than likes), follower growth from the audience we want, and the one or two things we’ll do differently next month.'] },
      { q: 'Tell us about a time the data changed your mind.', match: '300 help-center', glance: ['Help center: thought writing was the problem', 'Search data showed people couldn’t find answers', 'Rebuilt 300 articles around what people searched', 'Support tickets −18%'], answer: ['I thought our help center needed better writing. The search data said people simply couldn’t find the answers. So I rebuilt 300 articles around what people actually searched for, and support tickets dropped 18%.'] },
    ] },
    { title: 'Frontier and its audience', questions: [
      { q: 'Who do you think Frontier is talking to?', match: '', glance: ['Founders + builders', 'People who want the idea, not the hype', 'Read the posting: technology-curious, always online'], answer: ['Founders and builders who want the idea, not the hype. People who are always online and can tell in one line whether something is worth their time. That shapes everything: lead with the idea, keep it short, never oversell.'], tips: [{ label: 'Good question back', text: '“Is that right? Who would you add?”' }] },
      { q: 'What would you do in your first 30 days?', match: '', glance: ['Listen + audit what Frontier has made', 'What has worked, who the voices are', 'Small tests in week two', 'A plan by day 30'], answer: ['Listen and audit: everything Frontier has made, what has worked, and who the voices are. Small tests in week two, so we learn early. By day 30, a simple plan we agree on.'], steps: ['Week 1: listen', 'Week 2: small tests', 'Week 3–4: plan'] },
      { q: 'Which accounts do you admire, and why?', match: '', glance: ['Pick two you really follow', 'One line on what each does well', 'One thing you’d borrow'], answer: ['[Pick two accounts you genuinely follow.] Say in one line what each does well, and one thing you’d borrow for Frontier.'], flag: { label: 'Your homework', text: 'Choose these the night before. Don’t name an account you don’t actually follow.' } },
    ] },
    { title: 'Gaps', questions: [
      { q: 'You haven’t worked in venture or crypto.', match: '9K to 52K', glance: ['True', 'Learned Canopy’s merchants from zero', 'LinkedIn 9K → 52K there', 'The skill is distribution'], answer: ['That’s true. I learned Canopy’s merchant audience from zero and grew our LinkedIn from 9K to 52K there. The skill here is distribution, and that carries over. I’d spend my first weeks learning the space from your team.'] },
      { q: 'Your X experience looks lighter than LinkedIn.', match: '', glance: ['True, most brand work on LinkedIn', 'Month one: study what Frontier founders do well', 'Test formats, then settle'], answer: ['It is. Most of my brand work has been on LinkedIn. In the first month I’d study what Frontier’s founders already do well on X, test a few formats and settle on what works.'] },
      { q: 'This is more social than strategy. Is that what you want?', match: '', glance: ['Yes', 'Strategy aimed at distribution', 'Want to own a channel end to end'], answer: ['Yes. Strategy is still the job, aimed at distribution. Owning a channel end to end is what I want next.'] },
      { q: 'Tell me about something that went wrong.', match: '38,000', glance: ['Newsletter hot takes did badly', 'Said so, showed the numbers', 'Moved to one useful thing per issue', 'Grew to 38,000 subscribers, 46% opens'], answer: ['On the Ops Notes newsletter we tried hot takes for a while, and they did badly. I said so, showed the numbers and moved us to one useful thing per issue, with a real customer example. It grew to 38,000 subscribers with a 46% open rate.'], tips: [{ label: 'Shape', text: 'What happened, what you did, what changed. About 60 seconds.' }] },
    ] },
  ],
  homework: {
    title: 'Ideas for Frontier’s social',
    top3: [
      { title: 'One clip per piece, three hooks each.', detail: 'Every podcast, essay and announcement gets cut three ways in its first week. Over a month that shows which hooks work for this audience.' },
      { title: 'A founder voice program.', detail: 'Help portfolio founders post in their own voice with a simple rhythm, as the posting asks. Start with two founders who already post.' },
      { title: 'A one-page monthly report.', detail: 'Reach to the right people, saves and shares, and what we’ll change. Short enough that people read it.' },
    ],
    quickWins: [
      { title: 'Templates for clips', detail: 'Caption and framing templates so a clip takes an hour, not a day.' },
      { title: 'A shared calendar with editorial', detail: 'See pieces a few days before they publish so social is ready on launch day.' },
      { title: 'A voice guide for Frontier', detail: 'One page: how Frontier sounds on X versus LinkedIn, and words to avoid.' },
    ],
    bigPlays: [
      { title: 'A recurring short-form series', detail: 'A named weekly format built from editorial’s best piece of the week.' },
      { title: 'Event coverage kits', detail: 'For offsites and events: what to film, who to ask, and posts ready the same day.' },
    ],
    lookedAt: 'The job posting only. This is demo data, so no live research was run. Check Frontier’s channels yourself before you mention specifics.',
    framing: 'I had a few ideas from the posting. I’d want to see what’s already working before committing to anything.',
    edge: 'You’ve run this kind of program before, end to end, and you can show the numbers.',
    primers: [
      { term: 'Carry', plain: 'In venture capital, carry (carried interest) is a share of the fund’s profits. Some firms give it to team members on top of salary. It pays out years later, if the fund does well.', ifAsked: 'I’d like to understand how carry works for this role.' },
      { term: 'Clips operation', plain: 'The work of cutting short videos from longer content, like podcasts and talks, and posting them across platforms. It includes picking moments, editing, captions and tracking what works.', ifAsked: '' },
      { term: 'Audience development', plain: 'Growing and understanding an audience on purpose: which people you reach, where they come from, and what makes them stay. The posting mentions working with an audience development lead.', ifAsked: '' },
    ],
  },
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
