# ⚪️ Madrid Femenino Xtra 🟣

<div align="center">
  <img src="https://i.gyazo.com/bb389c0a7b32f71b7c5657668f7c174c.jpg" alt="Madrid Femenino Xtra - Página principal" width="800" />
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
  <img src="https://i.gyazo.com/5e1a1ceec396f55ead64e170d1afdb9d.png" alt="Madrid Femenino Xtra - Estadísticas" width="800" />
</div>

## ✨ Funcionalidades

- 📰 **Noticias y actualidad** — Cobertura completa del equipo
- 📅 **Calendario y resultados** — Todos los partidos, pasados y futuros
- 📈 **Estadísticas históricas** — Balance por temporada y competición
- 👩 **Fichas de jugadoras** — Partidos, goles, asistencias y más
- 🏟️ **Estadios y árbitras** — Base de datos completa
- 🏆 **Competiciones** — Liga F, UWCL, Copa de la Reina y Supercopa
- 🔴 **Livescore en tiempo real** — Marcador, minuto y timeline en directo

---

## 🔴 Livescore — Sincronización automática con SofaScore

Madrid Femenino Xtra incluye un sistema completo de livescore que sincroniza datos en tiempo real desde **SofaScore** y los escribe automáticamente en la base de datos **Turso**, respetando los IDs propios del proyecto.

### Cómo funciona

```
SofaScore JSON API  →  sofascore-scraper.ts  →  sofascore-mapper.ts  →  Turso DB
       ↑                    (fetch puro)           (mapeo a IDs propios)
  api.sofascore.com
```

El sistema usa la **API JSON pública de SofaScore** (la misma que alimenta su web y apps) en vez de scraping HTML, lo que lo hace estable, rápido y sin necesidad de navegador headless.

### Activación automática

El script se activa **1 hora antes del partido** y sincroniza cada 30 segundos hasta el final:

```bash
# Con URL directa del partido en SofaScore
npx tsx scripts/sync-sofascore.ts --sofascore-url "https://www.sofascore.com/match/12345678" --watch

# Buscando automáticamente por rival
npx tsx scripts/sync-sofascore.ts --away "Athletic Bilbao" --watch
```

### Qué se escribe en la BD

| Tabla | Datos |
|---|---|
| `partidos` | `goles_rm`, `goles_rival`, `tiempo_partido` (minuto vivo) |
| `alineaciones` | Titulares, suplentes, minutos jugados, minuto de cambio |
| `estadisticas_jugadoras` | Valoración, pases, tiros, duelos, regates, faltas… |
| `estadisticas_partidos` | Posesión, tiros, pases, córners, fueras de juego… |
| `goles_y_asistencias` | Goleadoras de RM con `id_jugadora` real de la BD |
| `goles_rival` | Goles del rival con `id_club` real de la BD |
| `tarjetas` | Tarjetas de RM con `id_jugadora` real de la BD |
| `tarjetas_rival` | Tarjetas del rival con `id_club` real de la BD |

### Respeto de IDs propios

El mapper busca cada jugadora en la BD con tres niveles de coincidencia:
1. **Nombre completo** — `%Misa Rodríguez%`
2. **Nombre + apellido por separado** — `%Misa%` AND `%Rodríguez%`
3. **Solo apellido** — `%Rodríguez%`

El club rival se busca en la tabla `clubes` por palabras clave del nombre, devolviendo su `id_club` real. El partido se identifica filtrando por fecha (`DATE(p.fecha)`) y nombre del rival.

### Detección automática local/visitante

El sistema detecta automáticamente si el Real Madrid figura como equipo local o visitante en SofaScore y asigna `goles_rm`/`goles_rival` correctamente, independientemente del orden en la URL.

### Visualización en la web

- **Home**: Durante las 2 horas del partido, la cuenta atrás se sustituye por el marcador en vivo con el minuto entre los números
- **Ficha del partido**: Marcador, estado (no comenzado / en curso / finalizado) y timeline en directo
- **H2H**: El historial de enfrentamientos desaparece automáticamente 1 hora antes del inicio (cuando el script arranca con la alineación)

### Preparación de la BD

Antes del primer partido en vivo, ejecutar en Turso:

```bash
turso db shell realmadridfem-database "ALTER TABLE partidos ADD COLUMN tiempo_partido TEXT;"
```

---

## 🚀 Tecnologías Principales

- **Framework**: [Astro 5.x](https://astro.build/) (v5.x)
- **Frontend**: [React](https://react.dev/) / [TailwindCSS 4](https://tailwindcss.com/)
- **Base de Datos**: [Turso](https://turso.tech/) (LibSQL)
- **Autenticación**: [Clerk](https://clerk.com/)
- **CMS**: [Contentful](https://www.contentful.com/) (Noticias)
- **Media**: [Cloudflare](https://www.cloudflare.com/) (R2 / Images)
- **Despliegue**: [Vercel](https://vercel.com/)

## 🛠️ Instalación y Configuración

Sigue estos pasos para ejecutar el proyecto localmente:

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/madridfemeninoxtra.git
cd madridfemeninoxtra
```

### 2. Instalar dependencias
Se recomienda el uso de `pnpm`:
```bash
pnpm install
```

### 3. Configurar variables de entorno
Copia el archivo de ejemplo y rellena tus credenciales:
```bash
cp .env.example .env
```
_Nota: Necesitarás acceso a Turso, Clerk y Contentful para que el sitio funcione con datos reales._

### 4. Iniciar servidor de desarrollo
```bash
pnpm dev
```
La aplicación estará disponible en [http://localhost:4321](http://localhost:4321).

## 📁 Estructura del Proyecto

- `/src/pages`: Rutas de la aplicación (incluye slugs dinámicos para jugadoras, hitos, etc.)
- `/src/components`: Componentes reutilizables (Astro y React).
- `/src/db`: Clientes de base de datos y configuración de Turso.
- `/src/utils`: Lógica de negocio, mapeo de datos, cliente SofaScore.
- `/src/assets`: Recursos estáticos (escudos, banderas, iconos).
- `/scripts`: Scripts de sincronización en vivo (`sync-sofascore.ts`).

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE). Siéntete libre de colaborar o usarlo como base para tus propios proyectos.

---

*Hala Madrid y nada más.* 🟣⚪️
