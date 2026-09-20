export const exercises = [
  {
    id: 1,
    name: '3/4 abdominales',
    muscleGroup: 'Abdomen',
    video: 'https://tu-video.com/34-abdominales.mp4',
    description: 'Realizar el movimiento de forma controlada, contrayendo el abdomen en cada repetición.',
  },
  {
    id: 2,
    name: 'Curva lateral de 45°',
    muscleGroup: 'Abdomen',
    video: 'https://tu-video.com/curva-lateral.mp4',
    description: 'Mantener la espalda estable y realizar el movimiento lentamente, respetando el rango de movimiento indicado.',
  },
  {
    id: 3,
    name: 'Bicicleta de aire',
    muscleGroup: 'Abdomen',
    video: 'https://tu-video.com/bicicleta-aire.mp4',
    description: 'Alternar codo con rodilla contraria manteniendo el core activado durante todo el movimiento.',
  },
  {
    id: 4,
    name: 'Press de banca',
    muscleGroup: 'Pecho',
    video: 'https://tu-video.com/press-banca.mp4',
    description: 'Bajar la barra de forma controlada hasta el pecho y empujar hacia arriba sin bloquear los codos.',
  },
  {
    id: 5,
    name: 'Sentadilla',
    muscleGroup: 'Pierna',
    video: 'https://tu-video.com/sentadilla.mp4',
    description: 'Bajar manteniendo la espalda recta y las rodillas alineadas con los pies.',
  },
  {
    id: 6,
    name: 'Prensa de piernas',
    muscleGroup: 'Pierna',
    video: 'https://tu-video.com/prensa-piernas.mp4',
    description: 'Empujar la plataforma sin despegar la zona lumbar del respaldo.',
  },
  {
    id: 7,
    name: 'Jalón lateral alternativo',
    muscleGroup: 'Espalda',
    video: 'https://tu-video.com/jalon-lateral.mp4',
    description: 'Tirar de la polea llevando el codo hacia atrás, controlando el regreso.',
  },
  {
    id: 8,
    name: 'Elevación lateral de hombro',
    muscleGroup: 'Hombro',
    video: 'https://tu-video.com/elevacion-lateral.mp4',
    description: 'Elevar los brazos hasta la altura de los hombros sin balancear el cuerpo.',
  },
  {
    id: 9,
    name: 'Estiramiento del equipo a cuatro patas',
    muscleGroup: 'Movilidad',
    video: 'https://tu-video.com/estiramiento.mp4',
    description: 'Comenzar en posición de cuatro apoyos. Mantener la espalda estable y realizar el movimiento lentamente, respetando el rango de movimiento indicado.',
  },
  {
    id: 10,
    name: 'Saltos de tijera',
    muscleGroup: 'Cardio',
    video: 'https://tu-video.com/saltos-tijera.mp4',
    description: 'Saltar abriendo y cerrando piernas y brazos de forma coordinada, aterrizando con las rodillas semiflexionadas.',
  },
  {
    id: 11,
    name: 'Extensión de cuádriceps',
    muscleGroup: 'Pierna',
    video: 'https://tu-video.com/extension-cuadriceps.mp4',
    description: 'Extender la pierna de forma controlada hasta casi estirarla del todo, sin bloquear la rodilla.',
  },
  {
    id: 12,
    name: 'Estiramiento de cadera',
    muscleGroup: 'Movilidad',
    video: 'https://tu-video.com/estiramiento-cadera.mp4',
    description: 'Mantener la posición de estiramiento sin rebotar, respirando de forma calmada durante todo el ejercicio.',
  },
];

export function getExerciseById(exerciseId) {
  return exercises.find((exercise) => exercise.id === exerciseId);
}
