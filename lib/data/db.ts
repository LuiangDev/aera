import type {
  Activity,
  Answer,
  GradingResult,
  Question,
  Student,
  Submission,
  Teacher,
} from "@/lib/types";

/**
 * Forma de la base de datos del prototipo de front.
 * Cada colección corresponde 1:1 con una tabla del esquema de §22, para que el reemplazo
 * por Supabase sea mecánico (ver supabase/migrations/0001_init.sql).
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

export const STORAGE_KEY = "aera.mock.db.v1";

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

function makeStudents(teacherId: string, count: number, offset = 0): Student[] {
  return Array.from({ length: count }, (_, i) => {
    const name = NOMBRES[(i + offset) % NOMBRES.length];
    return {
      id: `st_${offset + i + 1}`,
      teacher_id: teacherId,
      name,
      identifier: `A-${String(offset + i + 1).padStart(3, "0")}`,
      created_at: iso(40),
    };
  });
}

/**
 * Datos de demostración. Cubren los tres estados derivados de actividad (§22):
 * una en borrador (sin preguntas), una en corrección y una completada.
 */
export function seedDatabase(): Database {
  const teacher: Teacher = {
    id: "t_1",
    email: "docente@aera.app",
    name: "Ana Ríos",
    created_at: iso(120),
  };

  const students = makeStudents(teacher.id, 25);

  // Actividad 1 — en corrección
  const a1: Activity = {
    id: "act_1",
    teacher_id: teacher.id,
    title: "Matemática - Fracciones",
    subject: "Matemática",
    description: "Evaluación de fracciones equivalentes y operaciones básicas.",
    max_score: 20,
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
      text: "¿Cuánto es 5 + 3?",
      options: ["6", "7", "8", "9"],
      expected_answer: "8", points: 2, rubric: [],
      confidence: 0.94, confirmed: true, created_at: iso(12), updated_at: iso(11),
    },
    {
      id: "q_1_2", activity_id: a1.id, number: 2, type: "open_ended",
      text: "Explica qué es una fracción.",
      options: [],
      expected_answer:
        "Una fracción representa una parte de un todo dividido en partes iguales.",
      points: 5,
      rubric: [
        { id: "c_1_2_a", description: "Explica qué representa una fracción", points: 2 },
        { id: "c_1_2_b", description: "Menciona que el todo está dividido", points: 1.5 },
        { id: "c_1_2_c", description: "Hace referencia a partes iguales", points: 1.5 },
      ],
      confidence: 0.71, confirmed: false, created_at: iso(12), updated_at: iso(12),
    },
    {
      id: "q_1_3", activity_id: a1.id, number: 3, type: "short_answer",
      text: "Escribe una fracción equivalente a 2/4.",
      options: [],
      expected_answer: "1/2",
      points: 3,
      rubric: [
        { id: "c_1_3_a", description: "Propone una fracción equivalente correcta", points: 2 },
        { id: "c_1_3_b", description: "Justifica la equivalencia", points: 1 },
      ],
      confidence: 0.88, confirmed: true, created_at: iso(12), updated_at: iso(11),
    },
    {
      id: "q_1_4", activity_id: a1.id, number: 4, type: "long_answer",
      text: "Resuelve 3/4 + 1/8 y explica el procedimiento paso a paso.",
      options: [],
      expected_answer:
        "Se buscan denominadores comunes (8), 3/4 = 6/8, luego 6/8 + 1/8 = 7/8.",
      points: 6,
      rubric: [
        { id: "c_1_4_a", description: "Identifica el denominador común", points: 2 },
        { id: "c_1_4_b", description: "Convierte correctamente 3/4 a octavos", points: 2 },
        { id: "c_1_4_c", description: "Obtiene el resultado 7/8", points: 1 },
        { id: "c_1_4_d", description: "Explica el procedimiento con sus palabras", points: 1 },
      ],
      confidence: 0.62, confirmed: false, created_at: iso(12), updated_at: iso(12),
    },
    {
      id: "q_1_5", activity_id: a1.id, number: 5, type: "short_answer",
      text: "¿Qué fracción del total representan 3 de 12 partes?",
      options: [],
      expected_answer: "3/12 = 1/4",
      points: 4,
      rubric: [
        { id: "c_1_5_a", description: "Escribe la fracción 3/12", points: 2 },
        { id: "c_1_5_b", description: "La simplifica a 1/4", points: 2 },
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
    description: "Evaluación de comprensión lectora sobre El Principito.",
    max_score: 20,
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
      text: "¿Quién narra la historia?", options: [],
      expected_answer: "El aviador.", points: 4,
      rubric: [{ id: "c_2_1_a", description: "Identifica al aviador como narrador", points: 4 }],
      confidence: 0.92, confirmed: true, created_at: iso(30), updated_at: iso(29),
    },
    {
      id: "q_2_2", activity_id: a2.id, number: 2, type: "open_ended",
      text: "¿Qué representa la rosa para el principito?", options: [],
      expected_answer: "Representa el amor y la responsabilidad por lo que uno cuida.",
      points: 8,
      rubric: [
        { id: "c_2_2_a", description: "Menciona el vínculo afectivo", points: 4 },
        { id: "c_2_2_b", description: "Relaciona con la responsabilidad de cuidar", points: 4 },
      ],
      confidence: 0.86, confirmed: true, created_at: iso(30), updated_at: iso(29),
    },
    {
      id: "q_2_3", activity_id: a2.id, number: 3, type: "long_answer",
      text: "Explica con tus palabras la frase «lo esencial es invisible a los ojos».",
      options: [],
      expected_answer: "Lo importante no siempre se ve; se percibe con el corazón.",
      points: 8,
      rubric: [
        { id: "c_2_3_a", description: "Interpreta la frase más allá de lo literal", points: 4 },
        { id: "c_2_3_b", description: "Da un ejemplo propio", points: 4 },
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
    description: "Evaluación corta sobre planetas y movimientos de la Tierra.",
    max_score: 15,
    created_at: iso(1),
    updated_at: iso(1),
    processing_status: "PENDING",
    source_files: [],
  };

  const submissions: Submission[] = [];
  const answers: Answer[] = [];
  const grading: GradingResult[] = [];

  const AI_TEXTS: Record<string, string[]> = {
    q_1_1: ["8", "C. 8", "8 (ocho)"],
    q_1_2: [
      "Una fracción sirve para representar una parte de algo.",
      "Es cuando divides algo en partes iguales y tomas algunas.",
      "Una fracción es una parte de un todo dividido en partes iguales.",
    ],
    q_1_3: ["1/2", "2/4 = 1/2 porque se divide entre 2", "4/8"],
    q_1_4: [
      "3/4 = 6/8, entonces 6/8 + 1/8 = 7/8",
      "Sumé arriba y abajo: 4/12",
      "Busqué el denominador común 8 y me dio 7/8.",
    ],
    q_1_5: ["3/12", "3/12 = 1/4", "1/4"],
    q_2_1: ["El aviador", "El piloto que se estrella en el desierto"],
    q_2_2: [
      "La rosa representa el amor que el principito siente y su responsabilidad.",
      "Es una flor que él cuidaba.",
    ],
    q_2_3: [
      "Que lo importante se ve con el corazón, como el cariño.",
      "Que no todo se puede ver con los ojos.",
    ],
  };

  let counter = 0;
  const nextId = (prefix: string) => `${prefix}_seed_${++counter}`;

  const buildSubmission = (
    activity: Activity,
    questions: Question[],
    student: Student,
    index: number,
    status: "FINAL" | "AI_REVIEWED" | "PENDING",
  ) => {
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
    };
    submissions.push(sub);
    if (status === "PENDING") return;

    questions.forEach((q, qi) => {
      const pool = AI_TEXTS[q.id] ?? ["Respuesta del estudiante."];
      const text = pool[(index + qi) % pool.length];
      const answer: Answer = {
        id: nextId("ans"),
        submission_id: sub.id,
        question_id: q.id,
        extracted_text: text,
        confidence: [0.93, 0.68, 0.84, 0.72, 0.9][(index + qi) % 5],
        source_region: `p1:${20 + qi * 12}%,${8 + qi * 3}%`,
        created_at: iso(4),
      };
      answers.push(answer);

      const ratio = [0.8, 1, 0.6, 0.9, 0.75][(index + qi) % 5];
      const aiScore = Math.round(q.points * ratio * 2) / 2;
      const criterionScores = q.rubric.map((c, ci) => {
        const r = [1, 0.5, 0.75, 1, 0.5][(index + qi + ci) % 5];
        return {
          criterion_id: c.id,
          ai_points: Math.round(c.points * r * 2) / 2,
          teacher_points: null,
          comment:
            r === 1
              ? "El criterio se cumple explícitamente en la respuesta."
              : "El criterio se cumple solo de forma parcial.",
        };
      });

      grading.push({
        id: nextId("gr"),
        answer_id: answer.id,
        ai_score: aiScore,
        teacher_score: status === "FINAL" ? aiScore : null,
        ai_feedback:
          ratio === 1
            ? "La respuesta cubre todos los criterios definidos para esta pregunta."
            : "La respuesta demuestra comprensión parcial: falta desarrollar alguno de los criterios.",
        teacher_feedback: null,
        criterion_scores: criterionScores,
        status: status === "FINAL" ? "FINAL" : "AI_REVIEWED",
        created_at: iso(4),
        updated_at: iso(3),
      });
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
