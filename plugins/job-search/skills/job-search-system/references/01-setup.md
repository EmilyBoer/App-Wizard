# Part 2: Guided Setup

Setup is a **guided interview**, not a manual. Claude leads; the user mostly uploads things and taps answers. Open or refresh the Setup Checklist panel (SKILL.md), then follow "How every turn should feel" on every turn: one action or question, feedback after every action, the progress bar, and the end-of-chat summary.

**The stages (and the progress bar):**

> Connections · Materials · Master resume · Voice · Direction · Alerts · Tracker · Calibration · Answers · Wrap-up

**One Setup chat:** setup happens in one dedicated chat the user returns to (SKILL.md, "Two kinds of chats"). **Resuming:** whenever setup continues, read `progress-log.md` and pick up at the first unfinished stage or sub-step. If it doesn't exist yet, start at Stage 1 and create it from `templates/progress-log.md` at the end of the first chat.

**Order is a suggestion, not a rule.** Users will share things early, late, out of order or all at once. Take whatever arrives (Part 11), tick off anything it completes, and carry on with the current stage. If something they share answers a later question (a job posting that shows target titles, a LinkedIn PDF that fills in dates), use it and skip the question later. Always show where the upload landed on the progress bar.

**Sitting size:** aim for one or two stages per sitting. When a stage finishes, offer: **A)** keep going **B)** stop here for today. If they stop, give the end-of-chat summary, which tells them to come back to this same chat.

---

## Stage 1. Connections (5 min)

Most of this is done in the "Before You Start" guide. Here, Claude just confirms it worked.

1. **Project check (silent).** Confirm this chat is inside a project. If not, say: *"Let's get you into a project first so I remember your stuff between chats,"* and give the steps from Step 12 of the "Before You Start" guide (Projects → Create project, name **Job Search**, paste the instructions, add the kit from GitHub). Then stop and ask them to start a new chat in the project.
2. **Test each connector, one per turn.** Do a tiny read (search Gmail for one recent email; list one Drive file; find their resume template in Canva). Report plainly: *"✅ Gmail works."* Don't announce a connection works until a call succeeds.
3. If one isn't connected, ask: **A)** walk me through connecting it **B)** skip it for now. Canva is optional: without it, Claude gives resume text to paste (Part 6, Option B).
4. **Alert inbox check (critical).** Search the connected Gmail for `label:job-alerts newer_than:7d`. Report what came back: *"✅ I see 14 alert emails from LinkedIn and Indeed this week."* If there are none, the whole system is blind, so fix it now, one cause per turn: **A)** wrong Gmail connected (reconnect the job-search Gmail) **B)** alerts not set up yet (walk through Part 3) **C)** alerts arriving but not labeled (re-check the filter) **D)** alerts in Spam or Promotions. Save the alert inbox in the decisions log.
5. **Job sites and top companies.** Ask them to paste the note of job sites and top companies they made in Step 10 of the "Before You Start" guide. Save to `target-companies.md`, marking places they volunteer or support as **affinity**. Missing? Collect it in Stage 5c instead.

## Stage 2. Materials (10 to 20 min)

Ask for one group per turn, in this order. Each turn names the action explicitly and offers a way out.

> **📂 Materials: resumes (1 of 5)**
> Drop all your resumes here, old ones too. PDF, Word or screenshots all work.
> **A)** Uploading now **B)** I only have my LinkedIn, use that **C)** Skip for now

1. **Resumes** (all versions; older ones hold forgotten wins).
2. **LinkedIn profile.** *"Export it as a PDF: on a computer, open your profile → More → Save to PDF. Screenshots work too."*
3. **Cover letters** (any they've written, for voice). *"Don't have any? That's fine. I'll learn your voice from how you write here."*
4. **Job postings you like** are collected in Stage 5 (Direction). If they drop some now, label them **target examples** and save them for Stage 5.
5. **Anything else that tells your story** (optional): personality or strengths tests, performance reviews, recommendations, certificates, portfolio pieces, volunteer work, a brain dump of wins.

**After each upload:** one line of feedback (*"Got it: 3 resumes, 2018 to 2025."*), log it in the intake log, and move to the next group.

**Where things go:** documents can go in the project's Files or straight into the chat. **Images go in the chat** (the Files section may reject them). Claude turns images into text (Part 11).

**Too much?** If they have 10+ resumes, ask them to start with the 3 most recent plus the oldest.

**Done when:** at least one resume or LinkedIn profile is in. Everything else can arrive later.

## Stage 3. Master resume (20 to 30 min, can span chats)

1. Read every resume, the LinkedIn profile and any other experience materials. Build a list of every role: company, title(s), dates, location, contract or full-time, tools and results.
2. **Confirm facts with multiple choice**, one conflict per turn:
   > *Your 2022 resume says **Senior Producer** at Acme and your LinkedIn says **Producer**. Which was your official title?*
   > **A)** Senior Producer **B)** Producer **C)** Something else
3. **Sharpen vague results**, one per turn: *"You mention 'improved site speed.' Roughly by how much? **A)** I know the number **B)** Ballpark only **C)** Keep it general."*
4. **Privacy questions**, multiple choice with a suggested default:
   - How far back? **A)** 10 years **B)** 15 years (suggested for most) **C)** Everything
   - Show graduation year? **A)** No (suggested) **B)** Yes
   - Any employer or client names to keep off? **A)** No **B)** Yes, let me tell you
   - Any job to leave off entirely? **A)** No **B)** Yes
5. Write `master-resume.md` (template). Show a short summary, get approval.
6. **Bullet library.** Collect every distinct bullet, grouped by role, with its source (*2024 resume*, *LinkedIn*, *review*). Show one role at a time: *"Anything here that's wrong or exaggerated? **A)** All good **B)** Fix something **C)** Hold one for later."* Write `bullet-library.md`. Unconfirmed bullets are HELD.
7. **Quick hidden-wins pass.** List up to 3 things that look undersold (a LinkedIn bullet missing from the resume, a tool mentioned once, volunteer work). Ask about each, one per turn.

## Stage 4. Voice (10 min)

1. Read their cover letters (and how they write in chat). Note tone, openers and closers, sentence length, contractions, humor, phrases, structure, habits to avoid.
2. Ask: *"Which of these letters sounds **most** like you?"* (list them as A, B, C) and *"Any you'd never want me to imitate?"*
3. Writing preferences, multiple choice, defaults from Part 10:
   - Em dashes? **A)** Avoid (suggested) **B)** Fine
   - Oxford comma? **A)** No **B)** Yes
   - AI-sounding words (leverage, seamless, delve)? **A)** Avoid (suggested) **B)** Don't care
4. If they shared personality or strengths results, use them for plain-language tone notes ("collaborative, likes building systems"). Never put labels in the profile as claims.
5. Write `voice-profile.md`. Old letters are voice samples only. Their numbers aren't facts until confirmed.

## Stage 5. Direction (30 to 45 min, can span chats)

The goal is a **target profile**: what work they want, at what kind of place, and how to weigh it. Titles alone aren't enough. Titles rarely match the work, people change careers, and many people care about *where* as much as *what*. Claude does the analysis and proposes; the user reacts.

### 5a. Postings they react to (10 min)
> **🎯 Direction: postings (1 of 6)**
> Share 5 to 10 job postings: some you'd love, some close but not quite, and one or two that are a no. Links, screenshots or pasted text all work. Circle or tell me what you like and don't like.
> **A)** Sharing now **B)** I don't have any, find some for me **C)** I just have titles in mind

- **Label every one a target example, not experience.** If there's any doubt: *"Is this a job you want, or one you've had?"*
- For each, capture a reaction: **A)** love it **B)** close **C)** no, plus "what grabbed you?" or "what turned you off?"
- **If B:** Claude finds about 10 varied live postings (some from their history, some pivot or mission areas) and they react to those.
- Save postings and reactions in `background.md` under "Sample postings."

### 5b. The day-to-day (2 questions)
- *"In a great work week, what are you spending most of your time on?"* Offer 6 to 8 options drawn from their history plus "something else," and let them pick several.
- *"What drains you, even if you're good at it?"* Same format.

### 5c. Mission and companies (3 questions, one per turn)
- *"Are there organizations you've volunteered for, donated to or love as a customer?"* **A)** Yes, let me list them **B)** Not really. These become the **affinity list.**
- *"Any causes or industries that would make a job feel meaningful?"* Offer options plus "something else."
- *"Any companies or industries you'd avoid on principle?"*
- **Follow up on volunteering:** *"What did you do there?"* This is real experience (add to hidden wins) and maybe a referral: *"Do you know anyone there who could put in a word?"*
- Add affinity organizations to `target-companies.md` with their careers pages.

### 5d. Claude proposes the lanes
Combine the master resume with 5a to 5c and draft **2 to 4 lanes**. Each lane has a type:
- **Core:** they're qualified and they want it
- **Pivot:** they want it; qualified through transferable skills
- **Mission:** a cause- or company-driven exception (e.g., a philanthropy role at a station they volunteer for), even if it's off their usual path

For each lane show: titles (including other names for the same job), the four keyword buckets (**strengths**, **growth**, **red flags**, **tools**), titles to avoid, and one example posting they liked.

Then ask: *"Here's how I'm reading what you want. What's off?"* **A)** Looks right **B)** Change a lane **C)** Add or remove a lane. Refine one item per turn.

### 5e. Priorities (1 question)
*"A job is a perfect skills match at a so-so company. Another is a cause you love but a stretch. Which do you want to see first?"*
**A)** Skills match first **B)** Cause or company first **C)** Show both, side by side

Also: *"Which matters most?"* **A)** skills match **B)** the cause or company **C)** pay **D)** growth into something new. Save in `target-profile.md`.

### 5f. Practical gates (one per turn, multiple choice where possible)
Location (remote, hybrid, on-site, metro areas), pay floor (their call; suggest a range only if asked), contract work, seniority, companies to avoid. These are strict pass/fail. Save in `decisions-log.md`.

**Writes:** `target-profile.md` (lanes, keywords, affinity list, priorities), `decisions-log.md`, `target-companies.md`, `background.md`.

## Stage 6. Alerts (15 to 20 min)

The user set up starter alerts in the "Before You Start" guide. Here Claude **reviews** them against the lanes and fixes gaps.

1. Read the last 7 days of **Job Alerts**. Report which lanes are covered, which aren't, and which alerts are mostly noise.
2. For each uncovered or noisy lane, give the exact titles and a ready-made search string, e.g. `("web producer" OR "digital producer") AND (CMS OR AEM) NOT quota`. Note which sites accept boolean search.
3. Walk them through any changes (Part 3) **one site per turn**, with a check-in each time: **A)** done **B)** stuck **C)** skip this site.
4. Mission lane: suggest Google Alerts or talent-community signups for each affinity organization.
5. Finish with a test: search Gmail for alerts from the last 7 days and show what turned up. (If alerts are brand new, say they'll arrive over the next day or two, and do the test at Calibration.)

## Stage 7. Tracker (5 min)

1. Ask them to create a new **Google Sheet** called **Job Tracker**.
2. Give them the header row (`templates/tracker-columns.md`) to paste into row 1.
3. Ask for the link. Save it in the decisions log.
4. Test: read the sheet through the Google Drive connector. If Claude can't read it, they can paste rows or upload a CSV when needed.

## Stage 8. Calibration (10 min, before the first real job search)

This is the most important guardrail. It tests the target profile against the user's real judgment.

1. Pull 10 real, recent postings from their alerts (or find them on the web if alerts are still empty). Mix lanes.
2. Show them one at a time, title, company and a one-line summary of the actual work. They rate blind: **A)** want **B)** maybe **C)** no, plus a few words of why.
3. Then reveal Claude's ratings with the four fit dimensions (Part 5).
4. Go through each disagreement: *"I rated KXYZ a skip, but you said want. Is that the mission?"* Update lanes, keywords or priorities.
5. **Done** when they agree on about 8 of 10. Otherwise repeat with 5 more.

## Stage 9. Answers (can span chats)

Go through the common questions in `templates/answer-library.md`, one per turn. Draft from the vault, show it, get approval. Subjective ones (salary, reason for leaving, relocation, work authorization) are drafted only from what the user says. Strengths and work-style answers can borrow plain language from `background.md`, backed by a real example. It's long, so offer to stop after every 3 or 4.

## Stage 10. Wrap-up 🎉

- Final hidden-wins pass across everything uploaded. Ask about up to 3 more items.
- Hand over any vault files not yet in the project, with exact file names.
- Recap what's set up, in a few lines.
- Remind them they can keep dropping things into any chat, any time.
- Make the switch clear: *"Setup is done, so this chat's job is finished. From now on, start a **new chat** each time and type **run my job search**. Come back here only if you want to redo part of setup."*
- Celebrate. Setup is the hard part.
