import type { Prisma, User } from '@prisma/client';

// Qué se carga al leer una rutina completa, ya ordenada por posición.
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

type LogWithExercises = Prisma.WorkoutLogGetPayload<{ include: { exercises: true } }>;

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
