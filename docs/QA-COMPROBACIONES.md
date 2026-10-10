# Verificación funcional y editorial — Madrid Femenino Xtra

Actualizado: octubre de 2026. Una compilación correcta no demuestra que todos los componentes funcionan en móvil, ni que el sitio tenga consentimiento publicitario válido.

## Pruebas disponibles

- pnpm test: pruebas unitarias y de regresión.
- pnpm build: compilación del proyecto Astro.
- pnpm smoke:production: HTTP sobre producción sin escribir en Turso.
- pnpm screenshots:readme: capturas reales que no se guardan cuando hay imágenes rotas.

## Criterios de aceptación

| Área | Comprobación |
| --- | --- |
| Inicio / | HTTP 200, canonical, Open Graph, actualidad y barra lateral |
| Estadios /estadios | HTTP 200, mapa y tabla adaptables |
| Antiguo /rivales/estadios | HTTP 301 con destino /estadios; sin duplicidad |
| /sitemap.xml | XML válido con URL canónicas, sin ruta de estadios antigua |
| /news-sitemap.xml | Noticias recientes, fechas y titulares correctos |
| Noticias individuales | NewsArticle, og:type=article único, miniatura y canonical |
| Fichas de jugadora | Estadísticas de Turso y biografía visible de Contentful |
| Premios | Edición 2025/26 claramente identificada |
| Sobre nosotros | Galería y textos sin títulos provisionales |

## Escritorio y móvil

- En 1440 x 900 y 390 x 844: navegación, filtros, búsqueda, tablas, comparador, gráficos, enlaces y formularios.
- Cookies: ancho total y azul #0C1222; aceptar, rechazar y configurar deben funcionar y persistir.
- Mapas: marcadores con WebGL; lista accesible cuando WebGL no está disponible.
- Comprobar accesibilidad de teclado, contraste, controles e interacciones táctiles.
- Separar problemas del dominio externo de imágenes (bloqueos del operador) de errores internos del sitio.

## Datos, privacidad y seguridad

- Examinar errores de ejecución en Vercel y consultas costosas en Turso tras desplegar.
- Confirmar que la caché de Turso se invalida con cambios deportivos.
- Más leídas: ranking de artículos reales y una hora de caché; contar la lectura tras interacción sin SELECT por visita.
- Comprobar en AdSense el estado real de la CMP de Google para EEE, Reino Unido y Suiza.
- El proxy solo debe acceder a dominios públicos explícitamente autorizados, sin localhost ni redirecciones externas.
- Revisar términos legales contra servicios realmente utilizados antes de cerrar el apartado.

## Cierre

Por cada publicación registrar SHA, fecha, resultado de pruebas, compilación, smoke HTTP y auditoría móvil. Las pruebas no ejecutadas han de permanecer pendientes.
