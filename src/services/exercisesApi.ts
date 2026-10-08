// Conexión con la API externa de ejercicios (ExerciseGymGifsDB).
// Es un JSON estático servido por el CDN jsDelivr: no necesita API key.
// Fijamos la versión (@v1.1.0) para que un cambio en el repo no rompa la app.
const API_URL =
  'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/api/es/exercises.json';

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  gif: string;
  instructions: string[];
};

type ApiExercise = {
  id: string;
  name: string;
  muscle: string;
  gifUrl: string;
  instructions: string[];
};

type ApiResponse = {
  exercises: ApiExercise[];
};

// La API devuelve el músculo en inglés; lo llevamos a los grupos que ya usa la app
// (así las estadísticas siguen agrupando igual).
const GRUPOS_MUSCULARES: Record<string, string> = {
  abs: 'Abdomen',
  pectorals: 'Pecho',
  'serratus-anterior': 'Pecho',
  lats: 'Espalda',
  'upper-back': 'Espalda',
  traps: 'Espalda',
  spine: 'Espalda',
  'levator-scapulae': 'Espalda',
  delts: 'Hombro',
  biceps: 'Bíceps',
  forearms: 'Bíceps',
  triceps: 'Tríceps',
  glutes: 'Glúteos',
  quads: 'Pierna',
  hamstrings: 'Pierna',
  calves: 'Pierna',
  adductors: 'Pierna',
  abductors: 'Pierna',
  cardio: 'Cardio',
};

// Convierte un ejercicio de la API al formato que usan las pantallas
function adaptarEjercicio(ejercicio: ApiExercise): Exercise {
  return {
    id: ejercicio.id, // ej: 'pectorals/barbell-bench-press'
    name: ejercicio.name,
    muscleGroup: GRUPOS_MUSCULARES[ejercicio.muscle] ?? ejercicio.muscle,
    gif: ejercicio.gifUrl,
    instructions: ejercicio.instructions, // array de pasos
  };
}

// Trae todos los ejercicios (≈1300) en español
export async function fetchExercises(): Promise<Exercise[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`No se pudieron cargar los ejercicios (${response.status})`);
  }

  const data = (await response.json()) as ApiResponse;
  return data.exercises.map(adaptarEjercicio);
}
