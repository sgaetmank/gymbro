import { z } from 'zod';

// Convierte un parámetro de la URL en un id válido (o null si no lo es).
export function parseId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Primer problema de un esquema, con la ruta del campo (sirve para depurar).
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Datos inválidos';
  return issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message;
}

// ---------- Registro y login ----------

export const GENDERS = ['Femenino', 'Masculino'] as const;
export const GOALS = ['Salud', 'Bajar de peso', 'Fuerza', 'Tonificar', 'Otro'] as const;

const REQUIRED = 'Completa todos los campos obligatorios';
const NUMBERS = 'Edad, peso y altura deben ser números válidos';
const requiredText = z.string({ error: REQUIRED }).trim().min(1, REQUIRED);

export const registerSchema = z.object({
  firstName: requiredText,
  lastName: requiredText,
  email: z
    .string({ error: REQUIRED })
    .trim()
    .toLowerCase()
    .regex(/^\S+@\S+\.\S+$/, 'El email no es válido'),
  dni: z
    .string({ error: REQUIRED })
    .trim()
    .regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 números, sin puntos'),
  password: z
    .string({ error: REQUIRED })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  gender: z.enum(GENDERS, { error: REQUIRED }),
  age: z.number({ error: NUMBERS }).int(NUMBERS).positive(NUMBERS).max(120, NUMBERS),
  weight: z.number({ error: NUMBERS }).positive(NUMBERS).max(500, NUMBERS),
  height: z.number({ error: NUMBERS }).positive(NUMBERS).max(300, NUMBERS),
  phone: requiredText,
  emergencyPhone: requiredText,
  healthInsurance: z.string().trim().optional(),
  contraindications: z.string().trim().optional(),
  goal: z.enum(GOALS, { error: REQUIRED }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
});

// ---------- Rutina ----------

const exerciseItemSchema = z.object({
  type: z.literal('exercise'),
  exerciseId: z.string().trim().min(1),
  series: z.number().int().min(1).max(100),
  repetitions: z.number().int().min(1).max(1000),
  weight: z.number().min(0).max(1000), // en kg; 0 = peso corporal
  comments: z.string().max(500).default(''),
});

const restItemSchema = z.object({
  type: z.literal('rest'),
  time: z.number().min(0).max(1000),
  unit: z.enum(['minutos', 'segundos']),
});

const itemSchema = z.discriminatedUnion('type', [exerciseItemSchema, restItemSchema]);

export const routineSchema = z.object({
  days: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        blocks: z
          .array(z.object({ items: z.array(itemSchema).max(50) }))
          .max(30),
      })
    )
    .max(14),
});

export type RoutineInput = z.infer<typeof routineSchema>;
export type ItemInput = RoutineInput['days'][number]['blocks'][number]['items'][number];

// ---------- Check-in ----------

export const checkinSchema = z.object({
  dayId: z.number().int().positive(),
  qr: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// ---------- Consultas ----------

export const monthQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const yearQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
});
