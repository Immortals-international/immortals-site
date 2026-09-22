# Macau flagship presentation

The former single-page architecture study is now a complete presentation website. The homepage introduces the clinic and the relationship between the public experience floor and private clinical care. Shared mega menus make the layout, four design directions and original thirteen experience concepts directly accessible.

## Sitemap

- `/` — clinic vision, experiences, interiors, layout and tour introductions.
- `/layout/` — Club, Gallery and Salon in one page, with the original SVG drawings, area comparison and zoom dialog. `#club`, `#gallery` and `#salon` select a plan.
- `/interior-design/` — four-direction overview and six-room comparison.
- `/interior-design/sculptural-minimalism/`
- `/interior-design/asian-modernist/`
- `/interior-design/contemporary-luxury/`
- `/interior-design/tailored-luxury/`
- `/experiences/` — why experiences matter, guest journey and all thirteen concepts.
- `/experiences/beat-the-dealer/` — existing three-round interactive showcase.
- `/experiences/tilt-meter/`
- `/experiences/mystery-marker/`
- `/experiences/night-room/`
- `/experiences/baccarat-oxygen-salon/`
- `/experiences/hosted-heat-session/`
- `/experiences/one-plate/`
- `/experiences/skin-portrait/`
- `/experiences/vo2-introduction/`
- `/experiences/dexa-body-portrait/`
- `/experiences/two-baselines/`
- `/experiences/three-numbers/`
- `/experiences/bring-your-watch/`
- `/tour/` — existing six-room viewer.

## Shared structure

`SiteLayout.astro` provides the presentation shell, with reusable header, footer and image dialog. Beat the Dealer and the tour retain their existing presentation/game/viewer code and use the shared header. Experience content is held in `src/data/experiences.js`; design directions and room metadata are in `src/data/site.js`.

Desktop menus support hover on the category link, explicit toggle buttons, outside-click dismissal and Escape. Mobile uses a menu button and expandable sections. Overview links remain ordinary links. All navigation and assets use Astro's configured base, supporting the repository Pages prefix and the custom-domain root.

## Original assets and naming

The current renders, official wordmark, fonts, floor-plan SVGs, original boards and 360° assets are retained. New names map to existing asset folders:

| Presentation name | Existing asset folder |
| --- | --- |
| Sculptural minimalism | `futurism` |
| Asian modernist | `asian` |
| Contemporary luxury | `aman` |
| Tailored luxury | `milanese` |

Experience pages use relevant existing room studies as context. Captions distinguish an atmosphere/setting reference from an illustration of the specific activity. Hotel-room, heat-facility and meal-service designs have not been created or implied by the reused clinic images.

## Experience content decisions

Each new page explains the invitation, three steps of the visit, personal takeaway, potential next conversation and operating assumptions. Beat the Dealer remains the sole browser-game experience; its reaction, grip-control and balance mechanics are unchanged.

- Paid entry is confirmed only for Beat the Dealer. No new prices or booking/payment flow are introduced.
- Mystery Marker reveals a proposed test before the guest agrees to it.
- Night Room is a proposed hotel extension, distinct from a patient suite.
- Baccarat Oxygen Salon and Hosted Heat Session are marked for feasibility review, with their operating notes visible by default.
- VO₂ Introduction is a short fitness estimate, explicitly separate from a full measured VO₂ max assessment.
- Two Baselines includes an appropriately timed repeat after the trip.
- Three Numbers does not promise instant laboratory results.
- Bring Your Watch reviews existing wearable history; no live device integration is promised.

The site remains a concept presentation with `noindex,nofollow`. Feedback continues to link to the existing external service. There are no changes to DNS, deployment settings, authentication or feedback storage.

## Verification

- Both the repository-prefix build and `SITE_URL=https://immortals.international` build produce 22 routes.
- Existing regression suites pass: seven dealer-model checks and ten tour checks.
- Browser review of all 22 routes at 1440 × 1000 and 390 × 844: no page exceptions, missing asset responses or horizontal overflow.
- Verified thirteen experience menu links, Escape dismissal, mobile navigation, all-four image comparison update, image dialog, plan deep links, 150% zoom and plan switching inside the dialog.
- Custom-domain output audited for duplicate IDs and missing local link/asset targets: none.
- Single-file preview checked from a local file URL: navigation, four DEXA comparison images, floor-plan switching/zoom, grip demo start, six-room tour reaching Hyperbaric and mobile experience navigation.
- A responsive image-height correction was checked after the full-route review.

The offline preview generator is `scripts/build-presentation-preview.py` at the repository root. It packages the compiled site into one HTML file and adapts asset URLs/navigation only inside the review wrapper. Production pages remain ordinary static Astro routes.
