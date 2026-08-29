-- ============================================================================
-- AERA — envío de retroalimentación y seguimiento familiar
--
-- Tres cosas:
--  1. La retroalimentación deja de ser solo un borrador: se ENVÍA, y ese envío tiene
--     momento. Mientras `feedback_sent_at` sea null, la familia no ve nada.
--  2. La IA puede proponer una retroalimentación global (`ai_feedback_draft`), que es
--     una SUGERENCIA — nunca se entrega sin que el docente la apruebe (§19, §31).
--  3. El estudiante gana un apoderado, que es quien entra al portal de seguimiento.
--
-- ALCANCE: PROJECT_CONTEXT.md §33 deja el portal con login propio fuera del MVP. Este
-- portal familiar se construyó como prototipo a pedido del brief; el modelo de acceso
-- real (cuenta de apoderado, invitación, código de un solo uso) está SIN DEFINIR y por
-- eso todavía no hay policies de lectura para ese rol: ver la nota al final.
--
-- No aplicada todavía, como el resto de migraciones.
-- ============================================================================

alter table public.submissions
  -- Propuesta de la IA a partir de toda la corrección. Sugerencia, no resultado final.
  add column if not exists ai_feedback_draft text,
  -- Momento del envío a la familia. Null = todavía es borrador del docente.
  add column if not exists feedback_sent_at timestamptz;

comment on column public.submissions.ai_feedback_draft is
  'Retroalimentación global sugerida por IA. El docente la aprueba o edita antes de enviar; nunca se entrega tal cual.';
comment on column public.submissions.feedback_sent_at is
  'Momento en que el docente envió la retroalimentación a la familia. Null = no visible en el portal del apoderado.';

alter table public.students
  add column if not exists guardian_name text,
  add column if not exists guardian_email text;

comment on column public.students.guardian_name is
  'Apoderado. En esta fase el estudiante no tiene usuario propio: quien accede al seguimiento es su apoderado.';

-- La reinterpretación del audio se guarda dentro del jsonb `voice_note` como
-- `ai_transcript`, junto a duración y forma de onda. No necesita columna propia.

-- ── Índice para el portal familiar ──────────────────────────────────────────
create index if not exists submissions_student_sent_idx
  on public.submissions (student_id, feedback_sent_at);

-- ============================================================================
-- PENDIENTE DE DECISIÓN antes de conectar el portal familiar
--
-- Hoy las policies de `submissions`, `answers` y `grading_results` (0001) permiten leer
-- solo al docente dueño de la actividad. El apoderado no tiene rol ni identidad en el
-- modelo, así que el portal NO puede conectarse tal como está: haría falta decidir
--
--   a) cuenta de apoderado en auth.users + tabla `guardians` con vínculo a `students`,
--      y policies de solo lectura acotadas a: notas FINAL y feedback_sent_at not null; o
--   b) acceso por enlace firmado sin cuenta (token de un solo uso por entrega), que
--      evita crear usuarios pero complica revocar el acceso.
--
-- Conectarlo sin resolver esto abriría datos de estudiantes a quien adivine un id.
-- Por eso el prototipo del front lee de la capa mock y no de Supabase.
-- ============================================================================
