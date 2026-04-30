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

- 📰 **Noticias y actualidad** — Cobertura completa del equipo con búsqueda, categorías y tiempo de lectura
- 📅 **Calendario y resultados** — Todos los partidos, pasados y futuros
- 📈 **Estadísticas históricas** — Balance por temporada y competición
- 👩 **Fichas de jugadoras** — Partidos, goles, asistencias y más
- 🏟️ **Estadios y árbitras** — Base de datos completa
- 🏆 **Competiciones** — Liga F, UWCL, Copa de la Reina y Supercopa
- 📧 **Newsletter semanal** — Digest automático cada lunes con las noticias de la semana
- ⚡ **Comparador de jugadoras** — Gráfico radar interactivo con tabla de stats por secciones, filtros por temporada y competición (incluyendo "Partidos oficiales"), modos totales/por 90 minutos, y descarga de imagen con logo y fotos de las jugadoras

---

## 🚀 Tecnologías Principales

- **Framework**: [Astro 5.x](https://astro.build/)
- **Frontend**: [React](https://react.dev/) / [TailwindCSS 4](https://tailwindcss.com/)
- **Base de Datos**: [Turso](https://turso.tech/) (LibSQL)
- **Autenticación**: [Clerk](https://clerk.com/)
- **CMS**: [Contentful](https://www.contentful.com/) (Noticias)
- **Email**: [Resend](https://resend.com/) (Newsletter)
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
- `/scripts` — Scripts de automatización (newsletter semanal)

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).

---

*Hala Madrid y nada más.* 🟣⚪️
