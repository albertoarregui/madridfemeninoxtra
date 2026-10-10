# Madrid Femenino Xtra

**Medio independiente y archivo estadístico del Real Madrid Femenino.**

[Visitar la web](https://www.madridfemeninoxtra.com) · [Noticias](https://www.madridfemeninoxtra.com/noticias) · [Estadísticas](https://www.madridfemeninoxtra.com/estadisticas-real-madrid-femenino) · [Partidos](https://www.madridfemeninoxtra.com/partidos)

Madrid Femenino Xtra reúne cobertura periodística, resultados, perfiles y datos históricos del Real Madrid Femenino. El proyecto combina una publicación editorial con una aplicación de consulta estadística y herramientas de exploración de datos.

> Proyecto independiente. No es un sitio oficial del Real Madrid CF.

## La plataforma

La información está organizada para consultar tanto la actualidad como el archivo histórico del equipo.

- **Actualidad:** noticias, crónicas, previas, declaraciones y contenido multimedia, gestionados en Contentful.
- **Partidos y temporadas:** resultados, calendarios, alineaciones, goleadoras, asistencias y datos por competición.
- **Archivo de protagonistas:** perfiles de jugadoras, entrenadores, árbitras, clubes rivales y estadios, con datos deportivos y biografías editoriales.
- **Análisis estadístico:** comparador de futbolistas, rankings, buscadores avanzados, gráficos de rendimiento, goles esperados (xG) y redes de asistencias.
- **La Fábrica:** seguimiento de la cantera femenina, sus competiciones y el recorrido de las jugadoras.
- **Fotogalerías:** contenido audiovisual indexado por partido y jugadora a partir de metadatos XMP y regiones faciales.

### Capturas

La documentación visual se mantiene en `docs/screenshots/`. Las imágenes deben mostrar la web real y actualizarse cuando se introduzcan cambios de diseño importantes.

| Vista | Archivo recomendado |
| --- | --- |
| Portada y presentación editorial | `docs/screenshots/portada.webp` |
| Ficha de partido con estadísticas y alineaciones | `docs/screenshots/partido.webp` |
| Perfil de una jugadora | `docs/screenshots/jugadora.webp` |
| Comparador de jugadoras | `docs/screenshots/comparador.webp` |
| Estadísticas avanzadas | `docs/screenshots/estadisticas.webp` |
| La Fábrica | `docs/screenshots/la-fabrica.webp` |
| Menú y diseño móvil | `docs/screenshots/movil.webp` |

_No se incluyen capturas antiguas como si reflejaran el estado actual de la web._

## Arquitectura

| Capa | Tecnología | Responsabilidad |
| --- | --- | --- |
| Aplicación | Astro 5, React, TypeScript | Páginas renderizadas en servidor y herramientas interactivas |
| Estilos | Tailwind CSS 4 y CSS propio | Sistema visual y diseño adaptable |
| Base de datos | Turso / libSQL | Datos de partidos, estadísticas y catálogos |
| Contenido editorial | Contentful | Noticias, fichas biográficas y recursos Open Graph |
| Identidad | Clerk | Sesiones y acceso a funciones privadas |
| Medios | Cloudflare R2 / Images | Almacenamiento y distribución de imágenes |
| Notificaciones | Resend | Comunicaciones de la newsletter |
| Infraestructura | Vercel | Despliegue de Astro SSR y caché de ejecución |

La separación entre datos deportivos y contenido editorial permite actualizar biografías y noticias sin modificar la estructura de estadísticas. Las fichas dinámicas consultan Turso y pueden incorporar texto enriquecido publicado desde Contentful.

### Organización del repositorio

```text
src/
  components/     Componentes Astro y React
  db/             Conexiones y consultas de datos
  layouts/        Estructuras comunes de página
  pages/          Rutas públicas y endpoints de API
  styles/         Hojas de estilo
  utils/          Transformaciones, estadísticas y caché
scripts/
  contentful/     Utilidades editoriales y Open Graph
  galerias/       Procesado e indexación de fotografías
  migrations/     Cambios versionados de base de datos
tests/            Pruebas automatizadas
```

## Desarrollo local

**Requisitos:** Node.js compatible con Astro 5 y pnpm.

```bash
git clone https://github.com/albertoarregui/madridfemeninoxtra.git
cd madridfemeninoxtra
pnpm install
cp .env.example .env
pnpm dev
```

El archivo `.env.example` documenta las variables necesarias. Las credenciales de Turso, Contentful, Clerk y otros proveedores deben configurarse localmente; **no deben incorporarse al repositorio**.

Comandos habituales:

```bash
pnpm dev          # Desarrollo
pnpm build        # Compilación de producción
pnpm test         # Pruebas automatizadas
pnpm preview      # Vista previa de la compilación
```

La aplicación depende de servicios externos. Para reproducir todas las vistas y datos en local se necesitan credenciales válidas y acceso a las fuentes correspondientes.

## Datos y caché

La aplicación utiliza Vercel Runtime Cache y caché de CDN para reducir lecturas repetidas. Las escrituras realizadas desde el cliente de datos incluyen invalidación por etiquetas.

Si los datos se modifican desde fuera de la aplicación —por ejemplo, mediante una consola de Turso—, puede solicitarse la invalidación explícita:

```bash
curl -X POST https://www.madridfemeninoxtra.com/api/cache/revalidate \
  -H "Content-Type: application/json" \
  -H "x-cache-revalidation-secret: $CACHE_REVALIDATION_SECRET" \
  --data '{"tables":["partidos","alineaciones","goles_y_asistencias"]}'
```

La invalidación también admite etiquetas específicas mediante el campo `tags`. El valor de `CACHE_REVALIDATION_SECRET` debe mantenerse privado.

## Contenido y publicaciones

Las entradas editoriales se mantienen en Contentful. Las miniaturas de las páginas se resuelven según la ruta; los contenidos dinámicos pueden utilizar su imagen particular. Los títulos y las descripciones Open Graph se gestionan por separado de las etiquetas SEO tradicionales.

Las imágenes de galerías se indexan a partir de metadatos de los archivos almacenados en Cloudflare. Los scripts de `scripts/galerias/` permiten preparar y actualizar esa información.

## Privacidad y publicidad

La web incorpora un panel propio de preferencias que distingue almacenamiento necesario y publicidad opcional. El cargador de AdSense de la aplicación espera una preferencia positiva antes de solicitar el script de anuncios. La gestión de consentimiento publicitario de Google, especialmente para visitantes del Espacio Económico Europeo, requiere comprobar la configuración de una CMP certificada; el panel propio no debe considerarse sustituto automático del marco TCF.

La política de cookies y el resto de textos legales se publican en la web.

## Estado y mantenimiento

Las modificaciones se integran en la rama principal y se despliegan en Vercel. Antes de publicar conviene ejecutar `pnpm test` y `pnpm build`, verificar los datos dinámicos con credenciales válidas y revisar la accesibilidad y la navegación móvil.

La información deportiva se amplía conforme se incorporan partidos, jugadoras y nuevas temporadas. Las cifras totales cambian con frecuencia y por ello no se fijan estadísticas de cobertura en este README.

## Licencia y atribución

El código, los textos periodísticos, las fotografías y los elementos de marca pueden estar sujetos a derechos distintos. La disponibilidad pública del repositorio **no implica** que sus contenidos o recursos visuales se puedan reutilizar libremente. Para consultas editoriales o de colaboración, utiliza la [página de contacto](https://www.madridfemeninoxtra.com/contacto).
