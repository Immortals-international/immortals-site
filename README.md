# Immortals Macau

The Macau flagship presentation, built in `astro-site/` using Astro 7.3.3 and Node.js 24. A shared mega-menu navigation connects the homepage, Layout, Interior Design and Experiences. The site has 22 static pages, including four design directions, thirteen experience concepts and the six-room 360° tour. See `astro-site/MACAU_PRESENTATION.md` for the sitemap, content decisions and validation.

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

Each architectural direction has its own page, with the six room studies, material palette and original lounge/suite board. Room images open in a full-image dialog. The Interior Design overview compares any of the six rooms across all four directions; full room views retain their proportions. Navigation thumbnails and atmospheric homepage hero images may crop for composition. The single Layout page contains all three original floor plans and the zoomable drawing explorer.

Display WebP files and thumbnails are generated with `node scripts/prepare-scenes.mjs /path/to/extracted-pack/public` after installing the Astro dependencies. The original PNG masters are retained in the supplied `Immortals-Macau-24-Scene-Pack.zip` archive and in the local ignored `verification/scene-pack/` extraction. `public/assets/scenes/manifest.json` records both source and display hashes. Generated display files are committed; production builds do not need the private handoff folder. Images keep their full proportions, with no crops or upscaling.


## Offline presentation preview

After building the site, run `python3 scripts/build-presentation-preview.py /absolute/path/Immortals-Macau-Presentation-Preview.html`. The generated HTML embeds the compiled pages and assets, with local navigation, comparison controls, the game and the 360° tour. It is a review artifact; generating it does not publish the website.
