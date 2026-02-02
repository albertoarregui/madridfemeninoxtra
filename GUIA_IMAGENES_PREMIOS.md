# Guía de Imágenes para Premios en Perfiles de Jugadoras

## 📁 Estructura de Carpetas

Debes crear dos carpetas en `src/assets/` para almacenar las imágenes de los premios:

```
src/
└── assets/
    ├── jugadora_del_mes/
    │   ├── 1.jpg
    │   ├── 2.jpg
    │   ├── 3.jpg
    │   └── ...
    └── jugadora_de_la_temporada/
        ├── 1.jpg
        ├── 2.jpg
        └── ...
```

## 🏷️ Nomenclatura de Archivos

### Método 1: Por ID de Premio (Recomendado)
Las imágenes deben nombrarse usando el **`id_premio`** de la tabla `jugadora_del_mes`:

**Ejemplo:**
- Si `id_premio = 1` → nombre del archivo: `1.jpg` o `1.png` o `1.webp`
- Si `id_premio = 15` → nombre del archivo: `15.jpg`
- Si `id_premio = 42` → nombre del archivo: `42.png`

### Método 2: Con prefijo "award_"
Alternativamente, puedes usar el prefijo `award_`:

- `award_1.jpg`
- `award_15.png`
- `award_42.webp`

## 🖼️ Formatos Soportados

El sistema acepta los siguientes formatos de imagen:
- `.jpg` / `.jpeg`
- `.png`
- `.webp` (recomendado para mejor rendimiento)

## 📏 Especificaciones Recomendadas

### Dimensiones
- **Relación de aspecto**: 3:4 (vertical) en desktop, 5:3 (horizontal) en móvil
- **Resolución recomendada**: 600x800 píxeles (o superior)
- **Mínimo**: 450x600 píxeles

### Calidad
- **Peso del archivo**: Máximo 500 KB por imagen
- **Optimización**: Comprimir imágenes para web
- **Fondo**: Preferiblemente con la jugadora en acción o posando con el premio

### Composición
Para que el texto sea legible sobre la imagen:
- Evitar fondos muy brillantes en la parte inferior (el texto va ahí)
- La jugadora debe estar bien iluminada
- Preferible fondo desenfocado (bokeh)

## 🎨 Ejemplos Visuales

### Para Premios Mensuales (jugadora_del_mes/)
```
┌──────────────────┐
│                  │
│   FOTO DE LA     │  ← Parte superior: más clara
│   JUGADORA       │
│                  │
│   [GRADIENTE]    │  ← Gradiente dorado/oscuro
│                  │
│   🏅 OCTUBRE 2024│  ← Texto sobre fondo oscuro
│   Mejor Jugadora │
└──────────────────┘
```

### Para Premios de Temporada (jugadora_de_la_temporada/)
```
┌──────────────────┐
│                  │
│   FOTO DE LA     │  ← Parte superior: más clara
│   JUGADORA       │
│                  │
│   [GRADIENTE]    │  ← Gradiente rojo/oscuro
│                  │
│   🏆 2023-2024   │  ← Texto sobre fondo oscuro
│   Mejor Jugadora │
└──────────────────┘
```

## 📝 Proceso de Implementación

### Paso 1: Obtener el ID del Premio
Consulta la tabla `jugadora_del_mes` para obtener el `id_premio`:

```sql
SELECT id_premio, id_jugadora, tipo, titulo, fecha 
FROM jugadora_del_mes 
ORDER BY fecha DESC;
```

### Paso 2: Preparar la Imagen
- Edita o recorta la foto de la jugadora
- Asegúrate de que tenga buena iluminación
- La jugadora debe estar en el centro-superior de la imagen
- Deja espacio en la parte inferior para el texto

### Paso 3: Nombrar y Guardar
- Nombra el archivo con el `id_premio`
- Guárdalo en la carpeta correspondiente:
  - `src/assets/jugadora_del_mes/` para tipo="mes"
  - `src/assets/jugadora_de_la_temporada/` para tipo="temporada"

### Paso 4: Verificar
La imagen aparecerá automáticamente en el perfil de la jugadora cuando:
1. La jugadora tenga registros en la tabla `jugadora_del_mes`
2. Exista una imagen con el nombre correcto en la carpeta correcta

## 🔍 Ejemplo Práctico

**Escenario**: Linda Caicedo gana el premio de Mejor Jugadora del Mes en Octubre 2024

**Base de datos**:
```
id_premio: 23
id_jugadora: 7
tipo: "mes"
titulo: "Mejor Jugadora del Mes"
fecha: "2024-10-01"
```

**Pasos**:
1. Selecciona una foto de Linda Caicedo
2. Edítala con dimensiones 600x800px
3. Guárdala como: `src/assets/jugadora_del_mes/23.jpg`
4. Al visitar `/jugadoras/linda-caicedo` verás el premio con la imagen

## ⚠️ Notas Importantes

### Si no hay imagen
- Si no existe una imagen con el nombre correcto, la tarjeta del premio se mostrará **sin foto de fondo**
- Solo aparecerá el gradiente de color con el texto

### Fallback
- El sistema funciona perfectamente sin imágenes
- Las tarjetas mantendrán su estilo con colores:
  - Dorado/amarillo para premios mensuales
  - Rojo para premios de temporada

### Performance
- Las imágenes se cargan de forma eager (inmediata)
- Optimiza tus imágenes con herramientas como:
  - [TinyPNG](https://tinypng.com/)
  - [Squoosh](https://squoosh.app/)
  - `npm run optimize-images` (si tienes script configurado)

## 🛠️ Troubleshooting

### La imagen no aparece
1. ✅ Verifica que el nombre del archivo coincide con el `id_premio`
2. ✅ Verifica que está en la carpeta correcta (mes vs temporada)
3. ✅ Verifica la extensión del archivo (.jpg, .png, .webp)
4. ✅ Limpia la caché del navegador
5. ✅ Reinicia el servidor de desarrollo

### El texto no es legible
- Oscurece más la imagen original en la parte inferior
- O ajusta el gradiente en el CSS (`.award-overlay`)

### La imagen se ve pixelada
- Usa una imagen de mayor resolución
- Mínimo 600x800px, recomendado 900x1200px
