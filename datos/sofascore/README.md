# Bandeja de entrada de Sofascore

Sube aquí el JSON que te da ChatGPT (un fichero `.json` por partido, con el prompt de
`scripts/sofascore/PROMPT_CHATGPT.md`). Al hacer push a `main`, la GitHub Action
"Importar partido de Sofascore" lo valida, lo carga en Turso, recarga la caché de la web
y borra el fichero de esta carpeta.

Si el partido tiene algún problema (goles que no cuadran, jugadoras sin emparejar, partido que
no existe aún en la base de datos), el fichero se queda aquí y la Action sale en rojo con el motivo.
Subir JSON a esta carpeta no genera un despliegue en Vercel.
