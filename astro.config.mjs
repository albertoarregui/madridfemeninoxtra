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
    // El calendario se integró en /partidos (próximos partidos y resultados).
    '/calendario': { status: 301, destination: '/partidos' },
  },
  output: 'server',
  prefetch: {
    // No abrir páginas SSR con consultas a Turso sólo por pasar el cursor.
    // Las vistas que realmente lo necesiten pueden activar prefetch por enlace.
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  adapter: vercel({
    // Las imágenes ya se suben optimizadas en WebP. Evitamos generar variantes
    // mediante la API de Image Optimization de Vercel (y consumir su cuota).
    imageService: false,
  }),
  image: {
    // Conserva el archivo original: no redimensiona ni recomprime las imágenes
    // y enlaza al archivo directamente (sin el endpoint `/_image`).
    service: {
      entrypoint: './src/lib/passthrough-image-service.ts',
    },
    domains: ['images.ctfassets.net', 'downloads.ctfassets.net', 'media.madridfemeninoxtra.com'],
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // Publican ESM sin "type": "module"; el runtime Node de Vercel no puede
      // cargarlos desde node_modules, así que se incluyen en el bundle.
      noExternal: ['@contentful/rich-text-html-renderer', '@contentful/rich-text-types'],
    },
  },

  integrations: [clerk(), react()]
});
