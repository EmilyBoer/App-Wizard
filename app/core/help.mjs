// Help center articles. Short, plain, searchable. Also given to the chat so
// "Ask the wizard" answers the same way.

export const ARTICLES = [
  { id: 'start', title: 'Getting started: what setup does', tags: 'setup start begin first time', body: `Setup takes about 25 minutes and saves as you go, so you can stop any time.

1. Your materials: drop in resumes, your LinkedIn, reviews and screenshots.
2. Your experience: check the work history we built and settle anything that doesn't match.
3. Your voice: show us how you write.
4. Resume design: pick a look or bring your Canva design.
5. What you want: start from real jobs you like.
6. Job sites: tell us where you look.
7. Standard answers: the questions every application asks.
8. Rate 10 real jobs: teach us what fits.

After that, App Wizard finds jobs every morning and has resumes and letters ready for the best ones.` },
  { id: 'edit-resume', title: 'How do I edit my resume?', tags: 'edit change resume bullet wording fix', body: `Open the job, then Documents, then press Edit on the resume. Click any line to change it.

When you change a line we ask if you want to save the new wording to your profile, so every future resume starts from it. Your changes also teach us how you like things written.

To change a fact (a date, a title, a result), change it in Profile, Experience. Resumes are built from your profile, so fixing it there fixes it everywhere.` },
  { id: 'editable-format', title: 'How do I get my resume in a format I can edit?', tags: 'word docx editable download format google docs text', body: `Every resume comes as a PDF and as plain text. The plain-text version pastes cleanly into Word, Google Docs or an application form.

You can also edit any line inside App Wizard before you download (see "How do I edit my resume?").

A Word download is being considered for a later version.` },
  { id: 'download', title: 'Where are my files?', tags: 'download pdf save file folder documents', body: `Every resume and cover letter is in Documents and on the job's page. Press Download PDF or Copy text.

Files are named like Jordan_Lee_Resume_Company_Role.pdf so you can tell them apart in an application form.` },
  { id: 'linkedin', title: 'Adding your LinkedIn', tags: 'linkedin profile pdf export data screenshots', body: `App Wizard can't open LinkedIn links: LinkedIn doesn't allow other apps to read profiles. These ways work better anyway:

Save to PDF (fastest): open your LinkedIn profile, press More (or Resources), then Save to PDF. Drop the file into Setup, Your materials.

Download your data (most complete): LinkedIn Settings, Data privacy, Get a copy of your data. Pick "Want something in particular?" and choose Positions, Profile, Skills and Recommendations. LinkedIn emails you a file in about 10 minutes. Drop the .zip's files in.

Screenshots: these work too. We read the words from the image.

We compare LinkedIn with your resumes. If dates or titles differ, we ask you which is right. Anything only on LinkedIn is offered as an addition; nothing is added without your OK.` },
  { id: 'alerts', title: 'How do I bring in LinkedIn or Indeed jobs?', tags: 'linkedin indeed alerts email forward paste glassdoor ziprecruiter', body: `LinkedIn and Indeed don't share their job lists with other apps. Their job alert emails do include the jobs, so:

1. On LinkedIn or Indeed, turn on job alerts for your searches.
2. When an alert arrives, open it, select all, copy, and paste it into Dashboard, Add jobs, Paste an alert email.
3. We pull out every job link and check each one.

Coming later: your own App Wizard address you can forward alerts to automatically.

Company career pages that use Greenhouse, Lever, Ashby, SmartRecruiters or Workable are read directly every day, with no email needed. Add them in Setup, Job sites.` },
  { id: 'job-sites', title: 'Which job sites can App Wizard read?', tags: 'sites boards greenhouse lever ashby workable smartrecruiters careers page add website', body: `We read job lists straight from company hiring systems: Greenhouse, Lever, Ashby, SmartRecruiters and Workable. These are always current, so you don't see expired jobs.

We can also read company career pages that publish standard job data.

When you add a website, we tell you right away whether we can read it, whether it needs email alerts, or whether it isn't supported yet.` },
  { id: 'expired', title: 'Why don’t I see expired jobs?', tags: 'expired closed old stale', body: `Every job comes from the company's own live list and is checked again before you apply. If a job disappears from that list, we mark it Closed in your tracker.` },
  { id: 'custom-font', title: 'Adding a custom font', tags: 'font custom upload canva brice typeface ttf otf woff license', body: `App Wizard includes 12 free Google Fonts that are safe to put in PDFs. If your design uses a different font, we swap in the closest one.

If you want your exact font:
1. Find the font file (.ttf, .otf, .woff or .woff2). Fonts from Google Fonts or Font Squirrel are free to use. Canva Pro fonts often can't be downloaded; check the font's own website.
2. Make sure you're allowed to use it. Licensing is your responsibility.
3. Go to Profile, Resume design, Fonts, and press Upload a font.

If the font file says it can't be placed in PDFs, we warn you. Your uploaded fonts stay on your computer.` },
  { id: 'canva', title: 'Using your Canva resume design', tags: 'canva design import template pdf', body: `In Canva, press Share, Download, and pick PDF Standard. Drop that PDF into Resume design.

We rebuild your layout so hiring systems can read it. Photos, skill bars and decorative graphics become plain text. Check the side-by-side preview; if it isn't close enough, pick one of our templates.` },
  { id: 'length', title: 'How long will my resume be?', tags: 'length page one page font size small cut', body: `One page by default. Up to 1½ pages if you have 10 or more years of experience, or if you turn it on.

Text never gets smaller than 10 point. If it doesn't fit, we cut the least relevant lines from your oldest roles first, then roles older than your "how far back" setting, then shorten the summary. You always see what we cut.` },
  { id: 'truth', title: 'Will App Wizard make things up?', tags: 'truth lie invent accurate facts honest', body: `No. Everything we write comes from your profile. We reword and reorder; we never invent jobs, dates, numbers, skills or results.

After Claude writes a draft, App Wizard checks it in code: every resume line must come from a line in your profile, and every number must match. Anything that fails is swapped back to your own wording, and we tell you.` },
  { id: 'morning', title: 'What happens every morning?', tags: 'morning batch automatic daily schedule', body: `At the time you pick (7 AM by default), App Wizard checks your job sites, finds new matches, and gets resumes and letters ready for the best few. You review and apply.

The computer needs to be on with App Wizard open (it can sit in the background). Change the time or number in Profile, Settings.` },
  { id: 'extension', title: 'Filling applications with the browser extension', tags: 'extension chrome edge autofill fill application form browser', body: `The App Wizard extension fills in application forms using your profile and the answers you approved.

1. In Profile, Settings, press Set up the extension and follow the steps.
2. Open an application and press the App Wizard button.
3. Check everything, answer anything marked "needs you", and press submit yourself.

We never submit for you, and we never answer personal questions (salary, demographics, why you're leaving) unless you saved an answer.` },
  { id: 'learning', title: 'How does App Wizard learn what I like?', tags: 'learn smart preferences rules feedback improve', body: `Every yes, no, skip, save and edit teaches App Wizard. When a pattern is clear, it becomes a plain rule, like "We'll hide jobs with 'development' in the title".

See every rule in Profile, What we've learned. Turn any rule off or delete it. Edits you make to resumes and letters are used as examples next time.` },
  { id: 'cheat-sheet', title: 'Interview cheat sheets', tags: 'interview cheat sheet prep questions', body: `Press Make cheat sheet on any job. We read the company's own website and the job posting, and use your real results to outline answers to likely questions.

Company facts only come from those pages. If we couldn't read the company's site, we say so.` },
  { id: 'calendar', title: 'Adding interviews', tags: 'calendar interview invite ics schedule', body: `Three ways:
1. Press Got an interview? Add it, and fill in the date and time.
2. Drop in the calendar invite file (.ics). Most invites have one attached; in Gmail, open the invite and download it.
3. Calendar connections (Google, Outlook) are coming later.` },
  { id: 'privacy', title: 'Where is my information kept?', tags: 'privacy data secure stored computer', body: `Everything is kept on your computer. To write and match, App Wizard sends the needed parts of your profile and the job to Claude (by Anthropic) through your API key. Nothing is sold or shared.` },
  { id: 'api-key', title: 'Setting up your Claude API key', tags: 'api key claude anthropic setup cost console sign in', body: `App Wizard uses Claude to read your files and write. During testing you use your own Claude API key. It takes about 3 minutes.

1. Go to https://console.anthropic.com and sign in (or create an account). This is separate from your regular Claude chat account, but you can use the same email.
2. Add a little credit: Settings, Billing. Five dollars lasts most people a month or more.
3. Open https://console.anthropic.com/settings/keys and press Create Key. Name it "App Wizard".
4. Copy the key (it starts with sk-ant-) and paste it into App Wizard: Profile, Settings, then press Save and test.

If the test fails, the message tells you why: usually the key was copied with a missing piece, or the account has no credit yet.` },
];

export function searchHelp(query) {
  const q = String(query || '').toLowerCase().split(/\W+/).filter((w) => w.length > 1);
  if (!q.length) return ARTICLES.map(({ id, title }) => ({ id, title }));
  return ARTICLES.map((a) => {
    const hay = `${a.title} ${a.tags} ${a.body}`.toLowerCase();
    const score = q.reduce((s, w) => s + (a.title.toLowerCase().includes(w) ? 3 : 0) + (a.tags.includes(w) ? 2 : 0) + (hay.includes(w) ? 1 : 0), 0);
    return { id: a.id, title: a.title, score };
  }).filter((a) => a.score > 0).sort((a, b) => b.score - a.score);
}
