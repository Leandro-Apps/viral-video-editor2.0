# Brand packs

A brand pack is a folder with everything that changes from one company to another. The 108 animations, the layouts and the captions are the same for every brand. When a video is created, `sync-kit.sh` copies the kit into the project and `apply_brand.py` swaps colors, fonts, logo, names and CTAs for the ones in the pack.

```
brand-packs/<brand>/
  brand.json        required
  logo.png          required: the symbol, square, transparent background, 512 px or larger
  fonts/            optional: body and handwritten (hand) fonts, .woff2, .ttf or .otf
  music/            optional: your own tracks (hard.mp3, chill.mp3...) that replace the kit's
  sfx/              optional: sound effects with the same names as the kit's
  brands/           optional: partner logos (slug.png or slug.svg)
  brand.md          recommended: tone of voice, personas, offers and prices, forbidden words (the script uses it)
```

## brand.json

| Field | Example | Where it appears |
|---|---|---|
| `name` | `"Sorriso Vivo"` | animated logo, brand titles, "it's not X, it's {name}" |
| `wordmark` | `"sorriso vivo"` | name written next to the symbol on app screens |
| `tagline` | `"Seu sorriso, sem espera."` | brand opening and closing |
| `site` | `"sorrisovivo.com.br"` | CTA, footers |
| `app_url` | `"agenda.sorrisovivo.com.br"` | address bar of the app screens |
| `offer_url` | `"sorrisovivo.com.br/avaliacao"` | offer page on the screens |
| `handle` | `"dra.marina.sorrisovivo"` | Instagram comments and DMs (without @) |
| `logo` | `"logo.png"` | symbol in every brand element |
| `colors.accent` | `"#0EA5A4"` | the highlight color (in the kit's default look, orange) |
| `colors.dark` | `"#0B2E3A"` | the dark color (in the kit's default look, navy) |
| `colors.*` optional | `accent_light`, `accent_pale`, `accent_soft`, `dark_deep`, `green`, `red`, `paper`, `ink`, `muted` | shades derived automatically when left out |
| `fonts.body` | `"fonts/SpaceGrotesk-latin.woff2"` | all text |
| `fonts.hand` | `"fonts/patrickhand.ttf"` | handwritten notes, arrows, scribbles |
| `cta.button` | `"Agendar avaliação"` | buttons clicked by the cursor |
| `cta.en` / `cta.pt` | `trial`, `build`, `build_big` | the 3 default CTAs (comment, free trial, build in X) |

## Do I need the whole design system?

No. The animations use only the tokens in the table above: 2 main colors (the rest is derived), 2 fonts, the symbol, the name and the CTA texts. UI components, grids, custom icons and product screens are not part of the kit.

If the brand has a design system (JSON tokens, Figma, CSS, website), ask Claude: "read the design system at <link or file> and create the brand pack". It pulls the colors, fonts and logo from there.

To show the real product, use screenshots and screen recordings (`public/shots`, `public/covers`, `screen` layout). The kit's app screens are generic mockups with the brand's color and name.

## Using it

```bash
# one project
projects/motion-kit/sync-kit.sh projects/<video> projects/motion-kit/brand-packs/<brand>
# the daily task and new_day.py read the environment variable
export VIDEO_BRAND=projects/motion-kit/brand-packs/<brand>
```

Without a pack, the kit uses the default brand.
