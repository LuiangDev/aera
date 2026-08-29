import type {
  Activity,
  Answer,
  GradingResult,
  Question,
  Student,
  Submission,
  Teacher,
} from "@/lib/types";
import type { AchievementLevel } from "@/lib/evaluacion";
import { predominantLevel } from "@/lib/evaluacion";

/**
 * Forma de la base de datos del prototipo de front.
 * Cada colección corresponde 1:1 con una tabla del esquema de §22.
 */
export interface Database {
  teachers: Teacher[];
  activities: Activity[];
  questions: Question[];
  students: Student[];
  submissions: Submission[];
  answers: Answer[];
  grading_results: GradingResult[];
  session: { teacher_id: string | null };
}

// v3: la evaluación pasa de escala vigesimal a niveles de logro AD/A/B/C (RVM 094-2020 y
// RVM 048-2024). Subir la versión evita que una sesión antigua quede con puntajes.
export const STORAGE_KEY = "aera.mock.db.v3";

export const uid = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const iso = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86_400_000).toISOString();

const NOMBRES = [
  "Ana Quispe", "Carlos Mendoza", "María Fernández", "Pedro Ramírez", "Lucía Torres",
  "Diego Salas", "Valeria Ríos", "Joaquín Vega", "Camila Rojas", "Mateo Aguirre",
  "Sofía Ludeña", "Bruno Castillo", "Renata Paredes", "Iván Cárdenas", "Daniela Soto",
  "Gabriel Ochoa", "Paula Guzmán", "Nicolás Herrera", "Andrea Zamora", "Rodrigo Pinto",
  "Fernanda Lozano", "Tomás Bustos", "Elena Márquez", "Álvaro Nieto", "Milagros Ponce",
  "Jorge Alcántara", "Rosa Villar", "Sebastián Caro", "Nadia Espinoza", "Óscar Tapia",
];

const APODERADOS = [
  "Rosa Navarro", "Julio Mendoza", "Carmen Díaz", "Héctor Ramírez", "Silvia Torres",
  "Manuel Salas", "Patricia Ríos", "Alberto Vega", "Lucía Rojas", "Óscar Aguirre",
];

function makeStudents(teacherId: string, count: number, offset = 0): Student[] {
  return Array.from({ length: count }, (_, i) => {
    const name = NOMBRES[(i + offset) % NOMBRES.length];
    return {
      id: `st_${offset + i + 1}`,
      teacher_id: teacherId,
      name,
      identifier: `A-${String(offset + i + 1).padStart(3, "0")}`,
      created_at: iso(40),
      guardian_name: APODERADOS[(i + offset) % APODERADOS.length],
    };
  });
}

/**
 * Banco de respuestas de estudiantes.
 *
 * Cada variante trae el nivel que le corresponde y el comentario que lo justifica: una
 * respuesta correcta NUNCA sale valorada como si tuviera errores. Los datos de
 * demostración tienen que ser pedagógicamente coherentes, o la demo enseña lo contrario
 * de lo que el producto promete.
 */
interface AnswerVariant {
  text: string;
  level: AchievementLevel;
  comment: string;
}

const ANSWER_BANK: Record<string, AnswerVariant[]> = {
  // Actividad 1 — Fracciones
  q_1_1: [
    {
      text: "B) 2/4",
      level: "A",
      comment:
        "Identifica correctamente la fracción equivalente a 1/2 entre las opciones dadas.",
    },
    {
      text: "B) 2/4, porque si divido arriba y abajo entre 2 me queda 1/2",
      level: "AD",
      comment:
        "Además de elegir la opción correcta, justifica la equivalencia simplificando la fracción.",
    },
    {
      text: "D) 1/4",
      level: "C",
      comment:
        "Selecciona una fracción que no equivale a 1/2. Conviene repasar la simplificación de fracciones.",
    },
  ],
  q_1_2: [
    {
      text: "Una fracción es una parte de un todo que se ha dividido en partes iguales.",
      level: "A",
      comment:
        "Explica la relación parte-todo y menciona que las partes son iguales: cumple los dos criterios.",
    },
    {
      text: "Es cuando divides algo en partes iguales y tomas algunas. Por ejemplo, si parto una pizza en 4 y como 1, comí 1/4.",
      level: "AD",
      comment:
        "Explica la idea con precisión y la ilustra con un ejemplo propio pertinente.",
    },
    {
      text: "Una fracción sirve para representar una parte de algo.",
      level: "B",
      comment:
        "Reconoce la idea de parte, pero no menciona que el todo se divide en partes iguales.",
    },
  ],
  q_1_3: [
    {
      text: "4/8, porque 2/4 y 4/8 representan la misma cantidad.",
      level: "A",
      comment: "Propone una fracción equivalente correcta y justifica la equivalencia.",
    },
    {
      text: "1/2",
      level: "B",
      comment:
        "La fracción es equivalente, pero no explica por qué lo es. Falta la justificación que pide el criterio.",
    },
    {
      text: "2/5",
      level: "C",
      comment:
        "La fracción propuesta no es equivalente a 2/4. Conviene revisar cómo se comprueba una equivalencia.",
    },
  ],
  q_1_4: [
    {
      text: "Busqué el denominador común, que es 8. Convertí 3/4 en 6/8 y sumé: 6/8 + 1/8 = 7/8.",
      level: "AD",
      comment:
        "Resuelve correctamente y explica cada paso del procedimiento con sus propias palabras.",
    },
    {
      text: "3/4 = 6/8, entonces 6/8 + 1/8 = 7/8",
      level: "A",
      comment:
        "Llega al resultado correcto mostrando la conversión, aunque explica el procedimiento de forma muy breve.",
    },
    {
      text: "Sumé arriba y abajo: 3+1 = 4 y 4+8 = 12, entonces 4/12.",
      level: "C",
      comment:
        "Suma numeradores y denominadores por separado. Conviene retomar por qué hace falta un denominador común.",
    },
  ],
  q_1_5: [
    {
      text: "3/12, que simplificado es 1/4.",
      level: "A",
      comment: "Escribe la fracción correcta y la simplifica como pide el criterio.",
    },
    {
      text: "3/12",
      level: "B",
      comment: "La fracción es correcta, pero queda sin simplificar.",
    },
    {
      text: "12/3",
      level: "C",
      comment:
        "Invierte los términos de la fracción: el total va en el denominador.",
    },
  ],
  // Actividad 2 — Comprensión lectora
  q_2_1: [
    {
      text: "El aviador, que se accidenta en el desierto.",
      level: "A",
      comment: "Identifica correctamente al narrador de la historia.",
    },
    {
      text: "El principito",
      level: "C",
      comment:
        "Confunde al protagonista con el narrador. Conviene volver al inicio del texto.",
    },
  ],
  q_2_2: [
    {
      text: "La rosa representa el cariño del principito y la responsabilidad de cuidar a quien uno quiere.",
      level: "AD",
      comment:
        "Relaciona el símbolo con el vínculo afectivo y con la responsabilidad, más allá de lo literal.",
    },
    {
      text: "Representa a alguien a quien él quiere mucho.",
      level: "B",
      comment:
        "Reconoce el vínculo afectivo, pero no menciona la responsabilidad de cuidarla.",
    },
    {
      text: "Es una flor que estaba en su planeta.",
      level: "C",
      comment:
        "Se queda en la descripción literal, sin interpretar qué representa la rosa.",
    },
  ],
  q_2_3: [
    {
      text: "Significa que lo importante no se ve a simple vista: por ejemplo, el cariño de mi familia no se puede ver, pero se siente.",
      level: "AD",
      comment:
        "Interpreta la frase más allá de lo literal y la ilustra con un ejemplo propio.",
    },
    {
      text: "Que lo importante se ve con el corazón y no con los ojos.",
      level: "A",
      comment:
        "Interpreta correctamente la frase, aunque no llega a dar un ejemplo propio.",
    },
    {
      text: "Que hay cosas que no se ven.",
      level: "B",
      comment:
        "Se acerca a la idea, pero la explicación es muy general y no la relaciona con el texto.",
    },
  ],
};

/** Niveles por criterio coherentes con el nivel global de la respuesta. */
function criterionLevelsFor(
  level: AchievementLevel,
  criterionIds: string[],
): { criterion_id: string; ai_level: AchievementLevel; teacher_level: null; comment: string }[] {
  return criterionIds.map((criterion_id, i) => {
    let ai_level: AchievementLevel = level;
    if (level === "AD") ai_level = i === 0 ? "AD" : "A";
    if (level === "B") ai_level = i === 0 ? "A" : "B";
    return {
      criterion_id,
      ai_level,
      teacher_level: null,
      comment:
        ai_level === "AD"
          ? "Supera lo esperado en este criterio."
          : ai_level === "A"
            ? "Cumple con lo esperado en este criterio."
            : ai_level === "B"
              ? "Se acerca a lo esperado: requiere acompañamiento."
              : "Todavía no evidencia este criterio.",
    };
  });
}

export function seedDatabase(): Database {
  const teacher: Teacher = {
    id: "t_1",
    email: "docente@aera.app",
    name: "Ana Ríos",
    created_at: iso(120),
    education_level: "primaria",
  };

  const students = makeStudents(teacher.id, 25);

  // Actividad 1 — en corrección
  const a1: Activity = {
    id: "act_1",
    teacher_id: teacher.id,
    title: "Matemática - Fracciones",
    subject: "Matemática",
    competency: "Resuelve problemas de cantidad",
    description: "Evaluación de fracciones equivalentes y suma de fracciones.",
    education_level: "primaria",
    created_at: iso(12),
    updated_at: iso(2),
    processing_status: "READY",
    source_files: [
      {
        id: "file_a1",
        file_name: "fracciones-hoja1.jpg",
        file_url: "/mock/fracciones-hoja1.jpg",
        mime_type: "image/jpeg",
        size_bytes: 2_411_233,
        page_count: 1,
      },
    ],
  };

  const q1: Question[] = [
    {
      id: "q_1_1", activity_id: a1.id, number: 1, type: "multiple_choice",
      text: "¿Cuál de las siguientes fracciones es equivalente a 1/2?",
      options: ["2/6", "2/4", "3/5", "1/4"],
      expected_answer: "2/4",
      rubric: [
        { id: "c_1_1_a", description: "Identifica la fracción equivalente correcta" },
      ],
      confidence: 0.94, confirmed: true, created_at: iso(12), updated_at: iso(11),
    },
    {
      id: "q_1_2", activity_id: a1.id, number: 2, type: "open_ended",
      text: "Explica con tus palabras qué es una fracción.",
      options: [],
      expected_answer:
        "Una fracción representa una parte de un todo dividido en partes iguales.",
      rubric: [
        { id: "c_1_2_a", description: "Explica la relación entre la parte y el todo" },
        { id: "c_1_2_b", description: "Menciona que las partes son iguales" },
      ],
      confidence: 0.71, confirmed: false, created_at: iso(12), updated_at: iso(12),
    },
    {
      id: "q_1_3", activity_id: a1.id, number: 3, type: "short_answer",
      text: "Escribe una fracción equivalente a 2/4 y explica por qué lo es.",
      options: [],
      expected_answer: "1/2 o 4/8, porque representan la misma cantidad.",
      rubric: [
        { id: "c_1_3_a", description: "Propone una fracción equivalente correcta" },
        { id: "c_1_3_b", description: "Justifica por qué son equivalentes" },
      ],
      confidence: 0.88, confirmed: true, created_at: iso(12), updated_at: iso(11),
    },
    {
      id: "q_1_4", activity_id: a1.id, number: 4, type: "long_answer",
      text: "Resuelve 3/4 + 1/8 y explica el procedimiento paso a paso.",
      options: [],
      expected_answer:
        "Se busca el denominador común (8): 3/4 = 6/8, luego 6/8 + 1/8 = 7/8.",
      rubric: [
        { id: "c_1_4_a", description: "Identifica el denominador común" },
        { id: "c_1_4_b", description: "Convierte correctamente 3/4 a octavos" },
        { id: "c_1_4_c", description: "Obtiene el resultado 7/8" },
        { id: "c_1_4_d", description: "Explica el procedimiento con sus palabras" },
      ],
      confidence: 0.62, confirmed: false, created_at: iso(12), updated_at: iso(12),
    },
    {
      id: "q_1_5", activity_id: a1.id, number: 5, type: "short_answer",
      text: "¿Qué fracción del total representan 3 de 12 partes? Simplifícala.",
      options: [],
      expected_answer: "3/12 = 1/4",
      rubric: [
        { id: "c_1_5_a", description: "Escribe la fracción 3/12" },
        { id: "c_1_5_b", description: "La simplifica a 1/4" },
      ],
      confidence: 0.81, confirmed: true, created_at: iso(12), updated_at: iso(11),
    },
  ];

  // Actividad 2 — completada
  const a2: Activity = {
    id: "act_2",
    teacher_id: teacher.id,
    title: "Comunicación - Comprensión lectora",
    subject: "Comunicación",
    competency: "Lee diversos tipos de textos escritos en su lengua materna",
    description: "Evaluación de comprensión lectora sobre El Principito.",
    education_level: "primaria",
    created_at: iso(30),
    updated_at: iso(6),
    processing_status: "READY",
    source_files: [
      {
        id: "file_a2",
        file_name: "comprension-lectora.pdf",
        file_url: "/mock/comprension-lectora.pdf",
        mime_type: "application/pdf",
        size_bytes: 1_204_882,
        page_count: 2,
      },
    ],
  };

  const q2: Question[] = [
    {
      id: "q_2_1", activity_id: a2.id, number: 1, type: "short_answer",
      text: "¿Quién narra la historia?",
      options: [],
      expected_answer: "El aviador.",
      rubric: [{ id: "c_2_1_a", description: "Identifica al aviador como narrador" }],
      confidence: 0.92, confirmed: true, created_at: iso(30), updated_at: iso(29),
    },
    {
      id: "q_2_2", activity_id: a2.id, number: 2, type: "open_ended",
      text: "¿Qué representa la rosa para el principito?",
      options: [],
      expected_answer: "El amor y la responsabilidad por lo que uno cuida.",
      rubric: [
        { id: "c_2_2_a", description: "Menciona el vínculo afectivo" },
        { id: "c_2_2_b", description: "Relaciona con la responsabilidad de cuidar" },
      ],
      confidence: 0.86, confirmed: true, created_at: iso(30), updated_at: iso(29),
    },
    {
      id: "q_2_3", activity_id: a2.id, number: 3, type: "long_answer",
      text: "Explica con tus palabras la frase «lo esencial es invisible a los ojos» y da un ejemplo.",
      options: [],
      expected_answer: "Lo importante no siempre se ve; se percibe con el corazón.",
      rubric: [
        { id: "c_2_3_a", description: "Interpreta la frase más allá de lo literal" },
        { id: "c_2_3_b", description: "Da un ejemplo propio pertinente" },
      ],
      confidence: 0.79, confirmed: true, created_at: iso(30), updated_at: iso(29),
    },
  ];

  // Actividad 3 — borrador (sin preguntas todavía)
  const a3: Activity = {
    id: "act_3",
    teacher_id: teacher.id,
    title: "Ciencias - El sistema solar",
    subject: "Ciencia y Tecnología",
    competency: "Explica el mundo físico basándose en conocimientos científicos",
    description: "Evaluación corta sobre planetas y movimientos de la Tierra.",
    education_level: "primaria",
    created_at: iso(1),
    updated_at: iso(1),
    processing_status: "PENDING",
    source_files: [],
  };

  const submissions: Submission[] = [];
  const answers: Answer[] = [];
  const grading: GradingResult[] = [];

  let counter = 0;
  const nextId = (prefix: string) => `${prefix}_seed_${++counter}`;

  const buildSubmission = (
    activity: Activity,
    questions: Question[],
    student: Student,
    index: number,
    status: "FINAL" | "AI_REVIEWED" | "PENDING",
  ) => {
    const levels: AchievementLevel[] = [];
    const pending: {
      answer: Answer;
      grading: Omit<GradingResult, "id">;
    }[] = [];

    if (status !== "PENDING") {
      questions.forEach((q, qi) => {
        const bank = ANSWER_BANK[q.id] ?? [];
        const variant = bank[(index + qi) % bank.length];
        if (!variant) return;
        levels.push(variant.level);

        const answer: Answer = {
          id: nextId("ans"),
          submission_id: "",
          question_id: q.id,
          extracted_text: variant.text,
          confidence: [0.93, 0.68, 0.84, 0.72, 0.9][(index + qi) % 5],
          source_region: `p1:${20 + qi * 12}%,${8 + qi * 3}%`,
          created_at: iso(4),
        };

        pending.push({
          answer,
          grading: {
            answer_id: answer.id,
            ai_level: variant.level,
            teacher_level: status === "FINAL" ? variant.level : null,
            ai_feedback: variant.comment,
            teacher_feedback: null,
            criterion_levels: criterionLevelsFor(
              variant.level,
              q.rubric.map((c) => c.id),
            ),
            status: status === "FINAL" ? "FINAL" : "AI_REVIEWED",
            created_at: iso(4),
            updated_at: iso(3),
          },
        });
      });
    }

    const overall = predominantLevel(levels);
    const sub: Submission = {
      id: nextId("sub"),
      activity_id: activity.id,
      student_id: student.id,
      file_url: `/mock/${activity.id}-${student.identifier}.jpg`,
      file_name: `${student.identifier}-respuestas.jpg`,
      page_count: 1,
      status: status === "PENDING" ? "PENDING" : "READY",
      created_at: iso(5),
      processed_at: status === "PENDING" ? null : iso(4),
      teacher_feedback:
        status === "FINAL" && index % 3 === 0
          ? "Reconoce la relación parte-todo y resuelve las equivalencias con seguridad. Para seguir avanzando, conviene que escriba el procedimiento completo antes del resultado; practicar con la recta numérica le ayudará a afianzarlo."
          : null,
      voice_note: null,
      ai_feedback_draft: null,
      feedback_sent_at: status === "FINAL" && index % 3 === 0 ? iso(2) : null,
      ai_level: overall,
      teacher_level: status === "FINAL" ? overall : null,
    };
    submissions.push(sub);

    pending.forEach(({ answer, grading: g }) => {
      answer.submission_id = sub.id;
      answers.push(answer);
      grading.push({ id: nextId("gr"), ...g });
    });
  };

  // Actividad 1: 18 de 25 entregadas — 11 finalizadas, 7 revisadas por IA.
  students.slice(0, 18).forEach((s, i) => {
    buildSubmission(a1, q1, s, i, i < 11 ? "FINAL" : "AI_REVIEWED");
  });

  // Actividad 2: 25 de 25 entregadas y finalizadas → completada.
  students.forEach((s, i) => buildSubmission(a2, q2, s, i, "FINAL"));

  return {
    teachers: [teacher],
    activities: [a1, a2, a3],
    questions: [...q1, ...q2],
    students,
    submissions,
    answers,
    grading_results: grading,
    session: { teacher_id: null },
  };
}

export function emptyDatabase(): Database {
  const seeded = seedDatabase();
  return {
    teachers: seeded.teachers,
    activities: [],
    questions: [],
    students: [],
    submissions: [],
    answers: [],
    grading_results: [],
    session: { teacher_id: null },
  };
}
