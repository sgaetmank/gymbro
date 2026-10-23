import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Router } from 'express';

import { signToken } from '../auth';
import { prisma } from '../db';
import { toPublicUser } from '../serializers';
import { firstIssue, loginSchema, registerSchema } from '../validation';

export const authRouter = Router();

// Alta de un alumno. El rol NUNCA viene del cliente: siempre es ALUMNO.
authRouter.post('/register', async (req, res) => {

  // Se valida primero (registerSchema). Un cuerpo inválido nunca llega a la base → 400
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: firstIssue(parsed.error) });
  }
  const data = parsed.data;

  try {
    const user = await prisma.user.create({
      data: {
        role: 'ALUMNO',
        email: data.email,
        dni: data.dni,
        passwordHash: await bcrypt.hash(data.password, 10),
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        age: data.age,
        weight: data.weight,
        height: data.height,
        phone: data.phone,
        emergencyPhone: data.emergencyPhone,
        healthInsurance: data.healthInsurance || '-',
        contraindications: data.contraindications || 'Ninguna',
        goal: data.goal,
      },
    });

    // 201 Created: se creó un recurso.
    // Respuesta: { token, user }
    res.status(201).json({ token: signToken(user.id, user.role), user: toPublicUser(user) });

  } catch (error) {
    // P2002 = violación de un campo único: la base es quien garantiza que no se repitan.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = String(error.meta?.target ?? '');
      return res.status(409).json({
        error: target.includes('dni')
          ? 'Ya existe una cuenta con ese DNI'
          : 'Ya existe una cuenta con ese email',
      });
    }

    // throw error para cualquier otro error: llega al manejador global (500).
    throw error;
  }
}); 

authRouter.post('/login', async (req, res) => {

  // Se valida primero (loginSchema). Un cuerpo inválido nunca llega a la base → 400.
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Completa email y contraseña' });
  }

  // findUnique por email (campo @unique, rápido).
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // bcrypt.compare vuelve a hashear la contraseña recibida con la misma sal y compara.
  const passwordOk = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;

  // Mismo mensaje para "no existe" y "contraseña mal": no se revela cuál fue.
  // si fueran distintos, un atacante podría averiguar qué emails están registrados.
  if (!user || !passwordOk) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  // Respuesta: { token, user }
  res.json({ token: signToken(user.id, user.role), user: toPublicUser(user) });
});
