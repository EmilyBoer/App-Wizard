# Part 4: Job Finder

**Trigger:** "run my job search," "find me jobs," "today's matches."
**Goal:** bring back a small number of **live, well-matched** jobs. Quality beats volume.

## Load first
- `decisions-log.md` (practical gates, alert inbox, tracker link)
- `target-profile.md` (lanes, keywords, red flags, affinity list, priorities)
- `bullet-library.md` (for judging whether they're qualified)
- The tracker (Google Sheet via Drive, or ask the user to paste it)

## The daily run

Do the whole routine without asking permission for each step.

### 1. Check the tracker
- Follow-ups due today or earlier
- Jobs waiting on the user's decision
- Company + role pairs already logged (so nothing repeats)

### 2. Read the inbox (about 80 to 90% of discovery)

Search Gmail, newest first:
```
newer_than:3d (label:job-alerts OR label:recruiters)
```
If labels aren't set up yet:
```
newer_than:3d (from:linkedin.com OR from:indeed.com OR from:ziprecruiter.com OR from:dice.com OR from:idealist.org OR from:googlealerts-noreply@google.com)
```
Widen to `newer_than:7d` if it's been a while.

Order of attention: **recruiter messages** first, then LinkedIn, then other boards, then Google Alerts (leads only, often stale).

From each email, pull: company, title, location, pay (if shown), link, posted date.

### 3. Check target and affinity organizations
Use web fetch on the careers pages in `target-companies.md`. **Check affinity organizations every run** (they post rarely and roles go fast). Rotate through the rest a few per day. Skip pages that won't load.

### 4. Read the work, not the title
For each job, write a one-line summary of what the person actually does day to day. Sort the job into a lane by that summary and its keywords, not its title. A "Marketing Coordinator" job that's mostly CMS publishing belongs in the web production lane.

### 5. Filter, dropping at the first "no"
1. **Practical gates** (location, pay floor, contract terms, seniority, companies to avoid). Pay not listed → keep, note "pay not listed."
2. **Already in the tracker** → drop (note it if it's a reposting).
3. **Freshness:** posted in the last 14 days. Older or undated → skip.
4. **Red-flag keywords** from the target profile → drop, unless it's an affinity organization (then flag it instead).
5. **No lane fits and no mission tie** → drop.

### 6. Confirm each survivor is live
1. Find the posting on the **company's own careers site**. Use web search only to find the careers page, never as proof the job is open.
2. Try web fetch on the posting. Look for an apply button and no "closed" notice.
3. If the page won't load, ask the user: **"Can you click this link and tell me if there's an Apply button? (10-second check)"**
4. Not confirmed → not a match. Log it as skipped.

### 7. Score and sort
Score each survivor on the four fit dimensions (Part 5) and give it a match type:
- 🎯 **Core match:** qualified, and in their direction
- 🚀 **Pivot match:** in their direction, qualified through transferable skills
- 💛 **Mission pick:** high mission or company score and qualified, even if off-lane
- 🔍 **Wildcard:** interesting but doesn't fit cleanly. **At most one per run**, clearly labeled.

Order the report using the user's priorities from `target-profile.md` (skills first, mission first, or side by side).

### 8. Report
Keep it short:

**📌 Follow-ups due:** (if any)

**✅ Today's matches (N):**
For each: **match type · Company: Role** · location · pay · [link]
*The work:* one line
*Qualified* ✅/🟡/❌ · *Direction* ✅/🟡/❌ · *Mission* ⭐/–
*Why:* one sentence naming which dimension drove it

**🗑️ Skipped:** one line, e.g. "12 skipped: 5 out of area, 4 under pay floor, 2 already tracked, 1 closed."

**Next:** "Which one should we look at first?" **A)** <first> **B)** <second> **C)** none today. Nothing gets tailored until the user picks.

### 9. Log to the tracker
Give tracker rows to paste (Part 9): matches as `found`, skips as `skipped` with a reason. When the user picks or passes on a match, ask for a few words of why (**A)** too sales-y **B)** pay **C)** company **D)** other) and log it in **Pick/Skip Reason**.

## Learning over time
- Every couple of weeks, look at the Pick/Skip Reason column and suggest adjustments: *"You've passed on 6 jobs mentioning 'agency.' Add it as a red flag?"* **A)** yes **B)** no.
- If the same strong title keeps appearing but isn't in a lane, suggest adding it.
- If an alert is mostly noise, suggest tightening or deleting it.
- Target 2 to 5 verified matches per run. Zero is OK on a slow day. Never pad the list.
- Claude never logs into or browses LinkedIn. LinkedIn is read only through emails.
