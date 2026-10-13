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
    throw error;
  }
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Completa email y contraseña' });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const passwordOk = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;

  // Mismo mensaje para "no existe" y "contraseña mal": no se revela cuál fue.
  if (!user || !passwordOk) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  res.json({ token: signToken(user.id, user.role), user: toPublicUser(user) });
});
