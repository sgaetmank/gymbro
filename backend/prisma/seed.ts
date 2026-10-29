// Carga en la base los datos de prueba (backend/prisma/seed-data).
// Es seguro volver a correrlo: vacía las tablas y las vuelve a llenar.
import bcrypt from 'bcryptjs';

import '../src/env';
import { prisma } from '../src/db';
import { routines } from './seed-data/routines';
import { users } from './seed-data/users';
import { workoutLogs } from './seed-data/workoutLogs';

async function main() {
  // Se vacía de los hijos hacia los padres.
  await prisma.gymVisit.deleteMany();
  await prisma.workoutLogExercise.deleteMany();
  await prisma.workoutLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.routine.deleteMany(); // borra en cascada días, bloques e ítems

  for (const routine of routines) {
    await prisma.routine.create({
      data: {
        id: routine.id,
        name: routine.name,
        days: {
          create: routine.days.map((day, dayIndex) => ({
            name: day.name,
            position: dayIndex,
            blocks: {
              create: day.blocks.map((block, blockIndex) => ({
                position: blockIndex,
                items: {
                  create: block.items.map((item, itemIndex) =>
                    item.type === 'exercise'
                      ? {
                          position: itemIndex,
                          type: 'exercise',
                          exerciseId: item.exerciseId,
                          series: Number.parseInt(item.series, 10),
                          repetitions: Number.parseInt(item.repetitions, 10),
                          weightKg: Number.parseFloat(item.weight), // '20 kg' -> 20
                          comments: item.comments,
                        }
                      : {
                          position: itemIndex,
                          type: 'rest',
                          restTime: Number.parseFloat(item.time),
                          restUnit: item.unit,
                        }
                  ),
                },
              })),
            },
          })),
        },
      },
    });
  }

  // Todos los usuarios de prueba comparten contraseña: se hashea una sola vez.
  const hashes = new Map<string, string>();
  for (const user of users) {
    if (!hashes.has(user.password)) {
      hashes.set(user.password, await bcrypt.hash(user.password, 10));
    }
    await prisma.user.create({
      data: {
        id: user.id,
        role: user.isTrainer ? 'ENTRENADOR' : 'ALUMNO',
        email: user.email.toLowerCase(),
        dni: user.dni,
        passwordHash: hashes.get(user.password) ?? '',
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        age: Number.parseInt(user.age, 10), // '23 años' -> 23
        weight: Number.parseFloat(user.weight), // '75.5 kg' -> 75.5
        height: Number.parseFloat(user.height), // '160 cm' -> 160
        phone: user.phone,
        emergencyPhone: user.emergencyPhone,
        healthInsurance: user.healthInsurance,
        contraindications: user.contraindications,
        goal: user.goal,
        routineId: user.id_rutina ?? null,
      },
    });
  }

  for (const log of workoutLogs) {
    await prisma.workoutLog.create({
      data: {
        id: log.id,
        userId: log.userId,
        date: log.date,
        exercises: {
          create: log.exercises.map((exercise) => ({
            exerciseId: exercise.exerciseId,
            muscleGroup: exercise.muscleGroup,
          })),
        },
      },
    });
  }

  console.log(
    `Seed listo: ${users.length} usuarios, ${routines.length} rutinas, ${workoutLogs.length} registros.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
