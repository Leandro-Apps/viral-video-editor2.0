# STACK workflow · THE house style for every vertical video (all projects)

**Fixed (never changes):** the zones below, the scene types (STACK / SOLO), the animation catalogue, the keyword hierarchy step, and the PROOF rule.
**Free to change per video:** colours and the serif only: `setStackTheme('cream' | 'white' | 'night' | 'mint' | 'sky' | {ink, navy, orange, bg, panel, dot, serif})` at the top of `video.ts` (kit/stack.ts).
**Vary per video:** pick different animation types from the catalogue for the same kind of keyword (a number can be `stat` one time and a count-up card the next). Caption mode can alternate: headline only (`stackLive:'off'`, default for #4) or headline + small live caption (`'small'`) or full live caption (`'full'`).
**PROOF rule:** every video must show the real result on screen: the page, the product in use, the delivered output (video, report, file). `makeStack().finish(SPEC)` throws if proof elements (`winShot`, `screenDemo`, `smoothScroll`, `broll`, `fork` with a real screenshot) cover < 15% of the video or no single proof lasts 3 s.
**Scaffold:** `daily/video-template.ts` (copied by new_day.py) already has the helpers (`makeStack`), the scene table and the checks.


Layout constants live in `kit/stack.ts` (never hand-place things). Zones, top to bottom (1080x1920):

| Zone | y | What |
|---|---|---|
| TOP SAFE | 0-250 | nothing important (grey gradient) |
| A HEADLINE | 255-490 | caption A: small bold line + hero line (serif italic, `box` / `underline` / `plain`) |
| B STAGE | 500-1000 | the animation area (x 60-1020), changes every 1.5-4 s |
| C LIVE | 1015-1100 | caption C: live word-by-word caption, max 3 words, keywords in orange |
| D CARD | 1247-1920 | you, in a card that bleeds off the bottom; your head pops ~130 px above it (cut-out) |
| SOLO | full frame | layout `full`: you alone for an important statement; live caption in white on the chest (y 1230) |

A and C may show together (default) or one at a time (add a `hideCaptions` range).

## Script step (do this BEFORE writing any beat)
1. **Rank the keywords by hierarchy.** Read the transcript (words.ts) and mark every phrase:
   - **S** (hero): the one phrase per sentence a viewer must remember. 2-4 words. Goes to zone A as the hero line.
   - **A** (stage object): a noun/number/action that can be *shown*. Goes to zone B as an animation.
   - **B** (live): words that get orange in zone C (the caption). Pure emphasis, no animation.
   - **SOLO**: the 1-3 statements that carry emotion or a promise ("the part I love", "nothing spends until I approve"). You go full screen, no stage.
2. **Pick the animation per A keyword** from the catalogue below. Do not repeat the same type twice in a row; keep simple window shots between complex ones.
3. **Write the scene table** (phrase -> zone A hero, zone B element, sfx) in the video's `video.ts` header comment, then the beats. Times always come from `a('phrase', n)` (word start), never typed seconds.

## Animation catalogue (zone B)
| Keyword type | Element | Notes |
|---|---|---|
| screenshot / page / product / "live link" | `winShot` | window with slow zoom, glowing line around it; `scroll:true` scrolls a tall page inside it. The simple, default choice. |
| a number | `stat` | count-up, turns orange on landing |
| "connect / plug / integrate" | `plug` | app mark A plugs into app mark B (spark + CONNECTED) |
| "competitors / research / compare" | `rivals` | magnifier scans generic cards, NEVER real brand logos |
| "brand / colours / identity" | `brandKit` | logo tile, type specimen, colour swatches |
| a list of 3-4 things | `toolGrid` | tiles light up as each is spoken |
| "it built X and Y" / "X + Y become one" | `fork` (`dir:'out'` / `'in'`) | node splits into two cards or two cards merge |
| typing / comment / prompt / sign in | `promptBox` | typed text, send button, result pill |
| more | `fx/*.tsx` | cards3d, motionfx, transitions, data, ui... usable in zone B with `frame:true` wrappers |

## Build
`captions: 'stack'`, shots alternate `layout: 'stack'` and `layout: 'full'` (solo). Add `whoosh:false` to shots and cue `whoosh-soft` by hand at each change.
Render check: `.venv/bin/python projects/motion-kit/daily/render.py projects/<p> <Comp> <name>.mp4 0.25` (output goes to `<project>/renders/`, pass a bare file name).
Reference implementation: `projects/wf-dia04/video.ts` (Reel #4 v4).
