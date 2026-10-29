import { Router, type Response } from 'express';

import { getAuth } from '../auth';
import { getCatalog } from '../catalog';
import { GYM } from '../config';
import { prisma } from '../db';
import { getDistanceInMeters, todayInTimeZone } from '../geo';
import { toApiLog } from '../serializers';
import { attendanceSchema, checkinSchema, firstIssue } from '../validation';

// Solo alumnos (ver app.ts).
export const checkinsRouter = Router();

function validateAttendance(body: unknown, res: Response, expectedQr: string) {
  const parsed = attendanceSchema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: firstIssue(parsed.error) });
    return null;
  }

  if (parsed.data.qr !== expectedQr) {
    res.status(400).json({ error: 'Este código no corresponde a Gymbro' });
    return null;
  }

  const distance = getDistanceInMeters(
    { latitude: parsed.data.latitude, longitude: parsed.data.longitude },
    GYM
  );
  if (distance > GYM.radiusMeters) {
    res.status(400).json({
      error: `Estás lejos del gimnasio (a ${Math.round(distance)} m). Acercate para registrar.`,
    });
    return null;
  }

  return parsed.data;
}

checkinsRouter.post('/entrada', async (req, res) => {
  const input = validateAttendance(req.body, res, GYM.qr);
  if (!input) return;

  const { userId } = getAuth(res);
  const openVisit = await prisma.gymVisit.findFirst({
    where: { userId, exitedAt: null },
    select: { id: true },
  });
  if (openVisit) {
    return res.status(409).json({ error: 'Ya tenés una entrada abierta y figurás dentro del gimnasio.' });
  }

  const visit = await prisma.gymVisit.create({ data: { userId } });
  res.status(201).json({ visit: { enteredAt: visit.enteredAt } });
});

checkinsRouter.post('/salida', async (req, res) => {
  const input = validateAttendance(req.body, res, GYM.exitQr);
  if (!input) return;

  const { userId } = getAuth(res);
  const openVisit = await prisma.gymVisit.findFirst({
    where: { userId, exitedAt: null },
    orderBy: { enteredAt: 'desc' },
    select: { id: true },
  });
  if (!openVisit) {
    return res.status(409).json({ error: 'No tenés una entrada abierta para registrar la salida.' });
  }

  const result = await prisma.gymVisit.updateMany({
    where: { id: openVisit.id, exitedAt: null },
    data: { exitedAt: new Date() },
  });
  if (result.count === 0) {
    return res.status(409).json({ error: 'Esta entrada ya fue cerrada. Volvé a intentarlo.' });
  }

  res.json({ ok: true });
});

// Registra un entrenamiento. El cliente manda solo QUÉ día hizo y DÓNDE está y el QR leido;
// los ejercicios, los grupos musculares y la fecha los decide el servidor.
checkinsRouter.post('/', async (req, res) => {

  const parsed = checkinSchema.safeParse(req.body); // exige un dayId entero positivo, un qr de texto y coordenadas en rango
  
  if (!parsed.success) {
    return res.status(400).json({ error: firstIssue(parsed.error) });
  }
  
  const { dayId, qr, latitude, longitude } = parsed.data;

  if (qr !== GYM.qr) { // Compara con la constante de config.ts (GYMBRO_CHECKIN_V1)
    return res.status(400).json({ error: 'Este código no corresponde a Gymbro' });
  }

  // calcula la distancia entre la ubicación del cliente y la del gimnasio; si está lejos, no deja registrar.
  // geo.ts
  const distance = getDistanceInMeters({ latitude, longitude }, GYM);
  if (distance > GYM.radiusMeters) {
    return res.status(400).json({
      error: `Estás lejos del gimnasio (a ${Math.round(distance)} m). Acercate para registrar.`,
    });
  }

  const { userId } = getAuth(res);

  // El día tiene que pertenecer a la rutina de ESTE alumno.
  const day = await prisma.day.findFirst({
    where: { id: dayId, routine: { user: { id: userId } } },
    include: {
      blocks: {
        orderBy: { position: 'asc' },
        include: { items: { orderBy: { position: 'asc' } } },
      },
    },
  });
  if (!day) {
    return res.status(404).json({ error: 'No encontramos ese día en tu rutina' });
  }

  const exerciseIds = day.blocks
    .flatMap((block) => block.items) // flatMap junta los ítems de todos los bloques en una sola lista
    .filter((item) => item.type === 'exercise') // Se descartan los descansos
    .map((item) => item.exerciseId)
    .filter((exerciseId): exerciseId is string => exerciseId !== null); // es una guarda de tipos: le dice a TypeScript que ya no quedan null

  if (exerciseIds.length === 0) {
    return res.status(400).json({ error: 'Ese día no tiene ejercicios para registrar' });
  }

  let catalog;
  try {
    catalog = await getCatalog();
  } catch {
    return res
      .status(503)
      .json({ error: 'No se pudo consultar el catálogo de ejercicios. Probá de nuevo en un rato.' });
  }

  if (exerciseIds.some((exerciseId) => !catalog.has(exerciseId))) {
    return res.status(422).json({ error: 'Hay ejercicios del día que no están en el catálogo' });
  }

  const log = await prisma.workoutLog.create({
    data: {
      userId,
      date: todayInTimeZone(GYM.timeZone),
      exercises: {
        create: exerciseIds.map((exerciseId) => ({
          exerciseId,
          muscleGroup: catalog.get(exerciseId) ?? '',
        })),
      },
    },
    include: { exercises: true },
  });

  res.status(201).json({ log: toApiLog(log) });
});
