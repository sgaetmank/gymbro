import type { Prisma } from '@prisma/client';
import { Router } from 'express';

import { prisma } from '../db';
import { ROUTINE_INCLUDE, toApiRoutine, toPublicUser } from '../serializers';
import { firstIssue, parseId, routineSchema, type ItemInput } from '../validation';

// Todas estas rutas son solo para entrenadores (ver app.ts).
export const alumnosRouter = Router();

// Lista de alumnos (la pantalla de búsqueda filtra por texto en el cliente).
alumnosRouter.get('/', async (_req, res) => {
  const alumnos = await prisma.user.findMany({
    where: { role: 'ALUMNO' },
    orderBy: { id: 'asc' },
  });
  res.json({ users: alumnos.map(toPublicUser) });
});

// Rutina de un alumno (null si todavía no tiene).
alumnosRouter.get('/:id/rutina', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'El id no es válido' });
  }

  const alumno = await prisma.user.findFirst({
    where: { id, role: 'ALUMNO' },
    select: { routineId: true },
  });
  if (!alumno) {
    return res.status(404).json({ error: 'No existe ese alumno' });
  }

  const routine =
    alumno.routineId !== null
      ? await prisma.routine.findUnique({ where: { id: alumno.routineId }, include: ROUTINE_INCLUDE })
      : null;

  res.json({ routine: routine ? toApiRoutine(routine) : null });
});

function toItemData(item: ItemInput, position: number): Prisma.ItemCreateWithoutBlockInput {
  return item.type === 'exercise'
    ? {
        position,
        type: 'exercise',
        exerciseId: item.exerciseId,
        series: item.series,
        repetitions: item.repetitions,
        weightKg: item.weight,
        comments: item.comments,
      }
    : { position, type: 'rest', restTime: item.time, restUnit: item.unit };
}

// Guarda la rutina completa de un alumno (la reemplaza). Si no tenía, la crea y se la asigna.
// Todo ocurre en una transacción: o se guarda entero, o no se guarda nada.
alumnosRouter.put('/:id/rutina', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'El id no es válido' });
  }
  const parsed = routineSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: `La rutina no es válida: ${firstIssue(parsed.error)}` });
  }
  const { days } = parsed.data;

  const routine = await prisma.$transaction(async (tx) => {
    const alumno = await tx.user.findFirst({
      where: { id, role: 'ALUMNO' },
      select: { routineId: true },
    });
    if (!alumno) {
      return null;
    }

    let routineId = alumno.routineId;
    if (routineId === null) {
      const created = await tx.routine.create({ data: {} });
      routineId = created.id;
      await tx.user.update({ where: { id }, data: { routineId } });
    }

    await tx.routine.update({
      where: { id: routineId },
      data: {
        days: {
          deleteMany: {}, // borra los días anteriores (y, en cascada, sus bloques e ítems)
          create: days.map((day, dayIndex) => ({
            name: day.name,
            position: dayIndex,
            blocks: {
              create: day.blocks.map((block, blockIndex) => ({
                position: blockIndex,
                items: { create: block.items.map((item, itemIndex) => toItemData(item, itemIndex)) },
              })),
            },
          })),
        },
      },
    });

    return tx.routine.findUniqueOrThrow({ where: { id: routineId }, include: ROUTINE_INCLUDE });
  });

  if (!routine) {
    return res.status(404).json({ error: 'No existe ese alumno' });
  }
  res.json({ routine: toApiRoutine(routine) });
});
