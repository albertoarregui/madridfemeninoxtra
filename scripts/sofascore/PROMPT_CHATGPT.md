# Datos de Sofascore → base de datos

ChatGPT solo **descarga** las respuestas de Sofascore en bruto. Toda la transformación la hace
`scripts/sofascore/importar-partido.mjs`, que valida antes de escribir.

## Partido nuevo

1. Busca el id del partido en Sofascore (número final de la URL, p. ej. `#id:16425762`).
2. Pega el prompt de abajo en ChatGPT cambiando `[ID]` y guarda la respuesta como `partido-[ID].json`.
3. Revisa y carga:

```
node scripts/sofascore/importar-partido.mjs partido-[ID].json --dry   # informe, no escribe
node scripts/sofascore/importar-partido.mjs partido-[ID].json         # escribe y recarga la caché
```

## Histórico (todas las temporadas)

El id de Sofascore de cada partido está en la columna `partidos.sofascore_id` de la base de datos
(los amistosos que no están en Sofascore lo tienen vacío).

1. Pasa esos ids a tu automatización de ChatGPT y guarda cada respuesta como
   `paquetes/<sofascore_id>.json`.
2. Carga la carpeta entera (cada partido se valida por separado; los que fallen no se escriben):

```
node scripts/sofascore/importar-carpeta.mjs paquetes --dry
node scripts/sofascore/importar-carpeta.mjs paquetes
```

En los partidos que ya tienen alineación, goles y tarjetas, el importador **no los toca**: solo
añade estadísticas, estadísticas por partes, tiros, posiciones medias, dominio y mapas de calor.
Sofascore no tiene mapa de tiros, xG ni estadísticas por jugadora de los partidos más antiguos
(aprox. antes de 2023/24); en esos casos se carga lo que haya.

---

## Prompt

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
2. En "statistics" incluye TODOS los periodos que devuelva la API (ALL, 1ST, 2ND y prórroga si existe), cada uno con todos sus grupos y statisticsItems.
3. Incluye todas las jugadoras de "lineups" (titulares, suplentes que no jugaron y lesionadas), con todo su objeto "statistics".
4. Mantén los números tal cual (por ejemplo 0.15414896607399, no 0.15).
5. Devuelve solo el JSON, válido, en un bloque de código, con exactamente estas claves de primer nivel:
   event, statistics, lineups, incidents, shotmap, average_positions, graph, heatmaps
```

---

## Qué se guarda

| Del paquete | Tabla | Cuándo |
|---|---|---|
| event | partidos (sofascore_id, hora, público, resultado si falta) | siempre; hora y público solo si están vacíos |
| lineups → formation, captain | partidos (formacion, capitana) | solo si están vacíos (avisa si la capitana no coincide) |
| statistics (periodo ALL) | estadisticas_partidos | siempre (reemplaza) |
| statistics (ALL, 1ST, 2ND…) | estadisticas_periodos (todas las métricas, por parte) | siempre (reemplaza) |
| lineups → statistics | estadisticas_jugadoras (incluidas xG, xA, paradas, goles evitados, valores de pase/regate/defensivo/portera…) | siempre (reemplaza) |
| lineups + incidents (cambios) | alineaciones | solo si el partido no tiene alineación con minutos |
| incidents (goles) + shotmap | goles_y_asistencias, goles_rival, goles_propia | solo si el partido no tiene goles |
| incidents (tarjetas) | tarjetas, tarjetas_rival | solo si el partido no tiene tarjetas |
| incidents (penaltis) | penaltis_fallados, tanda_penaltis | solo si faltan |
| shotmap | tiros | siempre (reemplaza) |
| average_positions | posiciones_medias | siempre (reemplaza) |
| graph | dominio_partido | siempre (reemplaza) |
| heatmaps | mapas_calor | siempre (reemplaza) |

El importador no escribe nada si los goles de Sofascore no cuadran con el marcador
o si hay una jugadora del Madrid que no sabe emparejar (te dice cuál).
Opciones: `--forzar-eventos` reescribe alineación, goles y tarjetas; `--sin-cache` no recarga la caché.
