/*

Zod es una librería para describir cómo debe ser un dato (un esquema) y comprobarlo

Esquema	--> z.object({ email: z.string(), age: z.number() })

safeParse(dato) -->	Devuelve { success: true, data } o { success: false, error }, sin lanzar excepciones

data --> ya está tipado y limpio. TypeScript sabe que data.age es number; los campos no declarados se descartan 

*/


import { z } from 'zod';

// Convierte el :id de una URL (siempre texto) en un número válido. "abc", "-3" o "1.5" dan null → la ruta responde 400.
export function parseId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Zod puede detectar varios problemas; esta función se queda con el primero y arma un mensaje con la ruta del campo 
// ejemplo: days.0.blocks.0.items.0.series: Too small…, útil para depurar.
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

// Solo comprueba que haya algo. La validación real es la comparación con la bas
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
});

// ---------- Rutina ----------

const exerciseItemSchema = z.object({
  type: z.literal('exercise'), // el campo tiene que valer exactamente ese texto.
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

// un ítem puede ser de dos formas distintas. 
// Zod mira el campo type y valida contra el esquema que corresponde:
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

// z.infer deduce el tipo de TypeScript a partir del esquema: una sola fuente de verdad para la forma de los datos.
export type RoutineInput = z.infer<typeof routineSchema>;
export type ItemInput = RoutineInput['days'][number]['blocks'][number]['items'][number];


// ---------- Check-in ----------

// Latitud entre -90 y 90, longitud entre -180 y 180: rangos físicos reales. 
// El check-in solo acepta estos cuatro campos: el cliente no puede mandar ejercicios ni fecha, el servidor los decide.
export const checkinSchema = z.object({
  dayId: z.number().int().positive(),
  qr: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const attendanceSchema = z.object({
  qr: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});


// ---------- Consultas ----------

// Los parámetros de la URL (?year=2026&month=8) llegan como texto. 
// z.coerce.number() los convierte a número antes de validar. 
// year=abc o month=13 → 40
export const monthQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const yearQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
});
