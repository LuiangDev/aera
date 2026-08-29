# AERA — Design System

> Sistema de diseño de **AERA** (Evaluación Educativa Asistida por IA), extraído del export de Stitch (`efficient_educational_saas`) y de las 12 pantallas del prototipo, y auditado/corregido antes de pasar a construcción. Este documento es la fuente de verdad para que Claude Code construya y mantenga la UI de forma consistente.

**Nombre del sistema base (prototipo):** Efficient Educational SaaS — nombre genérico heredado del export, no una identidad pensada para "AERA". Se mantiene la paleta por ahora porque es funcional y ya está validada en 12 pantallas, pero queda como nota abierta para una futura pasada de identidad (ver sección 12).
**Estilo:** Minimalismo Funcional ("Clean SaaS")
**Stack de referencia:** Tailwind CSS + shadcn/ui (primitivos restyleados con estos tokens, nunca sus colores por defecto) + Google Fonts (`Inter`, `Material Symbols Outlined`)

---

## 1. Filosofía de marca

El sistema está diseñado para **educadores que gestionan grandes volúmenes de información** (actividades, exámenes, alumnos, calificaciones) sin fatiga cognitiva.

- **Personalidad:** profesional, autoritativa, tecnológicamente avanzada, "eficiencia organizada".
- **Enfoque visual:** whitespace generoso, paleta restringida y con propósito, profundidad sutil (no plana, no ruidosa).
- **Objetivo dual:** los **profesores** gestionan cohortes grandes en **desktop** (tablas densas, dashboards); los **alumnos** consultan feedback y notas en **mobile** (tarjetas, listas verticales) — ver nota de alcance en PROJECT_CONTEXT.md sobre qué de esto entra en el MVP.

Regla general para Claude Code: **priorizar claridad y velocidad de interacción** sobre la decoración. Si un componente no ayuda a leer o actuar más rápido, no se agrega.

**Regla de confianza (nueva, crítica para AERA):** todo output generado por IA debe ser visualmente distinguible de una decisión ya confirmada por el docente, en toda pantalla donde ambos convivan. Ver sección 8.9 — es el patrón más importante de este sistema, porque es el que sostiene la hipótesis central del producto (ver PROJECT_CONTEXT.md §31, §36).

---

## 2. Tokens de color

### 2.1 Paleta base (Material Design 3 - tonal)

| Token | Hex | Uso |
|---|---|---|
| `primary` | `#004AC6` | Texto/iconos sobre superficies claras que requieren color primario |
| `primary-container` | `#2563EB` | **Azul de acción principal** — botones primarios, estados activos, foco |
| `on-primary` | `#FFFFFF` | Texto sobre `primary` |
| `on-primary-container` | `#EEEFFF` | Texto sobre `primary-container` — verificado 4.54:1, pasa AA para texto normal (ver §11) |
| `primary-fixed` | `#DBE1FF` | Fondos tenues de acento (chips, hovers suaves) |
| `primary-fixed-dim` | `#B4C5FF` | Acentos secundarios sobre fondos oscuros (sidebar) |
| `on-primary-fixed` | `#00174B` | Texto sobre `primary-fixed` |
| `on-primary-fixed-variant` | `#003EA8` | Hover de botones "container" |
| `secondary` | `#565E74` | Texto secundario, iconografía neutra |
| `secondary-container` | `#DAE2FD` | Fondos suaves de tarjetas secundarias |
| `on-secondary-container` | `#5C647A` | Texto sobre `secondary-container` |
| `secondary-fixed` | `#DAE2FD` | Alias de `secondary-container` para uso en superficies fijas (sidebar) |
| `secondary-fixed-dim` | `#BEC6E0` | Texto sobre sidebar oscuro (inactivo) |
| `on-secondary-fixed` | `#131B2E` | Texto sobre `secondary-fixed` en fondo claro |
| `on-secondary-fixed-variant` | `#3F465C` | Fondo hover de items de navegación (sidebar oscuro) |
| `tertiary` / `tertiary-container` | `#525657` / `#6B6E70` | Acentos neutros terciarios — **uso concreto:** color de fondo de avatar-iniciales cuando no hay foto (ver §8.5), nunca para texto de acción |
| `error` | `#BA1A1A` | Estados de error, validaciones |
| `error-container` / `on-error-container` | `#FFDAD6` / `#93000A` | Fondos y texto de alertas de error |
| `inverse-surface` | `#213145` | **Fondo del sidebar** (navegación oscura) |
| `inverse-on-surface` | `#EAF1FF` | Texto sobre sidebar |
| `inverse-primary` | `#B4C5FF` | Alias de `primary-fixed-dim`, reservado para posibles overlays oscuros (modales sobre sidebar) — no usar hasta que exista ese caso |

### 2.2 Superficies (fondo en capas — "Tonal Layering")

| Token | Hex | Uso |
|---|---|---|
| `background` / `surface` | `#F8F9FF` | Lienzo general de la aplicación (Nivel 0) |
| `surface-dim` | `#CBDBF5` | Reservado — variante de fondo con más peso tonal, no tiene caso de uso activo todavía. No usar hasta definir uno; candidato a eliminarse del config si sigue sin uso al cerrar el MVP. |
| `surface-bright` | `#F8F9FF` | Alias de `background`, mismo valor — no introducir un segundo nombre para el mismo color en componentes nuevos; usar `background`. |
| `surface-variant` | `#D3E4FE` | Alias de `surface-container-highest`, mismo valor — mismo caso que arriba, preferir `surface-container-highest`. |
| `surface-container-lowest` | `#FFFFFF` | Tarjetas, tablas, modales (Nivel 1) |
| `surface-container-low` | `#EFF4FF` | Fondos alternos, hover de filas |
| `surface-container` | `#E5EEFF` | Contenedores de iconos, badges neutros |
| `surface-container-high` | `#DCE9FF` | Elementos elevados |
| `surface-container-highest` | `#D3E4FE` | Máximo énfasis de superficie |
| `surface-border` | `#E2E8F0` | **Borde estándar de tarjetas y tablas (1px)** |
| `surface-tint` | `#0053DB` | Reservado — tinte de superposición M3 para elevación con color, sin caso de uso mientras el sistema use sombra + capas en vez de tinte. No usar hasta que se necesite. |
| `outline` / `outline-variant` | `#737686` / `#C3C6D7` | Bordes de inputs, divisores |
| `on-surface` | `#0B1C30` | Texto principal |
| `on-surface-variant` | `#434655` | Texto secundario / labels |

> Los tres tokens marcados "reservado" (`surface-dim`, `surface-tint`, `inverse-primary`) y los dos alias sin caso de uso propio (`surface-bright`, `surface-variant`) quedan en el config porque vienen del export de Material 3 y podrían servir más adelante, pero **no se usan en ningún componente de este documento**. Si al cerrar el MVP siguen sin uso, Claude Code debe eliminarlos del `tailwind.config` en vez de dejarlos como deuda silenciosa.

### 2.3 Colores semánticos de estado (ciclo de vida de una respuesta)

Usados para el badge de estado de una **respuesta individual** dentro de una actividad (no el estado de la actividad completa — ver la tabla de mapeo en §2.4, que resuelve la inconsistencia que tenía el documento original entre el estado de actividad, el estado de respuesta y el badge visual).

| Estado visual | Token | Hex fondo/icono | Hex texto (corregido para AA) | Significado |
|---|---|---|---|---|
| Pendiente | `status-pending` | `#F59E0B` | `#B45309` | Requiere atención / sin corregir |
| En revisión | `status-review` | `#8B5CF6` | `#6D28D9` | Procesamiento activo / IA corrigiendo |
| Corregido | `status-corrected` | `#10B981` | `#047857` | Completado |

**Corrección de accesibilidad (hallazgo de la auditoría):** los tres colores originales (`#F59E0B`, `#8B5CF6`, `#10B981`) tienen buen contraste como *fondo tenue* o *icono*, pero como **texto sólido sobre blanco** no pasan AA:
- `#F59E0B` sobre blanco ≈ 2.15:1 (falla — mínimo AA es 4.5:1)
- `#8B5CF6` sobre blanco ≈ 4.23:1 (falla por poco)
- `#10B981` sobre blanco ≈ 2.54:1 (falla)

Los tres reemplazos (`#B45309`, `#6D28D9`, `#047857`) sí pasan: 5.02:1, 7.09:1 y 5.48:1 respectivamente. **Regla:** el hex original de cada estado se usa para fondo (`/10`), borde (`/20`) e íconos; el hex "texto" de la tabla de arriba es el único que se usa para el texto del badge. Estos valores deben re-verificarse con la skill de contraste/accesibilidad del proyecto antes de congelar el sistema — quedan como punto de partida ya calculado, no como palabra final.

**Patrón de uso de badges de estado** (pill, fondo tenue + texto sólido, ya corregido):

```html
<!-- Pendiente -->
<span class="inline-flex items-center gap-2 px-3 py-1 rounded-full
             bg-status-pending/10 text-status-pending-text
             border border-status-pending/20
             font-label-md text-label-md">
  Pendiente
</span>

<!-- En revisión -->
<span class="inline-flex items-center gap-2 px-3 py-1 rounded-full
             bg-status-review/10 text-status-review-text
             border border-status-review/20
             font-label-md text-label-md">
  En revisión
</span>

<!-- Corregido -->
<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
             bg-status-corrected/10 text-status-corrected-text
             border border-status-corrected/20
             font-label-md text-label-md">
  Corregido
</span>
```

> Regla: el color de estado **nunca** se usa a opacidad 100% como fondo de un bloque grande; siempre `/10` para fondo y `/20` para borde. El texto usa siempre el tono "-text" corregido de la tabla, nunca el hex base.

### 2.4 Mapeo entre los tres niveles de estado (resuelve la inconsistencia de la auditoría)

El documento original tenía tres vocabularios de estado sin relación declarada entre sí: el badge de arriba (3 estados), el `status` de `GradingResult` en PROJECT_CONTEXT.md (5 estados) y el texto libre del estado de actividad en el dashboard ("En corrección" / "Completada"). Quedan así, de forma explícita:

| `GradingResult.status` (backend, por respuesta) | Badge visual (§2.3) |
|---|---|
| `PENDING`, `PROCESSING` | Pendiente |
| `AI_REVIEWED`, `TEACHER_REVIEW` | En revisión |
| `FINAL` | Corregido |

El **estado de la actividad completa** (lo que se ve en el dashboard) es un valor **derivado**, no un campo independiente que alguien setea a mano:
- `borrador` — la actividad no tiene preguntas definidas todavía.
- `en_correccion` — tiene preguntas, y al menos una respuesta con `status` distinto de `FINAL`.
- `completada` — todas las respuestas de todos los estudiantes están en `FINAL`.

Ver PROJECT_CONTEXT.md §22 para el detalle de implementación de este cálculo.

---

## 3. Tipografía

**Fuente única: `Inter`** (pesos 400, 500, 600, 700, 900) en toda la aplicación. No mezclar familias tipográficas (excepto `Material Symbols Outlined` para iconos).

| Estilo | Tamaño | Line-height | Peso | Tracking | Uso |
|---|---|---|---|---|---|
| `display-lg` | 36px | 44px | 700 | -0.02em | Hero, títulos de landing/login |
| `headline-md` | 24px | 32px | 600 | -0.01em | Títulos de página/dashboard (desktop) |
| `headline-md-mobile` | 20px | 28px | 600 | — | Títulos de página en mobile |
| `headline-sm` | 20px | 28px | 600 | — | Títulos de sección, cabeceras de tarjeta |
| `body-lg` | 18px | 28px | 400 | — | Texto destacado, subtítulos |
| `body-md` | 16px | 24px | 400 | — | **Texto base** — cuerpo estándar |
| `body-sm` | 14px | 20px | 400 | — | Texto auxiliar, descripciones |
| `label-md` | 14px | 20px | 600 | 0.05em | Botones, labels de formulario, metadatos destacados |
| `label-sm` | 12px | 16px | 500 | — | Metadatos, timestamps, texto muy pequeño |

Convención de clases Tailwind: siempre combinar tamaño + familia, ej. `class="font-headline-md text-headline-md text-on-background"`.

**Regla:** el letter-spacing negativo (`-0.02em` / `-0.01em`) es exclusivo de titulares grandes (`display-lg`, `headline-md`). Nunca aplicarlo a `body-*`.

---

## 4. Layout y espaciado

- **Grid base:** híbrido fixed-fluid de 12 columnas.
- **Ancho máximo de contenido:** `container-max: 1440px`
- **Sidebar (desktop):** ancho fijo `sidebar-width: 260px`, fondo `inverse-surface` (#213145)
- **Gutter entre columnas/tarjetas:** `gutter: 24px`
- **Margen de página — mobile:** `margin-mobile: 16px`
- **Margen de página — desktop:** `margin-desktop: 32px`
- **Unidad base de ritmo vertical:** `base: 4px` (todo espaciado interno de componentes es múltiplo de 4px)

### Reflow mobile
- El sidebar colapsa en **bottom navigation bar** o **menú hamburguesa**.
- Las **tablas horizontales** se transforman en **tarjetas apiladas verticalmente**, nunca en scroll horizontal forzado.
- Aparece un **FAB** (botón flotante circular, 56px) para la acción principal de la pantalla en mobile:
```html
<button class="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary-container
               text-on-primary-container rounded-full shadow-lg flex items-center
               justify-center hover:scale-105 transition-transform z-50">
  <span class="material-symbols-outlined">add</span>
</button>
```

---

## 5. Bordes redondeados (`rounded`)

| Token | Valor | Uso |
|---|---|---|
| `sm` | 0.25rem (4px) | Chips pequeños, tags |
| `DEFAULT` | 0.5rem (8px) | **Inputs y botones** |
| `md` | 0.75rem (12px) | Contenedores medianos |
| `lg` | 1rem (16px) | **Tarjetas grandes** |
| `xl` | 1.5rem (24px) | Contenedores hero / paneles destacados |
| `full` | 9999px | **Badges, pills, avatares, FAB** |

Regla de forma: **redondeo pequeño → elemento interactivo denso** (input, botón); **redondeo grande → contenedor de agrupación** (tarjeta, panel); **full → elemento de estado o identidad** (badge, avatar).

**Corrección crítica (hallazgo de la auditoría):** en la versión anterior de este documento, la configuración real de Tailwind (§9) no coincidía con esta tabla — tenía los valores corridos un escalón (`DEFAULT` en 4px en vez de 8px, `lg` en 8px en vez de 16px, `xl` en 12px en vez de 24px) y le faltaban los tokens `sm` y `md`. Eso rompía justo la regla de arriba: una tarjeta con `rounded-xl` se veía con el redondeo de un chip, no de un panel destacado. **La configuración de §9 ya está corregida para coincidir exactamente con esta tabla — es la única fuente de verdad ahora.**

---

## 6. Elevación y sombra

Profundidad por **capas tonales** + sombra ambiental sutil. Las sombras **nunca son negro puro**: usar tinte azulado `rgba(15, 23, 42, X)`.

| Nivel | Uso | Especificación |
|---|---|---|
| **0 — Fondo** | Lienzo de la app | `bg-background` (#F8F9FF), sin sombra |
| **1 — Tarjetas/Tablas** | Contenido primario | `bg-surface-container-lowest` + `border border-surface-border` (1px) + `shadow-[0_2px_8px_rgba(15,23,42,0.02)]` |
| **2 — Dropdowns/Modales** | Overlays temporales | `shadow-[0_8px_30px_rgba(15,23,42,0.05)]` a `0.06` de opacidad, blur ~16px |

```html
<div class="bg-surface-container-lowest rounded-xl border border-surface-border
            p-6 shadow-sm flex flex-col relative overflow-hidden group
            hover:shadow-md transition-shadow">
  ...
</div>
```

---

## 7. Iconografía

- **Librería:** `Material Symbols Outlined` (Google Fonts), variable en peso (100–700) y relleno (`FILL` 0–1).
- **Tamaño por defecto:** 24px; usar `text-sm` para variantes de 20px dentro de botones pequeños o filas de tabla.
- **Convención de `FILL` (nueva — faltaba en la versión original):** `FILL: 0` (solo contorno) es el estado por defecto/inactivo de cualquier ícono de navegación; `FILL: 1` (relleno) se reserva exclusivamente para el ícono del item activo del sidebar (ver §8.2) y para íconos de estado dentro de un badge ya confirmado (ej. el check de "Corregido"). No usar `FILL: 1` de forma decorativa en ningún otro contexto.
- Nunca mezclar con otra librería de iconos (Lucide, FontAwesome, etc.).

```css
.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  font-size: 24px;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
}
.material-symbols-outlined.is-active { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
```

---

## 8. Componentes

### 8.1 Botones

**Primario (sólido):**
```html
<button class="bg-primary-container text-on-primary-container px-6 py-3
               rounded-full shadow-sm hover:bg-on-primary-fixed-variant
               transition-colors flex items-center gap-2 font-label-md
               disabled:opacity-40 disabled:pointer-events-none">
  <span class="material-symbols-outlined text-sm">add</span>
  Crear actividad
</button>
```

**Secundario (ghost / outline):**
```html
<button class="bg-surface-container-lowest text-primary-container px-4 py-2
               rounded-lg font-label-md border border-surface-border
               hover:bg-surface transition-colors
               disabled:opacity-40 disabled:pointer-events-none">
  Cancelar
</button>
```

**Icon button (circular, toolbar):**
```html
<button class="p-2 text-on-surface-variant hover:bg-surface-container-low
               rounded-full transition-all hover:scale-95">
  <span class="material-symbols-outlined">notifications</span>
</button>
```

> `primary-container` (#2563EB) = superficie de acción; `primary` (#004AC6) se reserva para texto/iconos de acento sobre fondo claro. No intercambiarlos.

### 8.2 Sidebar (navegación desktop)

- Fondo oscuro `inverse-surface` (#213145), texto `secondary-fixed-dim` (#BEC6E0) en reposo.
- Item activo: **borde izquierdo de 4px en `primary-container`** + fondo con tinte sutil + texto blanco + ícono con `FILL: 1` (ver §7).

```html
<a class="flex items-center gap-3 px-4 py-3 text-secondary-fixed-dim
          hover:text-surface-container-lowest hover:bg-on-secondary-fixed-variant
          transition-colors duration-200 border-l-4 border-transparent">
  <span class="material-symbols-outlined">dashboard</span>
  Dashboard
</a>
<!-- Estado activo: border-l-primary-container bg-on-secondary-fixed-variant text-white, ícono con clase is-active -->
```

### 8.3 Tablas de gestión

- Encabezados: `text-label-sm uppercase tracking-wider text-secondary`, fondo `surface-container-lowest`.
- Filas: borde inferior 1px `surface-border`, o zebra-stripe con `surface-container-low`.
- Nombre del alumno en negrita: `font-body-md font-semibold text-on-background`.
- Hover de fila: `hover:bg-surface-container-low transition-colors`.
- En mobile, cada fila se convierte en una **tarjeta apilada** (mismo componente de card Nivel 1).

### 8.4 Badges / Chips de estado

Ver §2.3 y §2.4 — siempre pill (`rounded-full`), fondo `/10`, borde `/20`, texto en el tono "-text" corregido para AA.

### 8.5 Avatares

```html
<!-- Foto -->
<img class="w-8 h-8 rounded-full object-cover border border-surface-border" src="..."/>

<!-- Iniciales (fallback) -->
<div class="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary-container
            flex items-center justify-center font-label-md">JD</div>
```

### 8.6 Inputs de formulario

- Radio: `rounded` (8px, ver §5 corregido), borde `outline-variant`.
- **Focus:** sombra interna sutil + borde en `primary`.
- **Error:** borde `error`, texto de ayuda en `on-error-container` sobre `error-container` tenue (`/10`).

```html
<input class="w-full px-4 py-3 rounded border border-outline-variant
              bg-surface-container-lowest text-on-surface
              focus:border-primary focus:ring-1 focus:ring-primary
              focus:shadow-inner transition-all
              aria-invalid:border-error" type="text"/>
<p class="mt-1 text-body-sm text-error hidden aria-[invalid]:block">Este campo es obligatorio.</p>
```

### 8.7 Reproductor de feedback por voz — **fuera del MVP actual**

> **Nota de la auditoría:** este componente estaba documentado como "distintivo de AERA" pero no aparece en ninguna parte del alcance funcional de PROJECT_CONTEXT.md (ni en el flujo, ni en §32 MVP, ni en §33 fuera de alcance). Se deja la especificación abajo por si en algún momento se confirma como funcionalidad real, pero **Claude Code no debe construir este componente en la fase 0** salvo que el brief lo pida explícitamente — construirlo sin que esté en el alcance es esfuerzo perdido.

Barra horizontal con forma de onda simplificada: controles (play/pause) en `primary`; barra de progreso en `secondary` con relleno activo en `primary`; contenedor card Nivel 1.

### 8.8 Barras de progreso (dashboards)

```html
<div class="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
  <div class="bg-status-corrected h-1.5 rounded-full" style="width: 72%"></div>
</div>
```

### 8.9 Origen del valor: sugerido por IA vs. confirmado por el docente (nuevo — el componente más importante del sistema)

> **Por qué existe:** PROJECT_CONTEXT.md §19 y §31 son explícitos en que la IA **nunca** debe presentarse como autoridad final, y que el docente necesita distinguir de un vistazo qué es una sugerencia y qué ya confirmó él. La versión anterior de este documento no tenía ningún componente para esto — es el hallazgo de mayor prioridad de la auditoría.

**Patrón:** un valor "sugerido por IA" siempre lleva una etiqueta visible con ícono `auto_awesome`, en el mismo tono violeta de "En revisión" (reutilizado a propósito: la IA sugiriendo es conceptualmente el mismo estado que "en revisión"). Un valor ya confirmado por el docente **no lleva badge** — se muestra como texto normal con un ícono de check pequeño en `status-corrected`, porque lo confirmado debe sentirse "resuelto", no seguir compitiendo visualmente por atención.

```html
<!-- Puntaje sugerido por IA, esperando confirmación del docente -->
<div class="flex items-center gap-2">
  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
               bg-status-review/10 text-status-review-text border border-status-review/20
               font-label-sm text-label-sm">
    <span class="material-symbols-outlined text-sm">auto_awesome</span>
    Sugerido por IA
  </span>
  <span class="font-headline-sm text-headline-sm text-on-background">4 / 5</span>
</div>

<!-- Puntaje ya confirmado por el docente -->
<div class="flex items-center gap-1.5">
  <span class="material-symbols-outlined text-sm text-status-corrected-text">check_circle</span>
  <span class="font-headline-sm text-headline-sm text-on-background">5 / 5</span>
  <span class="font-body-sm text-body-sm text-on-surface-variant">confirmado</span>
</div>
```

**Regla de copy asociada (de PROJECT_CONTEXT.md §31):** cualquier texto junto a un valor de IA usa lenguaje de sugerencia ("Calificación sugerida por IA", "La IA detectó...", "Revisa antes de aprobar"), nunca lenguaje de hecho consumado ("Respuesta incorrecta", "Calificación definitiva") mientras el docente no haya confirmado.

### 8.10 Estados de carga (nuevo)

El pipeline de OCR + IA (PROJECT_CONTEXT.md §26) es la pantalla que un docente va a ver con más frecuencia — necesita su propio componente, no un spinner genérico.

**Progreso por pasos** (para el procesamiento de una actividad o de una entrega):
```html
<ul class="space-y-3">
  <li class="flex items-center gap-3 text-body-md text-on-background">
    <span class="material-symbols-outlined text-status-corrected-text">check_circle</span>
    Archivo recibido
  </li>
  <li class="flex items-center gap-3 text-body-md text-on-background">
    <span class="material-symbols-outlined text-status-corrected-text">check_circle</span>
    Texto detectado
  </li>
  <li class="flex items-center gap-3 text-body-md text-primary-container">
    <span class="material-symbols-outlined animate-spin">progress_activity</span>
    Analizando preguntas
  </li>
  <li class="flex items-center gap-3 text-body-md text-on-surface-variant">
    <span class="material-symbols-outlined">radio_button_unchecked</span>
    Preparando actividad
  </li>
</ul>
```

**Skeleton de tarjeta** (para listas mientras cargan, ej. "Mis actividades"):
```html
<div class="bg-surface-container-lowest rounded-xl border border-surface-border p-6 animate-pulse">
  <div class="h-5 w-2/3 bg-surface-container rounded mb-3"></div>
  <div class="h-4 w-1/3 bg-surface-container rounded"></div>
</div>
```

Respetar `prefers-reduced-motion: reduce` — el `animate-spin`/`animate-pulse` se reemplaza por un estado estático con el mismo texto.

### 8.11 Estado vacío (nuevo)

Para "Mis actividades" cuando un docente entra por primera vez sin nada creado — es de las primeras pantallas reales que ve un usuario nuevo, no puede quedar sin diseñar.

```html
<div class="flex flex-col items-center justify-center text-center py-16 px-6">
  <span class="material-symbols-outlined text-4xl text-on-surface-variant mb-3">description</span>
  <p class="font-headline-sm text-headline-sm text-on-background mb-1">Todavía no tienes actividades</p>
  <p class="font-body-sm text-body-sm text-on-surface-variant mb-5 max-w-xs">
    Crea tu primera actividad y sube la evaluación que ya tienes lista — en papel o en PDF.
  </p>
  <button class="bg-primary-container text-on-primary-container px-6 py-3 rounded-full
                 font-label-md flex items-center gap-2">
    <span class="material-symbols-outlined text-sm">add</span>
    Crear mi primera actividad
  </button>
</div>
```

---

## 9. Configuración Tailwind (corregida — coincide exactamente con §5)

```js
tailwind.config = {
  darkMode: "class", // reservado — no implementado en el MVP, ver regla 5 de §10. No construir modo oscuro sin que se pida explícitamente.
  theme: {
    extend: {
      colors: {
        "primary": "#004ac6",
        "on-primary": "#ffffff",
        "primary-container": "#2563eb",
        "on-primary-container": "#eeefff",
        "primary-fixed": "#dbe1ff",
        "primary-fixed-dim": "#b4c5ff",
        "on-primary-fixed": "#00174b",
        "on-primary-fixed-variant": "#003ea8",
        "secondary": "#565e74",
        "on-secondary": "#ffffff",
        "secondary-container": "#dae2fd",
        "on-secondary-container": "#5c647a",
        "secondary-fixed": "#dae2fd",
        "secondary-fixed-dim": "#bec6e0",
        "on-secondary-fixed": "#131b2e",
        "on-secondary-fixed-variant": "#3f465c",
        "tertiary": "#525657",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#6b6e70",
        "on-tertiary-container": "#eff1f3",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "background": "#f8f9ff",
        "on-background": "#0b1c30",
        "surface": "#f8f9ff",
        "surface-dim": "#cbdbf5",
        "surface-bright": "#f8f9ff",
        "surface-variant": "#d3e4fe",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        "surface-border": "#E2E8F0",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#434655",
        "inverse-surface": "#213145",
        "inverse-on-surface": "#eaf1ff",
        "inverse-primary": "#b4c5ff",
        "outline": "#737686",
        "outline-variant": "#c3c6d7",
        "surface-tint": "#0053db",
        "status-pending": "#F59E0B",
        "status-pending-text": "#B45309",
        "status-review": "#8B5CF6",
        "status-review-text": "#6D28D9",
        "status-corrected": "#10B981",
        "status-corrected-text": "#047857"
      },
      borderRadius: {
        sm: "0.25rem",     // 4px  — corregido: antes no existía
        DEFAULT: "0.5rem", // 8px  — corregido: antes era 0.25rem (4px)
        md: "0.75rem",     // 12px — corregido: antes no existía
        lg: "1rem",        // 16px — corregido: antes era 0.5rem (8px)
        xl: "1.5rem",      // 24px — corregido: antes era 0.75rem (12px)
        full: "9999px"
      },
      spacing: {
        base: "4px",
        "sidebar-width": "260px",
        "container-max": "1440px",
        gutter: "24px",
        "margin-mobile": "16px",
        "margin-desktop": "32px"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      },
      fontSize: {
        "display-lg": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-md-mobile": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "headline-sm": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.05em", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }]
      }
    }
  }
}
```

> **Simplificación (auditoría):** la versión original repetía `fontFamily` nueve veces, una por cada estilo tipográfico, todas apuntando a `["Inter"]`. Como hay una sola familia en todo el sistema, se colapsó a un único `fontFamily.sans` — usar `font-sans` para la familia y las clases `text-*` de §9/§3 para tamaño/peso/tracking.

**Fuentes (Google Fonts):**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL,GRAD,opsz@100..700,0..1,-50..200,20..48&display=swap" rel="stylesheet"/>
```

---

## 10. Reglas de uso rápidas para Claude Code

1. **Nunca** introducir un color fuera de la paleta de §2 sin agregarlo primero como token nombrado.
2. **Nunca** mezclar tipografías: solo `Inter` para texto, `Material Symbols Outlined` para iconos.
3. Todo estado de respuesta (pendiente / en revisión / corregido) se representa **siempre** con el patrón de badge de §2.3/§2.4, con los tonos "-text" corregidos — nunca los hex base como color de texto.
4. Todo valor generado por IA que el docente todavía no confirmó usa el patrón de §8.9 — nunca se muestra un puntaje o corrección de IA como si fuera definitivo.
5. Toda tarjeta nueva usa `surface-container-lowest` + `border-surface-border` + sombra Nivel 1, salvo overlay explícito (Nivel 2).
6. El sidebar es **siempre oscuro** (`inverse-surface`); el resto de la interfaz es **siempre claro**. No crear modo oscuro global salvo que se solicite explícitamente — `darkMode: "class"` queda declarado pero sin implementar.
7. En mobile, priorizar **tarjetas apiladas y FAB** sobre tablas y toolbars densas.
8. Espaciado interno de componentes: siempre múltiplos de `4px`.
9. Botón primario = fondo `primary-container` (#2563EB), no `primary` (#004AC6).
10. Toda pantalla de carga (upload, procesamiento OCR/IA) usa el patrón de §8.10, no un spinner genérico sin contexto.
11. Toda lista que puede estar vacía (actividades, estudiantes, entregas) tiene su estado vacío diseñado con el patrón de §8.11 antes de darse por construida.
12. Los primitivos de UI (botón, input, dialog, toggle, tabla) se implementan con **shadcn/ui**, restyleados con estos tokens — no se usan los colores por defecto de shadcn ni se reinventan componentes que shadcn ya resuelve.

---

## 11. Accesibilidad y contraste — verificación inicial

Cálculo de contraste WCAG (fórmula de luminancia relativa estándar) sobre las combinaciones que el sistema usa como texto:

| Combinación | Contraste | Resultado |
|---|---|---|
| `on-primary-container` (#EEEFFF) sobre `primary-container` (#2563EB) — texto de botón primario | 4.54:1 | Pasa AA (texto normal) |
| `status-pending` (#F59E0B) sobre blanco — **hex original, no usar como texto** | 2.15:1 | Falla |
| `status-pending-text` (#B45309) sobre blanco — reemplazo ya aplicado en §2.3 | 5.02:1 | Pasa AA |
| `status-review` (#8B5CF6) sobre blanco — **hex original, no usar como texto** | 4.23:1 | Falla por poco |
| `status-review-text` (#6D28D9) sobre blanco — reemplazo ya aplicado en §2.3 | 7.09:1 | Pasa AA |
| `status-corrected` (#10B981) sobre blanco — **hex original, no usar como texto** | 2.54:1 | Falla |
| `status-corrected-text` (#047857) sobre blanco — reemplazo ya aplicado en §2.3 | 5.48:1 | Pasa AA |

Estos números son el punto de partida y ya están aplicados en los tokens de §2.3/§9 — de todas formas, antes de congelar el sistema, correr la skill de contraste/accesibilidad del proyecto sobre cada combinación de texto real (incluyendo `on-surface-variant` sobre `surface-container-low`, foco de inputs, y el badge de §8.9) para confirmar que ninguna quedó fuera de rango.

**Foco de teclado:** todo elemento interactivo debe tener un anillo de foco visible (`focus:ring-1 focus:ring-primary` como mínimo, ver §8.6) — no depender solo del cambio de color de borde, que no es suficiente para quienes navegan con teclado o tienen baja visión.

---

## 12. Nota abierta: identidad visual heredada

Este sistema viene de un export genérico de Stitch (`efficient_educational_saas`) — es una paleta azul-corporativa funcional pero no fue diseñada pensando en el nombre "AERA" ni en lo que el producto realmente hace (evaluación + corrección asistida por IA con OCR). Se mantiene para el MVP porque ya está validada en 12 pantallas y no vale la pena bloquear la construcción por esto. Cuando el producto tenga tracción, vale la pena una sesión de identidad real — nombre, color, tipografía — pensada específicamente para AERA, en vez de heredar la plantilla genérica.
