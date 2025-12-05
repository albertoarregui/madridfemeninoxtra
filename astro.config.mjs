import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

export default defineConfig({
  output: 'hybrid', // Habilita SSR para rutas API dinámicas

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()]
});