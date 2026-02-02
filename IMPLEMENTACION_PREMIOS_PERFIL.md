# Implementación de Premios en Perfiles de Jugadoras

## 📋 Vista Previa

Así es como se verá la nueva sección de premios en el perfil de cada jugadora:

```
┌─────────────────────────────────────────────────────────────┐
│  🏆 PREMIOS Y RECONOCIMIENTOS                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Mejor Jugadora del Mes (3)                                │
│  ┌───────────────────────────────────────────────────┐     │
│  │  🏅 Octubre 2024        │  🏅 Marzo 2024          │     │
│  │  Mejor Jugadora del Mes │  Mejor Jugadora del Mes │     │
│  └───────────────────────────────────────────────────┘     │
│  ┌────────────────────────┐                                │
│  │  🏅 Diciembre 2023     │                                │
│  │  Mejor Jugadora del Mes│                                │
│  └────────────────────────┘                                │
│                                                             │
│  Mejor Jugadora de la Temporada (1)                        │
│  ┌────────────────────────┐                                │
│  │  🏆 2023-2024          │                                │
│  │  Mejor Jugadora        │                                │
│  │  de la Temporada       │                                │
│  └────────────────────────┘                                │
│                                                             │
│  (Si no tiene premios: "No hay premios registrados")       │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Implementación Técnica

### Paso 1: Actualizar `[slug].astro` (imports y obtención de datos)

Agregar al inicio del archivo, después de las otras importaciones:

\`\`\`astro
---
// ... imports existentes ...
import { fetchPlayerAwards } from "../../utils/awards";
import { getPlayerAwards, groupAwardsByType, formatAwardDate } from "../../utils/playerAwards";

// ... código existente ...

// Obtener premios de la jugadora
const allAwards = await fetchPlayerAwards();
const playerAwards = getPlayerAwards(allAwards, player.id_jugadora);
const groupedAwards = groupAwardsByType(playerAwards);
---
\`\`\`

### Paso 2: Agregar la nueva sección HTML

Insertar después de la sección de "TRAYECTORIA" (alrededor de la línea 431):

\`\`\`astro
{/* Nueva sección de Premios */}
<section class="awards-section">
    <h2 class="section-header">🏆 PREMIOS Y RECONOCIMIENTOS</h2>
    <div class="awards-content">
        {
            playerAwards && playerAwards.length > 0 ? (
                <>
                    {/* Premios Mensuales */}
                    {groupedAwards.monthly.length > 0 && (
                        <div class="award-category">
                            <h3 class="award-category-title">
                                Mejor Jugadora del Mes ({groupedAwards.monthly.length})
                            </h3>
                            <div class="awards-grid">
                                {groupedAwards.monthly.map((award) => (
                                    <div class="award-card monthly">
                                        <div class="award-icon">🏅</div>
                                        <div class="award-details">
                                            <div class="award-period">
                                                {formatAwardDate(award.fecha)}
                                            </div>
                                            <div class="award-title">
                                                {award.titulo || "Mejor Jugadora del Mes"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Premios de Temporada */}
                    {groupedAwards.seasonal.length > 0 && (
                        <div class="award-category">
                            <h3 class="award-category-title">
                                Mejor Jugadora de la Temporada ({groupedAwards.seasonal.length})
                            </h3>
                            <div class="awards-grid">
                                {groupedAwards.seasonal.map((award) => (
                                    <div class="award-card seasonal">
                                        <div class="award-icon">🏆</div>
                                        <div class="award-details">
                                            <div class="award-period">
                                                {award.temporada}
                                            </div>
                                            <div class="award-title">
                                                {award.titulo || "Mejor Jugadora de la Temporada"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <p class="no-data">No hay premios registrados</p>
            )
        }
    </div>
</section>
\`\`\`

### Paso 3: Agregar CSS al final del archivo

\`\`\`css
<style>
/* ... estilos existentes ... */

/* Premios Section */
.awards-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.awards-content {
    margin-top: 1.5rem;
}

.award-category {
    margin-bottom: 2.5rem;
}

.award-category:last-child {
    margin-bottom: 0;
}

.award-category-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #fbbf24;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.awards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.award-card {
    background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%);
    border: 2px solid #fbbf24;
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.award-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(251, 191, 36, 0.2);
    border-color: #f59e0b;
}

.award-card.seasonal {
    background: linear-gradient(135deg, #fff1f1 0%, #ffffff 100%);
    border-color: #ef4444;
}

.award-card.seasonal:hover {
    border-color: #dc2626;
    box-shadow: 0 8px 16px rgba(239, 68, 68, 0.2);
}

.award-icon {
    font-size: 2.5rem;
    line-height: 1;
    flex-shrink: 0;
}

.award-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.award-period {
    font-size: 1rem;
    font-weight: 700;
    color: #1f2937;
    text-transform: capitalize;
}

.award-title {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
}

/* Responsive */
@media (max-width: 768px) {
    .awards-section {
        padding: 1.5rem 1rem;
    }

    .awards-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
    }

    .award-card {
        padding: 1rem;
    }

    .award-icon {
        font-size: 2rem;
    }

    .award-period {
        font-size: 0.9rem;
    }

    .award-title {
        font-size: 0.8rem;
    }
}
</style>
\`\`\`

## 📊 Características Implementadas

### ✅ Funcionalidades:
1. **Agrupación automática** por tipo de premio (mensual vs temporada)
2. **Contador de premios** en cada categoría
3. **Ordenamiento cronológico** (más recientes primero)
4. **Grid responsive** adaptable a diferentes tamaños de pantalla
5. **Animaciones hover** para mejor UX
6. **Diseño diferenciado**:
   - Premios mensuales: Dorado/Amarillo 🏅
   - Premios de temporada: Rojo/Oro 🏆
7. **Mensaje de estado** cuando no hay premios

### 🎨 Diseño Visual:
- **Tarjetas**: Cada premio en su propia tarjeta con gradiente sutil
- **Iconos**: Emojis distintivos (🏅 para mes, 🏆 para temporada)
- **Colores**: Esquema dorado para premios mensuales, rojizo para temporada
- **Efectos**: Sombras y elevación al hacer hover
- **Responsive**: Grid adaptable (2-3 columnas en desktop, 1 columna en móvil)

### 📱 Responsive:
- **Desktop**: 2-3 tarjetas por fila
- **Tablet**: 2 tarjetas por fila  
- **Móvil**: 1 tarjeta por fila (apiladas verticalmente)

## 💡 Mejoras Opcionales

### Opción 1: Timeline Visual
En lugar de grid, mostrar los premios en línea de tiempo:

\`\`\`
2024 ───●─────●────────●─── Presente
        │     │        │
     Oct 24  Mar 24  Dic 23
\`\`\`

### Opción 2: Estadísticas de Premios
Agregar un resumen al inicio:

\`\`\`
┌──────────────────────────────┐
│ 📊 Resumen de Premios        │
│ • Total: 4 premios           │
│ • Mensuales: 3               │
│ • Temporada: 1               │
└──────────────────────────────┘
\`\`\`

### Opción 3: Badge en la foto
Agregar un badge dorado en la foto de perfil si tiene premios:

\`\`\`
  ┌─────────┐
  │  FOTO   │
  │ JUGADORA│ 🏆 x4
  └─────────┘
\`\`\`

## 🚀 Próximos Pasos

1. Copiar el código de los 3 pasos anteriores
2. Pegar en el archivo `[slug].astro` en las ubicaciones indicadas
3. Probar con una jugadora que tenga premios
4. Ajustar los colores/estilos según preferencia

¿Quieres que implemente esto directamente en el archivo, o prefieres alguna variante del diseño?
