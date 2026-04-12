# ⚪️ Madrid Femenino Xtra 🟣

Bienvenido al repositorio oficial de **Madrid Femenino Xtra**, la base de datos histórica más grande del Real Madrid Femenino.

Este proyecto es una aplicación web moderna construida con **Astro**, diseñada para ser extremadamente rápida, visualmente atractiva y fácil de mantener.


📊 Datos en cifras

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

✨ Funcionalidades

## ✨ Funcionalidades

- 📰 **Noticias y actualidad** — Cobertura completa del equipo
- 📅 **Calendario y resultados** — Todos los partidos, pasados y futuros
- 📈 **Estadísticas históricas** — Balance por temporada y competición
- 👩 **Fichas de jugadoras** — Partidos, goles, asistencias y más
- 🏟️ **Estadios y árbitras** — Base de datos completa
- 🏆 **Competiciones** — Liga F, UWCL, Copa de la Reina y Supercopa

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
- `/src/utils`: Lógica de negocio (formateo de fechas, cálculo de estadísticas, etc.)
- `/src/assets`: Recursos estáticos (escudos, banderas, iconos).

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE). Siéntete libre de colaborar o usarlo como base para tus propios proyectos.

---

*Hala Madrid y nada más.* 🟣⚪️
