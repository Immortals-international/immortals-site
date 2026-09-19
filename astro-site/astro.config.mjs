import { defineConfig } from 'astro/config';

const customSite = process.env.SITE_URL;
export default defineConfig({
  site: customSite || 'https://immortals-international.github.io',
  base: customSite ? '/' : '/immortals-site/',
  output: 'static',
  trailingSlash: 'always',
});
