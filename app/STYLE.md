# Job Wizard style guide

How the app looks and behaves. The tokens live in `renderer/app.css` (`:root`); this file says how to use them.
The checks at the bottom run automatically in `test/ui-crawl.mjs`.

## Principles

1. **One thing matters most on each screen.** Exactly one primary button. Everything else is quieter.
2. **Plain words, sentence case.** "Save and leave", not "SAVE & EXIT". No jargon, no exclamation marks in buttons.
3. **Every way in has a way out.** Every overlay has an X, closes with Esc, and never throws away typed work without asking.
4. **Setup runs once.** After the first sign-in, answers are changed in Profile, in an overlay, never by going back into setup.
5. **Truth over polish.** We never show a number, title or fact we didn't get from the person.

## Color

| Token | Use |
|---|---|
| `--ink` #14213D | Text, headings, the outline of secondary buttons |
| `--ink-2` #33405E | Secondary text inside cards |
| `--ink-muted` #5E6880 | Help text, labels, captions |
| `--paper` / `--panel` / `--panel-2` | Page, quiet surfaces, hover |
| `--line` / `--line-strong` | Dividers and borders; strong for inputs and hover |
| `--spark-deep` #D2461C | **Only** the primary button and the active tab underline |
| `--good` / `--info` / `--attention` / `--alert` (+ `-soft`) | Status tags and notes, never decoration |

Setup (first sign-in) uses the dark theme (`body.building`); everything else is light. Overlays are always light.

## Type

| Role | Font | Size / line height | Weight |
|---|---|---|---|
| Page title (h1) | Schibsted Grotesk (`--display`) | 36 / 42 | 800, −0.02em |
| Section title (h2) | `--display` | 22 / 30 | 700, −0.01em |
| Card title (h3) | Figtree (`--sans`) | 17 / 24 | 700 |
| Body | `--sans` | 16 / 26 | 400 |
| Small | `--sans` | 14 / 21 | 400 |
| Tiny (hints only) | `--sans` | 13 / 19 | 400 |
| Eyebrow (labels like "Question 3 of 18") | `--sans` | 14 / 20 | 600, muted |
| Tags | `--sans` | 12.5 / 18 | 600 |

Allowed sizes: 10 (nav badge), 11, 12, 12.5, 13, 14, 15, 16, 17, 18, 20, 21, 22, 30, 36 px. Nothing else.
Bold is for names of things and the one thing to notice, not whole sentences.

## Spacing

One scale: `--s1` 4 · `--s2` 8 · `--s3` 12 · `--s4` 16 · `--s5` 24 · `--s6` 32 · `--s7` 48 · `--s8` 64 px.
Inside a card: 16 between items. Between cards: 24. Between page sections: 32–48.
Corners: `--r-sm` 8 (inputs, small buttons), `--r-md` 12 (notes), `--r-lg` 16 (cards, overlays).

## Buttons (three levels)

| Level | Class | When |
|---|---|---|
| Primary | `.btn.primary` (`.big` in setup footers) | The one action that moves the person forward. One per screen; overlays can have their own. |
| Secondary | `.btn.secondary` | A real action that isn't the main one (Upload, Add this job, Fix it). |
| Quiet | `.btn`, `.btn.small`, `.btn.link` | Back, Cancel, Change, Remove, Skip. |

Labels say what happens: "Save", "Add this job", "Looks right". Busy states use `data-busy` ("Saving…").
Destructive actions use `.btn.danger` and are never primary.

## Overlays

- Use `modal()` from `renderer/lib.js`. It adds the X, Esc, click-outside, focus handling and the
  "You typed something that isn't saved" check. Don't build overlays by hand.
- Title as the first h2. One primary button. "Cancel" uses `data-close`.
- Changing a Profile answer opens that answer's form in an overlay (`editAnswer` in `builder.js`).

## Components

- **Cards** `.card` (+ `.featured` for the one card that matters, `.quiet` for background info, `.tight` for compact).
- **Notes** `.note.info|good|att|alert`: a sentence of status, never a paragraph.
- **Tags** `.tag.good|info|att|alert|muted`: one or two words.
- **Profile rows** `.choice`: label · value · quiet "Change" button.
- **Tabs** `.tabs .tab` with `.on` for the current one.

## Resumes (the documents we make)

These follow their own rules in `core/docs.mjs`:
- Body text never below 10 pt, section titles never below 11 pt, margins at least 0.5 in.
- Real text in reading order (name and contact first) so hiring systems can read it; icons are drawn, not text.
- The contact line spreads evenly across the page (or sits in an even grid when there are icons).
- Short resumes open up their spacing (up to 1.6×) to fill the page evenly.

## Automatic checks (`test/ui-crawl.mjs`)

Visits every screen and:
- opens every overlay and checks it has an X and closes with Esc
- checks typed text isn't lost when clicking outside an overlay
- checks the menu is visible (there's always a way out)
- checks setup can't be reopened once finished
- flags any screen with more than one primary button
- flags any text size that isn't on the type scale
