export const routines = [
  {
    id: 1,
    name: 'Mi Rutina',
    days: [
      {
        id: 1,
        name: 'Día 1',
        blocks: [
          {
            id: 1,
            name: 'Bloque 1',
            items: [
              {
                id: 1,
                type: 'exercise',
                exerciseId: 2,
                series: '4',
                repetitions: '10',
                weight: '0 kg',
                comments: '',
              },
              {
                id: 2,
                type: 'rest',
                time: '1',
                unit: 'minutos',
              },
            ],
          },
          {
            id: 2,
            name: 'Bloque 2',
            items: [
              {
                id: 3,
                type: 'exercise',
                exerciseId: 9,
                series: '2',
                repetitions: '20',
                weight: '0 kg',
                comments: '',
              },
            ],
          },
        ],
      },
      {
        id: 2,
        name: 'Día 2',
        blocks: [
          {
            id: 3,
            name: 'Bloque 1',
            items: [
              {
                id: 4,
                type: 'exercise',
                exerciseId: 3,
                series: '2',
                repetitions: '15',
                weight: '1 kg',
                comments: '',
              },
              {
                id: 5,
                type: 'exercise',
                exerciseId: 7,
                series: '4',
                repetitions: '23',
                weight: '5 kg',
                comments: 'Nota: 32 PER LADO',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 3,
    name: 'Rutina Pérdida de Peso',
    days: [
      {
        id: 31,
        name: 'Día 1',
        blocks: [
          {
            id: 31,
            name: 'Cardio',
            items: [
              {
                id: 31,
                type: 'exercise',
                exerciseId: 3,
                series: '3',
                repetitions: '15',
                weight: '0 kg',
                comments: '',
              },
              {
                id: 32,
                type: 'exercise',
                exerciseId: 10,
                series: '3',
                repetitions: '20',
                weight: '0 kg',
                comments: '',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 4,
    name: 'Rutina Tonificación',
    days: [
      {
        id: 41,
        name: 'Día 1',
        blocks: [
          {
            id: 41,
            name: 'Piernas y glúteos',
            items: [
              {
                id: 41,
                type: 'exercise',
                exerciseId: 5,
                series: '4',
                repetitions: '12',
                weight: '10 kg',
                comments: '',
              },
              {
                id: 42,
                type: 'rest',
                time: '1',
                unit: 'minutos',
              },
            ],
          },
        ],
      },
    ],
  },
];

export function getRoutineById(routineId) {
  // Busca la rutina asociada al usuario mediante su routineId.
  return routines.find((routine) => routine.id === routineId);
}

export function createRoutine(days) {
  // Alta de una rutina nueva (equivale a un INSERT en la base de datos).
  const routine = {
    id: Math.max(...routines.map((routine) => routine.id)) + 1,
    name: 'Mi Rutina',
    // Copia profunda para no compartir referencias con el estado de la pantalla
    days: JSON.parse(JSON.stringify(days)),
  };
  routines.push(routine);
  return routine;
}

export function updateRoutineDays(routineId, days) {
  // Reemplaza los días de la rutina (equivale a un UPDATE en la base de datos).
  const routine = getRoutineById(routineId);
  if (!routine) return false;
  // Copia profunda para no compartir referencias con el estado de la pantalla
  routine.days = JSON.parse(JSON.stringify(days));
  return true;
}
