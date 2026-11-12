# Family 09 · demo (screen demonstration, the default for all projects)

The style of a typical product-homepage demo video, for any brand: real screenshots of the app, one per state, animated with a smooth zoom that comes in and out, a cursor gliding along a curve, a ripple on click with the cursor sinking, typing that swaps the screenshots, and the result at the end (pulls back, highlights what changed with a glow and reflection, badge with the number and a strong zoom). No raw screen recording.

| id | name | what it does | when to use | materials | example props |
|---|---|---|---|---|---|
| screenDemo | Screen demo | Animates a recorded flow (`midia/fluxos/<name>`): the camera goes to each action, cursor, click, typing, result with highlight and badge | tutorial, "how it works", proof that it's fast, any product feature | a flow recorded with `capture/flow.js` (screenshots + click boxes) copied to `public/fluxos/<name>` | `{"src":"fluxos/nota-fiscal"}` (optional: `area` [x,y,w,h], `zoom`, `speed`, `fit` contain/cover, `label`) |

In 16:9 the whole app is visible and the camera zooms in 1.5x on each action. In 9:16 it fills the area (`fit: cover`) and the camera follows the action; on the result it pulls back to fit the whole row. The duration adapts to the beat (0.75x to 1.7x). Use the `hidden` layout (or a small `circle`) while screenDemo is on screen.
