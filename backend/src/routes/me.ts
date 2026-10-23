/*
Todas las rutas de este archivo hablan de quien hace el pedido, y lo saben por el token, no por la URL
*/

import { Router } from 'express';

import { getAuth } from '../auth';
import { prisma } from '../db';
import { ROUTINE_INCLUDE, toApiLog, toApiRoutine, toPublicUser } from '../serializers';
import { firstIssue, monthQuerySchema, yearQuerySchema } from '../validation';

// Un Router es un mini-servidor de rutas
export const meRouter = Router();

// Mi perfil (sirve para restaurar la sesión al abrir la app).
meRouter.get('/', async (_req, res) => {
  const user = await prisma.user.findUnique({ where: { id: getAuth(res).userId } });
  if (!user) {
    return res.status(401).json({ error: 'La cuenta ya no existe' });
  }
  res.json({ user: toPublicUser(user) });
});

// Mi rutina (null si todavía no tengo).
meRouter.get('/rutina', async (_req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: getAuth(res).userId },
    select: { routineId: true },
  });
  const routine =
    user?.routineId != null
      ? await prisma.routine.findUnique({ where: { id: user.routineId }, include: ROUTINE_INCLUDE })
      : null;

  res.json({ routine: routine ? toApiRoutine(routine) : null });
});

// Mis registros de entrenamiento de un mes: GET /api/me/registros?year=2026&month=8
meRouter.get('/registros', async (req, res) => {
  const parsed = monthQuerySchema.safeParse(req.query); // req.query son los parámetros después del ?. Se validan con monthQuerySchema (año 2000–2100, mes 1–12).
  if (!parsed.success) {
    return res.status(400).json({ error: firstIssue(parsed.error) });
  }
  const { year, month } = parsed.data;
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;

  const logs = await prisma.workoutLog.findMany({
    where: { userId: getAuth(res).userId, date: { startsWith: prefix } }, // selecciona exactamente los días de ese mes
    include: { exercises: true }, // trae los ejercicios de cada registro.
    orderBy: [{ date: 'asc' }, { id: 'asc' }], // con dos criterios: por fecha y, si hay dos el mismo día, por id (orden de creación).
  }); 

  res.json({ logs: logs.map(toApiLog) });
});

// Días distintos entrenados en un año: GET /api/me/dias-entrenados?year=2026
meRouter.get('/dias-entrenados', async (req, res) => {
  const parsed = yearQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: firstIssue(parsed.error) });
  }

  const dates = await prisma.workoutLog.findMany({
    where: { userId: getAuth(res).userId, date: { startsWith: `${parsed.data.year}-` } },
    select: { date: true },
    distinct: ['date'],
  });

  res.json({ days: dates.length });
});
