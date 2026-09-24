# Immortals Macau

The Macau flagship presentation, built in `astro-site/` using Astro 7.3.3 and Node.js 24. A shared mega-menu navigation connects the homepage, Layout, Interior Design and Experiences. The site has 22 content pages and three redirects, including four design directions, thirteen experience concepts and the six-room 360° tour. See `astro-site/MACAU_PRESENTATION.md` for the sitemap, content decisions and validation.

## Run locally

```sh
cd astro-site
npm ci
npm run build
npm run preview
```

The default base is `/immortals-site/`. Set `SITE_URL=https://immortals.international` when building for the custom domain.

## Deployment

`.github/workflows/deploy.yml` builds `astro-site/` and deploys to GitHub Pages on pushes to `main`. Enable GitHub Actions as the Pages source. Configure the custom domain in Pages, set the repository variable `SITE_URL`, then point its DNS at GitHub Pages and enable HTTPS once the certificate is issued.

## Feedback

The presentation links to the existing [team feedback form](https://immortals-macau-visual-concepts.immortals-in-8490.chatgpt.site/#discussion). Saved responses and authentication remain on that service. Keep it running. A standalone feedback migration needs verified authentication and database hosting; GitHub Pages cannot provide them. No submitted feedback records are included here.

## Room scene galleries

The approved September 2026 scene set contains six rooms across Sculptural Minimalism, Shadow & Timber, Blue Mineral and Navy Residence. Each direction has a room carousel; the overview compares the same room across all four. Full images open in a dialog without cropping. The lobby images are 3:2 and the remaining room images are 16:9. The previous direction URLs redirect to their current names.

The Blue Mineral lobby includes the approved eight-second silent water loop, with WebM and MP4 sources. It plays only while visible, pauses when switching rooms or hiding the page, and provides an explicit pause/play control. Reduced-motion users start with the still image. A video failure leaves the still usable.

The approved website exports and their thumbnails are committed under `astro-site/public/assets/scenes/`. `manifest.json` records the current names, actual dimensions, source master hashes and exported asset hashes. Stable internal asset IDs preserve existing experience-page links. The 360° tour uses its separate panorama assets.

To republish this approved pack, run `node scripts/publish-approved-scenes.mjs /path/to/clinic-scene-rollout-2026-09-23` after installing the Astro dependencies. The companion `output/gallery-water-motion-2026-09-23` folder supplies the approved loop. Production builds need only the committed exports, not the private source folder. `scripts/prepare-scenes.mjs` is the older archive importer and should not be run against this release.


## Offline presentation preview

After building the site, run `python3 scripts/build-presentation-preview.py /absolute/path/Immortals-Macau-Presentation-Preview.html`. The generated HTML embeds the compiled pages and assets, with local navigation, comparison controls, the game and the 360° tour. It is a review artifact; generating it does not publish the website.
