# Immortals Macau — Codex handoff

## Start here

Continue the existing Astro website. Do not rebuild it from scratch or use the standalone HTML preview as the source project. Fetch GitHub first and preserve any newer work. Run the site locally and confirm images render on the user’s Mac, then continue the homepage review section by section. Read the latest validation results below before changing image code.

Repository: https://github.com/Immortals-international/immortals-site

Working branch: `feat/macau-presentation-site`

Application baseline before this documentation commit: `f903103f1ac1d27df72257297e4af4d9aca71511`.

Live colour reference: https://immortals.international/#asian

The presentation work is saved on the working branch. It has not been merged into `main` or published to the live domain. Do not confuse the live site with the newer multipage presentation. The user chose a Codex handoff in this exchange; do not treat it as an instruction to merge or deploy automatically.

## What we are building

A polished presentation website for the proposed Immortals Macau longevity clinic. The immediate audience includes Jason and project stakeholders. It should make the proposed clinic tangible, explain the spatial and commercial thinking, and invite discussion. It is not currently a booking or clinical service application.

The user wants an impressive, visually rich experience with restrained copy, architectural imagery, individual experience pages and a linked 360° room tour. One interactive experience is sufficient to demonstrate the idea. Later work may include a homepage trailer video.

## Latest user decisions — these take priority

- The existing live site is the preferred reference specifically for **colours**. This is not a request to copy its text, spacing or page layout.
- Preserve the current multipage structure and approved navigation and typography work.
- The latest attempt to enforce an off-white/Dusk/Wave palette was disliked and explicitly reverted. Do not reapply it automatically.
- White section breaks and accent text are acceptable in principle. The user dislikes a monotonous blue page, but widening the gradient is not the preferred solution. No new treatment has yet been approved.
- Less text is better. Avoid decorative numbers, excessive eyebrows, labels, repeated explanations and filler.
- Preserve large headings. Do not shrink type to solve a width problem; adjust the layout instead.
- The homepage vision heading should occupy two complete lines on desktop, left-aligned, with its supporting paragraph below it. Mobile may wrap naturally.
- Both homepage hero CTAs are recognisable buttons below the supporting text, aligned left. Preserve this.
- “Let’s shape the flagship.” is an approved closing idea.
- Work section by section. Discuss substantial new design directions before implementing them. Do not reopen settled choices unnecessarily.
- Never send email or Slack messages without explicit approval. No outreach is needed for this work.

## Current site structure

There are 22 generated routes:

- `/`: presentation homepage.
- `/layout/`: one complete layout page; no child pages or Layout mega menu. Three concepts: Club, Gallery and Salon, with plan selection and a zoom dialog.
- `/interior-design/`: four-style comparison overview.
- Four interior subpages: `sculptural-minimalism`, `asian-modernist`, `contemporary-luxury`, `tailored-luxury`.
- `/experiences/`: why experiences matter and an overview of 13 concepts.
- Thirteen experience subpages: `beat-the-dealer`, `tilt-meter`, `mystery-marker`, `night-room`, `baccarat-oxygen-salon`, `hosted-heat-session`, `one-plate`, `skin-portrait`, `vo2-introduction`, `dexa-body-portrait`, `two-baselines`, `three-numbers`, `bring-your-watch`.
- `/tour/`: linked six-room 360° concept tour.

Homepage sequence: hero → vision → layout → interior design → experiences → 360° tour → “Let’s shape the flagship.”

Navigation: Layout is a direct link. Interior Design and Experiences have directly clickable overview links plus wide desktop mega menus. Their overview links sit near the corresponding navigation trigger, avoiding a long mouse journey to the far left. Mobile uses accordions. Preserve keyboard, Escape, outside-click and focus behaviour.

Beat the Dealer has reaction, grip-control and virtual balance demonstrations. Paid entry for the real concept was confirmed, but no price was agreed. The browser games are demonstrations, not clinical measurements. Do not make every experience interactive.

## Immediate issue: images fail in the standalone preview

The user reports widespread missing images in ChatGPT's local HTML preview. A screenshot specifically shows a broken floor-plan image in the homepage “One footprint. Three possibilities.” section. Another shows the text-only vision section. These are homepage sections even though ambient browser state sometimes reports `/layout/`.

The exact runtime cause is **not confirmed**. Do not claim the site assets are missing or that the issue is fixed without testing.

What was checked:

- The standalone preview is approximately 25.56 MB and embeds 22 pages and 86 assets.
- All 228 nonempty static `<img src>` references map to embedded assets. Twenty additional image elements have no initial `src`, including lightbox placeholders; these are not missing files.
- The Club SVG is embedded with MIME type `image/svg+xml`, approximately 202 KB.
- All three source floor-plan SVGs parse as valid XML.
- The Astro production build succeeds.
- The Linux test browser was found to have an incomplete executable: 164,085,760 bytes instead of the package’s 209,022,176 bytes. It was restored from the original package; browser checks now run successfully. This was a test-environment issue, not proof of the Mac app’s image-loading cause.
- All 78 raster source images decode successfully, and all three floor-plan SVGs parse as valid XML.
- Fresh Chromium checks against the compiled Astro site over localhost passed at 1440, 1024, 390 and 375 px widths: no missing homepage images, horizontal overflow, page errors or failed requests. Links to Layout, Interior Design, Experiences and the tour also passed.
- Fresh file-preview checks passed for the homepage, Layout, Interior Design overview, Asian modernist and One Plate. All images with initial `src` decoded on those pages, with no page errors.
- An older broader preview test has a stale selector for the Layout navigation link and times out there. That timeout is not an image-loading failure. Update selectors before relying on that old harness.
- The reported Mac app issue is still not reproduced. Do not make speculative production asset-path changes. First confirm in the user’s real browser/localhost setup; investigate Blob/iframe behaviour in the Mac preview only if reproducing that specific wrapper is still necessary.

The offline wrapper in `scripts/build-presentation-preview.py` embeds base64 asset data, creates Blob URLs, rewrites page assets and CSS, and displays each route in a Blob-backed iframe. It also intercepts dynamic image `src` assignments and implements parent-window hash navigation. This preview-specific machinery is a plausible failure area, especially in the Mac app's file preview, but remains a hypothesis.

First run the actual Astro project over localhost. Inspect failed image requests, console errors, asset MIME types and `naturalWidth`. Test the homepage floor plan, all three plan variants, four design galleries, experience images, enlarged images and 360° textures. If localhost works, isolate the problem to the offline wrapper before changing production asset paths. The user prefers reliable Codex development over continued dependence on the large single-file preview.

## Latest design proposal — discussed, not implemented

The user feels the homepage is too monochrome and its vision section too empty/text-heavy. The latest recommendation was:

1. Keep the navy palette and introduce contrast through existing clinic imagery: warm materials, daylight and people.
2. Keep the vision heading large and on two desktop lines; shorten the paragraph to one sentence.
3. Place a larger main-entrance image and a smaller patient-suite image beneath it, illustrating the public welcome and private clinical experience.
4. Restore the missing floor-plan image before redesigning the layout teaser. It should be a substantial visual on a light drawing panel beside the existing heading and short description.

The user then requested this handoff. Confirming reliable image loading on the user’s Mac is the next concrete task; Linux Chromium now passes. The proposed vision redesign is not yet approved.

## Local setup in Codex

Use an existing checkout if available. Inspect its status before switching branches; preserve uncommitted work. For a fresh checkout:

```bash
git clone https://github.com/Immortals-international/immortals-site.git
cd immortals-site
git fetch origin
git switch --track origin/feat/macau-presentation-site
cd astro-site
npm ci
SITE_URL=http://localhost:4321 npm run dev -- --host 127.0.0.1
```

Use Node 24; the package requires Node >=22.12.0. Astro is pinned to 7.3.3 in the current project. The existing package lock is authoritative.

Production check, from `astro-site/`:

```bash
SITE_URL=https://immortals.international npm run build
npm run test:tour
npm run test:dealer
```

Run relevant tests when modifying those features; a colour-only edit does not require rewriting the game tests.

`astro.config.mjs` uses base `/` when `SITE_URL` is set. Without it, the default base is `/immortals-site/`. Match the intended hosting environment rather than hard-coding asset paths. `src/data/site.js` supplies URL helpers.

The existing `.github/workflows/deploy.yml` publishes GitHub Pages on pushes to `main` and supports manual dispatch. It builds `astro-site` using Node 24 and repository variable `SITE_URL`. Inspect current hosting configuration before any future deployment. Do not change DNS, hosting provider or domain settings as part of the handoff.

## Main files

| Area | Repository path |
| --- | --- |
| Homepage and scoped homepage CSS | `astro-site/src/pages/index.astro` |
| Shared page styles | `astro-site/src/styles/site.css` |
| Header/menu appearance | `astro-site/src/styles/site-shell.css` |
| Navigation | `astro-site/src/components/SiteHeader.astro`, `astro-site/src/scripts/site-navigation.js` |
| Shared page layout | `astro-site/src/layouts/SiteLayout.astro` |
| Layout page and controls | `astro-site/src/pages/layout.astro`, `astro-site/src/scripts/layout-explorer.js` |
| Styles, rooms and URLs | `astro-site/src/data/site.js` |
| Experience content | `astro-site/src/data/experiences.js` |
| Interior pages | `astro-site/src/pages/interior-design/` |
| Experience pages | `astro-site/src/pages/experiences/` |
| 360° tour | `astro-site/src/pages/tour.astro`, `astro-site/src/scripts/clinic-tour.js`, `astro-site/src/data/clinic-tour.js` |
| Interactive demo | `astro-site/src/scripts/beat-the-dealer.js`, `astro-site/src/scripts/dealer-game-models.js` |
| Offline preview generator | `scripts/build-presentation-preview.py` |

## Existing assets and scene constraints

Assets are in the repository, primarily `astro-site/public/assets/`. They do not need to be recovered from this chat.

Style asset mappings:

| Display name | Asset key |
| --- | --- |
| Sculptural minimalism | `futurism` |
| Asian modernist | `asian` |
| Contemporary luxury | `aman` |
| Tailored luxury | `milanese` |

Scene images use `assets/scenes/{style}/{room}.webp` with thumbnail variants. Room keys include `main-entrance`, `private-entrance`, `patient-suite-blood-draw`, `dexa`, `vo2-max`, `hyperbaric`. Original boards use `assets/{style}.png`; floor plans use `assets/plan-{club,gallery,salon}.svg`. Official wordmark and Mori font assets are already included.

Keep scenes consistent with the floor plan. Main arrival should feel grand and double-height. Blood draw belongs in the established patient suite. DEXA equipment should be positioned plausibly against a wall. The hyperbaric concept is a seated multi-person chamber integrated into its room; the user previously objected to overly curved geometry. Inspect current tour imagery before proposing replacements. These are design concepts, not surveyed architectural or clinical specifications.

## Brand reference and reverted attempt

The official Quick Start guide is at https://drive.google.com/file/d/1NDaFF4mCy4JefQ8AJV4fVFWjAb-0OEJh/view . Its published palette includes Dusk `#1D2C4E`, Rise `#FCFBF8`, Wave 500 `#4A6AAB`, and Wave 300 `#A8BCD7`. It specifies Wave 400 for emphasis on dark surfaces, but the fetched text did not supply that hex value. Gold was not listed. Do not invent an approved gold or claim full brand compliance.

However, the user explicitly preferred the previous visual treatment and authorised reverting the recent palette implementation. Honour that design choice. The live site is the colour reference; text and layout are being developed independently.

Useful history:

- `cee1547`: larger full-width vision heading and left-aligned hero buttons.
- `4546321`: palette/light-section attempt, subsequently rejected.
- `f903103`: reverts that attempt; current confirmed working state.

## Suggested first response and completion criteria

Tell the user you have loaded the existing branch and understand that the live reference is for colours only. Start the project locally and confirm image rendering before proposing further visual changes. Only change image code if a failure can be reproduced; the current Linux Chromium checks pass. Keep progress updates short and do not ask the user to repeat the briefing.

The immediate milestone is a reliable local preview with visible images, functioning navigation, floor-plan selection/zoom and no new regressions. Then return to the homepage vision section. Preserve the existing copy and layout unless the user approves the next design revision. Publish only when the user clearly asks to publish the reviewed result.
