# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page, interactive travel itinerary ("Natal na Europa", 11/12/2026 → 02/01/2027, 9 travelers, 7 bases), published as a static site on GitHub Pages.

Plain HTML, CSS and vanilla JS. **No build step, no bundler, no framework, no dependencies.** If a change seems to need a package, it is the wrong change.

All user-facing text is **Brazilian Portuguese**. Keep it that way, including typographic quotes (`“ ” ’`) and `R$ / € / CHF` formatting already used in the data.

## Running and verifying

```bash
python3 -m http.server 8000     # http://localhost:8000
```

A static server is required — `file://` breaks the ES module imports. `index.html` carries a boot watchdog that says exactly that instead of rendering a blank page, so a truly blank screen means the watchdog itself never ran (check the console).

For real verification without installing anything: drive Chrome's DevTools Protocol over Node's global `WebSocket` (Node ≥ 22). Launch with `--headless --remote-debugging-port=9222`, fetch the target from `http://localhost:9222/json`, then use `Runtime.evaluate` to click through the UI (`el.click()` reaches the delegated handlers), `Emulation.setDeviceMetricsOverride` + `Page.captureScreenshot` for viewports, `Emulation.setEmulatedMedia` + `Page.printToPDF` for print.

Two lessons from doing it: Chrome's plain `--screenshot` with `--force-device-scale-factor` clips the canvas and **fakes a horizontal overflow that isn't there** — always measure `documentElement.scrollWidth` against `clientWidth` before believing a screenshot. And screenshots catch what assertions don't: the invisible-text bug below was found by looking, not by testing.

## File roles

| File | Role |
| --- | --- |
| [index.html](index.html) | Page shell: sidebar nav, search box, `#results` / `#view` containers, boot watchdog |
| [styles.css](styles.css) | Entire design |
| [app.js](app.js) | State, hash router, the eight screens, event delegation |
| [roteiro-data.js](roteiro-data.js) | **All itinerary content**, as ES module exports |
| [Roteiro-Europa-Completo.md](Roteiro-Europa-Completo.md) | Source-of-truth reference doc the app was derived from. Reconcile against it when facts change |
| [fotos/](fotos/) | Images used by the site |
| `.nojekyll` | Keeps GitHub Pages from running the files through Jekyll |

The app was originally authored as a Claude Design document (`Natal na Europa.dc.html` + `support.js` + `image-slot.js`). It shipped a 500KB self-inflating bundle that never rendered, and was replaced by this static site; the sources were removed in the commit after `140dd0a`, which still has them if they are ever needed. The design decisions from that version survive here, described below.

## Design system

### Color

Nine values, all in `:root`. The palette is warm and paper-like; nothing is pure white or pure black.

| Token | Value | Role |
| --- | --- | --- |
| `--ink` | `#241f1a` | Text, and the background of "summary" blocks |
| `--paper` | `#efe9dc` | Page background |
| `--card` | `#f6f2e9` | Card background, and text on dark blocks |
| `--body` | `#4a4238` | Secondary prose |
| `--muted` | `#6f665a` | Labels, captions, metadata |
| `--gold` | `#c9a24a` | The only accent allowed *on* dark blocks |
| `--rust` | `#b4552f` | Editorial accent (also Lisbon's color) |
| `--line` | `rgba(36,31,26,.12)` | Default hairline |
| `--line-strong` | `rgba(36,31,26,.2)` | Interactive borders |

**City colors are data, not CSS.** They live in `roteiro-data.js` and reach the stylesheet only through the `--col` custom property, set inline on a container:

| lisboa | paris1 | interlaken | zurique | viena | zagreb | paris2 |
| --- | --- | --- | --- | --- | --- | --- |
| `#b4552f` | `#3a55a0` | `#2f6b4f` | `#7a4577` | `#9e2c46` | `#a2761c` | `#2c3f78` |

The rule: **never write a city hex in `styles.css`, and never write `color:` or `background:` inline in `app.js`.** Pass `style="--col:${c.col}"` and let the rule read `var(--col)`. The only place the seven appear literally is the timeline rail gradient, which is deliberately the whole trip at once. The checklist blocks reuse the same seven as semantic tones (green = done, rust = urgent, gold = soon, blue = later, crimson = warning).

### Typography

Three faces, each with a job it never leaves:

- **Bricolage Grotesque** — display only. Weight 500 (700 for the one emphasized phrase in the hero), line-height 1.02–1.1, letter-spacing −0.02em at hero size. Headings, big numbers, card titles.
- **Figtree** — body. 18.5px / 1.6. Prose, list items, buttons.
- **Space Mono** — labels and every number that isn't a headline. Dates, times, sunrise/sunset, hotel names, costs, weekday chips, "eyebrow" kickers. This is what makes the page read as an itinerary rather than a brochure; when in doubt about a small piece of metadata, it is mono.

Eyebrows (the small kickers above headings) are mono, uppercase, `letter-spacing: .16em` (`.2em` for the editorial one, `.18em` in the sidebar), 14.5–15.5px, in `--muted`, `--gold` on dark, or the city color.

Scale: hero 64 (44 on mobile) → h1 42 → h2 30 → h3 26 → card titles 24–33 → body 18.5 → secondary 17–17.5 → mono labels 14–16.5. Prose blocks carry `text-wrap: pretty`.

### Shape, depth, motion

- **Radii by size:** 8px inputs and buttons, 10px list rows and day cards, 12px cards and panels, 14px full-bleed colored headers, 999px pills and filter chips.
- **Accent by edge:** a 4px left border marks a row belonging to a city; a 5px top border marks a card; a 4px top border marks a checklist block. Never both.
- **Almost no elevation.** One shadow exists — the hover lift, `translateY(-4px)` + `0 18px 34px -18px`. The rotated country stamp on city photos is the single decorative flourish (`rotate(-6deg)`, its own small shadow).
- **Motion is short and functional:** `riseIn` .5s on section entry, `growW` .9s on progress bars, a 2s `tick` on the countdown, .18–.25s on state transitions. All of it collapses under `prefers-reduced-motion`.

### Layout and hierarchy

250px sidebar + fluid main, `max-width: 1560px`. Two breakpoints: **1180px** collapses two-column grids to one, **900px** turns the sidebar into a horizontal scroller at the top and drops the day-block time gutter.

Two backgrounds carry meaning and should not be used decoratively:

- **Ink block** = a summary or a warning. Sidebar, countdown, checklist progress, financial totals, the "buy this for today" list, the night-train row, transport pills.
- **Full-bleed city color, radius 14** = "you are inside this city or this day". Used exactly twice: the city header and the selected-day header.

### Print is a supported output

Three screens offer an explicit PDF button — city detail, "Meu dia" and Timeline — so a single day can be carried on paper. `[data-print-hide]` strips nav, search, controls, and the on-screen instructions that mean nothing on paper; grids collapse to one column; cards get `break-inside: avoid`; page margin 14mm. A Timeline day comes out at 2–5 pages.

**Nothing printable may depend on a painted background.** Chrome and Safari print with background graphics *off* by default, so an ink block prints as near-white text on white — invisible. In `@media print` the dark blocks (`.selhead`, `.cityhead`, `.pend`, `.progress`, `.card--dark`, `.kpi--dark`, `.res--night`, `.pill`) invert to ink on white with the accent moved to the border. Test print output with backgrounds suppressed, not with them on.

The Timeline also drops, on paper, the empty illustration frames and the 124px connector arrows: for a ten-stop day those two together cost about a full sheet of nothing. The transport mode survives in its pill.

## Development rules

**Content vs. presentation.** Itinerary prose lives in `roteiro-data.js`, never inline in a template — with two documented exceptions in `app.js`: `PENDENCIAS` (what to buy per date) and `MODO_FIXO` (transport per leg).

**Screens are string builders.** Each returns HTML; `render()` assigns it to `#view`. No virtual DOM, no per-element listener — one delegated `click` handler on `document` dispatches on `data-*` attributes:

| Attribute | Effect |
| --- | --- |
| `data-go` | switch screen (and clear the search) |
| `data-city` / `data-back-cities` | open / close a city |
| `data-day` | jump to a date in "Meu dia" |
| `data-date` | pick a date from the calendar |
| `data-step` | previous / next day |
| `data-filter` | filter "Roteiro completo" by city |
| `data-toggle` | expand a day in the accordion |
| `data-check` | tick a checklist item |
| `data-print` | `window.print()` |

Adding an interaction means adding a `data-*` case, not an `addEventListener`.

**Escape everything.** Every interpolated value goes through `esc()`. The data is local and trusted, but the habit is what keeps it safe when it stops being local.

**Never re-render for the clock.** `atualizarContadores()` patches `[data-days]`, `[data-clock]` and `[data-pct]` in place, every second. Re-rendering a screen on a timer would fight the user.

**Keep the search box out of `#view`.** It lives in `index.html` so re-rendering results never steals focus mid-typing. Screens that re-render in place (accordion, checkbox) save and restore `window.scrollY` by hand.

**Routing is `#/screen/param`** — `#/cidades/lisboa`, `#/dia/2026-12-15`, `#/completo/viena`. `ir()` writes the hash and lets `hashchange` drive the render, so every screen is linkable and the back button works. Unknown routes fall back to `inicio`. State that belongs in a link goes in the hash; state that belongs to the person (checkboxes) goes in `localStorage`.

**GitHub Pages constraints:** relative paths only, no leading `/`; nothing server-side; `.nojekyll` present; ES modules mean the site cannot be opened from disk.

**Accessibility that is already there and should stay:** `lang="pt-BR"`, `aria-pressed` on checklist boxes, `aria-expanded` on accordion heads, `aria-label` on icon-only buttons, a visible `:focus-visible` ring, `prefers-reduced-motion`, and a `<noscript>` message.

## Traps

- **`DAYS` is derived, not raw.** The two `variant` entries in `roteiro-data.js` are fragments: one becomes Plitvice (per the `PLITVICE` constant), the other concatenates the city day with the light day. Never index `D.DAYS` positionally — use the module-level `DAYS`.
- **`CITIES[].dias` and `d.city` disagree on purpose.** A city's card lists the arrival/departure day that belongs to the *next* city's `city` field, so "ver os 5 dias" on Viena's card and 4 days under the Viena filter are both correct.
- **Checklist item ids (`r1`, `a1`, `h1`, …) are `localStorage` keys** under `natal-europa:v1`. Renaming one silently resets that person's checkbox. The saved object also carries `plitvice` / `reveillon` / `ultimo`, kept for compatibility with what the app stored before.
- **The `b0` block is force-checked** and non-toggleable — it still counts toward the percentage, which is why the page opens at 24% and not 0%.
- **Dark blocks need an explicit color, twice over.** On screen, `--col` defaults to the dark ink at `:root`, so anything using `color: var(--col)` inside an ink block renders invisible unless overridden — this is what hid "129 dias" in the countdown until `.kpi--dark .kpi__v { color: inherit }` was added. On paper, the same blocks disappear for the opposite reason: the background isn't painted, so light text lands on white. Both failures are silent and neither shows up in an assertion — only in a rendering.
- **An inline `style="color:…"` beats every print override.** Two of them in `viewFinanceiro` had to become a class before `@media print` could reach them. This is the practical reason behind the "no inline colors in `app.js`" rule, not just tidiness.
- **Desktop rules leak into the mobile nav.** Sidebar buttons are `width: 100%`; in the horizontal mobile bar that must become `width: auto`, or the flex scroller sizes itself to its content, inflates the grid track and drags the whole page into horizontal overflow.
- **`MODO_FIXO` is keyed by `date|next-block-title`.** Renaming a block title in `roteiro-data.js` silently downgrades that leg's transport pill to "a pé" — no error, just a wrong itinerary.
- **Photos are a manual map.** `PHOTOS` at the top of `app.js` pairs a slot id with a file in `fotos/`; anything unmapped renders a captioned placeholder. There is no upload path — the original drag-and-drop slots needed a host that a static site does not have.
