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

## 🖥️ Vista de la portada

<a href="https://gyazo.com/52ba56aa667f05bf83d69d9532663e5b"><img src="https://i.gyazo.com/52ba56aa667f05bf83d69d9532663e5b.png" alt="Portada de Madrid Femenino Xtra" width="1200" /></a>

*Captura de la portada de producción (11 de octubre de 2026).*

## 📌 ¿Qué es Madrid Femenino Xtra?

**Madrid Femenino Xtra** es un medio digital y una plataforma de datos especializada en el Real Madrid Femenino. El objetivo es que la información no desaparezca cuando termina un partido: cada crónica, estadística y ficha contribuye a construir un archivo consultable de la trayectoria del equipo.

La web combina dos vertientes que se complementan:

- 📰 **Cobertura periodística:** noticias, previas, crónicas, declaraciones y contenido multimedia.
- 📊 **Datos deportivos:** encuentros, alineaciones, rendimiento individual, competiciones e información histórica.

El proyecto está desarrollado y mantenido de manera independiente, y evoluciona conforme se incorporan nuevas temporadas y funcionalidades.

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

## ⭐ Valoraciones de las jugadoras

- `/valoraciones` muestra el último partido finalizado y los demás encuentros **exclusivamente de la temporada vigente**, con **escudos**, **logo de la competición**, fecha y resultado.
- Cada partido tiene una ficha `/valoraciones/[id]-[partido]-[fecha]` con entrenador, once y suplentes, fotos, diez notas seleccionables en una única fila, elección de **MVP** a la izquierda y medias de los lectores.
- Las páginas se generan a partir de **partidos y alineaciones de Turso**; no requiere crear una noticia para abrir cada votación. Los minutos ausentes se identifican como no disponibles.
- Solo se permite votar cuando el resultado está registrado y han transcurrido dos horas desde el inicio programado; el plazo termina 72 horas después de la apertura. Las temporadas anteriores no aparecen en VALORACIONES; el resto de archivos históricos de MFX no se modifica.
- Los visitantes pueden leer las medias. Para votar hay que iniciar sesión con Clerk. Cada cuenta tiene **un único juego de valoraciones por partido**, editable durante el plazo, y solo puede elegir una futbolista MVP. Se limitan los envíos repetidos a intervalos de 20 segundos.
- Las valoraciones de los lectores se almacenan en `match_reader_ratings`, de forma independiente de las puntuaciones estadísticas deportivas; no se comparten tokens ni identificadores de votantes en el HTML.
- Las páginas de valoraciones se excluyen de la caché CDN de HTML para no mostrar promedios desactualizados. La tabla de votos dispone de un índice por partido.

## ✉️ Newsletter semanal automática

**La semana blanca** se confecciona sin intervención editorial adicional a partir de las noticias publicadas en Contentful. Los lunes, a las **10:00 (Europe/Madrid)**, se envía a los suscriptores confirmados por doble opt-in en Resend. Incluye solo las categorías que tengan publicaciones recientes: **Actualidad, Fichajes, Crónicas, La Fábrica y Datos**.

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
