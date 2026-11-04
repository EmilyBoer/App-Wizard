# Margo (desktop app)

Set it up once. Every morning, Margo finds jobs that fit, and has a tailored resume and cover letter ready for the best ones. You check them and press send.

## Run it

You need [Node.js 20 or newer](https://nodejs.org) and a Claude API key ([console.anthropic.com](https://console.anthropic.com)).

```bash
cd app
npm install        # installs Electron, the desktop wrapper
npm start          # opens the Margo window
```

No install? Run it in your browser instead (same app, no extra packages):

```bash
cd app
npm run web        # then open http://127.0.0.1:4321
```

In the browser version, "Download PDF" opens the print window (choose Save as PDF) and the morning run only happens when you press "Get applications ready".

Your data lives on your computer: in the desktop app's user-data folder, or `~/.app-wizard` for the browser version (change it with `APP_WIZARD_DATA=/some/folder`).

## Hosted for testers (`npm run hosted`)

One server, many people. Each browser gets its own sign-in (an HttpOnly cookie) and only ever sees its own account's data. Sessions are stored hashed and survive restarts, so a redeploy doesn't sign people out.

```
MARGO_DATA=/path/to/persistent/disk ANTHROPIC_API_KEY=sk-ant-... npm run hosted
```

| Setting | What it does |
|---|---|
| `PORT` | Port to listen on (hosting services set this) |
| `HOST` | Address to listen on (default `0.0.0.0`) |
| `MARGO_DATA` | Where accounts and data live (default `./data`). Must be a persistent disk, or everyone's data disappears on redeploy. |
| `ANTHROPIC_API_KEY` | The shared Claude key. Set it in the host's secret settings, never in GitHub. |
| `MARGO_SECURE_COOKIES` | Set to `0` only when testing over plain http on your own machine. |

Health check: `GET /healthz`.

**What's different from `npm run web`:** saving PDFs to a folder on disk and the browser extension are off (they're desktop features). Job links and job sites people type in can't reach the server's own network. Sign-in attempts are limited to 10 per 15 minutes per address.

**Not yet (next steps):** email verification and password reset, a per-person cap on Claude use, and deploys from GitHub to a staging and a tester address.

## What's in here

| Folder | What it does |
| --- | --- |
| `core/` | Everything the app knows how to do, as plain Node with no extra packages. `api.mjs` is the list of every action. |
| `core/ai.mjs` | Every task Claude does, with the truth rules and the code checks that run after Claude answers. |
| `core/match.mjs` | Free, fast matching on every job: hard filters (pay floor, location, deal-breakers, words that mean two things, employer types to avoid) and a score. Only top jobs go to Claude. |
| `core/learn.mjs` | Learning: every yes, no, skip and edit becomes an event; clear patterns become plain-language rules the user can see and turn off. |
| `core/docs.mjs` | Resume and letter pages: 3 templates, 12 Google Fonts, minimum sizes, the cut order, file names, readability check. |
| `core/profile.mjs` | Merging files into one work history, conflicts to settle, things the user may be underselling. |
| `core/intake.mjs` | Job alert emails, calendar invites (.ics), company research for cheat sheets. |
| `core/help.mjs` | Help center articles (also given to the chat). |
| `../engine/` | The job sources engine: live jobs from Greenhouse, Lever, Ashby, SmartRecruiters, Workable and pages with standard job data. |
| `renderer/` | The screens: login, 10-step setup, dashboard, job page, tracker, interviews and cheat sheets, documents, profile, help, chat. |
| `main/` | The Electron wrapper: window, PDF making, tray icon, morning run, connection for the browser extension. |
| `server/` | Small local server for the browser version and for the extension. |
| `extension/` | Chrome/Edge extension that fills application forms. It never submits. |
| `test/` | Tests with a fake Claude and fake job sites. `npm test` |

## The truth rules, in code

Claude drafts; code checks before anything is shown:

- Every resume line must name the profile line it came from. Lines without a source are dropped.
- Every number in a resume line must appear in its source line, or the original wording is used.
- Titles, companies and dates are copied from the profile, never from Claude.
- Skills not in the profile are removed.
- Cover letter numbers must appear in the profile; banned words and em dashes are flagged or removed.
- Claude can suggest additions in chat, but nothing is added to the profile without the user pressing Yes.

## Browser extension

1. Chrome or Edge: Extensions, turn on Developer mode, Load unpacked, pick `app/extension`.
2. In Margo: Profile, Browser extension. Copy the pairing code into the extension.
3. On an application form, press the Margo icon, then Fill this application.

It talks only to Margo on the same computer (`127.0.0.1:47321`) and only with the pairing code.

## Known gaps (next up)

- **Packaging:** `npm run build` needs the `engine` folder copied inside `app/` first (the app imports it from `../engine`).
- **Forwarding inbox:** a personal Margo email address for job alerts needs a small server. Until then, users paste alert emails into Add jobs.
- **Calendar connections:** Google and Outlook later; for now, add interviews by hand or drop in the invite file.
- **Fonts offline:** resume fonts load from Google Fonts, so making a PDF needs an internet connection.
- **Accounts:** local to one computer. Cloud accounts and sync come with the paid version.
- **Workday** job sites aren't read yet.
