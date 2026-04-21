# SofaScore Live Match Synchronizer

Sincroniza automáticamente datos en vivo de partidos del Real Madrid Femenino desde SofaScore a tu base de datos Turso.

## 🎯 Características

- ✅ Scraping automático de SofaScore
- ✅ Sincronización de resultado, tiempo y alineaciones
- ✅ Estadísticas de partido y jugadoras
- ✅ Goles, asistencias y tarjetas
- ✅ Datos de penaltis (si aplica)
- ✅ Respeta IDs existentes en base de datos
- ✅ Mapeo fuzzy de nombres de jugadoras
- ✅ Ejecución manual o automática (cada 30s)

## 📦 Instalación

Los módulos necesarios ya están en `package.json`:
- `puppeteer` - Web scraping
- `puppeteer-extra` - Anti-detección
- `@libsql/client` - Conexión Turso

## 🚀 Uso

### 1. Ejecución Manual (Una sola sincronización)

```bash
# Con URL de SofaScore
npm run sync:livematch -- --sofascore-url "https://www.sofascore.com/match/12345678"

# Buscar automáticamente por equipo rival
npm run sync:livematch -- --away "Athletic Bilbao"
```

### 2. Modo Watch (Cada 30 segundos)

```bash
# Sincronizar continuamente durante todo el partido
npm run sync:livematch -- --sofascore-url "https://www.sofascore.com/match/12345678" --watch

# O buscar y sincronizar
npm run sync:livematch -- --away "Athletic Bilbao" --watch
```

### 3. API HTTP

**Endpoint:** `POST /api/sync/livematch`

**Body:**
```json
{
  "sofascoreUrl": "https://www.sofascore.com/match/12345678"
}
```

O dejar que busque automáticamente:
```json
{
  "homeTeam": "Real Madrid Femenino",
  "awayTeam": "Athletic Bilbao",
  "matchDate": "2026-04-20"
}
```

**Respuesta:**
```json
{
  "success": true,
  "matchId": 266,
  "updates": {
    "matches": 1,
    "lineups": 22,
    "stats": 22,
    "goals": 2,
    "cards": 1
  }
}
```

## 📋 Datos Sincronizados

### Tablas Actualizadas:

| Tabla | Datos |
|-------|-------|
| `partidos` | Resultado (goles_rm, goles_rival), tiempo |
| `alineaciones` | Minutos jugados, titular/suplente |
| `estadisticas_partidos` | Posesión, tiros, pases, tackles, etc. |
| `estadisticas_jugadoras` | Rating, pases, tiros, duelos, etc. |
| `goles_y_asistencias` | Goles del RM, asistentes |
| `goles_rival` | Goles del rival |
| `tarjetas` | Tarjetas amarillas/rojas del RM |
| `tarjetas_rival` | Tarjetas del rival |
| `penaltis_fallados` | Penaltis (si aplica) |

## 🔄 Workflow del Scraper

```
1. Navega a SofaScore
   ↓
2. Extrae: Score, Minuto, Alineaciones, Stats
   ↓
3. Mapea nombres jugadoras → IDs (fuzzy matching)
   ↓
4. Sincroniza con Turso (INSERT/UPDATE)
   ↓
5. Si --watch: Espera 30s y repite desde paso 1
```

## 🔍 Búsqueda de URL de Partido

La función `findRMFemeninoMatch()` busca automáticamente partidos en SofaScore:

```bash
npm run sync:livematch -- --away "Barcelona"
# Busca automáticamente: Real Madrid Femenino vs Barcelona
```

## ⚙️ Configuración

### Variables de Entorno (.env)

Las siguientes já deben estar configuradas:

```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

## 🐛 Troubleshooting

### "Could not find SofaScore match URL"
- Asegúrate de que el partido existe en SofaScore
- Usa `--sofascore-url` directamente si la búsqueda automática falla

### "Jugadora not found" in logs
- El nombre en SofaScore no matchea exactamente con tu BD
- Necesitas agregar la jugadora a tu BD o implementar un mapping manual

### "Database sync failed"
- Verifica que las credenciales de Turso son correctas
- Comprueba que el match ID existe en `partidos`

## 🎯 Casos de Uso Comunes

### Sincronización en vivo durante un partido
```bash
# 1. Encontrar URL en SofaScore (ej: sofascore.com/match/12345678)
# 2. Correr en una terminal independiente
npm run sync:watch -- --sofascore-url "https://www.sofascore.com/match/12345678"

# 3. En otra terminal, seguir el desarrollo normal
npm run dev
```

### Sincronización automática vía cron (Linux/Mac)
```bash
# Cada 30s durante los 90 minutos del partido
# Agregar a crontab:
*/2 * * * * cd /path/to/project && npm run sync:watch -- --away "Athletic Bilbao" >> cron.log 2>&1
```

### Sincronización manual después del partido
```bash
npm run sync:livematch -- --sofascore-url "https://www.sofascore.com/match/12345678"
# Descarga todos los datos finales
```

## 📊 Ejemplo de Log

```
[2026-04-20T18:30:45.123Z] Starting sync...
Match URL: https://www.sofascore.com/match/12345678
▶ Scraping SofaScore...
✓ Scraped successfully: Real Madrid Femenino 2 - 1 Athletic Bilbao
  Time: HT 45
  Home: 11 players
  Away: 11 players
▶ Mapping to database schema...
✓ Mapped: Match ID 266
  Lineups: 22 players
  Goals: 2
  Cards: 1
▶ Syncing to database...
✓ Database updated successfully
  Matches: 1
  Lineups: 22
  Stats: 22
  Goals: 2
  Cards: 1
```

## 🔐 Notas de Seguridad

- El scraper usa `puppeteer-extra` con plugin anti-detección
- Solo scrape durante horas de partido (max 2/semana)
- Respeta el `robots.txt` de SofaScore
- No compartas logs con URLs sensibles

## 🤝 Integración con UI

Para mostrar datos en vivo en tu web:

```astro
---
import { fetchGamesDirectly } from '../utils/partidos';

const games = await fetchGamesDirectly();
const liveMatch = games.find(g => g.isPlayed && g.resultado !== 'P');
---

{liveMatch && (
  <div class="livescore">
    <p>{liveMatch.club_local} {liveMatch.goles_rm} - {liveMatch.goles_rival} {liveMatch.club_visitante}</p>
    <p>Tiempo: {liveMatch.tiempo_partido}</p>
  </div>
)}
```

## 📈 Roadmap

- [ ] Websocket para actualizaciones en tiempo real
- [ ] Dashboard de sincronización
- [ ] Alertas de goles/tarjetas
- [ ] Historial de sincronizaciones
- [ ] Multi-temporada support
- [ ] Sincronización de múltiples partidos simultáneamente

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de error
2. Verifica que la URL de SofaScore es válida
3. Confirma que los IDs de partido existen en Turso
4. Intenta con `--sofascore-url` en lugar de búsqueda automática
