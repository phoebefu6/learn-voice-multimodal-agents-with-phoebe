# Agent brief - shared by every fan-out page of learn-voice-multimodal-agents-with-phoebe

You are writing ONE static HTML session page. No servers, no npm. **If your target file already
exists on disk, do not write it; report that and stop.** Write the file, return its path and one
line of coverage. No HTML in your reply.

## Read first, in this order

1. The template page. Copy its structure, classes, SVG grammar and quiz markup EXACTLY, including
   4 options per quiz question:
   `/Users/phoebe.fu/Documents/Claude_Work/github_repo/learn-voice-multimodal-agents-with-phoebe/courses/01-the-voice-pipeline.html`
   For a page with a live widget, also read how the bench page embeds one:
   `/Users/phoebe.fu/Documents/Claude_Work/github_repo/learn-voice-multimodal-agents-with-phoebe/courses/02-the-latency-waterfall.html`
2. The source map: every verified number, its evidence tier, per-session coverage, the seams, the
   canon numbers. Use ONLY its numbers; never invent a statistic; if a fact is missing, teach the
   uncertainty.
   `/Users/phoebe.fu/Documents/Claude_Work/github_repo/learn-voice-multimodal-agents-with-phoebe/materials/official-course-map.md`
   (Raw quotes behind it, if you need exact wording: `materials/research-notes.md` in the same repo.)
3. The stylesheet `:root` block for the palette tokens:
   `/Users/phoebe.fu/Documents/Claude_Work/github_repo/learn-voice-multimodal-agents-with-phoebe/assets/style.css`

## Page skeleton (keep every component)

toolbar (crumb EXACTLY `<a href="../index.html">learn-voice-multimodal-agents-with-phoebe</a> / Session N of 6`,
#toggle-all, #zoom-toggle) · masthead (eyebrow "Learn Voice and Multimodal Agents with Phoebe · Session N of 6",
h1 with one `<span class="accent">`, .sub, .chip-row with the level chip (🟢 Foundations / 🟡 Core /
🟠 Deeper / 🔴 Ship it, as given in your outline) plus two .chip.audience and .chip.time "45 min",
.agenda a1-a4 with flex weights) · main.wrap · section#intro (Part 0 "Where we start": kicker, .lede
that says "constructed Callwell example", .legend pills as in the template, .callout.win "★ What you
walk out with tonight.") · 3 Parts, each `section.section#part-N` with section-kicker (klabel "Part N ·
covers ...", h2, `.tag.concept "N min live"`), a `.lede`, ONE figure, 2-3 `details.card` accordions
(summary: `.mode.live` or `.mode.self`, title, `.mini`, `.caret ▶`), and at least one `.callout.example`
with `span.ex-pill` "Real world" on the page · section#demo-1 Build-along (klabel "Build-along", h2,
`.tag.demo "★ 22 min · everyone builds"`, .lede, ONE figure, `.steps > .step`, each step a `p` then a
`.prompt-box.good` carrying a `span.label` "★ Step N · ...") · section#exercise Homework (ol, 4 items)
· section#quiz (3 x `.quiz-q data-answer="0-based"`, `p.qtext`, 4 x `button.qopt` "A · ...", `p.qwhy`;
one `p.quiz-score` after the last; vary the correct letter) · section#official, h2 EXACTLY "What this
session teaches, and where it came from", `.covered > .covered-row` (pill solid ✓ / light ◐ + name +
note), then the `.mono` line EXACTLY "Every fact on this page, and its verification tier, is recorded in
the course's source map." · section.cheat#cheatsheet (h3 "Session N cheat sheet <span>· pin this</span>",
.grid-2 of six .cheat-item) · `.callout.next` with `.nx-pill` "Next session" (last page: "What next")
· footer.pagefoot · `<script src="../assets/app.js?v=1"></script>` (plus the widget scripts if your
outline has a widget).

Head: the template's social meta block with this page's own description/title/url
(`https://phoebefu6.github.io/learn-voice-multimodal-agents-with-phoebe/courses/<file>`);
`<title>Session N · <title> - learn voice and multimodal agents with phoebe</title>`;
`<link rel="stylesheet" href="../assets/style.css?v=1">`. Nothing else external.

First `details.card` in the FIRST Part is `open`; no other. Sentence case headings. Warm practitioner
voice for builders, concrete, never dry. Inside prompt-boxes escape `&` `<` `>` (`&lt;` etc.). 450 to
650 lines is guidance about depth, never a target: never collapse whitespace, dissolve a list into a
paragraph, or drop a component to fit.

## Hard rules (a violation is rework)

- NEVER an em dash or en dash, anywhere (prose, code, aria-labels, comments). Hyphen only.
- No meta text: never "this course", "in this course", "the course teaches", "banned here". The two
  exact estate phrases above are the only self-references; "session 5" cross-references are fine.
- Attribution "by Phoebe Fu". Never "built with" a tool.
- Every number comes from the map or is labelled constructed/modelled. For constructed data print
  "your numbers will differ", never invented outputs as if run. Any number you quote from a widget
  must be one the widget prints (the map's canon tables list them).
- Every product name, default, price and latency figure is dated 2026-11-08 and tiered
  (vendor-reported / practitioner / reported). Say "re-verify before you rely on it" where a page
  leans on one.
- Contested or missing evidence: teach the disagreement; never resolve what the literature has not.
  "Callers hang up after N seconds" and "500 ms is the magic number" have no primary source: never
  state them as fact.
- Health context: no legal advice, no clinical interpretation. Consent and data-handling lines stay
  general and sourced (map, session 6). HIPAA lines are "reported" only.
- NEVER "lottery" or "lotteries".
- Default to the English word. No Chinese terms needed.
- Titles, widget ids and class names must not collide with siblings. Reserved here: widget ids
  `vox-bench`, `vox-eot`, `vox-wer`; every `.vx-*` class. Do not reuse sibling h1s from
  learn-ai-agents, learn-ai-evals, learn-ai-observability, learn-agent-launch, learn-ai-media,
  learn-ai-design.
- Running case: Callwell is ALWAYS labelled "constructed Callwell example" (or "constructed") where
  introduced on the page. Sites Riverside, Northgate, Harbour; clinicians Doctor Okafor, Doctor
  Lindqvist. Never a real person's data; never Phoebe's own employer, clients or projects.
- Images are INPUT only. Never teach image, voice or video generation (seam: learn-ai-media).

## Figure grammar (hand-drawn, every figure)

Palette, ONLY these hexes (no invented greys): ink #10231F · muted #4A5E59 · teal #0B8470 · deep teal
#064E42 · mid teal #0A6E5E · soft teal #A8DCD1 · teal tint #E8F6F2 · faint #C3D5D0 · hairline #E1EBE8 ·
coral #C2412D · coral ink #8F2C1C · coral tint #FDEDE9 · light coral (strokes/fills only, never text)
#F07A63 · paper #FCFEFD · `#FFFFFF` · universal reds `#991B1B` `#FEF2F2` `#FCA5A5` only for a
wrong-way panel.

- `<figure class="zoomable">` > `<svg viewBox="0 0 880 H" xmlns="http://www.w3.org/2000/svg" role="img"
  aria-label="the data, not the shape">` > `<defs>` + `<style>` + content, then
  `<figcaption>🔍 Click to zoom - takeaway</figcaption>`. Grow H, never W.
- Prefix unique per figure, used for every class and id: `v<session><letter>` (v3a, v3b, v3c, v3d
  for session 3's four figures; v4a... etc.).
- Default hand-drawn grammar: `<defs>` holds a wobble filter `id="PSk"` (feTurbulence fractalNoise
  baseFrequency 0.02 numOctaves 2 seed <int> + feDisplacementMap scale 2.4, x -3% y -3% w 106% h 106%),
  a hachure pattern `id="PHc"` (7x7 userSpaceOnUse, rotate(-38), one accent line, opacity .5), an open
  arrowhead `id="PAr"` (path M1 1 L9 5 L1 9, fill none, ink stroke 1.6). ALL shapes sit inside ONE
  `<g filter="url(#PSk)" fill="none" stroke="#10231F" stroke-width="2" stroke-linecap="round"
  stroke-linejoin="round">`; rects carry a tiny rotation (-4 to 4 degrees for hand-placed items,
  under 1 for panels). Fills: white, teal tint, the hachure for "the pile" or "the data", and coral
  ONLY for the one thing the figure is about. One doodle anchor per figure (the template uses a coral
  sound-wave squiggle), simple strokes, never a mascot. Text classes: `.PH` 800 12px ink heading ·
  `.PL` 600 12px ink label · `.PS` 400 11px muted · `.PB` 800 11px coral-ink · `.PV` 800 16-20px deep
  teal value · `.PW` 800 12px white on a fill · `.PA` 700 11px deep teal caption · `.PN` 400 12px muted
  note. Text NEVER inside the filtered group.
- ALL `<text>` outside any filtered group, sans stack, never below 10.5px.
- Fit: max chars ≈ (box width - 20) / 7 at 12px, 6.4px/char at 11px; full-width note under 110 chars;
  40px between neighbouring point labels; bottom note 22px below the last row, H clears it by 8px.
  No line, arrow or curve may cross a label (the gate flags it); a label never overlaps another
  label or hangs outside its box. When in doubt, shorten.
- Floor: one figure per Part plus one in the build-along. Draw the MECHANISM (what the VAD state
  machine does with a pause; what truncation removes from the context; how a misread field still
  passes a schema; how a substitution, deletion and insertion align; which route a phone call takes
  to the agent), never a metaphor literally, never decoration.

## Voice and honesty

Every Part gets a real-world story from the map's sources (a vendor doc, a paper, a framework
default), cited by name and date. Constructed cases say "constructed" on the page. The only measured
numbers are the HCRC Map Task canon and the WER canon; latency totals are computed from dated inputs;
everything else about Callwell is constructed.

## Cross-links (absolute URLs)

- Agent loop: https://phoebefu6.github.io/learn-ai-agents-with-phoebe/courses/b1-agent-loop.html ;
  guardrails b7-guardrails.html ; agent evals b8-agent-evals.html (same repo path)
- Golden sets: https://phoebefu6.github.io/learn-ai-evals-with-phoebe/courses/b2-golden-set.html ;
  LLM-as-judge b5-llm-as-judge.html
- Latency per span: https://phoebefu6.github.io/learn-ai-observability-with-phoebe/courses/b4-cost-and-latency-per-span.html
- Launch gate: https://phoebefu6.github.io/learn-agent-launch-with-phoebe/courses/b9-the-launch-gate.html
- Vendor WER comparability: https://phoebefu6.github.io/learn-ai-media-with-phoebe/courses/05-how-it-fails-measured.html
- Hub: https://phoebefu6.github.io/learn-with-phoebe/

## Footer chain and session titles

Footer left: "Session N of 6 · learn-voice-multimodal-agents-with-phoebe · by Phoebe Fu &nbsp;·&nbsp; 📚 <a href="https://phoebefu6.github.io/learn-with-phoebe/">Learn with Phoebe ↗</a>"
Footer right: `<a href="PREV">← Prev: SHORT</a> &nbsp;·&nbsp; <a href="NEXT">Next: SHORT →</a>`
(session 6: "← Prev: Evals you cannot read" and `<a href="../index.html">Course home</a>`).

| N | File | h1 (one accent span) | Short name in footers |
|---|---|---|---|
| 1 | 01-the-voice-pipeline.html | The voice <span class="accent">pipeline</span>: cascaded or speech-to-speech | The voice pipeline |
| 2 | 02-the-latency-waterfall.html | The latency <span class="accent">waterfall</span>: where the second goes | The latency waterfall |
| 3 | 03-turn-taking.html | <span class="accent">Turn-taking</span>: when to speak, when to stop | Turn-taking |
| 4 | 04-images-in-the-loop.html | Images in the <span class="accent">loop</span>: reading what callers send | Images in the loop |
| 5 | 05-evals-you-cannot-read.html | Evals for a conversation you <span class="accent">cannot read</span> | Evals you cannot read |
| 6 | 06-shipping-the-call.html | Shipping the <span class="accent">call</span>: phones, handoffs and consent | Shipping the call |

## Widgets (only sessions 3 and 5)

After the app.js tag add, in this order:
`<script src="../assets/vox-sample.js?v=1"></script>` and `<script src="../assets/vox-live.js?v=2"></script>`.
- Session 3: `<div id="vox-eot" data-t="500"></div>` renders the end-of-turn curve widget (slider
  100-1200 ms; prints false cut-ins per 100 speaker changes, share of pauses the timer fires on, share
  of real gaps still running, and "Wait added to every reply"; human median gap 335 ms).
- Session 5: `<div id="vox-wer"></div>` renders the WER table for the six constructed Callwell pairs,
  the overall line and a try-it box.
Quote ONLY the canon values from the map for these.
