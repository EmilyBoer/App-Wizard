# App Wizard

A guided, truthful AI job search that runs on Claude. It reads the job alerts in your email, tells you honestly which jobs fit and why, tailors your resume, writes cover letters in your voice and keeps track of everything. It never invents experience and never submits anything for you.

**Status:** testing with early users. Expect changes.

> **New: the App Wizard desktop app** lives in [`app/`](app/README.md). It runs on its own (with Claude inside), reads live job lists straight from company hiring systems, and needs no job-search Gmail. The Claude kit below still works for people who want to use App Wizard inside Claude.

## Before you start

This kit needs about an hour of setup outside Claude first: a job-search Gmail, LinkedIn and job alerts. Follow the **Before You Start** guide (link coming soon).

## Install

Pick the option that matches your Claude plan.

### Free plan: add the kit to a project

1. In Claude, go to **Settings → Connectors** and connect **GitHub**.
2. Create a project called **Job Search**.
3. In the project's files area, click **+ → GitHub**, paste `https://github.com/EmilyBoer/App-Wizard` and select **JOB-SEARCH-SYSTEM.md**.
4. Start a new chat in the project and type **run job setup**.

To get updates, click **Sync** on the GitHub item in your project.

### Paid plans (Pro, Max, Team, Enterprise): install the plugin

1. In Claude, open **Customize → Plugins → Add → Add marketplace → Add from a repository**.
2. Enter `EmilyBoer/App-Wizard` and install **app-wizard**.
3. Create a project called **Job Search**, start a chat and type **run job setup**.

### Backup: upload the skill

Download `downloads/job-search-system.zip`, then in Claude go to **Customize → Skills → + → Create skill → Upload a skill**. (Turn on **Settings → Capabilities → Code execution and file creation** first.) Uploaded skills don't update automatically.

## What's in this repo

| Path | What it is |
|---|---|
| `app/` | The App Wizard desktop app (Electron), its browser extension and tests |
| `engine/` | Job sources engine: live jobs from company hiring systems |
| `JOB-SEARCH-SYSTEM.md` | All of App Wizard in one file, for free-plan projects |
| `plugins/app-wizard/` | App Wizard as a plugin, for paid plans |
| `.claude-plugin/marketplace.json` | Lets Claude add this repo as a plugin marketplace |
| `downloads/job-search-system.zip` | App Wizard as an uploadable skill |
| `engine/` | **The standalone app's first piece:** the job sources engine (live jobs from company hiring systems, freshness, duplicates, open/closed checks). See `engine/README.md`. |
