# Margo app style guide

How the app looks and behaves. Tokens live in `renderer/app.css`. This file lists every element we use, what it's for and how it looks today. The automatic checks at the bottom run in `test/ui-crawl.mjs`.

**Status (2026-10-28, late):** the app follows `shared/design-system.md` in the Margo project: six colors, lime = action, pink = standard, no disabled buttons, Bricolage only. That doc is the source of truth; this file must match it. The system is built so that a rebrand changes **layer 1** (and sometimes **layer 2**) in `app.css`, not the screens.

## How a rebrand works

`app.css` has three layers:

| Layer | What's in it | Change it when |
|---|---|---|
| 1. Brand | 6 colors plus paper white, 1 font. The only place hex codes and font names appear. | The palette or fonts change. Also update the font link in `renderer/index.html`. |
| 2. Roles | What each color is *for*: ground, surface, text, muted text, act, good news, quiet, needs you, closed. Defined twice: once for the dark ground, once for light surfaces. | What a color *means* changes (for example, light ground instead of dark, or disabled becomes mist). |
| 3. Components | Buttons, tags, notes, cards and the rest. They use roles only. | An element changes shape (corners, outline, size). |

Rebrand checklist:
1. Swap layer 1.
2. Check layer 2 still makes sense.
3. Run the crawl.
4. Look at every screen at 1440 and 390 wide.

**One trap:** a role that points at another role (`--good: var(--ink)`) is fixed where it's declared. Any alias of a surface role must be re-declared in the light-surface block, or it shows the dark-ground color on a light card.

**Theme roles (ready for light mode, design-system.md section 9):** `--ground`, `--card`, `--card-edge`, `--panel`, `--text`, `--text-on-panel`, `--action`, `--standard`, `--quiet`, `--forms`, `--tab-active`, `--star-edge`. Dark values live on `:root`. Light mode is PROPOSED, so there are no light values yet; when it's approved, add them under `[data-theme="light"]` and the device-setting media query, and only these tokens change.

Old token names (`--spark`, `--good-soft`, `--info`, `--attention`, etc.) are kept as aliases because screens use them in inline styles. New code should use the role names.

## Principles

1. **One thing matters most on each screen.** Exactly one main button (small row buttons don't count).
2. **Plain words, sentence case.** "Save and leave", not "SAVE & EXIT". We speak as "we", never "she" or "I".
3. **Every way in has a way out.** Every overlay has an X, closes with Esc, and never throws away typed work without asking.
4. **Setup runs once.** After that, answers change in Profile, in an overlay.
5. **Truth over polish.** We never show a number, title or fact we didn't get from the person.
6. **No fit labels.** Everything we show is assumed to fit. A job gets one plain sentence about why, plus "Draft my application".
7. **Responsive from the first draft.** Nothing scrolls sideways on a phone except tabs and wide tables, on purpose.

## Color

**Brand (layer 1):**
- plum night #261B2A
- plum #372839
- mist #CBB8CC
- pink lilac #F3C1EA
- soft lime #D8EBAE
- eggshell #F6EFEC
- white #FFFFFF, for resumes and letters only

**Meaning (layer 2):**

| Role | Today | Used for |
|---|---|---|
| Ground | plum night | Page, top bar, setup |
| Raised panel | plum | Quiet cards, kanban lanes, empty states, the area behind documents |
| Surface | eggshell | Cards, lists, job cards, overlays, chat, form fields |
| Text | eggshell on dark, plum night on light | |
| Muted text | mist on dark, plum night on light (no faded text) | Help text and captions only |
| Dividers | plum on dark, mist on light | Hairlines. Line #4A3750 is retired. |
| Action | lime | The one button that moves you forward, New status, count badges, the star |
| Standard | pink | Every other button, Applied status, news notes, active tab underline on dark |
| Quiet | mist | Neutral tags, info notes, field outlines, Closed status |
| Needs you | mist with a 2px plum night edge | Notes and fields that need the person |

No red anywhere. A problem is shown as "needs you" (mist with a plum edge) with a plain instruction.

## Type

Bricolage Grotesque for everything. No italics and no second typeface. The login hero underlines "your" in pink (the one emphasized word, as on the landing page); nothing else in the app is emphasized.

| Role | Size / line height | Weight |
|---|---|---|
| Page title (h1) | 36 / 42 (30 on phones) | 600, −0.02em |
| Section title (h2) | 22 / 30 | 600 |
| Card title (h3) | 17 / 24 | 600 |
| Body | 16 / 26 | 400 |
| Small | 14 / 21 | 400 |
| Tiny (hints only) | 13 / 19 | 400 |
| Eyebrow | 13 / 20, capitals | 500 |
| Tags | 12.5 / 18 | 600 |

Allowed sizes: 10, 11, 12, 12.5, 13, 14, 15, 16, 17, 18, 20, 21, 22, 30, 36 px.

## Spacing and corners

- **Spacing scale:** `--s1` 4 · `--s2` 8 · `--s3` 12 · `--s4` 16 · `--s5` 24 · `--s6` 32 · `--s7` 48 · `--s8` 64.
- **Corners:** buttons are pills; cards 24; notes and small cards 14; fields 10; tags 6.
- **Tap targets:** at least 44 px tall (small row buttons 36).

## The elements we're keeping

These are the building blocks every screen is made from. Their *job* stays fixed through any rebrand; only how they look changes.

| Element | Class | Job | Looks like today |
|---|---|---|---|
| Action button | `.btn.primary` (`.big` in setup footers, `.small` for repeated row actions) | The one step that moves the person forward | Lime pill, plum night text and 1.5px outline. Hover: plum night fill, lime text. |
| Standard button | `.btn.secondary` | Every other thing you can press | Pink pill, plum night text and 1.5px outline. Hover: plum night fill, pink text. |
| Quiet button | `.btn`, `.btn.small`, `.btn.link` | Back, Cancel, Change, Remove, Skip | Underlined text |
| No disabled buttons | — | — | Never show a greyed-out button. If a step is missing, the button does that step first ("Connect Claude to write one"). Reorder arrows that can't move are hidden. |
| Busy | `act()` in `lib.js` | While saving | Only the label changes ("Saving…") |
| Tag | `tag(text, kind)` | A one- or two-word label, never clickable | 6px corners. Status (`STATUS_TAG` in `lib.js`): `new` = lime, `applied` = pink, `interview` = plum night, `closed` = mist. Others: `muted`/`info` = mist, `good` = lime, `att`/`alert`/`spark` = pink |
| Note | `.note.info / good / att / alert` | One sentence of status | Solid fill, plum night text. `info` = mist, `good` = pink (news), `att`/`alert` = mist with a plum night edge (needs you) |
| Card | `.card` (`.featured`, `.quiet`, `.tight`) | A group of related things | Eggshell. Featured gets a plum night edge. Quiet is a plum panel. |
| List | `.list > .item` | Rows of things | Eggshell, hairline dividers |
| Job card | `.job` | One job | Eggshell. Title, company line, one sentence on why it fits, "Draft my application" |
| Stat | `.stat` | A number on Journey | Eggshell tile, big number |
| Profile row | `.choice-list > .choice` | Label · value · "Change" | Eggshell list |
| Tabs | `.tabs .tab` | Sections inside a page | Words with a 3px underline: pink on dark, plum night on light. Scroll sideways on phones. |
| Menu | `.nav` | Main sections | Same as tabs. On phones it gets its own row and scrolls sideways. |
| Chip | `.chip` | A choice you can toggle | Outline pill. Pressed: filled in the text color. |
| Option | `.radio`, `.pick`, `.choice-card` | Pick one or several | Outlined box; selected gets a strong edge |
| Love/Fine/Avoid | `.tri` | Three-way choice | Lime / mist / pink when on |
| Field | `input`, `select`, `textarea` | Typing | Always eggshell with plum night text and a mist outline. Plum while typing. |
| Field that needs fixing | `.needs-fix` or `aria-invalid="true"` | Something's wrong | Mist fill, 2px plum night edge, one instruction |
| Drop zone | `.drop` | Drag files in | Dashed outline on a raised panel |
| Numbered step | `.dot` | Step numbers | Always the same plum night circle |
| Progress | `.progress` | How far along | Lime yes, mist maybe, pink no, eggshell current |
| Overlay | `modal()` in `lib.js` | Anything that edits or confirms | Eggshell, X in the corner, Esc closes. Don't build overlays by hand. |
| Toast | `toast()` | "Saved." | Plum with a lime star. Errors are mist with a plum edge. |
| Empty state | `.empty` | Nothing here yet | Raised panel, star, one line and what to do. Today with nothing new: "A quiet morning" (locked copy). |
| Chat | `.drawer` | Ask Margo | Eggshell drawer; your messages plum night, ours mist |
| Logo | `sparkle()` + "margo" | Brand | Lime four-point star (slow twinkle, off under reduced motion), lowercase wordmark |
| Documents | `.paper-wrap`, `.dz-stage` | Resumes and letters | White paper on a plum panel. On phones the paper shrinks to fit. |

**Retired:** fit labels ("Strong match", "Good match", "Stretch", "Weak match"), letter avatars, the orange button with offset shadow, navy, Schibsted Grotesk and Figtree, Instrument Serif, DM Mono, line #4A3750, the disabled button, pink main buttons.

## Overlays

- Use `modal()` from `renderer/lib.js`. It adds the X, Esc, click-outside, focus handling and the "You typed something that isn't saved" check.
- Title as the first h2. One main button. "Cancel" uses `data-close`.
- Changing a Profile answer opens that answer's form in an overlay (`editAnswer` in `builder.js`).

## Responsive

| Width | What happens |
|---|---|
| Over 960 | Full layout |
| 960 and under | Resume editor, side panels and checklists stack |
| 720 and under | 16px gutter. Menu on its own row, scrolling sideways. Tabs scroll sideways. Main buttons in page headers and setup footers go full width. Profile rows stack. Login stacks. |
| 400 and under | Template and font pickers go one column |

Before calling any screen done, look at it at 1440 and 390 wide.

## Resumes (the documents we make)

These follow their own rules in `core/docs.mjs` and are *not* affected by the app's brand:
- Body text never below 10 pt, section titles never below 11 pt, margins at least 0.5 in.
- Real text in reading order (name and contact first) so hiring systems can read it.

## Automatic checks (`test/ui-crawl.mjs`)

Visits every screen and:
- opens every overlay and checks it has an X and closes with Esc
- checks typed text isn't lost when clicking outside an overlay
- checks the menu is visible
- checks setup can't be reopened once finished
- flags any screen with more than one main button (small row buttons don't count)
- flags any text size that isn't on the type scale
- **new:** at 390 px wide, flags anything that sticks out past the edge of the page
