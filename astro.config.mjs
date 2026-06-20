import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static site — deploys to Cloudflare Pages (build output: dist/).
export default defineConfig({
  site: 'https://vietnamcoco.vn',
  output: 'static',
  compressHTML: true,
  build: { format: 'directory' },
  integrations: [sitemap()],
});
