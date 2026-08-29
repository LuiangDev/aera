# CLAUDE.md — AERA

## Qué es esto

AERA es una plataforma web que permite a un docente digitalizar una actividad
académica que ya tiene (papel o digital), dejar que OCR + IA la estructuren en
preguntas, definir criterios de corrección, subir las respuestas de sus
estudiantes, y recibir una calificación sugerida por IA que el docente siempre
revisa y confirma antes de que sea definitiva. El principio rector: la
plataforma se adapta a la evaluación del docente, no al revés.

Lee, en este orden, antes de tocar código:
1. `docs/PROJECT_CONTEXT.md` — problema, propuesta de valor, flujo, modelo de
   datos, alcance del MVP, prioridad de desarrollo.
2. `docs/DESIGN_SYSTEM.md` — tokens, tipografía, componentes, y en particular
   la sección 8.9 (sugerido por IA vs. confirmado por el docente), que es el
   patrón visual más importante de todo el sistema.

## Antes de escribir código

`docs/PROJECT_CONTEXT.md` §5 señala el riesgo técnico más grande del proyecto:
la calidad del OCR/IA sobre documentos manuscritos con layout arbitrario no
está validada. Antes de construir el pipeline completo, correr una prueba
corta con 3-5 imágenes reales (no capturas limpias) contra el proveedor
elegido y confirmar que la extracción es razonable. Si el resultado es malo,
es mejor descubrirlo en una prueba de una tarde que después de construir todo
el editor de preguntas alrededor de datos poco confiables.

## Stack

- Next.js (App Router) + TypeScript.
- Tailwind CSS con los tokens de `docs/DESIGN_SYSTEM.md` §9 cargados en
  `tailwind.config` — nunca colores literales (`bg-[#...]`) en componentes.
- **shadcn/ui** para primitivos (botón, input, dialog, toggle, tabla) —
  restyleados con los tokens del sistema de diseño, nunca sus colores por
  defecto. Si ya tienes una skill o preset de shadcn/ui posicionado en el
  entorno, úsalo como base de instalación y configuración.
- Fuentes: `Inter` (única familia de texto) y `Material Symbols Outlined`
  (iconografía), vía Google Fonts.
- **Supabase**: Auth, Postgres, Storage, Row Level Security, Edge Functions.
  Ver `docs/PROJECT_CONTEXT.md` §22 (esquema), §26 (procesamiento asíncrono
  vía Supabase Realtime) y §29 (policies de RLS explícitas por tabla).
- OCR/IA: ver `docs/PROJECT_CONTEXT.md` §5 para la recomendación de enfoque
  (modelo multimodal con visión, llamado siempre desde el servidor).
- Accesibilidad: los contrastes de color ya vienen verificados en
  `docs/DESIGN_SYSTEM.md` §11 — si usas una skill de contraste/accesibilidad
  ya posicionada en el entorno, corre una segunda pasada sobre los
  componentes reales una vez construidos, no solo sobre los tokens en el
  papel.

## Alcance de la fase 0 — orden de prioridad

Ver `docs/PROJECT_CONTEXT.md` §38 para la lista completa. En resumen:

1. Validar el enfoque de OCR/IA con una prueba corta (ver arriba).
2. Auth + Dashboard con estado vacío (`docs/DESIGN_SYSTEM.md` §8.11).
3. Crear actividad → subir/escanear (individual y en lote, §11) → pipeline de
   procesamiento con el componente de progreso por pasos (`DESIGN_SYSTEM.md`
   §8.10), notificado vía Supabase Realtime.
4. Editor de preguntas, resaltando las de `confidence` baja.
5. Definición de respuestas/criterios estructurados (§16).
6. Subida de respuestas de estudiantes (individual y en lote) + corrección IA
   con el patrón sugerido-vs-confirmado (`DESIGN_SYSTEM.md` §8.9).
7. Vista de resultados + exportar PDF individual (§8.2).

## Convenciones

- Componentes en `components/`, uno por archivo.
- Ningún componente decide de dónde vienen los datos — pasan por una capa de
  acceso a Supabase, no llamadas directas desde cualquier componente.
- Colores siempre `var(--token)`/clases Tailwind de los tokens, nunca hex
  sueltos.
- Todo valor generado por IA que el docente no confirmó usa el patrón de
  `DESIGN_SYSTEM.md` §8.9 — sin excepciones, es el diferenciador de confianza
  del producto.
- Toda pantalla de carga usa el componente de progreso de §8.10, no un
  spinner genérico sin contexto.
- Toda lista que puede estar vacía tiene su estado vacío diseñado (§8.11)
  antes de darse por construida.
- Llamadas a proveedores de OCR/IA siempre desde server-side (Route
  Handler/Server Action/Edge Function) — nunca desde el cliente.
- Mobile-first para dashboard/estudiantes/resultados; el editor de preguntas
  y la revisión de correcciones pueden priorizar desktop dado el volumen de
  información que maneja un docente ahí.
