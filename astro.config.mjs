import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://www.madridfemeninoxtra.com',
  compressHTML: true,
  output: 'server',
  adapter: vercel({
    imageService: true,
  }),
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()]
});