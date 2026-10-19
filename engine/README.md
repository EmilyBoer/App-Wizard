# App Wizard job sources engine

The first piece of App Wizard: it pulls **live, open jobs** from as many places as possible, cleans them up and merges duplicates, so every job a user sees is real and current.

**Why it works:** it reads each company's live list of open jobs straight from its hiring system (Greenhouse, Lever, Ashby and others). A closed job simply isn't in the list. Job links found through search or alerts are often weeks stale; this engine checks them against the live list before trusting them.

## Try it

Needs [Node.js](https://nodejs.org) 20 or newer. No other installs.

```bash
cd engine
npm test                                          # run the tests (no internet needed)
node src/cli.mjs add jobs.lever.co/palantir       # what is this site, can we read it?
node src/cli.mjs add acme.com/careers             # works on company careers pages too
node src/cli.mjs jobs sources.example.json --max-age 30 --out jobs.json
node src/cli.mjs check https://job-boards.greenhouse.io/anthropic/jobs/5391376008
```

`sources.example.json` takes any mix of careers links and hiring-system boards. Edit it to try your own companies.

## What it does

| Function | What it does |
|---|---|
| `identifyWebsite(url)` | Works out what a pasted link is: a hiring system it can read directly (also when embedded in a company's careers page), a page with job data it can read, a big site that needs email alerts (LinkedIn, Indeed, Glassdoor, ZipRecruiter) or not supported yet. Always returns a plain-language next step. |
| `fetchAll(sources)` | Reads every source a few at a time, drops expired jobs, merges duplicates (keeping the company's own listing and the earliest posted date), sorts newest first and reports any source that failed. |
| `checkJobLink(url)` | Says whether a job link is still open by looking it up in the company's live list. |
| Freshness | Every job gets `fresh` (14 days or less), `recent` (15 to 30), `older` (31+) or `unknown`. Older postings stay visible but are flagged, since they may be evergreen or slow-moving roles. |

Every job comes out in one shape (see `src/job.mjs`): company, title, location, remote, link, posted and updated dates, plain-text description, age and freshness.

## Sources

| Source | Status |
|---|---|
| Greenhouse | List shape checked against a live board (2026-10-19) |
| Lever | Built from its public postings docs; not yet run against live data |
| Ashby | Built from its public job board docs; not yet run against live data |
| SmartRecruiters | Built from its public postings docs; not yet run against live data |
| Workable | Built from its public widget list; not yet run against live data |
| Any page with schema.org `JobPosting` data | Built and tested on sample pages. Many careers pages and job boards include this for Google |
| LinkedIn, Indeed, Glassdoor, ZipRecruiter | Not read directly (no public list, and their terms forbid scraping). The app reads their **email alerts** instead |

**First real-world test to run:** `node src/cli.mjs jobs sources.example.json` on your computer, then try 10 to 20 companies you actually care about. Note any that fail or look wrong.

## The setup question this powers

`presets.json` holds the setup screen's question and starter options:

> **What other websites do you look at for jobs?**
> Pick any you use, and paste links to others.
> [LinkedIn] [Indeed] [Andreessen Horowitz portfolio jobs] [Y Combinator: Work at a Startup] [Wellfound] [Built In] [Idealist] [USAJOBS]
> **Add a website:** `e.g. jobs.lever.co/acme or acme.com/careers`

Each pick or pasted link goes through `identifyWebsite()`, and the screen shows the result right away: "✓ We can read Acme's jobs directly," "Use LinkedIn's email alerts: here's how" or "We can't read this one yet. If it sends email alerts, forward them to your App Wizard inbox." Unsupported sites get logged so we know what to add next.

## Next

1. Run it on real companies and fix whatever breaks.
2. **Workday** (many large employers): needs its own reader.
3. **Email alerts inbox:** a forwarding address that reads LinkedIn, Indeed and other alert emails, pulls out each job and runs it through `checkJobLink()`.
4. **A discovery feed** (Fantastic.jobs, Hirebase or TheirStack) for jobs at companies the user hasn't named. Career-site data only.
5. **Company list helpers:** find a company's careers page from its name.

## Ground rules

- Read only public job lists. No logins, no scraping sites whose terms forbid it.
- Identify ourselves honestly (`User-Agent: AppWizard/0.1`) and keep requests gentle (4 at a time).
- A job counts as open only if it's in the company's live list today.
