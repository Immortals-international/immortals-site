# Immortals Macau architectural presentation

Astro port of the existing Immortals Macau presentation. All four architectural directions, images, fonts, five floor plans, comparisons and zoom controls are included locally.

## Floor plans

All five plans now include the September 25 corner-frontage revision. Gallery retains its visible lab, aligned salon walls, internal guest toilets and open corner lounge. The four other concepts each have a distinct public corner: discovery lounge, social salon, public forum and neighbourhood living room. Each now includes an enclosed working lab visible from public space. Two destinations retains the guest lecture forum, with its experience rooms beside the window café and a wider route around the internal support block. Their toilets and support rooms move inward, with revised circulation and equipment placement. All five share the homepage preview, layout comparison and enlarged viewer.

Run `python3 scripts/floor-plans/build_gallery.py` from the repository root to regenerate Gallery and refresh its cache hash. The supplied baseline is preserved in `scripts/floor-plans/gallery-source.svg`. The revised drawing deliberately omits obsolete area allocations; corner glazing and lab services remain proposals.

The four concept geometries are in `../scripts/floor-plans/concepts.json`. From the repository root, run `python3 scripts/floor-plans/build.py` to regenerate their SVGs and cache manifest. This renderer reads Gallery's reference symbols but never writes Gallery. With Shapely 2.x installed, run `python3 scripts/floor-plans/validate.py` to check coverage, overlaps, room doors, public lab glazing and circulation. The drawings illustrate the agreed program; measured areas, dimensions, new entrances and equipment fit remain unverified.

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

## Homepage clinic film

The homepage hero uses the approved 32-second revision-3.1 clinic experience film, with the enclosed mall entrance. The existing headline, description and destination links remain unchanged. `HeroFilm.astro` supplies the background media and pause/play control; `hero-film.js` handles visible-only silent playback and a bounded scroll parallax. Reduced-motion and data-saving visitors see the poster until they choose Play video. Video errors leave the poster visible.

Assets live in `public/assets/films/`. The desktop MP4 is the approved web export. The lighter 540 x 960 phone version preserves the 32-second edit and reframes each existing shot to keep the person or detail visible. Versioned filenames allow a later approved film to replace these assets without stale caches.
