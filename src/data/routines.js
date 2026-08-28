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
                name: 'Curva lateral de 45°',
                series: '4',
                repetitions: '10',
                weight: '0 kg',
                comments: '',
                instructions: 'Comenzar en posición de cuatro apoyos. Mantener la espalda estable y realizar el movimiento lentamente, respetando el rango de movimiento indicado.',
                video: 'https://tu-video.com/estiramiento.mp4',
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
                name: 'Estiramiento del equipo a cuatro patas',
                series: '2',
                repetitions: '20',
                weight: '0 kg',
                comments: '',
                instructions: 'Comenzar en posición de cuatro apoyos. Mantener la espalda estable y realizar el movimiento lentamente, respetando el rango de movimiento indicado.',
                video: 'https://tu-video.com/estiramiento.mp4',
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
                name: 'Bicicleta de aire',
                series: '2',
                repetitions: '15',
                weight: '1 kg',
                comments: '',
                instructions: 'Comenzar en posición de cuatro apoyos. Mantener la espalda estable y realizar el movimiento lentamente, respetando el rango de movimiento indicado.',
                video: 'https://tu-video.com/estiramiento.mp4',
              },
              {
                id: 5,
                type: 'exercise',
                name: 'Jalón lateral alternativo',
                series: '4',
                repetitions: '23',
                weight: '5 kg',
                comments: 'Nota: 32 PER LADO',
                instructions: 'Comenzar en posición de cuatro apoyos. Mantener la espalda estable y realizar el movimiento lentamente, respetando el rango de movimiento indicado.',
                video: 'https://tu-video.com/estiramiento.mp4',
              },
            ],
          },
        ],
      },
    ],
  },
];

export function getRoutineById(routineId) {
  return routines.find((routine) => routine.id === routineId);
}
