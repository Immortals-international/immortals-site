# Immortals Macau architectural presentation

Astro port of the existing Immortals Macau presentation. All four architectural directions, images, fonts, three floor plans, comparisons and zoom controls are included locally.

## Development

Use Node.js 24, then run `npm ci` and `npm run dev`. Run `npm run build` for a static build in `dist/`.

## GitHub Pages

The repository-root deployment workflow builds `astro-site/` on pushes to `main`. GitHub Pages must use GitHub Actions as its source. The default URL is `https://immortals-international.github.io/immortals-site/`.

For the custom domain, configure `immortals.international` in GitHub Pages and set the repository variable `SITE_URL` to `https://immortals.international`. The build then uses `/` as its base. Configure DNS at GoDaddy, the domain's current authoritative provider. Do not put API keys or tokens in this repository.

## Feedback migration status

GitHub Pages cannot run the current database or authentication service. This first static port links to the existing saved-feedback form on the original presentation. Existing responses and the owner's private summary remain there. The original feedback client, markup and server remain in the local handoff bundle, excluded from this repository and the published site. Those server files trust authenticated headers injected by Sites and must not be deployed publicly as-is. A standalone feedback backend requires replacement authentication and storage before it can replace the existing service.

## Publishing status

Uploading this repository does not itself confirm a live deployment or configured custom domain. Check the Actions run and Pages settings.
