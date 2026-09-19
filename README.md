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
