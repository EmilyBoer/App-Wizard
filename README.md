# Job Search Kit

A guided, truthful AI job search that runs on Claude. It reads the job alerts in your email, tells you honestly which jobs fit and why, tailors your resume, writes cover letters in your voice and keeps track of everything. It never invents experience and never submits anything for you.

**Status:** testing with early users. Expect changes.

## Before you start

This kit needs about an hour of setup outside Claude first: a job-search Gmail, LinkedIn and job alerts. Follow the **Before You Start** guide (link coming soon).

## Install

Pick the option that matches your Claude plan.

### Free plan: add the kit to a project

1. In Claude, go to **Settings → Connectors** and connect **GitHub**.
2. Create a project called **Job Search**.
3. In the project's files area, click **+ → GitHub**, paste this repository's link and select **JOB-SEARCH-SYSTEM.md**.
4. Start a new chat in the project and type **run job setup**.

To get updates, click **Sync** on the GitHub item in your project.

### Paid plans (Pro, Max, Team, Enterprise): install the plugin

1. In Claude, open **Customize → Plugins → Add → Add marketplace → Add from a repository**.
2. Enter this repository (`owner/repo`) and install **job-search**.
3. Create a project called **Job Search**, start a chat and type **run job setup**.

### Backup: upload the skill

Download `downloads/job-search-system.zip`, then in Claude go to **Customize → Skills → + → Create skill → Upload a skill**. (Turn on **Settings → Capabilities → Code execution and file creation** first.) Uploaded skills don't update automatically.

## What's in this repo

| Path | What it is |
|---|---|
| `JOB-SEARCH-SYSTEM.md` | The whole kit in one file, for free-plan projects |
| `plugins/job-search/` | The kit as a plugin, for paid plans |
| `.claude-plugin/marketplace.json` | Lets Claude add this repo as a plugin marketplace |
| `downloads/job-search-system.zip` | The kit as an uploadable skill |
