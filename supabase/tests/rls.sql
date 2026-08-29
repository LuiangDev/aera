-- ============================================================================
-- Prueba manual de las policies de RLS (§29).
--
-- Por qué existe: con RLS, una policy mal escrita NO da error — devuelve cero filas
-- en silencio. Cada tabla se prueba por separado, en las dos direcciones:
--   1. el docente dueño ve sus filas,
--   2. el otro docente ve exactamente cero.
--
-- Cómo correrlo: `supabase db reset` y luego este archivo con psql contra la base local,
-- o pegarlo en el SQL editor del proyecto. Reemplazar los UUID por los de dos usuarios
-- reales creados en auth.users.
-- ============================================================================

\set docente_a '00000000-0000-0000-0000-00000000000a'
\set docente_b '00000000-0000-0000-0000-00000000000b'

-- ── Datos de prueba (se insertan con privilegios de servicio) ───────────────
insert into public.teachers (id, email, name)
values (:'docente_a', 'a@aera.test', 'Docente A'),
       (:'docente_b', 'b@aera.test', 'Docente B')
on conflict do nothing;

insert into public.activities (id, teacher_id, title)
values ('00000000-0000-0000-0000-0000000000a1', :'docente_a', 'Actividad de A')
on conflict do nothing;

insert into public.questions (id, activity_id, number, text, points)
values ('00000000-0000-0000-0000-0000000000a2',
        '00000000-0000-0000-0000-0000000000a1', 1, 'Pregunta de A', 5)
on conflict do nothing;

insert into public.students (id, teacher_id, name, identifier)
values ('00000000-0000-0000-0000-0000000000a3', :'docente_a', 'Estudiante de A', 'A-001')
on conflict do nothing;

insert into public.submissions (id, activity_id, student_id, file_url)
values ('00000000-0000-0000-0000-0000000000a4',
        '00000000-0000-0000-0000-0000000000a1',
        '00000000-0000-0000-0000-0000000000a3',
        'a/act/hoja.jpg')
on conflict do nothing;

insert into public.answers (id, submission_id, question_id, extracted_text)
values ('00000000-0000-0000-0000-0000000000a5',
        '00000000-0000-0000-0000-0000000000a4',
        '00000000-0000-0000-0000-0000000000a2',
        'Respuesta')
on conflict do nothing;

insert into public.grading_results (id, answer_id, ai_score, ai_feedback)
values ('00000000-0000-0000-0000-0000000000a6',
        '00000000-0000-0000-0000-0000000000a5', 4, 'Feedback')
on conflict do nothing;

-- ── 1. El docente dueño ve sus filas ───────────────────────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select 'activities visibles para A (esperado 1)'      as caso, count(*) from public.activities;
select 'questions visibles para A (esperado 1)'       as caso, count(*) from public.questions;
select 'students visibles para A (esperado 1)'        as caso, count(*) from public.students;
select 'submissions visibles para A (esperado 1)'     as caso, count(*) from public.submissions;
select 'answers visibles para A (esperado 1)'         as caso, count(*) from public.answers;
select 'grading_results visibles para A (esperado 1)' as caso, count(*) from public.grading_results;

-- ── 2. El otro docente NO ve nada ──────────────────────────────────────────
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';

select 'activities visibles para B (esperado 0)'      as caso, count(*) from public.activities;
select 'questions visibles para B (esperado 0)'       as caso, count(*) from public.questions;
select 'students visibles para B (esperado 0)'        as caso, count(*) from public.students;
select 'submissions visibles para B (esperado 0)'     as caso, count(*) from public.submissions;
select 'answers visibles para B (esperado 0)'         as caso, count(*) from public.answers;
select 'grading_results visibles para B (esperado 0)' as caso, count(*) from public.grading_results;

-- ── 3. B tampoco puede escribir sobre datos de A (debe fallar) ─────────────
-- update public.activities set title = 'secuestrada'
--   where id = '00000000-0000-0000-0000-0000000000a1';
-- Resultado esperado: 0 filas afectadas (no error).

reset role;
