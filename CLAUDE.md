# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page, interactive travel itinerary ("Natal na Europa", 11/12/2026 → 02/01/2027, 8 travelers, 7 bases), published as a static site on GitHub Pages.

The group is **7 adults — one of them over 60 — and one 10-year-old**. The count drives a lot of prose ("com oito pessoas, reserve 20 minutos", "mesa para oito", "oito malas num balcão só"), so it is not a cosmetic number. It is *not* the same as the finance denominator: `finance()` reports per adult and per family of 2 adults + 1 child (2.75 shares), which is one family inside the group, not the group.

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

Two screens offer an explicit PDF button — city detail and Diário — so a single day can be carried on paper. `[data-print-hide]` strips nav, search, controls, and the on-screen instructions that mean nothing on paper; grids collapse to one column; cards get `break-inside: avoid`; page margin 14mm. A Diário day comes out at 2–5 pages.

**Nothing printable may depend on a painted background.** Chrome and Safari print with background graphics *off* by default, so an ink block prints as near-white text on white — invisible. In `@media print` the dark blocks (`.selhead`, `.cityhead`, `.pend`, `.progress`, `.card--dark`, `.kpi--dark`, `.res--night`, `.pill`) invert to ink on white with the accent moved to the border. Test print output with backgrounds suppressed, not with them on.

Diário also drops, on paper, the empty illustration frames and the 124px connector arrows: for a ten-stop day those two together cost about a full sheet of nothing. The transport mode survives in its pill.

## How card text is written

Every line inside a block's `l` array is a card bullet, and all of them follow the same five rules. They apply to new text and to any line you touch.

**Objective and explanatory, never opinionated.** State the fact and the reason it matters; do not tell the reader how to feel about it or defend a decision the reader already made. "Fecha às 16h30" and "fecha às 16h30, então 3h30 é o que cabe" are both fine. "É o ponto alto do dia", "vale a pena", "é o melhor de Viena", "é justamente o que vocês vieram buscar" are not — cut them, or replace them with the fact that made them seem true. A card explains; it does not persuade.

**Bold, never caps.** Emphasis is `**assim**`, which `forte()` in `app.js` turns into `<strong>` after escaping. It is the only markup the block text accepts — do not add more. Full-caps runs (`NÃO FECHA`, `ATENÇÃO`, `COMPREM ONLINE`) are gone from the cards on purpose: they were shouting at the reader and they broke as soon as a proper noun landed inside one. Names keep their own capitalisation (`Hietzinger Tor`, `ÖBB`, `WienMobil`, `U4`) and are not emphasis.

**One fact per bullet, and only facts the reader cannot recover on the spot.** Hours, prices, station and gate names, seasonal closures, what to buy in advance, what breaks if it is missed. Cut the background colour, the second telling of something another card on the same day already says, and the justification of the itinerary's own order.

**A card you travel to opens with a "Como chegar" line.** Written literally as `**Como chegar**: ` at the head of the bullet, it is the first bullet, always, and 76 of the 180 blocks carry it. A block qualifies when it has a real origin and a real destination — somewhere the group moves *to*. Skip it for cards where the group is already standing still (`Café em casa`, `Café da manhã no hotel`, `Antes de dormir`), for `aviso` cards, and for cards where transport is only mentioned in passing (a note about tram noise from the hotel room is not a route). When the route ends up buried in a later bullet, move it up rather than duplicating it; when the first bullet mixes the route with something else, split it in two and let the route go first.

**The connector pill and the `Como chegar` line are one thought split across two elements — write them together.** The pill between two cards renders `MODO_FIXO[date|next-block-title]` as *mode* + *até destination*, so it already answers "by what, and to where". The card's line must therefore carry what the pill cannot: line numbers and directions (`U3 direção Ottakring`), stop counts, which exit to take, where the walk starts, what to buy before boarding. Never restate the pill — a bullet reading "de metrô até o museu" under a pill reading `U3 · até Volkstheater` is pure noise. The two must also agree: change a route in the text and the pill's `modo` / `ate` has to change with it, and vice versa. The failure is silent, because `MODO_FIXO` is keyed by the *next* block's title and a miss falls back to `'a pé'` — which is how a 4 km leg once rendered as a walk.

**Escaping still applies.** `forte()` escapes before it converts, so an unmatched `**` is harmless and HTML in the data is inert. Emphasis does not nest: `**Como chegar**: **Brasserie Federal**` renders as two adjacent bold runs and reads as a mistake — put the name in plain text when it follows the label. The search haystack strips the markers via `semMarcacao()`, so a query still matches across an emphasised phrase.

## Development rules

**Content vs. presentation.** Itinerary prose lives in `roteiro-data.js`, never inline in a template — with two documented exceptions in `app.js`: `PENDENCIAS` (what to buy per date) and `MODO_FIXO` (transport per leg).

**Screens are string builders.** Each returns HTML; `render()` assigns it to `#view`. No virtual DOM, no per-element listener — one delegated `click` handler on `document` dispatches on `data-*` attributes:

| Attribute | Effect |
| --- | --- |
| `data-go` | switch screen (and clear the search) |
| `data-city` / `data-back-cities` | open / close a city |
| `data-day` | jump to a date in Diário |
| `data-date` | pick a date from the calendar |
| `data-step` | previous / next day |
| `data-filter` | filter "Roteiro completo" by city |
| `data-toggle` | expand a day in the accordion |
| `data-fin` | expand a group's itemised breakdown in Financeiro |
| `data-check` | tick a checklist item |
| `data-print` | `window.print()` |

Adding an interaction means adding a `data-*` case, not an `addEventListener`.

**Escape everything.** Every interpolated value goes through `esc()`. The data is local and trusted, but the habit is what keeps it safe when it stops being local.

**Never re-render for the clock.** `atualizarContadores()` patches `[data-days]`, `[data-clock]` and `[data-pct]` in place, every second. Re-rendering a screen on a timer would fight the user.

**Keep the search box out of `#view`.** It lives in `index.html` so re-rendering results never steals focus mid-typing. Screens that re-render in place (accordion, checkbox) save and restore `window.scrollY` by hand.

**Diário replaced two screens, and its old addresses still resolve.** "Meu dia" (a day's blocks as a list) and "Timeline" (the same blocks as a time line) were merged into `viewDiario`; the day note and the per-day pendências block existed only on "Meu dia" and were carried over, so the merge lost a screen and not content. `APELIDOS` maps `dia` and `timeline` onto `diario` in `aplicarHash()`, because a link someone already shared must land on the day rather than fall through to `inicio`. The suite asserts both aliases.

**Routing is `#/screen/param`** — `#/cidades/lisboa`, `#/dia/2026-12-15`, `#/completo/viena`. `ir()` writes the hash and lets `hashchange` drive the render, so every screen is linkable and the back button works. Unknown routes fall back to `inicio`. State that belongs in a link goes in the hash; state that belongs to the person (checkboxes) goes in `localStorage`.

**GitHub Pages constraints:** relative paths only, no leading `/`; nothing server-side; `.nojekyll` present; ES modules mean the site cannot be opened from disk.

**Accessibility that is already there and should stay:** `lang="pt-BR"`, `aria-pressed` on checklist boxes, `aria-expanded` on accordion heads, `aria-label` on icon-only buttons, a visible `:focus-visible` ring, `prefers-reduced-motion`, and a `<noscript>` message.

## Traps

- **`DAYS` is derived, not raw.** The two `variant` entries in `roteiro-data.js` are fragments: one becomes Plitvice (per the `PLITVICE` constant), the other concatenates the city day with the light day. Never index `D.DAYS` positionally — use the module-level `DAYS`.
- **`CITIES[].dias` and `d.city` disagree on purpose.** A city's card lists the arrival/departure day that belongs to the *next* city's `city` field, so "ver os 5 dias" on Viena's card and 4 days under the Viena filter are both correct.
- **Restaurant bookings left the checklist but kept their ids.** `RESTAURANTES` in `roteiro-data.js` feeds the "Falta reservar" screen and still uses the `p13`…`p26`/`c10` ids they had inside `CHECKLIST`, precisely so nobody's ticks reset. The two screens share `state.done` and the same storage key; only the counters are separate.
- **Checklist item ids (`r1`, `a1`, `h1`, …) are `localStorage` keys** under `natal-europa:v1`. Renaming one silently resets that person's checkbox. The saved object also carries `plitvice` / `reveillon` / `ultimo`, kept for compatibility with what the app stored before.
- **The `b0` block is force-checked** and non-toggleable — it still counts toward the percentage, which is why the page opens at 24% and not 0%.
- **Dark blocks need an explicit color, twice over.** On screen, `--col` defaults to the dark ink at `:root`, so anything using `color: var(--col)` inside an ink block renders invisible unless overridden — this is what hid "129 dias" in the countdown until `.kpi--dark .kpi__v { color: inherit }` was added. On paper, the same blocks disappear for the opposite reason: the background isn't painted, so light text lands on white. Both failures are silent and neither shows up in an assertion — only in a rendering.
- **An inline `style="color:…"` beats every print override.** Three of them in `viewFinanceiro` had to become classes (`.fin__v--col` is the last one) before `@media print` could reach them. There are none left in `app.js`, and this is the practical reason behind the "no inline colors" rule, not just tidiness.
- **Desktop rules leak into the mobile nav.** Sidebar buttons are `width: 100%`; in the horizontal mobile bar that must become `width: auto`, or the flex scroller sizes itself to its content, inflates the grid track and drags the whole page into horizontal overflow.
- **Financeiro groups by kind of expense, never by payment status.** Closed amounts already paid are folded into the group they belong to, diluted per adult by `share = 1/2.75` — the child counts as 0.75 of an adult. Nothing on that screen may label a figure as "already paid"; the group total is the whole estimate for that kind of spending. A group's line carries either an explicit `fam` (a real, known family total, from which the per-adult value is derived) or a per-adult `v`, from which `fam` is derived as `v × (2 + kid)`.
- **The `est` flag is the only thing that says "not priced yet".** Every `linha` in `finance()` has an `n` (its name in the drill-down) and an optional `est`, which renders the `estimativa` badge; `est` on the *group* means no line in it is closed, and puts the badge next to the title. A line whose price is known but unpaid (Plitvice) is **not** an estimate and must not carry it — the badge answers "is this number reliable", not "has this been paid". The per-item figures come from the family's cost spreadsheet; the Swiss and Viennese estimates reuse the fares already researched in `PASSES` and `TRANSPORTE`, so changing one of those should change the other.
- **Two things are deliberately outside the Financeiro totals:** clothing and cold-weather gear, and the amounts the other families in the group reimburse. The screen reports the cost of the trip, not the cash flowing through one person's account.
- **Group percentages use largest-remainder rounding.** Seven independent `Math.round` calls summed to 101%.
- **The connector's "até …" is the next block's title, unless overridden.** A leg renders as a pill (the mode) followed by `até <next block title>`, so block titles double as destination labels and a title like "Trem até Grindelwald" comes out as "até Trem até Grindelwald". When the leg's real destination differs from the next card's subject — the bus reaches the station, the train reaches the town — give `MODO_FIXO` an object `{ modo, ate }` instead of a bare string; `ate` replaces the title in the connector only. String values still mean "mode, destination = next title".
- **Two lookup tables are keyed by block title, and both fail silently.** `MODO_FIXO` (in `app.js`, keyed `date|next-block-title`) downgrades a leg's transport pill to "a pé"; `LUGARES` (in `roteiro-data.js`, keyed `date|block-title`) drops that stop's Maps link. Renaming a block title in `roteiro-data.js` breaks both with no error. The test suite guards `LUGARES` by asserting no key is orphaned — extend it if you add a third table. Note `buildDays` discards the *first* block of the `zagreb-leve` variant, so keys for it can never match.
- **`linksHtml()` renders only what exists**, so a contact row is data-driven: `tel` → "Ligar", `tel` + `zap` → WhatsApp, `mapa` → Google Maps, `url` → Site. **`zap` is set by hand and only on mobile numbers** — a `wa.me` link built from a restaurant's landline resolves to an invalid-number error, so don't derive it from the presence of a phone. `mapa` is a free-text search query, not coordinates; for the "a escolher" bookings it deliberately searches a neighbourhood ("restaurantes na Rue Cler, Paris").
- **Icon links lose their payload on paper.** A chip reading "Ligar" is useless in a PDF, so `@media print` puts the number back via `.lnk[data-tel]::after { content: attr(data-tel) }`. Any future chip that hides data behind a label needs the same treatment.
- **The 31/12 flight is Zagreb → Paris, and it is easy to write backwards.** The booking is often referred to as the "Paris–Zagreb" route, which names the pair, not the direction. Zagreb's stay ends on 31/12 and New Year's Eve is in Paris, so the leg can only be ZAG → CDG; the whole afternoon of the 31st depends on landing at 10h30. The test suite asserts the direction — keep that assertion.
- **`VOOS` carries an `ok` flag and unconfirmed legs stay visible.** Two of the five (VIE → ZAG, and the return out of Orly) are not issued yet and render with an "a confirmar" badge instead of being omitted, so nothing unbooked can pass for settled. `cia: ''` means the airline itself is unknown and the render drops the prefix rather than printing an empty separator.
- **Hotel addresses live on `CITIES`, not in the hotel name.** `end` / `mapa` / `app` / `tel` were added there and `RESERVAS` maps them through, which is why the Prático rows get the address, the booking platform and a Maps chip for free. Names that used to carry the street inline (`'Hotel Garden — Vodnikova 13'`) were trimmed back to the name alone — putting it back would print the address twice.
- **New checklist ids must dodge `p13`–`p29` and `c10`.** Those belong to `RESTAURANTES` now — `p27`–`p29` are bookings added after the split, `p29` being the still-undecided Réveillon dinner, and `p24` is left unused because it was a checklist id once — and both screens share `state.done` under one storage key — reusing one would tick someone's restaurant booking from the shopping list. The `t` prefix (`t1`) was opened for transfers for exactly this reason.
- **02/01 has no programme on purpose.** The museum choice (Orsay vs Louvre) was removed from `DECISOES` and from the day; the departure moved to 15h30. `ULTIMO` survives in `app.js` only because its value is written to `localStorage`, and dropping the key would rewrite the object already saved in everyone's browser. Nothing renders it.
- **Photos are a manual map.** `PHOTOS` at the top of `app.js` pairs a slot id with a file in `fotos/`; anything unmapped renders a captioned placeholder. There is no upload path — the original drag-and-drop slots needed a host that a static site does not have.
