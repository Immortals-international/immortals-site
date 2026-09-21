# Beat the Dealer — presentation preview

Built from main at `863f2b23755888eedc25ffa79d08e0cfaedbefea` for review before publication.

## What changed

- Added `/experiences/beat-the-dealer/` with a participation scene, three-round introduction, playable browser reaction demo, interactive illustrative scorecard, ticket inclusions and expandable operating concept.
- Added an experience chapter after the homepage vision, with an entry link and updated chapter numbering. Existing galleries, floor plans, feedback and 360 tour remain.
- Paid entry is confirmed. Price, equipment, staffing and timing are planning assumptions rather than a bookable offer. No payments or booking backend.
- The browser game uses three attempts and their median against a clearly labelled 300 ms demo target. It handles early responses, retries, reset, held keys, loss of focus and signal timeout. No results are stored or sent.
- Browser measurements are kept separate from the fictional clinic scorecard. The scorecard's grip, balance, reaction values and targets are illustrative, not clinical reference ranges.

## Three-round interactive update

The presentation now includes a connected three-round game, selectable round progress, retry/skip controls and a final scorecard based on the visitor's actual browser inputs. The fictional in-clinic scorecard remains separate.

- **Reaction:** three attempts, median response time, 300 ms demo target.
- **Grip control:** hold the button or Space to raise a virtual gauge; release to lower it. Hold the green zone for three continuous seconds within 15 seconds. The animated dynamometer is illustrative; the result measures control-game time, not strength.
- **Balance:** use left/right arrow keys or hold the on-screen phone buttons to counter a board's tilt and momentum. Accumulate ten seconds near level in a fifteen-second round. The result measures virtual-board control, not physical balance.
- **Outcome:** all three rounds must be played before declaring an overall winner; two or more wins beat the dealer. Skipped and unplayed rounds have no invented values. Retrying clears only that round; restarting clears the match.
- Focus loss, hidden pages and leaving the game pause active rounds and release held inputs. Pausing grip breaks its continuous-hold streak while preserving the best prior hold. Touch cancellation and lost pointer capture release controls.

Verification for this update: seven deterministic game-logic tests pass, including achievable wins, idle/constant-input losses, frame-rate consistency, score bounds, completed-state stability and skip semantics. Headless Chromium checks passed for the complete three-round journey, keyboard holds, pause/resume, real result propagation, retries, skipped rounds, two-of-three outcomes, match reset, mobile touch/cancellation and layout at 390/375 px. Desktop and phone screenshots were reviewed. Physical-device testing is still outstanding. Run `npm run test:dealer` from `astro-site/`.

## Local review

From `astro-site/`, run `npm ci`, `npm run build`, then `npm run preview`. Default path: `/immortals-site/experiences/beat-the-dealer/`. With `SITE_URL=https://immortals.international`, the path is `/experiences/beat-the-dealer/`.

Review the page's story, the proposed physical format, the reaction demo and the scorecard. The image is an atmosphere concept; furniture and equipment geometry are not validated against the floor plan. Desktop and mobile browser simulation does not replace testing on physical phones or validating the clinic's measurement protocol.

## Verification

- Production builds pass with both the repository base path and custom-domain base path.
- All ten existing tour tests pass.
- Headless Chromium checks passed at 1440 × 1000, 390 × 844 and 375 × 667: assets and fonts load; no horizontal overflow; homepage entry navigates to the experience.
- Exercised early-response retry, pending-signal cancellation on reset, focus-loss pause, held Space key, three attempts and median calculation, mobile touch, scorecard reveal/detail buttons and operating details. No page errors were observed.
- Desktop and mobile screenshots were visually reviewed. Checks used browser simulation rather than physical devices.

## Image provenance

Asset: `public/assets/experiences/beat-the-dealer.webp` (1672 × 941; WebP quality 90).

Created using the built-in image-generation tool. Reference: `public/assets/scenes/futurism/main-entrance.webp`. The reference supplied materials, lighting and interior style; it did not establish a precise position on the plan. Original generated source: `exec-f929c673-374d-42b6-996f-fcd054751a4b.png` in the originating conversation.

Prompt:

> Use case: photorealistic-natural / architectural concept. Asset: wide 16:9 editorial photograph for the Immortals Macau 'Beat the Dealer' paid clinic experience webpage. Use the reference ONLY for the established interior language: warm ivory stone, sculptural oak fins, concealed warm light, pale polished limestone floor, subdued blue upholstery. Create a NEW scene deeper inside this same public clinic discovery lounge. Main subject: one elegant oval pale stone challenge table with an inset navy interactive surface and a physical circular softly cyan-lit reaction pad. One well-dressed Hong Kong Chinese male guest around age 40 in a casual dark knit shirt and light trousers leans slightly forward and naturally taps the illuminated pad with one hand. Across the table, one friendly Asian female host in a refined dark navy uniform guides him, normal relaxed posture. One female companion in cream clothes watches with a subtle smile beside him. Exactly three people, anatomically natural hands and faces. A realistic small hand-grip dynamometer rests neatly on the table to one side. In the back-right of the scene is a separate low profile balance platform with a discreet support rail. Setting is a calm spacious hospitality-led discovery area, with the coordinated challenge furniture grounded in the actual room and generous clear circulation. Straight architectural verticals, no fisheye. Shot at ordinary eye level, 35mm editorial lens, natural believable proportions. People and table occupy the central and right two-thirds with a quieter ivory wall and timber texture at left. Table, hands and interaction must remain clearly readable at website hero size. Warm daylight and soft indirect light, refined candid photograph, no blue science-fiction glow beyond subtle pad light, no oversized holograms, no casino equipment, no playing cards, no chips, no visible text, no logos, no watermark. High detail, one coherent full-frame photographic scene.
