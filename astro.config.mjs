import { defineConfig } from 'astro/config';
export default defineConfig({ site: 'https://vietnamcoco.vn', output: 'static', compressHTML: true, build: { format: 'directory' } });
