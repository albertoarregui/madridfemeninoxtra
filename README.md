<div align="center">

# ⚽ MADRID FEMENINO XTRA

### Periodismo, estadísticas y memoria del Real Madrid Femenino

**Una plataforma independiente para seguir la actualidad del equipo y explorar su historia partido a partido.**

[🌐 **Visitar la web**](https://www.madridfemeninoxtra.com) · [📰 **Noticias**](https://www.madridfemeninoxtra.com/noticias) · [📅 **Partidos**](https://www.madridfemeninoxtra.com/partidos) · [📊 **Estadísticas**](https://www.madridfemeninoxtra.com/estadisticas-real-madrid-femenino)

![Astro](https://img.shields.io/badge/Astro-5-BC52EE?logo=astro&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Turso](https://img.shields.io/badge/Database-Turso-4FF8D2)
![Contentful](https://img.shields.io/badge/CMS-Contentful-2478CC)
![Vercel](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)

</div>

---

## 📌 ¿Qué es Madrid Femenino Xtra?

**Madrid Femenino Xtra** es un medio digital y una plataforma de datos especializada en el Real Madrid Femenino. El objetivo es que la información no desaparezca cuando termina un partido: cada crónica, estadística y ficha contribuye a construir un archivo consultable de la trayectoria del equipo.

La web combina dos vertientes que se complementan:

- 📰 **Cobertura periodística:** noticias, previas, crónicas, declaraciones y contenido multimedia.
- 📊 **Datos deportivos:** encuentros, alineaciones, rendimiento individual, competiciones e información histórica.

El proyecto está desarrollado y mantenido de manera independiente, y evoluciona conforme se incorporan nuevas temporadas y funcionalidades.

> **Aviso:** Madrid Femenino Xtra no es un canal oficial del Real Madrid CF ni está afiliado al club.

## 🖥️ Un vistazo a la plataforma

Las capturas se incorporarán cuando estén tomadas de la versión actual de producción, para evitar mostrar pantallas desactualizadas.

| Pantalla | Qué merece la pena mostrar |
|:--|:--|
| 🏠 **Portada** | Identidad visual, noticias destacadas, próximos partidos y clasificación |
| ⚽ **Ficha de partido** | Marcador, once inicial, estadísticas, eventos y valoraciones |
| 👤 **Ficha de jugadora** | Fotografía, biografía, trayectoria y desglose estadístico |
| 📊 **Comparador** | Selección de futbolistas y gráficos comparativos |
| 🎯 **Estadísticas avanzadas** | xG, rankings, gráficos y redes de asistencias |
| 🌱 **La Fábrica** | Cantera, equipos, clasificaciones y fichas |
| 📱 **Versión móvil** | Navegación y adaptación de las principales vistas |

📸 **Archivos previstos:** `docs/screenshots/portada.webp`, `partido.webp`, `jugadora.webp`, `comparador.webp`, `estadisticas.webp`, `la-fabrica.webp` y `movil.webp`.

Una vez añadidas esas imágenes al repositorio, pueden incluirse aquí con `![Portada de Madrid Femenino Xtra](docs/screenshots/portada.webp)` y el mismo patrón para las demás vistas.

**Generación de capturas reales:**

```bash
pnpm screenshots:readme
# Para documentar también una ficha concreta de partido y otra de jugadora:
MATCH_URL=/partidos/slug-real PLAYER_URL=/jugadoras/slug-real pnpm screenshots:readme
```

El comando usa Puppeteer y requiere Chrome/Chromium disponible. Guarda capturas en `docs/screenshots/` y **omite páginas con imágenes que no hayan cargado**, en lugar de generar documentación engañosa. Los nombres `slug-real` son marcadores que hay que sustituir por URLs existentes; no son páginas reales.

La configuración de Cloudflare y R2 no se altera durante la captura.


## ✨ Funcionalidades

| | Módulo | Qué ofrece |
|:--:|---|---|
| 📰 | **Actualidad** | Noticias, análisis, previas y crónicas de los partidos |
| 🗓️ | **Partidos** | Resultados, calendario, fichas y estadísticas de cada encuentro |
| 👥 | **Jugadoras** | Perfiles individuales, temporadas, goles, asistencias y minutos |
| 🧠 | **Entrenadores** | Trayectorias, partidos dirigidos y rendimiento |
| 🏟️ | **Estadios** | Datos del recinto, ubicación y archivo de encuentros |
| 🛡️ | **Rivales** | Historial de enfrentamientos y resultados |
| 🟨 | **Árbitras** | Fichas biográficas y partidos dirigidos |
| 📈 | **Estadísticas** | Clasificaciones, rankings, evolución y comparaciones |
| 🌱 | **La Fábrica** | Seguimiento de las categorías inferiores |
| 📷 | **Galerías** | Fotografías relacionadas con partidos y protagonistas |

### 🔍 Más allá del marcador

Los datos están conectados entre sí: desde un partido se puede profundizar en sus protagonistas; desde la ficha de una jugadora, recorrer su rendimiento por temporadas; y desde las estadísticas generales, comparar futbolistas y detectar tendencias.

Entre las herramientas disponibles figuran los gráficos de rendimiento, los **goles esperados (xG)**, las redes de asistencias y el comparador de jugadoras. El objetivo no es acumular cifras, sino hacerlas fáciles de interpretar.

### 📚 Un archivo que sigue creciendo

Además de los partidos y las estadísticas, la plataforma mantiene **297 fichas editoriales** de jugadoras, entrenadores, árbitras, rivales y estadios. Las biografías y el contenido periodístico se gestionan por separado de los datos deportivos para facilitar su actualización.

## 🧰 Stack tecnológico

| Tecnología | Uso en el proyecto |
|---|---|
| 🚀 **Astro 5** | Renderizado en servidor, rutas y composición de páginas |
| ⚛️ **React** | Herramientas y componentes interactivos |
| 🔷 **TypeScript** | Tipado y mantenimiento del código |
| 🎨 **Tailwind CSS 4 + CSS** | Interfaz responsive y sistema visual propio |
| 🗄️ **Turso / libSQL** | Partidos, resultados, estadísticas y referencias |
| ✍️ **Contentful** | Noticias, contenidos editoriales y biografías |
| 🖼️ **Cloudflare R2 / Images** | Almacenamiento y distribución de recursos gráficos |
| 🔐 **Clerk** | Autenticación y gestión de sesiones |
| ✉️ **Resend** | Comunicaciones y newsletter |
| ☁️ **Vercel** | Hosting, despliegue y ejecución SSR |

### 🏗️ Cómo está organizado

```text
madridfemeninoxtra/
├── src/
│   ├── components/      # Componentes de interfaz
│   ├── db/              # Acceso a los datos deportivos
│   ├── layouts/         # Estructura compartida de las páginas
│   ├── pages/           # Rutas y endpoints
│   ├── styles/          # Estilos globales y específicos
│   └── utils/           # Estadísticas, transformaciones y caché
├── scripts/
│   ├── contentful/      # Herramientas editoriales
│   ├── galerias/        # Preparación e indexación de fotografías
│   └── migrations/      # Evolución del modelo de datos
├── tests/               # Pruebas automatizadas
└── public/              # Recursos públicos
```

## 💻 Puesta en marcha

### 1. Requisitos

- Node.js compatible con **Astro 5**.
- **pnpm** como gestor de paquetes.
- Acceso a los servicios externos correspondientes para consultar los datos reales.

### 2. Instalación

```bash
git clone https://github.com/albertoarregui/madridfemeninoxtra.git
cd madridfemeninoxtra

pnpm install
cp .env.example .env
pnpm dev
```

La configuración local se realiza mediante `.env`. El archivo `.env.example` sirve de guía para las variables necesarias; las credenciales reales **no deben subirse a Git**.

### 3. Comandos

| Comando | Acción |
|---|---|
| `pnpm dev` | Iniciar el entorno de desarrollo |
| `pnpm build` | Generar la compilación de producción |
| `pnpm preview` | Previsualizar la aplicación compilada |
| `pnpm test` | Ejecutar las pruebas automatizadas |
| `pnpm smoke:production` | Verificar rutas, redirecciones y SEO de la web desplegada (solo lecturas HTTP) |
| `pnpm screenshots:readme` | Generar capturas reales para documentación |

> Algunas páginas dependen de Turso, Contentful u otros proveedores y requieren credenciales válidas para mostrar su contenido completo.

## 🔄 Flujo de datos y publicación

```text
              ┌─────────────────┐        ┌─────────────────┐
              │  Turso / libSQL │        │    Contentful   │
              │ Datos deportivos│        │ Texto editorial │
              └────────┬────────┘        └────────┬────────┘
                       │                          │
                       └──────────┬───────────────┘
                                  ▼
                        ┌─────────────────┐
                        │  Astro + React  │
                        │   Web y APIs    │
                        └────────┬────────┘
                                 ▼
                      ┌───────────────────┐
                      │   Vercel + CDN    │
                      │  Web de producción│
                      └───────────────────┘
```

Los registros deportivos se consultan desde Turso, mientras que noticias y biografías se administran en Contentful. Esto permite actualizar un texto editorial sin alterar las estadísticas de una jugadora o de un encuentro.

### ⚡ Caché y actualizaciones

Se utilizan mecanismos de caché de ejecución y de CDN para reducir lecturas innecesarias. Cuando se modifican datos fuera del flujo normal de la aplicación, la caché puede invalidarse mediante un endpoint protegido:

```bash
curl -X POST https://www.madridfemeninoxtra.com/api/cache/revalidate \
  -H "Content-Type: application/json" \
  -H "x-cache-revalidation-secret: $CACHE_REVALIDATION_SECRET" \
  --data '{"tables":["partidos","alineaciones","goles_y_asistencias"]}'
```

El secreto de invalidación debe mantenerse fuera del repositorio y de la documentación pública.

## 🛡️ Privacidad y publicación responsable

La plataforma dispone de un panel propio de preferencias de cookies. La carga publicitaria opcional se condiciona a la decisión del visitante; la gestión del consentimiento exigida por Google para determinados territorios requiere, además, una **CMP certificada compatible con TCF**.

Los contenidos editoriales, las fotografías, los escudos y otros recursos visuales pueden estar sujetos a derechos distintos de los del código. No deben asumirse licencias de reutilización por el mero hecho de que el repositorio sea público.

---

<div align="center">

### 🤍 Un proyecto independiente dedicado al fútbol femenino

**[madridfemeninoxtra.com](https://www.madridfemeninoxtra.com)**

[🌐 Web](https://www.madridfemeninoxtra.com) · [📰 Noticias](https://www.madridfemeninoxtra.com/noticias) · [📩 Contacto](https://www.madridfemeninoxtra.com/contacto)

</div>
