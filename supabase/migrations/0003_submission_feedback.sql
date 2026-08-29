-- ============================================================================
-- AERA — retroalimentación de cierre por entrega (DESIGN_SYSTEM.md §8.7)
--
-- Contexto: §22 solo tenía `teacher_feedback` por respuesta (en grading_results).
-- Faltaba el mensaje global del docente sobre toda la entrega, que es el que se le
-- entrega al estudiante junto con la nota (§8.2).
--
-- El componente de voz estaba especificado en §8.7 pero marcado fuera del MVP hasta
-- que el brief lo pidiera; ya se pidió, así que el modelo lo contempla.
--
-- No aplicada todavía: como 0001 y 0002, queda lista para correr cuando exista el
-- proyecto de Supabase.
-- ============================================================================

alter table public.submissions
  add column if not exists teacher_feedback text,
  -- { id, duration_seconds, created_at, object_url, waveform[] }
  -- `object_url` apunta al objeto del bucket `feedback-audio`; en el prototipo del front
  -- es un blob: en memoria del navegador y no se persiste.
  add column if not exists voice_note jsonb;

comment on column public.submissions.teacher_feedback is
  'Mensaje de cierre del docente sobre toda la entrega. Distinto del teacher_feedback por respuesta de grading_results.';
comment on column public.submissions.voice_note is
  'Metadatos del mensaje de voz del docente (§8.7). El audio vive en el bucket feedback-audio.';

-- ── Bucket privado para el audio de retroalimentación ───────────────────────
insert into storage.buckets (id, name, public)
values ('feedback-audio', 'feedback-audio', false)
on conflict (id) do nothing;

-- Misma convención de rutas que el resto: <teacher_id>/<activity_id>/<archivo>
create policy "feedback audio: leer los propios"
  on storage.objects for select
  using (
    bucket_id = 'feedback-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "feedback audio: subir los propios"
  on storage.objects for insert
  with check (
    bucket_id = 'feedback-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "feedback audio: borrar los propios"
  on storage.objects for delete
  using (
    bucket_id = 'feedback-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Las policies de RLS de `submissions` (0001) ya cubren estas columnas: se heredan de
-- la tabla, no de la columna. No hace falta policy nueva.
