# 🎯 LiveScore WebSocket System

**Real-time match updates con SSE (Server-Sent Events)**

Después de scrapear SofaScore:
1. ✅ Sincroniza datos a Turso
2. ✅ Detecta cambios
3. ✅ **Broadcast a clientes via SSE** ← AQUI ESTÁ LA MAGIA
4. ✅ Cliente recibe updates en vivo (<100ms)

---

## 🔄 Flujo el Livescore

```
Cliente A: Abre EvenSource → /api/sync/live-stream?matchId=266
      │
      └─ Conexión SSE abierta (escuchando)
      
      ↓ [En simultaneo en servidor]
      
SofaScore → Scraper (cada 5s) → BD Turso
      │
      └─ Detecta cambios (score, time, cards)
      │
      └─ Broadcast a SSE subscribers
      
      ↓ [De vuelta a cliente]
      
Cliente A/B/C: Reciben evento "goal_scored" → Actualizan UI
```

---

## 🚀 Uso

### 1. **En una página Astro** (Lo más simple)

```astro
---
// /src/pages/partidos/live.astro
import LiveScoreStream from '../../components/LiveScoreStream.tsx';
---

<Layout title="Partido en Vivo">
  <LiveScoreStream 
    client:load 
    matchId={266}
    homeTeam="Real Madrid Femenino"
    awayTeam="Athletic Bilbao"
  />
</Layout>
```

### 2. **En un componente React**

```tsx
import LiveScoreStream from '@/components/LiveScoreStream';

export default function MatchPage({ matchId }: { matchId: number }) {
  return (
    <LiveScoreStream
      matchId={matchId}
      homeTeam="Real Madrid Femenino"
      onGoal={(data) => {
        console.log('⚽ Goal:', data);
        // Show notification
      }}
      onCard={(data) => {
        console.log('🟨 Card:', data);
      }}
      onUpdate={(data) => {
        console.log('Updated:', data);
      }}
    />
  );
}
```

### 3. **Manual con EventSource** (Control total)

```javascript
const eventSource = new EventSource('/api/sync/live-stream?matchId=266');

// Connected
eventSource.addEventListener('connected', (event) => {
  const data = JSON.parse(event.data);
  console.log('Connected:', data);
});

// Score/time updated
eventSource.addEventListener('update', (event) => {
  const data = JSON.parse(event.data);
  console.log('Changes:', data.changes);
  // data.changes = [
  //   { field: 'goles_rm', from: 1, to: 2, type: 'GOAL' },
  //   { field: 'tiempo_partido', from: '45', to: 'HT', type: 'TIME' }
  // ]
});

// Goal scored
eventSource.addEventListener('goal_scored', (event) => {
  const data = JSON.parse(event.data);
  console.log('⚽ GOAL!', data);
  // Trigger sound/animation
});

// Card shown
eventSource.addEventListener('card_shown', (event) => {
  const data = JSON.parse(event.data);
  console.log('🟨 Card:', data);
});

// Error/disconnected
eventSource.onerror = () => {
  console.log('Trying to reconnect...');
};
```

---

## 📊 Eventos SSE

### `connected`
Se dispara cuando el cliente se conecta.
```json
{
  "message": "Connected to live stream",
  "matchId": 266,
  "data": {
    "id_partido": 266,
    "goles_rm": 0,
    "goles_rival": 0,
    "tiempo_partido": "-",
    "estado": "P",
    "lineups_count": 0,
    "stats_count": 0,
    "goals_count": 0,
    "cards_count": 0
  }
}
```

### `update`
Se dispara cuando hay cambios en el match.
```json
{
  "matchId": 266,
  "changes": [
    {
      "field": "goles_rm",
      "from": 0,
      "to": 1,
      "type": "GOAL"
    },
    {
      "field": "tiempo_partido",
      "from": "-",
      "to": "23'",
      "type": "TIME"
    }
  ],
  "timestamp": "2026-04-20T18:30:45.123Z",
  "data": { /* estado actual */ }
}
```

### `goal_scored`
Evento especial cuando hay gol.
```json
{
  "matchId": 266,
  "homeScore": 1,
  "awayScore": 0,
  "time": "23'"
}
```

### `card_shown`
Evento especial cuando hay tarjeta.
```json
{
  "matchId": 266,
  "message": "Tarjeta mostrada",
  "timestamp": "2026-04-20T18:30:45.123Z"
}
```

### `ping`
Heartbeat cada 5s para mantener conexión viva.

### `error`
Cuando hay error en stream.

---

## 🔄 Cómo funciona el Sync + Broadcast

### Flujo Completo:

1. **Cliente abre SSE**
   ```javascript
   const sse = new EventSource('/api/sync/live-stream?matchId=266')
   ```

2. **Backend detecta conexión** → Inicio comparación de estados

3. **Script cron ejecuta scraping** (cada 5s)
   ```bash
   npm run sync:watch -- --sofascore-url "https://sofascore.com/match/XXXXX"
   ```

4. **Post-sync, se detectan cambios**
   ```typescript
   // En scripts/sync-sofascore.ts
   await handlePostSyncBroadcast(matchId, previousState, ...)
   // Esto llama a broadcastMatchUpdate() para todos los subscribers
   ```

5. **Cliente recibe evento**
   ```javascript
   eventSource.addEventListener('goal_scored', (e) => {
     // Actualizar UI
   })
   ```

---

## ⏰ Timing

| Elemento | Tiempo |
|----------|--------|
| Scraping | Cada 5s |
| SSE check | Cada 5s |
| Broadcast | <100ms después de detect |
| **Total latencia** | **~5s + <100ms** |

*Con polling cada 30s tenías 0-30s de delay*
*Ahora tienes ~5s de delay = **6x más rápido***

---

## 🎛️ Configuración

### Variables de Entorno

Asegúrate de tener en `.env`:
```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

### Client-side configuration

```typescript
// Timeout de reconexión
const eventSource = new EventSource(url);
eventSource.addEventListener('error', () => {
  setTimeout(() => {
    // Reconectar después de X segundos
  }, 3000);
});
```

---

## 🐛 Troubleshooting

### "EventSource connection refused"
- ✓ Verifica que `/api/sync/live-stream` existe
- ✓ Astronauta está corriendo (`npm run dev`)
- ✓ El matchId existe en BD

### "No updates received"
- ✓ ¿El scraper está corriendo? (`npm run sync:watch`)
- ✓ ¿Hay datos nuevos en SofaScore?
- ✓ Verifica browser console para errores

### "Connection keeps disconnecting"
- ✓ Normal después de 15-30 min (Vercel timeout)
- ✓ cliente debería reconectar automático
- ✓ Implementa retry logic en cliente

---

## 📈 Performance

| Métrica | Valor |
|---------|-------|
| CPU (scraper) | ~20% durante 5s |
| Memoria (SSE) | ~1MB por cliente conectado |
| Ancho de banda | ~1KB por update |
| Máx simultaneos | ~100-500 clientes (según host) |

---

## 🎨 Customización

### Cambiar intervalo de sync
```typescript
// En src/pages/api/sync/live-stream.ts
// Cambiar `5000` por otro valor (ms)
setInterval(async () => {
  // Check changes
}, 5000); // ← AQUI
```

### Cambiar eventos detectados
```typescript
// En src/utils/match-change-detector.ts
// Agregar más eventos en detectAndBroadcastChanges()
if (previousSnapshot?.posesion !== newSnapshot?.posesion) {
  changes.push({
    field: 'posesion',
    from: previousSnapshot?.posesion,
    to: newSnapshot?.posesion,
    type: 'STAT',
  });
}
```

### Animaciones personalizadas
```tsx
// En src/components/LiveScoreStream.tsx
const [goalAnimating, setGoalAnimating] = useState(false);

if (goalAnimating) {
  // Tu CSS animation aqui
}
```

---

## 🔐 Notas de Seguridad

- ✅ SSE es unidireccional (server → client only)
- ✅ No permite ataques de inyección (datos parsed as JSON)
- ✅ matchId es público (visible en URL)
- ✓ Si quieres auth: Agrega verificación en `live-stream.ts`

```typescript
// Ejemplo: verificar auth
const jwt = request.headers.get('Authorization');
if (!verifyJWT(jwt)) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

## 📱 Mobile

SSE funciona en mobile (iOS/Android).

```tsx
// Detectar mobile
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

// Reducir frecuencia en mobile para ahorrar batería
const updateInterval = isMobile ? 10000 : 5000;
```

---

## 🚀 Deploy a Producción

### Vercel
- ✅ SSE funciona en Vercel
- ✅ Scraper funciona con cron jobs
- ⚠️ Timeout de 15min en free tier

### VPS/Self-hosted
- ✅ Todo funciona
- ✅ Puedes controlar timings
- ✅ Mejor para control total

---

## 📞 Ejemplos Completos

Ver `/SOFASCORE_EXAMPLES.ts` para 10 ejemplos de uso.

---

**¡Listo para livescore en vivo! 🎉**
