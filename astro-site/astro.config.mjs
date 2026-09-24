import { defineConfig } from 'astro/config';

const customSite = process.env.SITE_URL;
const redirectBase = customSite ? '' : '/immortals-site';
export default defineConfig({
  site: customSite || 'https://immortals-international.github.io',
  base: customSite ? '/' : '/immortals-site/',
  output: 'static',
  trailingSlash: 'always',
  redirects: {
    '/interior-design/asian-modernist/': `${redirectBase}/interior-design/shadow-and-timber/`,
    '/interior-design/contemporary-luxury/': `${redirectBase}/interior-design/blue-mineral/`,
    '/interior-design/tailored-luxury/': `${redirectBase}/interior-design/navy-residence/`,
  },
});
