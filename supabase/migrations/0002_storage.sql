-- ============================================================================
-- AERA — Storage (§24, §29)
-- Los documentos originales de actividades y las hojas de respuestas NO son públicos.
-- Un docente solo accede a los archivos que están bajo su propio prefijo.
-- Convención de rutas: <teacher_id>/<activity_id>/<archivo>
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('activity-documents', 'activity-documents', false),
  ('submission-documents', 'submission-documents', false)
on conflict (id) do nothing;

-- Policy explícita por bucket y por operación: el primer segmento de la ruta debe ser
-- el id del docente autenticado.
create policy "activity docs: leer los propios"
  on storage.objects for select
  using (
    bucket_id = 'activity-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "activity docs: subir los propios"
  on storage.objects for insert
  with check (
    bucket_id = 'activity-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "activity docs: borrar los propios"
  on storage.objects for delete
  using (
    bucket_id = 'activity-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "submission docs: leer los propios"
  on storage.objects for select
  using (
    bucket_id = 'submission-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "submission docs: subir los propios"
  on storage.objects for insert
  with check (
    bucket_id = 'submission-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "submission docs: borrar los propios"
  on storage.objects for delete
  using (
    bucket_id = 'submission-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
