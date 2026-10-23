/*

Lo que devuelve Prisma es un reflejo de las tablas (con passwordHash, columnas opcionales, etc.). 
Nunca se devuelve tal cual. 
Estas funciones construyen explícitamente la respuesta pública. 

Beneficios:

- Seguridad: campos sensibles que no se nombran, no salen.
- Estabilidad: si cambia una tabla, la API puede seguir igual.
- Forma cómoda para la app: por ejemplo, un ítem de rutina con su forma de ejercicio o de descanso.

*/


import type { Prisma, User } from '@prisma/client';

/*
Le dice a Prisma: "traeme la rutina con sus días, de cada día sus bloques, de cada bloque sus ítems, todo ordenado por position". 
Se define una vez y se reutiliza en me.ts y alumnos.ts. 
satisfies comprueba que sea válido sin perder el tipo exacto.
*/
export const ROUTINE_INCLUDE = {
  days: {
    orderBy: { position: 'asc' },
    include: {
      blocks: {
        orderBy: { position: 'asc' },
        include: { items: { orderBy: { position: 'asc' } } },
      },
    },
  },
} satisfies Prisma.RoutineInclude;

// Una rutina con días, bloques e ítems (según ROUTINE_INCLUDE)
type RoutineWithTree = Prisma.RoutineGetPayload<{ include: typeof ROUTINE_INCLUDE }>;

// Lista blanca: solo estos campos salen del servidor (nunca passwordHash).
export function toPublicUser(user: User) {
  return {
    id: user.id,
    role: user.role,
    routineId: user.routineId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    dni: user.dni,
    gender: user.gender,
    age: user.age,
    weight: user.weight,
    height: user.height,
    phone: user.phone,
    emergencyPhone: user.emergencyPhone,
    healthInsurance: user.healthInsurance,
    contraindications: user.contraindications,
    goal: user.goal,
  };
}


// del árbol de tablas a la forma de la API
export function toApiRoutine(routine: RoutineWithTree) {
  return {
    id: routine.id,
    name: routine.name,
    days: routine.days.map((day) => ({
      id: day.id,
      name: day.name,
      blocks: day.blocks.map((block) => ({
        id: block.id,
        items: block.items.map((item) =>
          item.type === 'exercise'
            ? {
                id: item.id,
                type: 'exercise' as const,
                exerciseId: item.exerciseId ?? '',
                series: item.series ?? 0,
                repetitions: item.repetitions ?? 0,
                weight: item.weightKg ?? 0,
                comments: item.comments,
              }
            : {
                id: item.id,
                type: 'rest' as const,
                time: item.restTime ?? 0,
                unit: item.restUnit === 'segundos' ? ('segundos' as const) : ('minutos' as const),
              }
        ),
      })),
    })),
  };
}


// Un registro de entrenamiento con su lista exercises
type LogWithExercises = Prisma.WorkoutLogGetPayload<{ include: { exercises: true } }>;

/*
Devuelve { id, userId, date, exercises: [{ exerciseId, muscleGroup }] },
sin los ids internos de WorkoutLogExercise ni createdAt.
*/
export function toApiLog(log: LogWithExercises) {
  return {
    id: log.id,
    userId: log.userId,
    date: log.date,
    exercises: log.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      muscleGroup: exercise.muscleGroup,
    })),
  };
}
