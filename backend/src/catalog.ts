// El servidor consulta el mismo catálogo de ejercicios que la app para saber
// a qué grupo muscular pertenece cada ejercicio (así no se lo cree al cliente).
const CATALOG_URL =
  'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/api/es/exercises.json';

// Misma tabla que src/services/exercisesApi.ts de la app.
const MUSCLE_GROUPS: Record<string, string> = {
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

type CatalogMap = Map<string, string>; // id del ejercicio -> grupo muscular

let cache: Promise<CatalogMap> | null = null;

async function loadCatalog(): Promise<CatalogMap> {
  const response = await fetch(CATALOG_URL, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    throw new Error(`Catálogo de ejercicios no disponible (${response.status})`);
  }
  const data = (await response.json()) as { exercises: { id: string; muscle: string }[] };
  return new Map(
    data.exercises.map((exercise) => [exercise.id, MUSCLE_GROUPS[exercise.muscle] ?? exercise.muscle])
  );
}

// Se descarga una sola vez; si falla, el próximo pedido vuelve a intentarlo.
export function getCatalog(): Promise<CatalogMap> {
  if (!cache) {
    cache = loadCatalog().catch((error) => {
      cache = null;
      throw error;
    });
  }
  return cache;
}
