# Immortals Macau

The existing architectural presentation, deployed from `astro-site/` using Astro 7.3.3 and Node.js 24. All four directions have equal prominence. The original images, fonts, three distinct floor plans, room comparisons and enlarged views are preserved.

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

Each architectural direction has six matching room scenes, synchronized room selection, thumbnails and a full-screen viewer. The comparison section also offers all six rooms. Original lounge/suite studies, floor plans and feedback remain available.

Display WebP files and thumbnails are generated with `node scripts/prepare-scenes.mjs /path/to/extracted-pack/public` after installing the Astro dependencies. The original PNG masters are retained in the supplied `Immortals-Macau-24-Scene-Pack.zip` archive and in the local ignored `verification/scene-pack/` extraction. `public/assets/scenes/manifest.json` records both source and display hashes. Generated display files are committed; production builds do not need the private handoff folder. Images keep their full proportions, with no crops or upscaling.
