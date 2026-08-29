/**
 * Modelo de datos — docs/PROJECT_CONTEXT.md §22.
 * Estos tipos son el contrato entre la UI y la capa de acceso a datos (lib/data/repository.ts).
 * Cuando el backend real de Supabase entre, cambia la implementación del repositorio,
 * no estos tipos ni los componentes.
 */

/** §14 — tipos soportados en el MVP. La arquitectura permite agregar más después. */
export type QuestionType =
  | "multiple_choice"
  | "short_answer"
  | "open_ended"
  | "long_answer";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Opción múltiple",
  short_answer: "Respuesta corta",
  open_ended: "Respuesta abierta",
  long_answer: "Respuesta desarrollada",
};

/** §20 — ciclo de vida de una respuesta (único estado de bajo nivel). */
export type AnswerStatus =
  | "PENDING"
  | "PROCESSING"
  | "AI_REVIEWED"
  | "TEACHER_REVIEW"
  | "FINAL";

/** §22 — estado derivado de la actividad, nunca editable a mano. */
export type ActivityStatus = "borrador" | "en_correccion" | "completada";

/** Estado del documento dentro del pipeline de procesamiento (§26). */
export type ProcessingStatus =
  | "PENDING"
  | "PROCESSING"
  | "READY"
  | "FAILED";

/** §16 — criterio con puntaje propio; la suma da el puntaje de la pregunta. */
export interface Criterion {
  id: string;
  description: string;
  points: number;
}

export interface Teacher {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Activity {
  id: string;
  teacher_id: string;
  title: string;
  subject: string;
  description: string;
  max_score: number;
  /**
   * §10 lista "fecha" entre los campos de crear actividad, pero el esquema de §22 no la
   * incluye. Se agrega como opcional para no perder el campo de la UI; queda pendiente
   * confirmarla antes de escribir la migración definitiva.
   */
  application_date?: string;
  created_at: string;
  updated_at: string;
  /** Documento original de la actividad (§11). Se conserva siempre. */
  source_files: SourceFile[];
  /** Estado del pipeline de extracción de preguntas. */
  processing_status: ProcessingStatus;
}

export interface SourceFile {
  id: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  size_bytes: number;
  page_count: number;
}

export interface Question {
  id: string;
  activity_id: string;
  number: number;
  type: QuestionType;
  text: string;
  options: string[];
  expected_answer: string;
  points: number;
  /** §16 — lista estructurada, no texto libre. */
  rubric: Criterion[];
  /** §28 — 0–1. Bajo CONFIDENCE_THRESHOLD se marca para revisión prioritaria. */
  confidence: number;
  /**
   * Añadido sobre §22: sin esto la UI no puede aplicar el patrón de §8.9 en el editor
   * (una pregunta extraída por IA es una sugerencia hasta que el docente la confirma).
   */
  confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  teacher_id: string;
  name: string;
  identifier: string;
  created_at: string;
}

/**
 * Nota de voz del docente (DESIGN_SYSTEM.md §8.7).
 *
 * PROTOTIPO: el audio se graba en el navegador con MediaRecorder y vive como `blob:` en
 * memoria durante la sesión. NO se sube a Storage todavía — cuando exista el bucket,
 * `object_url` pasa a ser la ruta firmada de Supabase y el resto de campos no cambia.
 */
export interface VoiceNote {
  id: string;
  duration_seconds: number;
  created_at: string;
  /** blob: en el prototipo; URL firmada de Storage cuando exista el backend. */
  object_url?: string;
  /** Amplitudes 0–1 para dibujar la onda simplificada de §8.7 de forma estable. */
  waveform: number[];
}

export interface Submission {
  id: string;
  activity_id: string;
  student_id: string;
  file_url: string;
  file_name: string;
  page_count: number;
  status: ProcessingStatus;
  created_at: string;
  processed_at: string | null;
  /**
   * Retroalimentación de cierre para toda la entrega, escrita por el docente.
   * Es distinta del `teacher_feedback` por respuesta de `GradingResult` (§22): esta es el
   * mensaje global al estudiante, no el comentario de una pregunta.
   */
  teacher_feedback: string | null;
  /** Mensaje de voz que acompaña (o reemplaza) al texto. */
  voice_note: VoiceNote | null;
}

export interface Answer {
  id: string;
  submission_id: string;
  question_id: string;
  extracted_text: string;
  /** §22/§28 — confianza de la extracción de esta respuesta. */
  confidence: number;
  /** §22 — zona del documento original de la que salió la extracción. */
  source_region?: string;
  created_at: string;
}

/** Evaluación por criterio (§16) — la IA evalúa cada criterio por separado. */
export interface CriterionScore {
  criterion_id: string;
  ai_points: number;
  teacher_points: number | null;
  comment: string;
}

export interface GradingResult {
  id: string;
  answer_id: string;
  ai_score: number;
  teacher_score: number | null;
  ai_feedback: string;
  teacher_feedback: string | null;
  criterion_scores: CriterionScore[];
  status: AnswerStatus;
  created_at: string;
  updated_at: string;
}

/** §28 — umbral sugerido de confianza para revisión prioritaria. */
export const CONFIDENCE_THRESHOLD = 0.75;

/** §11 — formatos y límites de carga. */
export const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "application/pdf",
] as const;
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
