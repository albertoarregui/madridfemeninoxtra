import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

import clerk from '@clerk/astro';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.madridfemeninoxtra.com',
  output: 'server',
  adapter: vercel({
    imageService: true,
  }),
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react(), sitemap(), clerk()]
});