-- ============================================================================
-- AERA — esquema inicial
-- Fuente: docs/PROJECT_CONTEXT.md §22 (modelo de datos), §23 (relaciones),
--         §26 (procesamiento), §29 (RLS explícita por tabla).
--
-- Esta migración todavía NO se ha aplicado a un proyecto de Supabase: queda lista
-- para correr con `supabase db push` o con el conector de Supabase cuando se cree el
-- proyecto. La capa de acceso del front (lib/data/provider.tsx) ya expone exactamente
-- estas entidades, así que la conexión es un reemplazo de implementación, no un rediseño.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── Tipos ───────────────────────────────────────────────────────────────────
create type question_type as enum (
  'multiple_choice',
  'short_answer',
  'open_ended',
  'long_answer'
);

-- §20 — ciclo de vida de una respuesta.
create type answer_status as enum (
  'PENDING',
  'PROCESSING',
  'AI_REVIEWED',
  'TEACHER_REVIEW',
  'FINAL'
);

-- Estado del documento dentro del pipeline (§26).
create type processing_status as enum ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- ── Tablas ──────────────────────────────────────────────────────────────────

-- Perfil del docente, 1:1 con auth.users (Supabase Auth).
create table public.teachers (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  title text not null,
  subject text not null default '',
  description text not null default '',
  max_score numeric(6, 2) not null default 20,
  -- §10 lista "fecha" en el formulario de crear actividad; §22 no la incluía.
  application_date date,
  processing_status processing_status not null default 'PENDING',
  -- Documentos originales de la actividad (§11). Se conservan siempre.
  source_files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  number integer not null,
  type question_type not null default 'short_answer',
  text text not null default '',
  options jsonb not null default '[]'::jsonb,
  expected_answer text not null default '',
  points numeric(6, 2) not null default 1,
  -- §16 — criterios estructurados: [{ id, description, points }]
  rubric jsonb not null default '[]'::jsonb,
  -- §28 — 0..1. Bajo 0.75 se marca para revisión prioritaria en el editor (§15).
  confidence numeric(4, 3) not null default 1 check (confidence >= 0 and confidence <= 1),
  -- Necesario para el patrón de §8.9 en el editor: lo extraído es sugerencia hasta que
  -- el docente lo confirma.
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, number)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  name text not null,
  identifier text not null default '',
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  -- Nulo mientras el docente no asigne el archivo a un estudiante (§11, carga en lote).
  student_id uuid references public.students (id) on delete set null,
  file_url text not null,
  file_name text not null default '',
  page_count integer not null default 1,
  status processing_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  extracted_text text not null default '',
  confidence numeric(4, 3) not null default 1 check (confidence >= 0 and confidence <= 1),
  -- §22 — zona del documento original de la que salió la extracción (bounding box).
  source_region text,
  created_at timestamptz not null default now(),
  unique (submission_id, question_id)
);

create table public.grading_results (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.answers (id) on delete cascade unique,
  ai_score numeric(6, 2) not null default 0,
  -- §19 — la nota final siempre pertenece al docente; null = todavía no confirmó.
  teacher_score numeric(6, 2),
  ai_feedback text not null default '',
  teacher_feedback text,
  -- §16 — [{ criterion_id, ai_points, teacher_points, comment }]
  criterion_scores jsonb not null default '[]'::jsonb,
  status answer_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Índices ─────────────────────────────────────────────────────────────────
create index on public.activities (teacher_id);
create index on public.questions (activity_id);
create index on public.students (teacher_id);
create index on public.submissions (activity_id);
create index on public.submissions (student_id);
create index on public.answers (submission_id);
create index on public.answers (question_id);
create index on public.grading_results (answer_id);

-- ── updated_at automático ───────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger activities_touch before update on public.activities
  for each row execute function public.touch_updated_at();
create trigger questions_touch before update on public.questions
  for each row execute function public.touch_updated_at();
create trigger grading_results_touch before update on public.grading_results
  for each row execute function public.touch_updated_at();

-- ── §22 — estado DERIVADO de la actividad ───────────────────────────────────
-- No es un campo editable: se calcula. borrador / en_correccion / completada.
create or replace function public.activity_status(p_activity_id uuid)
returns text
language sql
stable
as $$
  select case
    when (select count(*) from public.questions q where q.activity_id = p_activity_id) = 0
      then 'borrador'
    when not exists (
      select 1
      from public.grading_results g
      join public.answers a on a.id = g.answer_id
      join public.submissions s on s.id = a.submission_id
      where s.activity_id = p_activity_id
    ) then 'en_correccion'
    when exists (
      select 1
      from public.grading_results g
      join public.answers a on a.id = g.answer_id
      join public.submissions s on s.id = a.submission_id
      where s.activity_id = p_activity_id and g.status <> 'FINAL'
    ) then 'en_correccion'
    else 'completada'
  end;
$$;

create or replace view public.activities_with_status
with (security_invoker = true) as
select
  a.*,
  public.activity_status(a.id) as status,
  (select count(*) from public.questions q where q.activity_id = a.id) as question_count,
  (select count(distinct s.student_id) from public.submissions s
     where s.activity_id = a.id and s.student_id is not null) as student_count
from public.activities a;

-- ============================================================================
-- §29 — ROW LEVEL SECURITY
-- Cada tabla lleva su policy EXPLÍCITA. Nada se hereda por join implícito:
-- con RLS un join mal escrito no da error, devuelve cero filas en silencio.
-- Probar una por una (ver supabase/tests/rls.sql).
-- ============================================================================

alter table public.teachers        enable row level security;
alter table public.activities      enable row level security;
alter table public.questions       enable row level security;
alter table public.students        enable row level security;
alter table public.submissions     enable row level security;
alter table public.answers         enable row level security;
alter table public.grading_results enable row level security;

-- teachers: cada docente ve y edita solo su propio perfil.
create policy teachers_select on public.teachers
  for select using (id = auth.uid());
create policy teachers_insert on public.teachers
  for insert with check (id = auth.uid());
create policy teachers_update on public.teachers
  for update using (id = auth.uid()) with check (id = auth.uid());

-- activities: teacher_id directo.
create policy activities_select on public.activities
  for select using (teacher_id = auth.uid());
create policy activities_insert on public.activities
  for insert with check (teacher_id = auth.uid());
create policy activities_update on public.activities
  for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy activities_delete on public.activities
  for delete using (teacher_id = auth.uid());

-- students: teacher_id directo.
create policy students_select on public.students
  for select using (teacher_id = auth.uid());
create policy students_insert on public.students
  for insert with check (teacher_id = auth.uid());
create policy students_update on public.students
  for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy students_delete on public.students
  for delete using (teacher_id = auth.uid());

-- questions: hereda de activity (join explícito activity_id → teacher_id).
create policy questions_select on public.questions
  for select using (
    exists (select 1 from public.activities a
            where a.id = questions.activity_id and a.teacher_id = auth.uid())
  );
create policy questions_insert on public.questions
  for insert with check (
    exists (select 1 from public.activities a
            where a.id = questions.activity_id and a.teacher_id = auth.uid())
  );
create policy questions_update on public.questions
  for update using (
    exists (select 1 from public.activities a
            where a.id = questions.activity_id and a.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from public.activities a
            where a.id = questions.activity_id and a.teacher_id = auth.uid())
  );
create policy questions_delete on public.questions
  for delete using (
    exists (select 1 from public.activities a
            where a.id = questions.activity_id and a.teacher_id = auth.uid())
  );

-- submissions: hereda de activity.
create policy submissions_select on public.submissions
  for select using (
    exists (select 1 from public.activities a
            where a.id = submissions.activity_id and a.teacher_id = auth.uid())
  );
create policy submissions_insert on public.submissions
  for insert with check (
    exists (select 1 from public.activities a
            where a.id = submissions.activity_id and a.teacher_id = auth.uid())
  );
create policy submissions_update on public.submissions
  for update using (
    exists (select 1 from public.activities a
            where a.id = submissions.activity_id and a.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from public.activities a
            where a.id = submissions.activity_id and a.teacher_id = auth.uid())
  );
create policy submissions_delete on public.submissions
  for delete using (
    exists (select 1 from public.activities a
            where a.id = submissions.activity_id and a.teacher_id = auth.uid())
  );

-- answers: hereda de submission → activity (dos saltos, escritos a mano).
create policy answers_select on public.answers
  for select using (
    exists (select 1 from public.submissions s
            join public.activities a on a.id = s.activity_id
            where s.id = answers.submission_id and a.teacher_id = auth.uid())
  );
create policy answers_insert on public.answers
  for insert with check (
    exists (select 1 from public.submissions s
            join public.activities a on a.id = s.activity_id
            where s.id = answers.submission_id and a.teacher_id = auth.uid())
  );
create policy answers_update on public.answers
  for update using (
    exists (select 1 from public.submissions s
            join public.activities a on a.id = s.activity_id
            where s.id = answers.submission_id and a.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from public.submissions s
            join public.activities a on a.id = s.activity_id
            where s.id = answers.submission_id and a.teacher_id = auth.uid())
  );
create policy answers_delete on public.answers
  for delete using (
    exists (select 1 from public.submissions s
            join public.activities a on a.id = s.activity_id
            where s.id = answers.submission_id and a.teacher_id = auth.uid())
  );

-- grading_results: hereda de answer → submission → activity (tres saltos).
create policy grading_select on public.grading_results
  for select using (
    exists (select 1 from public.answers ans
            join public.submissions s on s.id = ans.submission_id
            join public.activities a on a.id = s.activity_id
            where ans.id = grading_results.answer_id and a.teacher_id = auth.uid())
  );
create policy grading_insert on public.grading_results
  for insert with check (
    exists (select 1 from public.answers ans
            join public.submissions s on s.id = ans.submission_id
            join public.activities a on a.id = s.activity_id
            where ans.id = grading_results.answer_id and a.teacher_id = auth.uid())
  );
create policy grading_update on public.grading_results
  for update using (
    exists (select 1 from public.answers ans
            join public.submissions s on s.id = ans.submission_id
            join public.activities a on a.id = s.activity_id
            where ans.id = grading_results.answer_id and a.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from public.answers ans
            join public.submissions s on s.id = ans.submission_id
            join public.activities a on a.id = s.activity_id
            where ans.id = grading_results.answer_id and a.teacher_id = auth.uid())
  );
create policy grading_delete on public.grading_results
  for delete using (
    exists (select 1 from public.answers ans
            join public.submissions s on s.id = ans.submission_id
            join public.activities a on a.id = s.activity_id
            where ans.id = grading_results.answer_id and a.teacher_id = auth.uid())
  );

-- ── Perfil automático al registrarse ────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.teachers (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Realtime (§26) ──────────────────────────────────────────────────────────
-- El front se suscribe al `status` de submissions y activities para reflejar el avance
-- del pipeline sin polling.
alter publication supabase_realtime add table public.submissions;
alter publication supabase_realtime add table public.activities;
