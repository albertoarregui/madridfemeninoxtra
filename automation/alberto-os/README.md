# Alberto OS — automatización sin n8n

Esta carpeta contiene la primera capa gratuita de automatización de Alberto OS. No publica contenido, no despliega la web y no escribe en Turso.

## Qué queda automatizado

- Google Drive: los archivos depositados en las carpetas de entrada de MFX aparecen en la pestaña `INBOX` de la hoja de control.
- Gmail: los mensajes etiquetados para Alberto OS aparecen en `INBOX` sin enviar ni modificar correos.
- R2: las imágenes se convierten a WebP conservando metadatos y se suben al bucket existente con protección contra sobrescrituras.
- Galerías: tras una subida a `galerias/...`, se reutiliza el indexador ya existente del proyecto.

## Límites de seguridad

- La sincronización de Drive y Gmail solo lee y registra.
- La subida a R2 es simulación salvo que se indique `--execute`.
- Los objetos existentes no se sobrescriben salvo que se añada también `--allow-overwrite`.
- Publicar, desplegar, enviar correos y escribir en Turso siguen requiriendo aprobación manual.

## 1. Activar la captura de Drive y Gmail

1. Abre la hoja de Google Sheets `ALBERTO OS · CONTROL`.
2. Ve a **Extensiones → Apps Script**.
3. Copia `apps-script/Code.gs` y `apps-script/appsscript.json` en el proyecto.
4. Ejecuta una vez `setupAlbertoOs` y concede los permisos de Drive, Gmail y Sheets.
5. Ejecuta `syncAlbertoOsInbox` para probar.
6. Cuando el resultado sea correcto, ejecuta `createHourlyTrigger`.

Etiquetas de Gmail que crea el script:

- `ALBERTO_OS/MFX`
- `ALBERTO_OS/VIAJES`
- `ALBERTO_OS/EMPLEO`
- `ALBERTO_OS/NEGOCIO`

Aplicar una de esas etiquetas a un correo lo incorpora a la bandeja de Alberto OS. El script no envía, archiva ni elimina mensajes.

## 2. Preparar imágenes para R2

Desde `automation/alberto-os/r2`:

```bash
npm install
node prepare-and-upload.mjs --input "/ruta/a/fotos" --target "jugadoras/2026-27" 
```

Ese primer comando es una simulación. Convierte las imágenes en una carpeta temporal, muestra el destino y no sube nada.

Para ejecutar la subida:

```bash
node prepare-and-upload.mjs --input "/ruta/a/fotos" --target "jugadoras/2026-27" --execute
```

Destinos permitidos:

- `galerias/...`
- `jugadoras/2026-27/...`
- `xi-inicial/2026-27/...`
- `goles/2026-27/...`

Requisitos locales:

- Node.js 20 o posterior.
- `rclone` configurado con un remoto llamado `r2`.
- Acceso al bucket `realmadridfem-database`.

Para comprobar la conexión sin escribir:

```bash
rclone lsf r2:realmadridfem-database --max-depth 1
```

## 3. Flujo recomendado

1. Deposita la entrada en la carpeta correspondiente de Drive.
2. La hoja crea una operación en estado `INBOX`.
3. Revisa o prepara el material localmente.
4. Ejecuta primero la simulación de R2.
5. Revisa destino, número de archivos y posibles colisiones.
6. Ejecuta con `--execute` solo cuando el plan sea correcto.

Las credenciales nunca se guardan en la hoja, en este repositorio ni en los prompts. `rclone` las conserva en su configuración local.
