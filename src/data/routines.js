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
    id: 2,
    name: 'Rutina Fuerza',
    days: [
      {
        id: 21,
        name: 'Día 1',
        blocks: [
          {
            id: 21,
            name: 'Fuerza de tren superior',
            items: [
              {
                id: 21,
                type: 'exercise',
                exerciseId: 4,
                series: '4',
                repetitions: '8',
                weight: '40 kg',
                comments: '',
              },
              {
                id: 22,
                type: 'rest',
                time: '2',
                unit: 'minutos',
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
  {
    id: 5,
    name: 'Rutina Tren Inferior',
    days: [
      {
        id: 51,
        name: 'Día 1',
        blocks: [
          {
            id: 51,
            name: 'Piernas',
            items: [
              {
                id: 51,
                type: 'exercise',
                exerciseId: 6,
                series: '4',
                repetitions: '10',
                weight: '60 kg',
                comments: '',
              },
              {
                id: 52,
                type: 'exercise',
                exerciseId: 11,
                series: '3',
                repetitions: '12',
                weight: '20 kg',
                comments: '',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 6,
    name: 'Rutina Movilidad',
    days: [
      {
        id: 61,
        name: 'Día 1',
        blocks: [
          {
            id: 61,
            name: 'Movilidad general',
            items: [
              {
                id: 61,
                type: 'exercise',
                exerciseId: 12,
                series: '3',
                repetitions: '30 segundos',
                weight: '0 kg',
                comments: '',
              },
              {
                id: 62,
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
