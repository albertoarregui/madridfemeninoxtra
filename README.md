# ⚪️ Madrid Femenino Xtra 🟣

<div align="center">
  <img src="https://i.gyazo.com/e869d44e9d7d11d24b2103b00f923fb1.jpg" alt="Madrid Femenino Xtra - Página principal" width="800" />
</div>

Bienvenido al repositorio oficial de **Madrid Femenino Xtra**, la base de datos histórica más grande del Real Madrid Femenino.

Este proyecto es una aplicación web moderna construida con **Astro**, diseñada para ser extremadamente rápida, visualmente atractiva y fácil de mantener.


# 📊 Datos en cifras

<div align="center">

| Estadística | Valor |
|---|---|
| ⚽ Temporadas | 6 |
| 🗓️ Partidos | 248 |
| ✅ Victorias | 170 |
| 🤝 Empates | 24 |
| ❌ Derrotas | 54 |
| 🥅 Goles a favor | 552 |
| 👟 Jugadoras | 86 |
| 🏟️ Estadios | 62 |
| 🆚 Rivales | 51 |
| 👩‍⚖️ Árbitras | 58 |

</div>

<div align="center">
  <img src="https://i.gyazo.com/ca3d832a3493d966884c9c17495aebc7.png" alt="Madrid Femenino Xtra - Estadísticas" width="800" />
</div>

## ✨ Funcionalidades

- 📰 **Noticias y actualidad** — Cobertura completa del equipo con búsqueda, categorías y tiempo de lectura
- 📅 **Calendario y resultados** — Todos los partidos, pasados y futuros
- 📈 **Estadísticas históricas** — Balance por temporada y competición
- 👩 **Fichas de jugadoras** — Partidos, goles, asistencias y más
- 🏟️ **Estadios y árbitras** — Base de datos completa
- 🏆 **Competiciones** — Primera Iberdrola (2020-2022), Liga F, UWCL, Copa de la Reina y Supercopa
- 📧 **Newsletter** — Aviso por email a los suscriptores confirmados cuando se publica una noticia nueva (webhook de Contentful)
- 🎠 **Carrusel "Jugadoras"** — Plantilla actual (+ entrenador) con foto, dorsal, posición y hasta 3 noticias relacionadas por persona; también en la ficha individual
- ⚡ **Comparador de jugadoras** — Gráfico radar interactivo con tabla de stats por secciones, filtros por temporada y competición (incluyendo "Partidos oficiales"), modos totales/por 90 minutos, y descarga de imagen con logo y fotos de las jugadoras
- 📊 **Estadísticas Avanzadas** — Tracker de xG por partido (goles reales vs esperados) y red interactiva de asistencias con D3, filtros por temporada y competición, con soporte táctil y diseño adaptado a móvil
- 🔍 **Buscador Avanzado** — Tabla de estadísticas individual filtrable por temporada, competición (incluyendo "Partidos Oficiales"), posición, titularidad, fecha y partido; ordenación por columna, modo totales/por 90 minutos y búsqueda en tiempo real
- 📸 **Fotogalerías con detección automática** — Cada foto detecta a las jugadoras etiquetadas en sus metadatos (XMP), y las galerías aparecen solas en la ficha de cada jugadora, en la ficha del partido y en la home. Miniaturas encuadradas en la cara mediante las regiones faciales de los metadatos

---

## 🚀 Tecnologías Principales

- **Framework**: [Astro 5.x](https://astro.build/)
- **Frontend**: [React](https://react.dev/) / [TailwindCSS 4](https://tailwindcss.com/)
- **Base de Datos**: [Turso](https://turso.tech/) (LibSQL)
- **Autenticación**: [Clerk](https://clerk.com/)
- **CMS**: [Contentful](https://www.contentful.com/) (Noticias)
- **Email**: [Resend](https://resend.com/) (Notificaciones de newsletter)
- **Media**: [Cloudflare](https://www.cloudflare.com/) (R2 / Images)
- **Despliegue**: [Vercel](https://vercel.com/)

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/madridfemeninoxtra.git
cd madridfemeninoxtra
```

### 2. Instalar dependencias
```bash
pnpm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

### 4. Iniciar servidor de desarrollo
```bash
pnpm dev
```

## 📁 Estructura del Proyecto

- `/src/pages` — Rutas de la aplicación
- `/src/pages/api/img-proxy.ts` — Proxy server-side para imágenes del CDN (necesario para la descarga de capturas con html2canvas)
- `/src/components` — Componentes reutilizables (Astro y React)
- `/src/db` — Clientes de base de datos Turso
- `/src/utils` — Lógica de negocio y helpers
- `/src/assets` — Recursos estáticos
- `/scripts` — Scripts de mantenimiento y depuración
- `/scripts/galerias` — Subida e indexado de fotogalerías (detección de jugadoras por metadatos)
- `/scripts/migrations` — Migraciones de base de datos versionadas

<div align="center">
  <img src="https://i.gyazo.com/a42415cdf2fcdb4b54b3fc0fce50bda2.png" alt="Madrid Femenino Xtra - Noticias" width="800" />
</div>

## 🔄 Cambios Recientes (Julio 2026)

### 📸 Fotogalerías con detección automática de jugadoras
- ✅ Un script (`npm run galeria` / `npm run galeria:indexar`) lee los metadatos **XMP** de cada foto en Cloudflare R2 (descargando solo la cola del fichero), detecta a las jugadoras etiquetadas y sus **regiones faciales**, las cruza con la tabla `jugadoras` y publica los índices en R2
- ✅ **Ficha de jugadora**: sección "Galería de {nombre}" con las fotos en las que aparece, cargando de 14 en 14, con miniaturas **encuadradas en su cara** y filtros por temporada y competición
- ✅ **Ficha de partido**: sección "Galería del partido" (21 fotos), enlazada automáticamente por el `id_partido` del nombre de carpeta
- ✅ **Home**: nueva sección "Galerías" bajo "Jugadoras", con el mismo hover que las tarjetas de noticias
- ✅ Visor tipo lightbox con teclado, swipe y navegación; las páginas de cada galería las sigue generando **Contentful** (las tarjetas solo enlazan cuando la entrada existe)
- ✅ Diccionario de alias editable (`scripts/galerias/overrides.json`) para variantes de escritura y personas que no son jugadoras
- ✅ Todo adaptado a todo tipo de pantalla, sin scroll horizontal (grid de 2 a 7 columnas según el ancho)

### ⚡ Rendimiento
- ✅ **Caché de CDN** en el middleware: las páginas públicas se sirven desde el borde (`s-maxage` + `stale-while-revalidate`), excluyendo `/api`, `/premios` y cualquier usuario identificado
- ✅ **Caché en memoria de los catálogos** de base de datos (jugadoras, partidos, goles, calendario, rivales, escudos) con TTL por tipo, deduplicando consultas repetidas y ráfagas concurrentes contra Turso
- ✅ **Optimización de imágenes** (servicio de imágenes de Vercel) en galerías, MVP, carrusel de hitos, noticias de la home y "más leídas"; favicon reducido de 343 KB a 5,5 KB
- ✅ **Prefetch** cambiado de `viewport` a `hover` para no renderizar en servidor decenas de páginas por visita
- ✅ Corregido un error de hidratación preexistente en el dashboard de estadísticas (fechas y números con zona horaria e idioma fijos)

### 🏠 Home
- ✅ **Vídeo de fondo del hero eliminado**; el fondo global (`background.webp`) queda visible en toda la página, hero incluido
- ✅ **Transiciones de página instantáneas** en todo el sitio: `ClientRouter` + prefetch (`hover`) en todas las rutas (incluida la intro `/`) y sin animación de cross-fade
- ✅ **Dashboard de estadísticas**: si la temporada actual aún no tiene partidos oficiales jugados, arranca en "Todas las Temporadas" en vez de quedar vacío; en cuanto se juega el primero, vuelve a arrancar filtrado a la temporada en curso
- ✅ **Nuevo carrusel "Jugadoras"**: plantilla actual (por dorsal de la última temporada) + entrenador del partido más reciente, con foto, dorsal/posición y hasta 3 noticias relacionadas por persona

### 📰 Noticias
- ✅ **Ficha de jugadora/entrenador**: sección de noticias relacionadas (vía `focusType` + `referenceId` de Contentful), mismo carrusel y efectos que el resto del sitio
- ✅ **`/noticias`**: mosaico con la noticia más reciente destacada + 4 secundarias, debajo del título
- ✅ **Estilo unificado**: todas las tarjetas de noticias (jugadoras, mosaico, archivo) comparten el mismo hover (borde cónico dorado giratorio) y la misma forma de esquina (`22px 0 22px 0`)
- ✅ **Archivo de noticias**: badge de categoría junto a la fecha; corregido el hueco que dejaba la miniatura cuando el texto era más alto
- ✅ **Newsletter**: retirado el digest semanal automático (cron de GitHub Actions); se mantiene el aviso por email al publicar cada noticia

### 📅 Cambio de temporada automático
- ✅ La temporada en curso se calcula **siempre en hora de Madrid** (`Europe/Madrid`), no en la del servidor; corrige que el calendario y la plantilla no cambiaran a la nueva temporada el 1 de julio en Vercel (que corre en UTC)
- ✅ Nuevo helper `src/utils/season.ts` (`getCurrentSeason`, `getCurrentSeasonStartYear`, `nowInMadrid`) aplicado en calendario, plantilla y el componente `Calendar`

### 👩 Fichas de jugadoras
- ✅ **Fin de contrato** y **valor de mercado** (datos de Soccerdonna, tabla `contratos`) en la ficha personal; el valor se muestra completo en euros (p. ej. `135.000 euros`)
- ✅ **Redes sociales** (Instagram, X y TikTok) como iconos enlazados desde la tabla `redes_sociales`
- ✅ **Historial de lesiones** en una tarjeta propia (tipo, zona, fechas y partidos perdidos) desde la tabla `lesiones`, resaltando las lesiones en curso
- ✅ **Badge "Lesionada"** junto a la edad cuando la jugadora tiene una lesión activa (sin alta o con alta futura)
- ✅ Todo adaptado a todo tipo de pantalla (`clamp()` y `flex-wrap`)

### 🔎 SEO y datos estructurados
- ✅ **Biografías/crónicas únicas e indexables** generadas desde la BD en las 6 fichas dinámicas (jugadoras, entrenadores, rivales, estadios, árbitras y partidos)
- ✅ **Datos estructurados schema.org**: `Person`, `SportsEvent`, `SportsTeam`, `StadiumOrArena` por ficha; `Organization` + `WebSite` con `SearchAction` global; `BreadcrumbList` en todas las fichas
- ✅ **Canonical** normalizado por ruta (sin query) y `og:url` por página
- ✅ **Prioridad a `/home`**: la landing `/` canonicaliza a `/home` y se retira del sitemap; `/search` (noindex) también fuera del sitemap

### 🏆 Competición "Primera Iberdrola"
- ✅ Nueva competición en la tabla `competiciones`; reasignados los **64 partidos** de liga de 2020/21 y 2021/22 (la liga se llamaba así hasta 2022)
- ✅ Incluida en todos los filtros de competiciones oficiales (las estadísticas históricas se mantienen intactas) y ordenada **la primera** como liga doméstica
- ✅ Logo propio con fondo transparente

### ⭐ Canteranas (jugadoras de La Fábrica)
- ✅ **Filtro "Canteranas"** en /jugadoras (categoría FIFA *club-trained*)
- ✅ **Badge lila** (★) en el grid y en la ficha
- ✅ Bio "formada en La Fábrica" + schema `alumniOf`

### ⚽ Crónica de partido
- ✅ Incluye **alineación, cambios, estadísticas** (solo si existen), **equipación, MVP, árbitra y hora**
- ✅ Los goles en propia puerta del Real Madrid **no** cuentan como gol del equipo

### 🧹 Otros
- ✅ Eliminada la columna `tiempo_partido` (sin uso) de la tabla `partidos`
- ✅ **Plantilla**: la portera con el dorsal más bajo aparece destacada por defecto
- ✅ Fichas: nombres completos en las tarjetas de estadísticas, retirado "Dorsal" de la ficha personal, textos justificados y adaptados a todo tipo de pantalla (`clamp()`)
- ✅ Migraciones añadidas: `11-drop-tiempo-partido`, `12-primera-iberdrola`

## � Cambios Recientes (Mayo 2026)

### Buscador Avanzado
- ✅ **Conteo de jugadoras**: Arreglado el filtrado para mostrar todas las 86 jugadoras en la BD (incluyendo convocadas sin minutos)
- ✅ **Layout de filtros**: Reorganizado en 2 líneas (grid 2 columnas) para mejor usabilidad
- ✅ **Filtros de fecha**: Añadida la funcionalidad de limpiar fechas con botón X
- ✅ **Estilos de fechas**: Consistencia visual con el resto de la web (amarillo #ffde59, sombras y bordes redondeados)
- ✅ **Color encabezado tabla**: Cambiado de #2b2b2b a #f0f0f0 (gris claro) para mayor contraste y coherencia visual

### Limpieza de Código
- ✅ **Archivos no usados eliminados**: 
  - `src/scripts/form.js`
  - `src/scripts/menu.js`

## �📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).

---

*Hala Madrid y nada más.* 🟣⚪️
