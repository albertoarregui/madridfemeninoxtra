<div align="center">

# ⚽ Madrid Femenino Xtra

**Noticias, estadísticas e historia del Real Madrid Femenino.**

[🌐 Web](https://www.madridfemeninoxtra.com) · [📰 Noticias](https://www.madridfemeninoxtra.com/noticias) · [📅 Partidos](https://www.madridfemeninoxtra.com/partidos) · [📊 Estadísticas](https://www.madridfemeninoxtra.com/estadisticas-real-madrid-femenino) · [🔁 Mercado](https://www.madridfemeninoxtra.com/mercado)

![Astro](https://img.shields.io/badge/Astro-5-BC52EE?logo=astro&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)
![Turso](https://img.shields.io/badge/Turso-libSQL-4FF8D2)
![Contentful](https://img.shields.io/badge/Contentful-CMS-2478CC)
![Vercel](https://img.shields.io/badge/Vercel-SSR-black?logo=vercel)
[![Tests](https://github.com/albertoarregui/madridfemeninoxtra/actions/workflows/tests.yml/badge.svg)](https://github.com/albertoarregui/madridfemeninoxtra/actions/workflows/tests.yml)

</div>

---

## 📌 Qué es

Madrid Femenino Xtra es un medio independiente sobre el Real Madrid Femenino. Publica la actualidad del equipo y mantiene una base de datos con todos sus partidos desde la temporada 2020/21: alineaciones, goles, tarjetas, estadísticas por jugadora, rivales, estadios, árbitras y entrenadores.

Las noticias y las biografías se escriben en Contentful; los datos deportivos están en Turso. La web junta las dos fuentes y enlaza unas fichas con otras: de un partido se pasa a sus jugadoras, de una jugadora a sus rivales, y así con todo.

## ✨ Secciones

| | Sección | Contenido |
|:--:|---|---|
| 📰 | **Noticias** | Crónicas, previas, declaraciones y actualidad, con filtro por categoría y temporada |
| 👥 | **Plantilla y jugadoras** | Ficha de cada jugadora con estadísticas por temporada, partidos, trayectoria y comparador |
| 🗓️ | **Partidos** | Calendario, resultados y ficha de cada encuentro: alineación sobre el campo, timeline, estadísticas y H2H |
| 🔁 | **Mercado** | Fichajes, salidas, cesiones y renovaciones por temporada, con importes cuando son públicos |
| 🧠 | **Entrenadores, árbitras, rivales y estadios** | Fichas con estadísticas, gráficas, récords e historial, y comparador entre ellos |
| 🏆 | **Rankings y récords** | Clasificaciones históricas en total o por 90 minutos, mejores actuaciones en un partido y récords goleadores |
| ⚖️ | **Comparadores** | Jugadora contra jugadora, jugadora contra un rival y sinergias (cómo rinde el equipo con o sin una jugadora) |
| 📈 | **Estadística avanzada** | xG, red de asistencias y buscadores de jugadoras, partidos y temporadas |
| ⭐ | **Valoraciones** | Notas y MVP de la afición en cada partido de la temporada (requiere iniciar sesión) |
| 🌱 | **La Fábrica** | Historia de la cantera y su peso en las selecciones inferiores de España |

## 🧰 Tecnología

| | Herramienta | Uso |
|:--:|---|---|
| 🚀 | **Astro 5** | Renderizado en servidor y rutas |
| ⚛️ | **React 19** | Rankings, comparadores, buscadores y gráficos |
| 🗄️ | **Turso (libSQL)** | Base de datos deportiva |
| ✍️ | **Contentful** | Noticias, fichas editoriales e imágenes para redes |
| 🖼️ | **Cloudflare R2** | Fotos, escudos y recursos gráficos en `media.madridfemeninoxtra.com` |
| 🔐 | **Clerk** | Inicio de sesión para las valoraciones |
| ☁️ | **Vercel** | Funciones, CDN y Runtime Cache |

## 🏗️ Arquitectura

```text
 Turso (datos) ─┐                          ┌─► CDN de Vercel (HTML y API)
                ├─► Astro + React (SSR) ───┤
 Contentful ────┘                          └─► Runtime Cache (consultas)
```

### ⚡ Caché y actualización de datos

- **Páginas:** la CDN guarda el HTML hasta 24 horas y lo regenera cuando se invalidan sus etiquetas.
- **Consultas:** cada lectura de Turso se guarda en Runtime Cache, etiquetada con las tablas que lee.
- **Cambios en Turso:** cada tabla de datos tiene triggers que suben su versión en `cache_cambios`. Las páginas llaman en segundo plano a `/api/cache/check`, que la CDN agrupa en una ejecución cada 30 segundos como máximo. Si una tabla ha cambiado, se invalidan sus consultas y las páginas que dependen de ella. Lo que se carga en Turso, venga de donde venga, se ve en menos de un minuto.
- **Contentful:** el webhook de publicación invalida noticias, portada y fichas.
- **Partidos recientes:** sus fichas leen Turso sin caché de datos y la CDN las agrupa por minuto.

Así Turso solo se consulta cuando algo cambia, y Runtime Cache solo escribe en esos casos.

## 🛠️ Desarrollo local

Requisitos: Node 24 y npm.

```bash
npm ci
cp .env.example .env    # rellena las credenciales
npm run dev
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación para producción |
| `npm test` | Pruebas automáticas |
| `npm run check` | Comprobación de tipos de Astro |
| `npm run cache:revalidar` | Invalida a mano la caché de las tablas indicadas |
| `npm run smoke:production` | Comprueba las páginas principales en producción |
| `npm run galeria` | Sube fotografías de galería a R2 |
| `npm run og` | Genera las imágenes para redes en Contentful |

## 📁 Estructura

```text
src/
├── components/   Componentes de interfaz (Astro y React)
├── db/           Cliente de Turso con caché e invalidación por tabla
├── layouts/      Plantilla común: SEO, datos estructurados y tema
├── lib/          Caché, etiquetas, escudos y utilidades
├── pages/        Rutas, API y sitemaps
├── sections/     Bloques de página reutilizables
├── styles/       Estilos globales y por sección
└── utils/        Consultas y cálculos deportivos
scripts/          Galerías, Contentful, migraciones y mantenimiento
tests/            Pruebas con node:test
public/           Iconos, manifiesto y robots.txt
```

## 🔎 SEO

- Sitemap dinámico (`/sitemap.xml`), sitemap de noticias (`/news-sitemap.xml`) y RSS (`/rss.xml`).
- Una sola URL por página, sin barra final, con canonical y redirecciones 301 desde las rutas antiguas.
- Datos estructurados de organización, web, artículos, personas, partidos y migas de pan.
- Las combinaciones de filtros de los comparadores no se indexan.

## 📄 Licencia

Código bajo licencia [MIT](LICENSE). Textos, fotografías y datos editoriales © Madrid Femenino Xtra.
