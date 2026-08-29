# AERA

Plataforma para digitalizar una actividad que el docente ya tiene, estructurarla con
OCR + IA, definir criterios y recibir una corrección **sugerida** que el docente siempre
revisa y confirma.

Fuente de verdad del producto y del diseño:
[`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) y
[`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md). `CLAUDE.md` (raíz) resume las
convenciones de construcción.

## Estado actual

**Maqueta de front completa y funcional.** Todas las vistas del flujo de fase 0 están
construidas, navegables y conectadas entre sí contra una capa de datos en memoria
(persistida en `localStorage`). El backend todavía no está conectado: el esquema, las
policies de RLS y los clientes de Supabase quedan escritos y listos para enchufar.

## Correr el proyecto

```bash
npm install
npm run dev
```

Cualquier correo y contraseña entran a la sesión de demostración. En **Ajustes** puedes
restaurar los datos de ejemplo o vaciarlos (útil para ver los estados vacíos de §8.11).

## Mapa de pantallas

| Ruta | Qué resuelve |
|---|---|
| `/login`, `/registro`, `/recuperar` | Autenticación (§8.1) |
| `/dashboard` | Actividades con estado derivado + estado vacío (§9, §8.11) |
| `/actividades/nueva` | Crear actividad (§10) |
| `/actividades/[id]` | Resumen: en qué paso del flujo está la actividad |
| `/actividades/[id]/documento` | Subir/escanear + progreso por pasos (§11, §8.10) |
| `/actividades/[id]/preguntas` | Editor de preguntas y criterios (§15, §16), confianza baja resaltada |
| `/actividades/[id]/respuestas` | Carga en lote + asignación archivo→estudiante (§11, §17) |
| `/actividades/[id]/correccion/[submissionId]` | Revisión de la corrección IA (§18, §8.9) |
| `/actividades/[id]/resultados` | Notas, promedio, estado (§21) |
| `/actividades/[id]/resultados/[studentId]` | Resultado individual imprimible / PDF (§8.2) |
| `/estudiantes` | Lista de clase, alta individual y en lote |
| `/ajustes` | Cuenta y control de los datos de demostración |

## Arquitectura del front

```
app/                      rutas (App Router, grupos (auth) y (app))
components/ui/            primitivos shadcn/ui restyleados con los tokens
components/layout/        shell: sidebar oscuro, bottom nav, FAB, PageHeader
components/activity/      tarjeta de actividad y editor de preguntas
components/grading/       tarjeta de revisión de corrección (§8.9)
components/upload/        dropzone y lista de archivos (§11)
lib/types.ts              modelo de datos de §22
lib/data/provider.tsx     CAPA DE ACCESO A DATOS — única puerta a los datos
lib/data/db.ts            base de demostración y semilla
lib/data/mock-ai.ts       simulación del pipeline OCR+IA (se reemplaza entero)
lib/data/derive.ts        estado derivado de actividad y mapeo a badges (§22, §2.4)
lib/supabase/             clientes de navegador y servidor, listos para usar
supabase/migrations/      esquema, RLS y buckets de Storage
supabase/tests/rls.sql    prueba manual de cada policy, tabla por tabla
```

Ningún componente decide de dónde vienen los datos: todo pasa por `useData()`.

## Conectar el backend (pasos)

1. Crear el proyecto en Supabase y aplicar
   `supabase/migrations/0001_init.sql` y `0002_storage.sql`.
2. Correr `supabase/tests/rls.sql` y confirmar que el docente B ve **cero** filas de A.
3. Copiar `.env.local.example` a `.env.local` y completar las variables.
4. Reemplazar la implementación de cada función de `lib/data/provider.tsx` por su
   consulta de Supabase. Las firmas y los tipos de retorno no cambian, así que las
   pantallas no se tocan.
5. Sustituir `startActivityProcessing` / `startSubmissionProcessing` por una llamada a la
   Edge Function que encola el trabajo, y `jobFor` por una suscripción de Supabase
   Realtime al `status` de `activities` / `submissions` (§26).
6. Construir el pipeline OCR + IA **después** de correr la validación técnica de §5
   (3–5 documentos reales, al menos uno manuscrito) y borrar `lib/data/mock-ai.ts`.

## Decisiones de diseño que no se negocian

- Todo valor de IA sin confirmar usa el patrón de §8.9 (`components/ui/ai-value.tsx`).
- Los estados usan siempre los tonos `-text` de los badges, nunca el hex base como texto.
- El estado de la actividad es derivado (§22), nunca un campo editable.
- Toda pantalla de carga usa el progreso por pasos de §8.10.
- Toda lista que puede estar vacía tiene su estado vacío (§8.11).
