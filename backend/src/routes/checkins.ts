import { Router } from 'express';

import { getAuth } from '../auth';
import { getCatalog } from '../catalog';
import { GYM } from '../config';
import { prisma } from '../db';
import { getDistanceInMeters, todayInTimeZone } from '../geo';
import { toApiLog } from '../serializers';
import { checkinSchema, firstIssue } from '../validation';

// Solo alumnos (ver app.ts).
export const checkinsRouter = Router();

// Registra un entrenamiento. El cliente manda solo QUÉ día hizo y DÓNDE está;
// los ejercicios, los grupos musculares y la fecha los decide el servidor.
checkinsRouter.post('/', async (req, res) => {
  const parsed = checkinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: firstIssue(parsed.error) });
  }
  const { dayId, qr, latitude, longitude } = parsed.data;

  if (qr !== GYM.qr) {
    return res.status(400).json({ error: 'Este código no corresponde a Gymbro' });
  }

  const distance = getDistanceInMeters({ latitude, longitude }, GYM);
  if (distance > GYM.radiusMeters) {
    return res.status(400).json({
      error: `Estás lejos del gimnasio (a ${Math.round(distance)} m). Acercate para registrar.`,
    });
  }

  const { userId } = getAuth(res);

  // El día tiene que pertenecer a la rutina de ESTE alumno.
  const day = await prisma.day.findFirst({
    where: { id: dayId, routine: { users: { some: { id: userId } } } },
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
    .flatMap((block) => block.items)
    .filter((item) => item.type === 'exercise')
    .map((item) => item.exerciseId)
    .filter((exerciseId): exerciseId is string => exerciseId !== null);

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
