# Immortals Macau architectural presentation

Astro port of the existing Immortals Macau presentation. All four architectural directions, images, fonts, five floor plans, comparisons and zoom controls are included locally.

## Floor plans

Gallery is the unchanged reference. Public windowfront, Shared window club, Two destinations and Two patient houses replace the former Club and Salon options. All five share the homepage preview, layout comparison and enlarged viewer.

The four concept geometries are in `../scripts/floor-plans/concepts.json`. From the repository root, run `python3 scripts/floor-plans/build.py` to regenerate their SVGs and cache manifest. This renderer reads Gallery's reference symbols but never writes Gallery. The drawings illustrate the agreed program; measured areas, dimensions, new entrances and equipment fit remain unverified.

## Development

Use Node.js 24, then run `npm ci` and `npm run dev`. Run `npm run build` for a static build in `dist/`.

## GitHub Pages

The repository-root deployment workflow builds `astro-site/` on pushes to `main`. GitHub Pages must use GitHub Actions as its source. The default URL is `https://immortals-international.github.io/immortals-site/`.

For the custom domain, configure `immortals.international` in GitHub Pages and set the repository variable `SITE_URL` to `https://immortals.international`. The build then uses `/` as its base. Configure DNS at GoDaddy, the domain's current authoritative provider. Do not put API keys or tokens in this repository.

## Feedback migration status

GitHub Pages cannot run the current database or authentication service. This first static port links to the existing saved-feedback form on the original presentation. Existing responses and the owner's private summary remain there. The original feedback client, markup and server remain in the local handoff bundle, excluded from this repository and the published site. Those server files trust authenticated headers injected by Sites and must not be deployed publicly as-is. A standalone feedback backend requires replacement authentication and storage before it can replace the existing service.

## Publishing status

Uploading this repository does not itself confirm a live deployment or configured custom domain. Check the Actions run and Pages settings.

## Clinic tour preview

The dedicated `tour/` page uses the presentation's PP Mori fonts, wordmark and colours. Homepage hero and header links use Astro's configured base URL. The supplied WebGL viewer has been adapted for room selection, projected navigation arrows, previous/next controls, touch swipe and pinch, keyboard controls, fullscreen and loading/error states. No viewer dependency or remote CDN is required.

Start with `npm run build && npm run preview`, then open `http://localhost:4321/immortals-site/tour/`. A build with `SITE_URL=https://immortals.international` uses `/tour/`. No publishing is required for either local preview.

All six rooms now load. Hyperbaric, patient suite and DEXA use newly generated rectilinear cube faces, authorized by the user and referenced to the existing futuristic renders. Forward views have more natural proportions, and the field of view is capped to prevent excessive edge stretching. **Visible joins between generated faces remain.** This is a review preview, not a seamless final tour. See `TOUR_QA.md` before publishing.

Room data is in `src/data/clinic-tour.js` and viewer logic in `src/scripts/clinic-tour.js`. Cubes use +X, -X, +Y, -Y, +Z, -Z ordering (right, left, up, down, front, back). `HBOT_REVISION.md` records this generated preview's mapping and limitations. The original handoff revision was missing. Never substitute or convert the obsolete spherical hyperbaric image.

From the repository root, `node scripts/prepare-tour.mjs /path/to/Immortals-Six-Room-360` preserves the five original display assets. `node scripts/prepare-tour-cubes.mjs /path/to/input.json` prepares generated images; the input maps room IDs to front/back/left/right/up/down source paths. Final faces and their manifest are in `public/assets/clinic-tour/cube-v2/`; prompts are in `TOUR_IMAGE_PROMPTS.md`. Run `npm run test:tour` from `astro-site/` for state, gesture, field-of-view and production-asset checks.
