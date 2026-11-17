import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import clerk from '@clerk/astro';

export default defineConfig({
  site: 'https://www.madridfemeninoxtra.com',
  compressHTML: true,
  redirects: {
    '/rivales/estadios': { status: 301, destination: '/estadios' },
    '/calendario': { status: 301, destination: '/partidos' },
    '/home': { status: 301, destination: '/' },
    '/estadisticas/graficos': { status: 301, destination: '/estadisticas/avanzadas' },
    '/comparador/con-sin': { status: 301, destination: '/comparador/sinergias' },
    '/rankings/maximas-goleadoras': { status: 301, destination: '/rankings?estadistica=goles' },
    '/rankings/maximas-asistentes': { status: 301, destination: '/rankings?estadistica=asistencias' },
    '/rankings/mas-partidos': { status: 301, destination: '/rankings?estadistica=partidos' },
    '/rankings/mas-minutos': { status: 301, destination: '/rankings?estadistica=minutos' },
    '/rankings/mas-capitanias': { status: 301, destination: '/rankings?estadistica=capitanias' },
    '/rankings/porterias-a-cero': { status: 301, destination: '/rankings?estadistica=porterias_cero' },
    '/rankings/[slug]': { status: 301, destination: '/rankings' },
  },
  output: 'server',
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  adapter: vercel({
    imageService: false,
    // Las páginas públicas se generan una vez y se sirven desde el almacén ISR.
    // Las etiquetas de caché las regeneran al cambiar Turso o Contentful.
    // Las fichas de partido (y sus pestañas) también: las antiguas solo con su
    // etiqueta match-ID y las recientes con cualquier carga de datos de partido.
    // API, votaciones, la pestaña de valoraciones y el widget del próximo partido
    // (dependen de la hora o de los votos) siguen siendo funciones normales.
    isr: {
      expiration: false,
      exclude: [
        /^\/api(?:\/|$)/,
        /^\/valoraciones(?:\/|$)/,
        /^\/premios(?:\/|$)/,
        /^\/partidos\/[^/]+\/valoraciones\/?$/,
        /^\/proximo-partido\/?$/,
        /^\/(?:comparador|mercado|plantilla|rankings|search)(?:\/|$)/,
        /^\/(?:sitemap\.xml|news-sitemap\.xml|rss\.xml)\/?$/,
      ],
    },
  }),
  image: {
    service: {
      entrypoint: './src/lib/passthrough-image-service.ts',
    },
    domains: ['images.ctfassets.net', 'downloads.ctfassets.net', 'media.madridfemeninoxtra.com'],
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['@contentful/rich-text-html-renderer', '@contentful/rich-text-types'],
    },
  },

  integrations: [clerk(), react()]
});
