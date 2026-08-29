import type {
  Answer,
  CriterionScore,
  GradingResult,
  Question,
  Submission,
} from "@/lib/types";
import { uid } from "@/lib/data/db";

/**
 * Simulación del pipeline OCR + IA (§12, §13, §26, §28).
 *
 * IMPORTANTE: este módulo NO es el pipeline real. Existe para que el front sea navegable
 * y funcional antes de que exista backend. Cuando se construya el pipeline real
 * (Edge Function → proveedor multimodal → JSON validado), se reemplaza este archivo
 * completo y el repositorio pasa a leer de Supabase — la UI no cambia, porque consume
 * exactamente la misma forma de datos.
 *
 * Antes de construir ese pipeline hay que correr la validación técnica de §5
 * (3-5 documentos reales, al menos uno manuscrito).
 */

const now = () => new Date().toISOString();

/** Plantillas de preguntas para simular una extracción con confianza variable. */
const EXTRACTION_TEMPLATES: Array<Omit<Question, "id" | "activity_id" | "created_at" | "updated_at">> = [
  {
    number: 1,
    type: "multiple_choice",
    text: "¿Cuál de las siguientes afirmaciones es correcta?",
    options: ["Afirmación A", "Afirmación B", "Afirmación C", "Afirmación D"],
    expected_answer: "Afirmación C",
    points: 2,
    rubric: [],
    confidence: 0.93,
    confirmed: false,
  },
  {
    number: 2,
    type: "short_answer",
    text: "Escribe la definición del concepto trabajado en clase.",
    options: [],
    expected_answer: "",
    points: 3,
    rubric: [],
    confidence: 0.86,
    confirmed: false,
  },
  {
    number: 3,
    type: "open_ended",
    text: "Explica con tus palabras el procedimiento que utilizaste.",
    options: [],
    expected_answer: "",
    points: 5,
    rubric: [],
    confidence: 0.68,
    confirmed: false,
  },
  {
    number: 4,
    type: "long_answer",
    text: "Desarrolla un ejemplo propio y justifica tu respuesta.",
    options: [],
    expected_answer: "",
    points: 6,
    rubric: [],
    confidence: 0.59,
    confirmed: false,
  },
  {
    number: 5,
    type: "short_answer",
    text: "Completa el resultado de la operación planteada.",
    options: [],
    expected_answer: "",
    points: 4,
    rubric: [],
    confidence: 0.81,
    confirmed: false,
  },
];

/** §28 — respuesta estructurada de la IA para la extracción de preguntas. */
export function extractQuestions(activityId: string, count = 5): Question[] {
  return EXTRACTION_TEMPLATES.slice(0, count).map((tpl) => ({
    ...tpl,
    id: uid("q"),
    activity_id: activityId,
    created_at: now(),
    updated_at: now(),
  }));
}

const STUDENT_ANSWER_POOL = [
  "Es una parte de un todo, cuando se divide en partes iguales.",
  "Lo resolví buscando el denominador común y después sumé los numeradores.",
  "No estoy seguro, pero creo que se hace dividiendo entre dos.",
  "La respuesta es 7/8 porque 3/4 equivale a 6/8.",
  "Porque lo importante no siempre se puede ver a simple vista.",
];

/**
 * §13.2 — corrección: Pregunta + Respuesta esperada + Criterios + Respuesta del estudiante
 * → evaluación, puntaje sugerido, justificación y feedback, con desglose por criterio (§16).
 */
export function gradeSubmission(
  submission: Submission,
  questions: Question[],
): { answers: Answer[]; grading: GradingResult[] } {
  const answers: Answer[] = [];
  const grading: GradingResult[] = [];

  questions.forEach((q, i) => {
    const answer: Answer = {
      id: uid("ans"),
      submission_id: submission.id,
      question_id: q.id,
      extracted_text: STUDENT_ANSWER_POOL[i % STUDENT_ANSWER_POOL.length],
      confidence: [0.91, 0.64, 0.87, 0.73, 0.95][i % 5],
      source_region: `p1:${18 + i * 13}%,${10 + i * 4}%`,
      created_at: now(),
    };
    answers.push(answer);

    const ratio = [0.75, 1, 0.5, 0.9, 0.8][i % 5];
    const criterion_scores: CriterionScore[] = q.rubric.map((c, ci) => ({
      criterion_id: c.id,
      ai_points: Math.round(c.points * [1, 0.5, 0.75][(i + ci) % 3] * 2) / 2,
      teacher_points: null,
      comment:
        [1, 0.5, 0.75][(i + ci) % 3] === 1
          ? "El criterio se cumple explícitamente en la respuesta."
          : "El criterio se cumple solo de forma parcial.",
    }));

    const ai_score = criterion_scores.length
      ? criterion_scores.reduce((acc, c) => acc + c.ai_points, 0)
      : Math.round(q.points * ratio * 2) / 2;

    grading.push({
      id: uid("gr"),
      answer_id: answer.id,
      ai_score,
      teacher_score: null,
      ai_feedback:
        ai_score >= q.points
          ? "La respuesta cubre todos los criterios definidos para esta pregunta."
          : "La respuesta demuestra comprensión parcial del concepto: falta desarrollar alguno de los criterios definidos.",
      teacher_feedback: null,
      criterion_scores,
      status: "AI_REVIEWED",
      created_at: now(),
      updated_at: now(),
    });
  });

  return { answers, grading };
}

/**
 * Retroalimentación global sugerida por IA a partir de toda la corrección.
 * Se arma con datos reales de la entrega (puntaje, criterios cumplidos y no cumplidos),
 * no con texto genérico: es lo que haría el modelo con el mismo insumo.
 *
 * SIEMPRE es una sugerencia (§19, §31): el docente la aprueba o la edita antes de enviar.
 */
export function buildFeedbackDraft(input: {
  studentName: string;
  total: number;
  maxTotal: number;
  strengths: string[];
  gaps: string[];
  /** false cuando la nota todavía no está confirmada: el borrador no menciona el puntaje. */
  includeScore: boolean;
}): string {
  const nombre = input.studentName.split(" ")[0] || "Hola";
  const ratio = input.maxTotal ? input.total / input.maxTotal : 0;

  // Si la nota todavía no está confirmada, el borrador NO menciona el puntaje: de lo
  // contrario un número provisional llegaría a la familia dentro del texto (§19, §31).
  const puntaje = input.includeScore ? ` (${input.total} de ${input.maxTotal})` : "";

  const apertura =
    ratio >= 0.85
      ? `${nombre}, tu trabajo está muy bien resuelto${puntaje}.`
      : ratio >= 0.6
        ? `${nombre}, tu trabajo va por buen camino${puntaje}.`
        : `${nombre}, hay varias cosas por reforzar en este trabajo${puntaje}.`;

  const fuerte = input.strengths.length
    ? ` Lo que resolviste con claridad: ${input.strengths.slice(0, 2).join("; ")}.`
    : "";

  const brecha = input.gaps.length
    ? ` Conviene que trabajes: ${input.gaps.slice(0, 2).join("; ")}.`
    : " Mantén ese nivel en la próxima evaluación.";

  const cierre =
    ratio >= 0.6
      ? " Sigue explicando tu procedimiento paso a paso: eso hace visible lo que ya entiendes."
      : " Repasemos juntos estos puntos en la próxima clase.";

  return `${apertura}${fuerte}${brecha}${cierre}`;
}

/**
 * Reinterpretación escrita de un mensaje de voz.
 *
 * PROTOTIPO: no hay transcripción real — no se envía audio a ningún proveedor todavía.
 * Devuelve un texto de ejemplo con la forma que tendría la salida real para que el flujo
 * se pueda evaluar. La interfaz lo declara como simulado; no presentarlo como
 * transcripción fiel de lo que el docente dijo.
 */
export function transcribeVoiceNote(input: {
  studentName: string;
  durationSeconds: number;
}): string {
  const nombre = input.studentName.split(" ")[0] || "el estudiante";
  return (
    `Mensaje de voz de ${input.durationSeconds} segundos para ${nombre}. ` +
    "En resumen: se reconoce el esfuerzo en el desarrollo, se pide detallar el " +
    "procedimiento antes del resultado y se propone repasar los ejercicios similares " +
    "de la clase anterior."
  );
}

/** Pasos que muestra el componente de progreso de §8.10 al procesar una actividad. */
export const ACTIVITY_PIPELINE_STEPS = [
  "Archivo recibido",
  "Texto detectado",
  "Preguntas identificadas",
  "Estructura detectada",
];

/** Pasos al procesar y corregir la entrega de un estudiante. */
export const SUBMISSION_PIPELINE_STEPS = [
  "Archivo recibido",
  "Texto detectado",
  "Respuestas asociadas a preguntas",
  "Corrección sugerida por IA",
];
