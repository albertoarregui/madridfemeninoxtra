import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import clerk from '@clerk/astro';

export default defineConfig({
  site: 'https://www.madridfemeninoxtra.com',
  compressHTML: true,
  // Ruta histórica consolidada: el listado único es /estadios.
  redirects: {
    '/rivales/estadios': { status: 301, destination: '/estadios' },
  },
  output: 'server',
  prefetch: {
    // Precarga al pasar el cursor sobre un enlace: navegación más rápida sin precargar en masa.
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  adapter: vercel({
    // Las imágenes ya se suben optimizadas en WebP. Evitamos generar variantes
    // mediante la API de Image Optimization de Vercel (y consumir su cuota).
    imageService: false,
  }),
  image: {
    // Conserva el archivo original: no redimensiona ni recomprime las imágenes.
    service: {
      entrypoint: 'astro/assets/services/noop',
    },
    domains: ['images.ctfassets.net', 'downloads.ctfassets.net', 'media.madridfemeninoxtra.com'],
  },
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [clerk(), react()]
});
