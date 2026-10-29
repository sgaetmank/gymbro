// Tipos que comparten las pantallas. Reflejan lo que devuelve el servidor
// una vez pasado por los adaptadores de src/services/api.ts.

export type User = {
  id: number;
  isTrainer: boolean;
  id_rutina?: number | null;
  name: string;
  initials: string;
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  gender: string;
  age: string;
  weight: string;
  height: string;
  phone: string;
  emergencyPhone: string;
  healthInsurance: string;
  contraindications: string;
  goal: string;
};

// Lo que completa el formulario de registro (la contraseña viaja solo al registrarse).
export type RegistrationData = Omit<
  User,
  'id' | 'isTrainer' | 'id_rutina' | 'name' | 'initials'
> & {
  password: string;
  confirmPassword?: string;
};

export type ExerciseRoutineItem = {
  id: number;
  type: 'exercise';
  exerciseId: string;
  series: string;
  repetitions: string;
  weight: string;
  comments: string;
};

export type RestRoutineItem = {
  id: number;
  type: 'rest';
  time: string;
  unit: 'minutos' | 'segundos';
};

export type RoutineItem = ExerciseRoutineItem | RestRoutineItem;

export type RoutineBlock = {
  id: number;
  items: RoutineItem[];
};

export type RoutineDay = {
  id: number;
  name: string;
  blocks: RoutineBlock[];
};

export type Routine = {
  id: number;
  name: string;
  days: RoutineDay[];
};

export type WorkoutExercise = {
  exerciseId: string;
  muscleGroup: string;
};

export type WorkoutLog = {
  id: number;
  userId: number;
  date: string;
  exercises: WorkoutExercise[];
};
