# Third-party notes

- **Fonts:** Inter and Caveat (SIL OFL 1.1), in `public/fonts` and `brand-packs/*/fonts`.
- **Brand marks:** Simple Icons (CC0) via `kit/brands.ts`. Trademarks belong to their owners. Trademarked logo files are **not** shipped; add your own under `public/brands/` and register them in `OFFICIAL_FILES` (`kit/brands.ts`).
- **Sound effects and music:** not included. Add your own (see README, "Audio"). `daily/make_music.py` synthesizes original background music from code.
- **Rendering and transcription** depend on [OpenMontage](https://github.com/calesthio/OpenMontage) (AGPL-3.0), a separate project that you install yourself. This repository does not contain OpenMontage code.
- Animation families (`kit/fx2`): original code written from scratch from functional specifications (element ids and prop types only). It replaces earlier code of unconfirmed provenance, which is not part of this repository.
