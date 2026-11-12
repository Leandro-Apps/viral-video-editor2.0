# Contributing

Thanks for helping improve Motion Kit. Issues and pull requests are welcome.

## Ground rules
- **The STACK zones are fixed.** Layout constants live in `kit/stack.ts`; never hand-place elements. New work goes into zone B (the stage) as an animation, or into a theme/brand pack.
- **Colours only change per video** (`setStackTheme`). Zones and scene types never change.
- **New animation?** Add it under `kit/fx2/`, export it from `kit/fx2/index.ts`, and add it to `kit/fx2/CATALOG.md` (what it is, props, when to use it). Write original code only: do not paste code or designs from other projects without a compatible licence.
- **No third-party assets.** Do not commit sound effects, music, trademarked logos, or code you cannot relicense under MIT. See `THIRD-PARTY.md`.
- **No secrets.** API keys are read from environment variables or the macOS Keychain, never from files in the repo.
- **English only** in code comments, docs and messages (locale strings for on-screen text are fine).

## Workflow
1. Fork, create a branch, make your change.
2. Render a quick check at 25% scale (see README, "Quick start") and attach a screenshot or GIF to the PR when you change visuals.
3. Open a pull request describing what changed and why.
