import type { AchievementLevel, EducationLevel } from "@/lib/evaluacion";

/**
 * Modelo de datos — docs/PROJECT_CONTEXT.md §22, adecuado a la normativa de evaluación
 * por competencias del MINEDU (RVM 094-2020 y RVM 048-2024, ver lib/evaluacion.ts).
 *
 * Cambio de fondo respecto de la versión anterior: NO hay puntajes vigesimales. Las
 * evidencias se valoran con niveles de logro (AD/A/B/C) por criterio, y el nivel de la
 * competencia se determina a partir de esas valoraciones — nunca promediando.
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
export type ProcessingStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

/**
 * §16 — criterio de evaluación de la rúbrica.
 * Ya no lleva puntaje: la rúbrica describe qué se espera, y cada criterio se valora con
 * un nivel de logro. Opcionalmente el docente puede escribir el descriptor de cada nivel,
 * que es la forma completa de una rúbrica según la norma.
 */
export interface Criterion {
  id: string;
  description: string;
  descriptors?: Partial<Record<AchievementLevel, string>>;
}

export interface Teacher {
  id: string;
  email: string;
  name: string;
  created_at: string;
  /** Define cuándo la conclusión descriptiva es obligatoria (RVM 048-2024). */
  education_level: EducationLevel;
}

export interface Activity {
  id: string;
  teacher_id: string;
  title: string;
  /** Área curricular (Matemática, Comunicación, …). */
  subject: string;
  /** Competencia del CNEB que la actividad evalúa. El objeto de evaluación es esta. */
  competency: string;
  description: string;
  /** Nivel educativo con el que se evalúa esta actividad. */
  education_level: EducationLevel;
  application_date?: string;
  created_at: string;
  updated_at: string;
  /** Documento original de la actividad (§11). Se conserva siempre. */
  source_files: SourceFile[];
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
  /** §16 — criterios de la rúbrica, sin puntaje. */
  rubric: Criterion[];
  /** §28 — 0–1. Bajo CONFIDENCE_THRESHOLD se marca para revisión prioritaria. */
  confidence: number;
  /** Necesario para el patrón de §8.9 en el editor de preguntas. */
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
  /** Quien accede al portal de seguimiento en esta fase. */
  guardian_name?: string;
}

/** Nota de voz del docente (DESIGN_SYSTEM.md §8.7). */
export interface VoiceNote {
  id: string;
  duration_seconds: number;
  created_at: string;
  /** blob: en el prototipo; URL firmada de Storage cuando exista el backend. */
  object_url?: string;
  waveform: number[];
  /** Reinterpretación escrita del audio, sugerida por IA (§8.9). */
  ai_transcript?: string;
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
   * Conclusión descriptiva de la competencia (RVM 048-2024). Es el texto que se informa a
   * la familia; obligatorio según nivel educativo y nivel de logro alcanzado.
   */
  teacher_feedback: string | null;
  voice_note: VoiceNote | null;
  ai_feedback_draft: string | null;
  feedback_sent_at: string | null;
  /**
   * Nivel de logro de la competencia para esta evidencia.
   * `ai_level` es sugerencia; `teacher_level` es el que vale (§19).
   */
  ai_level: AchievementLevel | null;
  teacher_level: AchievementLevel | null;
}

export interface Answer {
  id: string;
  submission_id: string;
  question_id: string;
  extracted_text: string;
  confidence: number;
  source_region?: string;
  created_at: string;
}

/** Valoración de un criterio de la rúbrica con la escala oficial. */
export interface CriterionLevel {
  criterion_id: string;
  ai_level: AchievementLevel;
  teacher_level: AchievementLevel | null;
  comment: string;
}

export interface GradingResult {
  id: string;
  answer_id: string;
  /** Nivel sugerido por la IA para esta evidencia. */
  ai_level: AchievementLevel;
  /** Nivel confirmado por el docente. La decisión final siempre es suya (§19). */
  teacher_level: AchievementLevel | null;
  ai_feedback: string;
  teacher_feedback: string | null;
  criterion_levels: CriterionLevel[];
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
