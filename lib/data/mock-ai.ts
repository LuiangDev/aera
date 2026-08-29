import type { Answer, CriterionLevel, GradingResult, Question, Submission } from "@/lib/types";
import type { AchievementLevel, EducationLevel } from "@/lib/evaluacion";
import { ACHIEVEMENT_LEVELS, conclusionRequired } from "@/lib/evaluacion";
import { uid } from "@/lib/data/db";

/**
 * Simulación del pipeline OCR + IA (§12, §13, §26, §28).
 *
 * IMPORTANTE: este módulo NO es el pipeline real. Existe para que el front sea navegable
 * antes de que exista backend. Se reemplaza entero cuando se construya el pipeline real,
 * después de la validación técnica de §5.
 *
 * Regla de coherencia: la valoración y el comentario que genera esta simulación tienen que
 * ser consistentes entre sí. Una respuesta correcta no puede salir marcada como error.
 */

const now = () => new Date().toISOString();

/** Plantillas de preguntas para simular una extracción con confianza variable. */
const EXTRACTION_TEMPLATES: Array<
  Omit<Question, "id" | "activity_id" | "created_at" | "updated_at">
> = [
  {
    number: 1,
    type: "multiple_choice",
    text: "¿Cuál de las siguientes afirmaciones corresponde al concepto trabajado en clase?",
    options: ["Afirmación A", "Afirmación B", "Afirmación C", "Afirmación D"],
    expected_answer: "Afirmación C",
    rubric: [{ id: "c_ext_1", description: "Reconoce el concepto correcto" }],
    confidence: 0.93,
    confirmed: false,
  },
  {
    number: 2,
    type: "short_answer",
    text: "Escribe con tus palabras la definición del concepto trabajado en clase.",
    options: [],
    expected_answer: "",
    rubric: [
      { id: "c_ext_2a", description: "Expresa la idea central del concepto" },
      { id: "c_ext_2b", description: "Usa vocabulario propio del área" },
    ],
    confidence: 0.86,
    confirmed: false,
  },
  {
    number: 3,
    type: "open_ended",
    text: "Explica el procedimiento que utilizaste para resolver la situación planteada.",
    options: [],
    expected_answer: "",
    rubric: [
      { id: "c_ext_3a", description: "Describe los pasos en orden" },
      { id: "c_ext_3b", description: "Justifica por qué eligió ese procedimiento" },
    ],
    confidence: 0.68,
    confirmed: false,
  },
  {
    number: 4,
    type: "long_answer",
    text: "Desarrolla un ejemplo propio y explica cómo se relaciona con lo trabajado.",
    options: [],
    expected_answer: "",
    rubric: [
      { id: "c_ext_4a", description: "Propone un ejemplo pertinente" },
      { id: "c_ext_4b", description: "Relaciona el ejemplo con el contenido de la clase" },
    ],
    confidence: 0.59,
    confirmed: false,
  },
  {
    number: 5,
    type: "short_answer",
    text: "Completa el resultado de la situación planteada y verifica tu respuesta.",
    options: [],
    expected_answer: "",
    rubric: [
      { id: "c_ext_5a", description: "Obtiene el resultado correcto" },
      { id: "c_ext_5b", description: "Verifica o comprueba su respuesta" },
    ],
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
    rubric: tpl.rubric.map((c) => ({ ...c, id: uid("c") })),
    created_at: now(),
    updated_at: now(),
  }));
}

/** Respuestas simuladas, cada una con el nivel que efectivamente le corresponde. */
const SIMULATED_ANSWERS: { text: string; level: AchievementLevel }[] = [
  {
    text: "Resolví la situación siguiendo los pasos que vimos en clase y comprobé el resultado al final.",
    level: "A",
  },
  {
    text: "Expliqué el procedimiento y agregué un ejemplo propio para mostrar cómo se aplica.",
    level: "AD",
  },
  {
    text: "Llegué al resultado, pero no alcancé a explicar cómo lo hice.",
    level: "B",
  },
  {
    text: "Intenté resolverlo, aunque me confundí en el procedimiento y no llegué al resultado.",
    level: "C",
  },
  {
    text: "Respondí con la idea principal, aunque me faltó desarrollarla más.",
    level: "B",
  },
];

const COMMENT_BY_LEVEL: Record<AchievementLevel, string> = {
  AD: "Supera lo esperado: resuelve con seguridad y además explica y ejemplifica.",
  A: "Cumple con lo esperado para esta competencia en todas las tareas propuestas.",
  B: "Está próximo a lo esperado: requiere acompañamiento para afianzar el procedimiento.",
  C: "Muestra un progreso mínimo respecto a lo esperado: necesita acompañamiento sostenido.",
};

const CRITERION_COMMENT: Record<AchievementLevel, string> = {
  AD: "Supera lo esperado en este criterio.",
  A: "Cumple con lo esperado en este criterio.",
  B: "Se acerca a lo esperado: requiere acompañamiento.",
  C: "Todavía no evidencia este criterio.",
};

/**
 * §13.2 — corrección: Pregunta + Respuesta esperada + Criterios + Respuesta del estudiante
 * → nivel de logro sugerido por criterio y para la evidencia completa (§16).
 */
export function gradeSubmission(
  submission: Submission,
  questions: Question[],
): { answers: Answer[]; grading: GradingResult[] } {
  const answers: Answer[] = [];
  const grading: GradingResult[] = [];

  questions.forEach((q, i) => {
    const simulated = SIMULATED_ANSWERS[i % SIMULATED_ANSWERS.length];

    const answer: Answer = {
      id: uid("ans"),
      submission_id: submission.id,
      question_id: q.id,
      extracted_text: simulated.text,
      confidence: [0.91, 0.64, 0.87, 0.73, 0.95][i % 5],
      source_region: `p1:${18 + i * 13}%,${10 + i * 4}%`,
      created_at: now(),
    };
    answers.push(answer);

    const criterion_levels: CriterionLevel[] = q.rubric.map((c, ci) => {
      let ai_level: AchievementLevel = simulated.level;
      if (simulated.level === "AD") ai_level = ci === 0 ? "AD" : "A";
      if (simulated.level === "B") ai_level = ci === 0 ? "A" : "B";
      return {
        criterion_id: c.id,
        ai_level,
        teacher_level: null,
        comment: CRITERION_COMMENT[ai_level],
      };
    });

    grading.push({
      id: uid("gr"),
      answer_id: answer.id,
      ai_level: simulated.level,
      teacher_level: null,
      ai_feedback: COMMENT_BY_LEVEL[simulated.level],
      teacher_feedback: null,
      criterion_levels,
      status: "AI_REVIEWED",
      created_at: now(),
      updated_at: now(),
    });
  });

  return { answers, grading };
}

/**
 * Conclusión descriptiva sugerida por IA (RVM 048-2024).
 *
 * La norma exige que la conclusión descriptiva incluya "recomendaciones personalizadas
 * orientadas al desarrollo de cada competencia", y que se redacte con lenguaje que
 * transmita altas expectativas (RVM 094-2020, 5.1.1 punto 13). El borrador se arma con
 * esa estructura: dónde está, qué evidencia lo sostiene y qué hacer para avanzar.
 *
 * SIEMPRE es una sugerencia (§19, §31): el docente la aprueba o la edita antes de enviar.
 */
export function buildFeedbackDraft(input: {
  studentName: string;
  competency: string;
  level: AchievementLevel | null;
  educationLevel: EducationLevel;
  strengths: string[];
  gaps: string[];
  /** false mientras el docente no haya confirmado el nivel: el borrador no lo afirma. */
  levelConfirmed: boolean;
}): string {
  const nombre = input.studentName.split(" ")[0] || "El estudiante";
  const nivel = input.level ? ACHIEVEMENT_LEVELS[input.level] : null;

  const apertura =
    nivel && input.levelConfirmed
      ? `${nombre} se encuentra en nivel ${nivel.code} (${nivel.label.toLowerCase()}) en la competencia «${input.competency}».`
      : `${nombre} evidencia el siguiente avance en la competencia «${input.competency}».`;

  const logros = input.strengths.length
    ? ` Logra: ${input.strengths.slice(0, 2).join("; ")}.`
    : "";

  const porTrabajar = input.gaps.length
    ? ` Aún requiere apoyo para: ${input.gaps.slice(0, 2).join("; ")}.`
    : "";

  // Recomendación personalizada: la norma la exige en toda conclusión descriptiva.
  const recomendacion = input.gaps.length
    ? ` Se recomienda acompañarlo con ejercicios donde explique su procedimiento antes de dar el resultado, y retomar estos criterios en la próxima experiencia de aprendizaje.`
    : ` Se recomienda proponerle situaciones de mayor complejidad para que siga ampliando lo que ya domina.`;

  const obligatoria =
    input.level && conclusionRequired(input.educationLevel, input.level);

  const cierre = obligatoria
    ? " Con el acompañamiento adecuado puede alcanzar el nivel esperado."
    : " Continúa con ese nivel de trabajo en las próximas actividades.";

  return `${apertura}${logros}${porTrabajar}${recomendacion}${cierre}`;
}

/**
 * Reinterpretación escrita de un mensaje de voz.
 *
 * PROTOTIPO: no hay transcripción real — no se envía audio a ningún proveedor todavía.
 */
export function transcribeVoiceNote(input: {
  studentName: string;
  durationSeconds: number;
}): string {
  const nombre = input.studentName.split(" ")[0] || "el estudiante";
  return (
    `Mensaje de voz de ${input.durationSeconds} segundos para ${nombre}. ` +
    "En resumen: se reconoce el avance en la competencia, se pide explicar el " +
    "procedimiento antes de dar el resultado y se propone retomar los criterios " +
    "trabajados en la clase anterior."
  );
}

/** Pasos que muestra el componente de progreso de §8.10 al procesar una actividad. */
export const ACTIVITY_PIPELINE_STEPS = [
  "Archivo recibido",
  "Texto detectado",
  "Preguntas identificadas",
  "Criterios de evaluación propuestos",
];

/** Pasos al procesar y valorar la entrega de un estudiante. */
export const SUBMISSION_PIPELINE_STEPS = [
  "Archivo recibido",
  "Texto detectado",
  "Respuestas asociadas a preguntas",
  "Nivel de logro sugerido por IA",
];
