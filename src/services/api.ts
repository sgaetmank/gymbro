// Conexión con el servidor de Gymbro (backend/). Las pantallas no llaman a fetch:
// usan estas funciones, que devuelven los mismos tipos que ya usaba la app.
import Constants from 'expo-constants';

import type {
  RegistrationData,
  Routine,
  RoutineDay,
  User,
  WorkoutLog,
} from '../types';
import { buildApiUrl } from './apiUrl';

// Se detecta sola (la PC desde la que Expo Go cargó la app) o se fuerza con EXPO_PUBLIC_API_URL.
const API_URL = buildApiUrl(process.env.EXPO_PUBLIC_API_URL, Constants.expoConfig?.hostUri);
const REQUEST_TIMEOUT_MS = 6000;

export class ApiError extends Error {
  status: number; // 0 = no hubo respuesta (sin conexión o timeout)

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// El token de la sesión y el aviso de "sesión vencida" los maneja AuthContext.
let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function request<T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PUT'; body?: unknown } = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisá tu conexión.', 0);
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Con token y 401: la sesión venció o ya no es válida.
    if (response.status === 401 && authToken) {
      onUnauthorized?.();
    }
    throw new ApiError(data?.error ?? `Error del servidor (${response.status})`, response.status);
  }

  return data as T;
}

// ---------- Adaptadores: del formato del servidor al que usan las pantallas ----------

type ApiUser = {
  id: number;
  role: 'ALUMNO' | 'ENTRENADOR';
  routineId: number | null;
  firstName: string;
  lastName: string;
  email: string;
  dni: string;
  gender: string;
  age: number;
  weight: number;
  height: number;
  phone: string;
  emergencyPhone: string;
  healthInsurance: string;
  contraindications: string;
  goal: string;
};

type ApiItem =
  | {
      id: number;
      type: 'exercise';
      exerciseId: string;
      series: number;
      repetitions: number;
      weight: number;
      comments: string;
    }
  | { id: number; type: 'rest'; time: number; unit: 'minutos' | 'segundos' };

type ApiRoutine = {
  id: number;
  name: string;
  days: { id: number; name: string; blocks: { id: number; items: ApiItem[] }[] }[];
};

// El servidor guarda números; las pantallas muestran "23 años", "75.5 kg", "160 cm".
function adaptUser(user: ApiUser): User {
  return {
    id: user.id,
    isTrainer: user.role === 'ENTRENADOR',
    id_rutina: user.routineId,
    name: `${user.firstName} ${user.lastName}`,
    initials: `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    dni: user.dni,
    gender: user.gender,
    age: `${user.age} años`,
    weight: `${user.weight} kg`,
    height: `${user.height} cm`,
    phone: user.phone,
    emergencyPhone: user.emergencyPhone,
    healthInsurance: user.healthInsurance,
    contraindications: user.contraindications,
    goal: user.goal,
  };
}

function adaptRoutine(routine: ApiRoutine): Routine {
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
                exerciseId: item.exerciseId,
                series: String(item.series),
                repetitions: String(item.repetitions),
                weight: `${item.weight} kg`,
                comments: item.comments,
              }
            : {
                id: item.id,
                type: 'rest' as const,
                time: String(item.time),
                unit: item.unit,
              }
        ),
      })),
    })),
  };
}

// Al guardar: de los textos de las pantallas a los números que valida el servidor.
function toApiDays(days: RoutineDay[]) {
  return days.map((day) => ({
    name: day.name,
    blocks: day.blocks.map((block) => ({
      items: block.items.map((item) =>
        item.type === 'exercise'
          ? {
              type: 'exercise' as const,
              exerciseId: item.exerciseId,
              series: Number(item.series),
              repetitions: Number(item.repetitions),
              weight: Number.parseFloat(item.weight), // '20 kg' -> 20
              comments: item.comments,
            }
          : {
              type: 'rest' as const,
              time: Number(item.time),
              unit: item.unit,
            }
      ),
    })),
  }));
}

// ---------- Sesión ----------

export async function login(email: string, password: string) {
  const data = await request<{ token: string; user: ApiUser }>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return { token: data.token, user: adaptUser(data.user) };
}

export async function register(form: RegistrationData) {
  const data = await request<{ token: string; user: ApiUser }>('/api/auth/register', {
    method: 'POST',
    body: {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      dni: form.dni,
      password: form.password,
      gender: form.gender,
      age: Number(form.age),
      weight: Number(form.weight),
      height: Number(form.height),
      phone: form.phone,
      emergencyPhone: form.emergencyPhone,
      healthInsurance: form.healthInsurance,
      contraindications: form.contraindications,
      goal: form.goal,
    },
  });
  return { token: data.token, user: adaptUser(data.user) };
}

export async function getMe(): Promise<User> {
  const data = await request<{ user: ApiUser }>('/api/me');
  return adaptUser(data.user);
}

// ---------- Alumno ----------

export async function getMyRoutine(): Promise<Routine | null> {
  const data = await request<{ routine: ApiRoutine | null }>('/api/me/rutina');
  return data.routine ? adaptRoutine(data.routine) : null;
}

// month: 1 a 12
export async function getMyLogs(year: number, month: number): Promise<WorkoutLog[]> {
  const data = await request<{ logs: WorkoutLog[] }>(
    `/api/me/registros?year=${year}&month=${month}`
  );
  return data.logs;
}

export async function getTrainedDays(year: number): Promise<number> {
  const data = await request<{ days: number }>(`/api/me/dias-entrenados?year=${year}`);
  return data.days;
}

export async function createCheckin(input: {
  dayId: number;
  qr: string;
  latitude: number;
  longitude: number;
}): Promise<WorkoutLog> {
  const data = await request<{ log: WorkoutLog }>('/api/checkins', {
    method: 'POST',
    body: input,
  });
  return data.log;
}

// ---------- Entrenador ----------

export async function getAlumnos(): Promise<User[]> {
  const data = await request<{ users: ApiUser[] }>('/api/alumnos');
  return data.users.map(adaptUser);
}

export async function getAlumnoRoutine(userId: number): Promise<Routine | null> {
  const data = await request<{ routine: ApiRoutine | null }>(`/api/alumnos/${userId}/rutina`);
  return data.routine ? adaptRoutine(data.routine) : null;
}

export async function saveAlumnoRoutine(userId: number, days: RoutineDay[]): Promise<Routine> {
  const data = await request<{ routine: ApiRoutine }>(`/api/alumnos/${userId}/rutina`, {
    method: 'PUT',
    body: { days: toApiDays(days) },
  });
  return adaptRoutine(data.routine);
}
