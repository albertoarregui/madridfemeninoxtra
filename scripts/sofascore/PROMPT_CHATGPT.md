# Prompt para ChatGPT: paquete de datos de Sofascore de un partido

Pega este prompt en ChatGPT cambiando `[ID]` por el id del partido en Sofascore
(es el número final de la URL del partido, p. ej. `.../#id:16425762` → `16425762`).

Guarda la respuesta como `partido-[ID].json` y cárgala con:

```
node scripts/sofascore/importar-partido.mjs partido-[ID].json --dry   # revisar
node scripts/sofascore/importar-partido.mjs partido-[ID].json         # escribir
```

---

```
Necesito un único archivo JSON con las respuestas EN BRUTO de la API de Sofascore para el partido [ID] del Real Madrid Femenino (equipo 305051). No resumas, no traduzcas, no redondees, no cambies nombres de claves ni quites campos: copia cada respuesta exactamente como la devuelve la API. Si una URL da error o no existe, pon null en esa clave; nunca inventes datos.

Descarga estas URLs y colócalas en estas claves del JSON:

"event":             https://api.sofascore.com/api/v1/event/[ID]
"statistics":        https://api.sofascore.com/api/v1/event/[ID]/statistics
"lineups":           https://api.sofascore.com/api/v1/event/[ID]/lineups
"incidents":         https://api.sofascore.com/api/v1/event/[ID]/incidents
"shotmap":           https://api.sofascore.com/api/v1/event/[ID]/shotmap
"average_positions": https://api.sofascore.com/api/v1/event/[ID]/average-positions
"graph":             https://api.sofascore.com/api/v1/event/[ID]/graph
"heatmaps":          un objeto cuyas claves son el player.id de CADA jugadora del Real Madrid que aparezca en "lineups" con statistics.minutesPlayed > 0, y cuyo valor es la respuesta de
                     https://api.sofascore.com/api/v1/event/[ID]/player/<player.id>/heatmap

Reglas:
1. El Real Madrid puede ser "home" o "away"; para los heatmaps usa el lado cuyo equipo es el 305051.
2. Incluye todas las jugadoras de "lineups" (titulares, suplentes que no jugaron y lesionadas), con todo su objeto "statistics".
3. Mantén los números tal cual (por ejemplo 0.15414896607399, no 0.15).
4. Devuelve solo el JSON, válido, en un bloque de código, con exactamente estas claves de primer nivel:
   event, statistics, lineups, incidents, shotmap, average_positions, graph, heatmaps
```

---

## Qué se guarda en la base de datos

| Del paquete | Tabla | Cuándo |
|---|---|---|
| event | partidos (sofascore_id, hora, público, resultado si falta) | siempre; hora/público solo si están vacíos |
| lineups → formation, captain | partidos (formacion, capitana) | solo si están vacíos (avisa si la capitana no coincide) |
| statistics | estadisticas_partidos | siempre (reemplaza) |
| lineups → statistics | estadisticas_jugadoras (todas las columnas, incluidas xG, xA, paradas, goles evitados…) | siempre (reemplaza) |
| lineups + incidents (cambios) | alineaciones | solo si el partido no tiene alineación con minutos |
| incidents (goles) + shotmap (parte del cuerpo, tipo) | goles_y_asistencias, goles_rival, goles_propia | solo si el partido no tiene goles |
| incidents (tarjetas) | tarjetas, tarjetas_rival | solo si el partido no tiene tarjetas |
| incidents (penaltis) | penaltis_fallados, tanda_penaltis | solo si faltan |
| shotmap | tiros | siempre (reemplaza) |
| average_positions | posiciones_medias | siempre (reemplaza) |
| graph | dominio_partido | siempre (reemplaza) |
| heatmaps | mapas_calor | siempre (reemplaza) |

El importador no escribe nada si los goles de Sofascore no cuadran con el marcador
o si hay una jugadora del Madrid que no sabe emparejar (te dice cuál).
