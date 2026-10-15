# Part 3: Gmail Job Alerts Setup

**Applies to:** any job seeker using this system. Personal settings (lanes, titles, pay floor, location, inbox address) live in each user's own vault, not here.

**How to deliver it:** one step per turn, with a check-in each time: **A)** done **B)** stuck **C)** skip. Users do most of this in the "Before You Start" guide (Steps 2 to 9), so check what's already done before asking. Use this part to fix gaps.

## Why Gmail-first

About 80% of discovery runs through email alerts. Alerts arrive when jobs post, so they're fresh by design, and reading an inbox is faster, cheaper and more reliable than crawling job sites. The other ~20% (company career pages, affinity organizations, startup boards) fills gaps the alerts miss.

Every lead from an alert still gets verified on the company's own careers page before it counts as a match.

---

## Step 1. Choose your alert inbox

**Option A: Use your main Gmail.** Simplest. Labels (Step 6) keep alerts sorted.

**Option B: Create a dedicated job-search Gmail (recommended if your inbox is busy).**
1. Create a new Gmail account, e.g. `firstname.lastname.jobs@gmail.com`. Use a professional-looking address, since recruiters may see it.
2. Use this address for every job site and alert below.
3. Connect **this** account to Claude's Gmail connector. The connector holds one Gmail account at a time, so it must be the inbox where alerts land.
4. Optional: forward recruiter replies to your main Gmail so you see them on your phone.

## Step 2. Connect LinkedIn to your alert inbox

1. In LinkedIn, go to **Me → Settings & Privacy → Sign in & security → Email addresses**.
2. Add your alert inbox address and confirm it from the verification email.
3. Make it your **primary** address, or alerts will keep going to the old one.
4. Under **Settings → Notifications → Searching for a job**, turn on email for **Job alerts** and **Messages from recruiters (InMail)**.

Claude never logs into or browses LinkedIn. It reads LinkedIn only through these emails and the profile PDF or screenshots the user shares.

## Step 3. Create LinkedIn job alerts (per lane)

Claude gives the user each lane's titles and search string from `target-profile.md`.

1. Go to **Jobs** and paste the lane's search string, or one exact title in quotes, e.g. `"web producer"`. LinkedIn job search accepts `AND`, `OR`, `NOT` and quotes.
2. Set **Location** (a metro area, or "United States" for remote).
3. Apply filters: **Date posted: Past 24 hours**, **Remote / Hybrid / On-site**, **Experience level**. Add **Salary** if offered.
4. Turn on the **Set alert** toggle at the top of the results.
5. In **Jobs → Job alerts / Manage alerts**, set each alert to **Daily**, delivered by **Email**.
6. Repeat for each lane. If a lane's titles vary a lot (common for pivot lanes), make one alert per title instead.

Tip: if a remote search and a local search both matter, make two alerts per lane.

## Step 4. Add other job-board alerts

Same alert inbox, daily email:

| Site | Where |
|---|---|
| Indeed | Search a title + location → **Get new jobs for this search by email** (or the bell icon). Manage under **Profile → Job alerts**. |
| ZipRecruiter | Search → **Get alerts** / **Save search**. |
| Dice (tech roles) | Search → **Save search** with email alerts on. |
| Idealist (nonprofit and mission roles) | Search → **Save search** with email alerts on. Good for the mission lane. |
| Company career sites | Many Greenhouse, Lever, Ashby and Workday boards offer "Get notified" or talent-community signups. Use them for top target and affinity organizations. |

Note: Indeed "jobs you might have missed" emails often resend old postings. Claude checks the posted date.

## Step 5. Set up Google Alerts (supplemental)

Google Alerts watch the open web. Treat them as **leads**, never confirmed openings.

1. Go to **google.com/alerts** while signed in to the alert inbox.
2. Enter a query like: `"web producer" (hiring OR "job opening" OR careers)`
3. **Show options:** At most once a day · Automatic · English / United States · All results · Deliver to the alert inbox.
4. **Create Alert.** Repeat per lane.

Useful extras: each affinity organization's name + `jobs OR careers OR hiring`, and funding news for their industry (newly funded companies hire soon after).

## Step 6. Label alerts so Claude can find them

1. In Gmail, create a label called **Job Alerts** (left sidebar → **More → Create new label**).
2. Create a filter (**Settings → Filters and Blocked Addresses → Create a new filter**):
   - **From:** `linkedin.com OR indeed.com OR ziprecruiter.com OR dice.com OR idealist.org OR googlealerts-noreply@google.com`
   - Action: **Apply the label "Job Alerts"**. Optional: **Skip the Inbox**.
3. Create a second label, **Recruiters**, for recruiter emails.

Claude can't create Gmail filters, so this step is the user's (about two minutes).

## Step 7. Confirm

Claude will:
1. Confirm the Gmail connector is on the alert inbox.
2. Search for alerts from the last 7 days and show what it found.
3. Add the alert inbox and alert list to the decisions log.

---

## What Claude does on each daily run

See Part 4. In short: reads **Job Alerts** and **Recruiters**, pulls each job, drops anything that fails a practical gate, checks the tracker, verifies survivors are live, checks a few target and affinity organizations, scores fit on four dimensions and logs everything.

## Maintenance (monthly, 10 minutes)

- Delete alerts that only produce noise; add titles that keep showing up in good matches.
- Check that LinkedIn alerts are still on Daily (LinkedIn sometimes resets them).
- Unsubscribe from "recommended jobs" digests that duplicate real alerts.
