"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Activity,
  ActivityStatus,
  Answer,
  AnswerStatus,
  Criterion,
  GradingResult,
  Question,
  Student,
  Submission,
  Teacher,
  VoiceNote,
} from "@/lib/types";
import { CONFIDENCE_THRESHOLD } from "@/lib/types";
import {
  type Database,
  STORAGE_KEY,
  emptyDatabase,
  seedDatabase,
  uid,
} from "@/lib/data/db";
import { deriveActivityStatus } from "@/lib/data/derive";
import {
  ACTIVITY_PIPELINE_STEPS,
  SUBMISSION_PIPELINE_STEPS,
  extractQuestions,
  gradeSubmission,
} from "@/lib/data/mock-ai";

/**
 * CAPA DE ACCESO A DATOS — única puerta entre la UI y el origen de los datos
 * (CLAUDE.md: "Ningún componente decide de dónde vienen los datos").
 *
 * Hoy resuelve contra una base en memoria persistida en localStorage.
 * Mañana, cada función de aquí pasa a ser una consulta a Supabase (o una llamada a una
 * Edge Function) sin que ningún componente cambie: la firma y la forma de la respuesta
 * son las mismas. Los `await sleep(...)` están para que la UI ejercite sus estados de
 * carga como lo hará contra la red real.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();

/** Trabajo de procesamiento asíncrono (§26). En el backend real, el avance llega por
 *  Supabase Realtime sobre el `status` de Submission/Activity; aquí lo emula un timer. */
export interface ProcessingJob {
  id: string;
  targetId: string;
  steps: string[];
  current: number;
  status: "running" | "done" | "error";
  error?: string;
}

export interface ActivityWithStats extends Activity {
  status: ActivityStatus;
  questionCount: number;
  studentCount: number;
  correctedCount: number;
  lowConfidenceCount: number;
}

export interface SubmissionWithMeta extends Submission {
  student: Student | null;
  answerStatuses: AnswerStatus[];
  aiTotal: number;
  finalTotal: number | null;
  isGraded: boolean;
  isFinal: boolean;
}

export interface GradingItem {
  question: Question;
  answer: Answer | null;
  grading: GradingResult | null;
}

export interface ResultRow {
  student: Student;
  submission: Submission | null;
  finalTotal: number | null;
  aiTotal: number;
  maxTotal: number;
  status: AnswerStatus | "SIN_ENTREGA";
}

interface DataContextValue {
  ready: boolean;
  teacher: Teacher | null;
  /* sesión */
  signIn: (email: string, password: string) => Promise<Teacher>;
  signUp: (name: string, email: string, password: string) => Promise<Teacher>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  /* actividades */
  activities: ActivityWithStats[];
  getActivity: (id: string) => ActivityWithStats | null;
  createActivity: (input: {
    title: string;
    subject: string;
    description: string;
    max_score: number;
    application_date?: string;
  }) => Promise<Activity>;
  updateActivity: (id: string, patch: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  /* documentos y pipeline */
  attachSourceFiles: (
    activityId: string,
    files: { name: string; size: number; type: string; pages: number }[],
  ) => Promise<void>;
  startActivityProcessing: (activityId: string) => void;
  startSubmissionProcessing: (submissionId: string) => void;
  jobFor: (targetId: string) => ProcessingJob | null;
  /* preguntas */
  questionsOf: (activityId: string) => Question[];
  addQuestion: (activityId: string) => Promise<Question>;
  updateQuestion: (id: string, patch: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  confirmQuestion: (id: string) => Promise<void>;
  confirmAllQuestions: (activityId: string) => Promise<void>;
  addCriterion: (questionId: string) => Promise<void>;
  updateCriterion: (
    questionId: string,
    criterionId: string,
    patch: Partial<Criterion>,
  ) => Promise<void>;
  deleteCriterion: (questionId: string, criterionId: string) => Promise<void>;
  /* estudiantes */
  students: Student[];
  createStudent: (name: string, identifier: string) => Promise<Student>;
  createStudentsBulk: (raw: string) => Promise<number>;
  deleteStudent: (id: string) => Promise<void>;
  /* entregas */
  submissionsOf: (activityId: string) => SubmissionWithMeta[];
  createSubmissions: (
    activityId: string,
    files: { name: string; size: number; type: string; pages: number }[],
  ) => Promise<Submission[]>;
  assignSubmissionStudent: (submissionId: string, studentId: string) => Promise<void>;
  deleteSubmission: (id: string) => Promise<void>;
  gradingItemsOf: (submissionId: string) => GradingItem[];
  /* retroalimentación de cierre (§8.7) */
  saveSubmissionFeedback: (submissionId: string, feedback: string) => Promise<void>;
  saveVoiceNote: (submissionId: string, note: VoiceNote) => Promise<void>;
  deleteVoiceNote: (submissionId: string) => Promise<void>;
  /* corrección */
  setTeacherScore: (gradingId: string, score: number) => Promise<void>;
  setTeacherFeedback: (gradingId: string, feedback: string) => Promise<void>;
  approveGrading: (gradingId: string) => Promise<void>;
  approveAllGrading: (submissionId: string) => Promise<void>;
  setCriterionTeacherPoints: (
    gradingId: string,
    criterionId: string,
    points: number,
  ) => Promise<void>;
  /* resultados */
  resultsOf: (activityId: string) => ResultRow[];
  /* utilidades de la maqueta */
  resetDemoData: () => void;
  clearAllData: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Database>(() => emptyDatabase());
  const [ready, setReady] = useState(false);
  const [jobs, setJobs] = useState<Record<string, ProcessingJob>>({});
  const timers = useRef<number[]>([]);

  // Hidratación desde localStorage (equivalente al primer fetch contra Supabase).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // Hidratación desde un sistema externo (localStorage). Con el backend real esto es
      // el primer fetch a Supabase; el set en el efecto es intencional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDb(raw ? (JSON.parse(raw) as Database) : seedDatabase());
    } catch {
      setDb(seedDatabase());
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      /* almacenamiento lleno o no disponible: la maqueta sigue funcionando en memoria */
    }
  }, [db, ready]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const teacher = useMemo(
    () => db.teachers.find((t) => t.id === db.session.teacher_id) ?? null,
    [db.teachers, db.session.teacher_id],
  );

  /* ── sesión ─────────────────────────────────────────────────────────────── */

  const signIn = useCallback<DataContextValue["signIn"]>(
    async (email) => {
      await sleep(600);
      const found =
        db.teachers.find((t) => t.email.toLowerCase() === email.toLowerCase()) ??
        db.teachers[0];
      if (!found) throw new Error("No encontramos una cuenta con ese correo.");
      setDb((prev) => ({ ...prev, session: { teacher_id: found.id } }));
      return found;
    },
    [db.teachers],
  );

  const signUp = useCallback<DataContextValue["signUp"]>(async (name, email) => {
    await sleep(700);
    const created: Teacher = {
      id: uid("t"),
      name,
      email,
      created_at: now(),
    };
    setDb((prev) => ({
      ...prev,
      teachers: [...prev.teachers, created],
      session: { teacher_id: created.id },
    }));
    return created;
  }, []);

  const signOut = useCallback(async () => {
    await sleep(200);
    setDb((prev) => ({ ...prev, session: { teacher_id: null } }));
  }, []);

  const requestPasswordReset = useCallback(async () => {
    await sleep(700);
  }, []);

  /* ── actividades ────────────────────────────────────────────────────────── */

  const statsFor = useCallback(
    (activity: Activity): ActivityWithStats => {
      const questions = db.questions.filter((q) => q.activity_id === activity.id);
      const subs = db.submissions.filter((s) => s.activity_id === activity.id);
      const subIds = new Set(subs.map((s) => s.id));
      const answers = db.answers.filter((a) => subIds.has(a.submission_id));
      const answerIds = new Set(answers.map((a) => a.id));
      const grades = db.grading_results.filter((g) => answerIds.has(g.answer_id));

      const correctedCount = subs.filter((s) => {
        const subAnswerIds = new Set(
          db.answers.filter((a) => a.submission_id === s.id).map((a) => a.id),
        );
        const g = db.grading_results.filter((x) => subAnswerIds.has(x.answer_id));
        return g.length > 0 && g.every((x) => x.status === "FINAL");
      }).length;

      return {
        ...activity,
        status: deriveActivityStatus({
          questionCount: questions.length,
          answerStatuses: grades.map((g) => g.status),
        }),
        questionCount: questions.length,
        studentCount: new Set(subs.map((s) => s.student_id).filter(Boolean)).size,
        correctedCount,
        lowConfidenceCount: questions.filter((q) => q.confidence < CONFIDENCE_THRESHOLD)
          .length,
      };
    },
    [db.questions, db.submissions, db.answers, db.grading_results],
  );

  const activities = useMemo(
    () =>
      db.activities
        .filter((a) => !teacher || a.teacher_id === teacher.id)
        .map(statsFor)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [db.activities, teacher, statsFor],
  );

  const getActivity = useCallback<DataContextValue["getActivity"]>(
    (id) => {
      const found = db.activities.find((a) => a.id === id);
      return found ? statsFor(found) : null;
    },
    [db.activities, statsFor],
  );

  const createActivity = useCallback<DataContextValue["createActivity"]>(
    async (input) => {
      await sleep(500);
      const activity: Activity = {
        id: uid("act"),
        teacher_id: db.session.teacher_id ?? db.teachers[0]?.id ?? "t_1",
        title: input.title,
        subject: input.subject,
        description: input.description,
        max_score: input.max_score,
        application_date: input.application_date,
        created_at: now(),
        updated_at: now(),
        processing_status: "PENDING",
        source_files: [],
      };
      setDb((prev) => ({ ...prev, activities: [...prev.activities, activity] }));
      return activity;
    },
    [db.session.teacher_id, db.teachers],
  );

  const updateActivity = useCallback<DataContextValue["updateActivity"]>(
    async (id, patch) => {
      setDb((prev) => ({
        ...prev,
        activities: prev.activities.map((a) =>
          a.id === id ? { ...a, ...patch, updated_at: now() } : a,
        ),
      }));
    },
    [],
  );

  const deleteActivity = useCallback<DataContextValue["deleteActivity"]>(async (id) => {
    await sleep(300);
    setDb((prev) => {
      const subIds = new Set(
        prev.submissions.filter((s) => s.activity_id === id).map((s) => s.id),
      );
      const ansIds = new Set(
        prev.answers.filter((a) => subIds.has(a.submission_id)).map((a) => a.id),
      );
      return {
        ...prev,
        activities: prev.activities.filter((a) => a.id !== id),
        questions: prev.questions.filter((q) => q.activity_id !== id),
        submissions: prev.submissions.filter((s) => !subIds.has(s.id)),
        answers: prev.answers.filter((a) => !subIds.has(a.submission_id)),
        grading_results: prev.grading_results.filter((g) => !ansIds.has(g.answer_id)),
      };
    });
  }, []);

  /* ── documentos y pipeline (§26) ────────────────────────────────────────── */

  const attachSourceFiles = useCallback<DataContextValue["attachSourceFiles"]>(
    async (activityId, files) => {
      await sleep(400);
      setDb((prev) => ({
        ...prev,
        activities: prev.activities.map((a) =>
          a.id === activityId
            ? {
                ...a,
                updated_at: now(),
                source_files: [
                  ...a.source_files,
                  ...files.map((f) => ({
                    id: uid("file"),
                    file_name: f.name,
                    file_url: `/mock/${f.name}`,
                    mime_type: f.type,
                    size_bytes: f.size,
                    page_count: f.pages,
                  })),
                ],
              }
            : a,
        ),
      }));
    },
    [],
  );

  const runJob = useCallback(
    (targetId: string, steps: string[], onDone: () => void) => {
      const job: ProcessingJob = {
        id: uid("job"),
        targetId,
        steps,
        current: 0,
        status: "running",
      };
      setJobs((prev) => ({ ...prev, [targetId]: job }));

      steps.forEach((_, i) => {
        const t = window.setTimeout(
          () => {
            setJobs((prev) => {
              const j = prev[targetId];
              if (!j) return prev;
              return { ...prev, [targetId]: { ...j, current: i + 1 } };
            });
            if (i === steps.length - 1) {
              onDone();
              setJobs((prev) => {
                const j = prev[targetId];
                if (!j) return prev;
                return { ...prev, [targetId]: { ...j, status: "done" } };
              });
            }
          },
          (i + 1) * 1100,
        );
        timers.current.push(t);
      });
    },
    [],
  );

  const startActivityProcessing = useCallback<
    DataContextValue["startActivityProcessing"]
  >(
    (activityId) => {
      setDb((prev) => ({
        ...prev,
        activities: prev.activities.map((a) =>
          a.id === activityId ? { ...a, processing_status: "PROCESSING" } : a,
        ),
      }));
      runJob(activityId, ACTIVITY_PIPELINE_STEPS, () => {
        setDb((prev) => {
          const existing = prev.questions.filter((q) => q.activity_id === activityId);
          const extracted = existing.length ? [] : extractQuestions(activityId);
          return {
            ...prev,
            questions: [...prev.questions, ...extracted],
            activities: prev.activities.map((a) =>
              a.id === activityId
                ? { ...a, processing_status: "READY", updated_at: now() }
                : a,
            ),
          };
        });
      });
    },
    [runJob],
  );

  const startSubmissionProcessing = useCallback<
    DataContextValue["startSubmissionProcessing"]
  >(
    (submissionId) => {
      setDb((prev) => ({
        ...prev,
        submissions: prev.submissions.map((s) =>
          s.id === submissionId ? { ...s, status: "PROCESSING" } : s,
        ),
      }));
      runJob(submissionId, SUBMISSION_PIPELINE_STEPS, () => {
        setDb((prev) => {
          const submission = prev.submissions.find((s) => s.id === submissionId);
          if (!submission) return prev;
          const questions = prev.questions
            .filter((q) => q.activity_id === submission.activity_id)
            .sort((a, b) => a.number - b.number);
          const already = prev.answers.some((a) => a.submission_id === submissionId);
          const { answers, grading } = already
            ? { answers: [], grading: [] }
            : gradeSubmission(submission, questions);
          return {
            ...prev,
            answers: [...prev.answers, ...answers],
            grading_results: [...prev.grading_results, ...grading],
            submissions: prev.submissions.map((s) =>
              s.id === submissionId
                ? { ...s, status: "READY", processed_at: now() }
                : s,
            ),
          };
        });
      });
    },
    [runJob],
  );

  const jobFor = useCallback<DataContextValue["jobFor"]>(
    (targetId) => jobs[targetId] ?? null,
    [jobs],
  );

  /* ── preguntas ──────────────────────────────────────────────────────────── */

  const questionsOf = useCallback<DataContextValue["questionsOf"]>(
    (activityId) =>
      db.questions
        .filter((q) => q.activity_id === activityId)
        .sort((a, b) => a.number - b.number),
    [db.questions],
  );

  const addQuestion = useCallback<DataContextValue["addQuestion"]>(
    async (activityId) => {
      const siblings = db.questions.filter((q) => q.activity_id === activityId);
      const question: Question = {
        id: uid("q"),
        activity_id: activityId,
        number: siblings.length + 1,
        type: "short_answer",
        text: "",
        options: [],
        expected_answer: "",
        points: 1,
        rubric: [],
        confidence: 1, // creada a mano por el docente: no es una extracción de IA
        confirmed: true,
        created_at: now(),
        updated_at: now(),
      };
      setDb((prev) => ({ ...prev, questions: [...prev.questions, question] }));
      return question;
    },
    [db.questions],
  );

  const updateQuestion = useCallback<DataContextValue["updateQuestion"]>(
    async (id, patch) => {
      setDb((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === id ? { ...q, ...patch, updated_at: now() } : q,
        ),
      }));
    },
    [],
  );

  const deleteQuestion = useCallback<DataContextValue["deleteQuestion"]>(async (id) => {
    setDb((prev) => {
      const target = prev.questions.find((q) => q.id === id);
      if (!target) return prev;
      const remaining = prev.questions.filter((q) => q.id !== id);
      // Renumerar las preguntas de la actividad para no dejar huecos en la numeración.
      const renumbered = remaining
        .filter((q) => q.activity_id === target.activity_id)
        .sort((a, b) => a.number - b.number)
        .map((q, i) => ({ ...q, number: i + 1 }));
      const renumberedById = new Map(renumbered.map((q) => [q.id, q]));
      return {
        ...prev,
        questions: remaining.map((q) => renumberedById.get(q.id) ?? q),
        answers: prev.answers.filter((a) => a.question_id !== id),
      };
    });
  }, []);

  const confirmQuestion = useCallback<DataContextValue["confirmQuestion"]>(
    async (id) => {
      setDb((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === id ? { ...q, confirmed: true, updated_at: now() } : q,
        ),
      }));
    },
    [],
  );

  const confirmAllQuestions = useCallback<DataContextValue["confirmAllQuestions"]>(
    async (activityId) => {
      await sleep(300);
      setDb((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.activity_id === activityId ? { ...q, confirmed: true, updated_at: now() } : q,
        ),
      }));
    },
    [],
  );

  const addCriterion = useCallback<DataContextValue["addCriterion"]>(
    async (questionId) => {
      setDb((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                rubric: [
                  ...q.rubric,
                  { id: uid("c"), description: "", points: 1 },
                ],
                updated_at: now(),
              }
            : q,
        ),
      }));
    },
    [],
  );

  const updateCriterion = useCallback<DataContextValue["updateCriterion"]>(
    async (questionId, criterionId, patch) => {
      setDb((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                rubric: q.rubric.map((c) =>
                  c.id === criterionId ? { ...c, ...patch } : c,
                ),
                updated_at: now(),
              }
            : q,
        ),
      }));
    },
    [],
  );

  const deleteCriterion = useCallback<DataContextValue["deleteCriterion"]>(
    async (questionId, criterionId) => {
      setDb((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                rubric: q.rubric.filter((c) => c.id !== criterionId),
                updated_at: now(),
              }
            : q,
        ),
      }));
    },
    [],
  );

  /* ── estudiantes ────────────────────────────────────────────────────────── */

  const students = useMemo(
    () =>
      db.students
        .filter((s) => !teacher || s.teacher_id === teacher.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [db.students, teacher],
  );

  const createStudent = useCallback<DataContextValue["createStudent"]>(
    async (name, identifier) => {
      const student: Student = {
        id: uid("st"),
        teacher_id: db.session.teacher_id ?? db.teachers[0]?.id ?? "t_1",
        name,
        identifier,
        created_at: now(),
      };
      setDb((prev) => ({ ...prev, students: [...prev.students, student] }));
      return student;
    },
    [db.session.teacher_id, db.teachers],
  );

  const createStudentsBulk = useCallback<DataContextValue["createStudentsBulk"]>(
    async (raw) => {
      await sleep(400);
      const teacherId = db.session.teacher_id ?? db.teachers[0]?.id ?? "t_1";
      const rows = raw
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line, i) => {
          const [name, identifier] = line.split(/[,;\t]/).map((p) => p?.trim());
          return {
            id: uid("st"),
            teacher_id: teacherId,
            name: name || `Estudiante ${i + 1}`,
            identifier: identifier || `A-${String(i + 1).padStart(3, "0")}`,
            created_at: now(),
          } satisfies Student;
        });
      setDb((prev) => ({ ...prev, students: [...prev.students, ...rows] }));
      return rows.length;
    },
    [db.session.teacher_id, db.teachers],
  );

  const deleteStudent = useCallback<DataContextValue["deleteStudent"]>(async (id) => {
    setDb((prev) => ({ ...prev, students: prev.students.filter((s) => s.id !== id) }));
  }, []);

  /* ── entregas ───────────────────────────────────────────────────────────── */

  const submissionsOf = useCallback<DataContextValue["submissionsOf"]>(
    (activityId) =>
      db.submissions
        .filter((s) => s.activity_id === activityId)
        .map((s) => {
          const answers = db.answers.filter((a) => a.submission_id === s.id);
          const ansIds = new Set(answers.map((a) => a.id));
          const grades = db.grading_results.filter((g) => ansIds.has(g.answer_id));
          const aiTotal = grades.reduce((acc, g) => acc + g.ai_score, 0);
          const finalTotal = grades.length
            ? grades.reduce((acc, g) => acc + (g.teacher_score ?? g.ai_score), 0)
            : null;
          return {
            ...s,
            student: db.students.find((st) => st.id === s.student_id) ?? null,
            answerStatuses: grades.map((g) => g.status),
            aiTotal,
            finalTotal,
            isGraded: grades.length > 0,
            isFinal: grades.length > 0 && grades.every((g) => g.status === "FINAL"),
          };
        })
        .sort((a, b) => (a.student?.name ?? "").localeCompare(b.student?.name ?? "")),
    [db.submissions, db.answers, db.grading_results, db.students],
  );

  const createSubmissions = useCallback<DataContextValue["createSubmissions"]>(
    async (activityId, files) => {
      await sleep(500);
      const created: Submission[] = files.map((f) => ({
        id: uid("sub"),
        activity_id: activityId,
        student_id: "", // §11 — la asignación archivo→estudiante es manual asistida
        file_url: `/mock/${f.name}`,
        file_name: f.name,
        page_count: f.pages,
        status: "PENDING",
        created_at: now(),
        processed_at: null,
        teacher_feedback: null,
        voice_note: null,
      }));
      setDb((prev) => ({ ...prev, submissions: [...prev.submissions, ...created] }));
      return created;
    },
    [],
  );

  const assignSubmissionStudent = useCallback<
    DataContextValue["assignSubmissionStudent"]
  >(async (submissionId, studentId) => {
    setDb((prev) => ({
      ...prev,
      submissions: prev.submissions.map((s) =>
        s.id === submissionId ? { ...s, student_id: studentId } : s,
      ),
    }));
  }, []);

  const deleteSubmission = useCallback<DataContextValue["deleteSubmission"]>(
    async (id) => {
      setDb((prev) => {
        const ansIds = new Set(
          prev.answers.filter((a) => a.submission_id === id).map((a) => a.id),
        );
        return {
          ...prev,
          submissions: prev.submissions.filter((s) => s.id !== id),
          answers: prev.answers.filter((a) => a.submission_id !== id),
          grading_results: prev.grading_results.filter((g) => !ansIds.has(g.answer_id)),
        };
      });
    },
    [],
  );

  const gradingItemsOf = useCallback<DataContextValue["gradingItemsOf"]>(
    (submissionId) => {
      const submission = db.submissions.find((s) => s.id === submissionId);
      if (!submission) return [];
      return db.questions
        .filter((q) => q.activity_id === submission.activity_id)
        .sort((a, b) => a.number - b.number)
        .map((question) => {
          const answer =
            db.answers.find(
              (a) => a.submission_id === submissionId && a.question_id === question.id,
            ) ?? null;
          const grading = answer
            ? db.grading_results.find((g) => g.answer_id === answer.id) ?? null
            : null;
          return { question, answer, grading };
        });
    },
    [db.submissions, db.questions, db.answers, db.grading_results],
  );

  /* ── retroalimentación de cierre (§8.7) ─────────────────────────────────── */

  const patchSubmission = (
    prev: Database,
    submissionId: string,
    patch: Partial<Submission>,
  ): Database => ({
    ...prev,
    submissions: prev.submissions.map((s) =>
      s.id === submissionId ? { ...s, ...patch } : s,
    ),
  });

  const saveSubmissionFeedback = useCallback<
    DataContextValue["saveSubmissionFeedback"]
  >(async (submissionId, feedback) => {
    await sleep(250);
    setDb((prev) =>
      patchSubmission(prev, submissionId, {
        teacher_feedback: feedback.trim() ? feedback : null,
      }),
    );
  }, []);

  const saveVoiceNote = useCallback<DataContextValue["saveVoiceNote"]>(
    async (submissionId, note) => {
      setDb((prev) => patchSubmission(prev, submissionId, { voice_note: note }));
    },
    [],
  );

  const deleteVoiceNote = useCallback<DataContextValue["deleteVoiceNote"]>(
    async (submissionId) => {
      setDb((prev) => {
        const current = prev.submissions.find((s) => s.id === submissionId);
        if (current?.voice_note?.object_url?.startsWith("blob:")) {
          URL.revokeObjectURL(current.voice_note.object_url);
        }
        return patchSubmission(prev, submissionId, { voice_note: null });
      });
    },
    [],
  );

  /* ── corrección (§18, §19) ──────────────────────────────────────────────── */

  const patchGrading = (
    prev: Database,
    gradingId: string,
    patch: Partial<GradingResult>,
  ): Database => ({
    ...prev,
    grading_results: prev.grading_results.map((g) =>
      g.id === gradingId ? { ...g, ...patch, updated_at: now() } : g,
    ),
  });

  const setTeacherScore = useCallback<DataContextValue["setTeacherScore"]>(
    async (gradingId, score) => {
      setDb((prev) =>
        patchGrading(prev, gradingId, {
          teacher_score: score,
          status: "TEACHER_REVIEW",
        }),
      );
    },
    [],
  );

  const setTeacherFeedback = useCallback<DataContextValue["setTeacherFeedback"]>(
    async (gradingId, feedback) => {
      setDb((prev) =>
        patchGrading(prev, gradingId, {
          teacher_feedback: feedback,
          status: "TEACHER_REVIEW",
        }),
      );
    },
    [],
  );

  const approveGrading = useCallback<DataContextValue["approveGrading"]>(
    async (gradingId) => {
      setDb((prev) => {
        const g = prev.grading_results.find((x) => x.id === gradingId);
        if (!g) return prev;
        return patchGrading(prev, gradingId, {
          teacher_score: g.teacher_score ?? g.ai_score,
          status: "FINAL",
        });
      });
    },
    [],
  );

  const approveAllGrading = useCallback<DataContextValue["approveAllGrading"]>(
    async (submissionId) => {
      await sleep(400);
      setDb((prev) => {
        const ansIds = new Set(
          prev.answers.filter((a) => a.submission_id === submissionId).map((a) => a.id),
        );
        return {
          ...prev,
          grading_results: prev.grading_results.map((g) =>
            ansIds.has(g.answer_id)
              ? {
                  ...g,
                  teacher_score: g.teacher_score ?? g.ai_score,
                  status: "FINAL",
                  updated_at: now(),
                }
              : g,
          ),
        };
      });
    },
    [],
  );

  const setCriterionTeacherPoints = useCallback<
    DataContextValue["setCriterionTeacherPoints"]
  >(async (gradingId, criterionId, points) => {
    setDb((prev) => ({
      ...prev,
      grading_results: prev.grading_results.map((g) => {
        if (g.id !== gradingId) return g;
        const criterion_scores = g.criterion_scores.map((c) =>
          c.criterion_id === criterionId ? { ...c, teacher_points: points } : c,
        );
        const teacher_score = criterion_scores.reduce(
          (acc, c) => acc + (c.teacher_points ?? c.ai_points),
          0,
        );
        return {
          ...g,
          criterion_scores,
          teacher_score,
          status: "TEACHER_REVIEW" as AnswerStatus,
          updated_at: now(),
        };
      }),
    }));
  }, []);

  /* ── resultados (§21) ───────────────────────────────────────────────────── */

  const resultsOf = useCallback<DataContextValue["resultsOf"]>(
    (activityId) => {
      const subs = db.submissions.filter((s) => s.activity_id === activityId);
      const questions = db.questions.filter((q) => q.activity_id === activityId);
      const maxTotal = questions.reduce((acc, q) => acc + q.points, 0);
      const studentIds = new Set(subs.map((s) => s.student_id).filter(Boolean));

      return Array.from(studentIds)
        .map((sid) => {
          const student = db.students.find((s) => s.id === sid);
          if (!student) return null;
          const submission = subs.find((s) => s.student_id === sid) ?? null;
          const answers = submission
            ? db.answers.filter((a) => a.submission_id === submission.id)
            : [];
          const ansIds = new Set(answers.map((a) => a.id));
          const grades = db.grading_results.filter((g) => ansIds.has(g.answer_id));
          const aiTotal = grades.reduce((acc, g) => acc + g.ai_score, 0);
          const finalTotal = grades.length
            ? grades.reduce((acc, g) => acc + (g.teacher_score ?? g.ai_score), 0)
            : null;
          let status: ResultRow["status"] = "SIN_ENTREGA";
          if (grades.length) {
            status = grades.every((g) => g.status === "FINAL")
              ? "FINAL"
              : grades.some((g) => g.status === "TEACHER_REVIEW")
                ? "TEACHER_REVIEW"
                : "AI_REVIEWED";
          } else if (submission) {
            status = submission.status === "PROCESSING" ? "PROCESSING" : "PENDING";
          }
          return { student, submission, finalTotal, aiTotal, maxTotal, status };
        })
        .filter((r): r is ResultRow => r !== null)
        .sort((a, b) => a.student.name.localeCompare(b.student.name));
    },
    [db.submissions, db.questions, db.students, db.answers, db.grading_results],
  );

  /* ── utilidades de la maqueta ───────────────────────────────────────────── */

  const resetDemoData = useCallback(() => {
    const fresh = seedDatabase();
    setDb({ ...fresh, session: { teacher_id: fresh.teachers[0]?.id ?? null } });
  }, []);

  const clearAllData = useCallback(() => {
    setDb((prev) => ({ ...emptyDatabase(), session: prev.session }));
  }, []);

  const value: DataContextValue = {
    ready,
    teacher,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    activities,
    getActivity,
    createActivity,
    updateActivity,
    deleteActivity,
    attachSourceFiles,
    startActivityProcessing,
    startSubmissionProcessing,
    jobFor,
    questionsOf,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    confirmQuestion,
    confirmAllQuestions,
    addCriterion,
    updateCriterion,
    deleteCriterion,
    students,
    createStudent,
    createStudentsBulk,
    deleteStudent,
    submissionsOf,
    createSubmissions,
    assignSubmissionStudent,
    deleteSubmission,
    gradingItemsOf,
    saveSubmissionFeedback,
    saveVoiceNote,
    deleteVoiceNote,
    setTeacherScore,
    setTeacherFeedback,
    approveGrading,
    approveAllGrading,
    setCriterionTeacherPoints,
    resultsOf,
    resetDemoData,
    clearAllData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData debe usarse dentro de <DataProvider>");
  return ctx;
}
