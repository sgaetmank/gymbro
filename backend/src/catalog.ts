// El servidor consulta el mismo catálogo de ejercicios que la app para saber
// a qué grupo muscular pertenece cada ejercicio (así no se lo cree al cliente).
const CATALOG_URL =
  'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/api/es/exercises.json';

// Misma tabla que src/services/exercisesApi.ts de la app.
// Traducción de grupos musculares
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

// Es una caché: guarda el catálogo para no descargarlo en cada check-in
// Es una variable del módulo (vive mientras el servidor esté encendido)
let cache: Promise<CatalogMap> | null = null;

// Descarga el catálogo de internet y lo convierte en un Map
// Map: id del ejercicio → grupo muscular:  buscar por id es inmediato (catalog.get(id), catalog.has(id)).
async function loadCatalog(): Promise<CatalogMap> {
  
  const response = await fetch(CATALOG_URL, { signal: AbortSignal.timeout(15000) }); // si no responde en 15 s, se corta.
  
  if (!response.ok) {
    throw new Error(`Catálogo de ejercicios no disponible (${response.status})`);
  }
  
  // lee la respuesta de internet y la convierte en un objeto. El as {...} le dice a TypeScript qué forma tiene
  const data = (await response.json()) as { exercises: { id: string; muscle: string }[] };
  
  // data.exercises.map(...) recorre los más de mil ejercicios y arma por cada uno un par [id, grupo muscular], 
  // por ejemplo ['abs/45-side-bend', 'Abdomen'].
  return new Map(
    data.exercises.map((exercise) => [exercise.id, MUSCLE_GROUPS[exercise.muscle] ?? exercise.muscle])
  );
}

// Devuelve el catálogo, descargándolo solo si todavía no lo tiene
export function getCatalog(): Promise<CatalogMap> {
  if (!cache) { // ¿nunca lo pedí?
    cache = loadCatalog() //   → lo pido AHORA y guardo la promesa
      .catch((error) => { //   si la descarga falla...
        cache = null; //   ...vacío la caché (para reintentar)
        throw error; //   ...y propago el error a quien lo pidió
      });
  }
  return cache; // devuelvo la promesa guardada
}
