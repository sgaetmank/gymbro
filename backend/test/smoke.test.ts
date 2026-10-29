// Prueba de humo de punta a punta contra el servidor YA ENCENDIDO.
// Antes: npm run db:seed (deja la base en un estado conocido) y npm run dev (en otra terminal).
// Después: npm run smoke
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const BASE = process.env.API_URL ?? 'http://localhost:3000';
const GYM = { latitude: -34.6127955, longitude: -58.3661936 };
const PASSWORD = 'gymbro123';

type ApiResult = { status: number; body: any };

async function api(
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {}
): Promise<ApiResult> {
  const response = await fetch(`${BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function login(email: string, password = PASSWORD): Promise<ApiResult> {
  return api('/api/auth/login', { method: 'POST', body: { email, password } });
}

const unique = String(Date.now());
const newStudent = {
  firstName: 'Prueba',
  lastName: 'Humo',
  email: `humo.${unique}@example.com`,
  dni: unique.slice(-8),
  password: 'secreta123',
  gender: 'Femenino',
  age: 30,
  weight: 62.5,
  height: 165,
  phone: '3794000000',
  emergencyPhone: '3794000001',
  healthInsurance: '',
  contraindications: '',
  goal: 'Salud',
};

const routineBody = {
  days: [
    {
      name: 'Día 1',
      blocks: [
        {
          items: [
            { type: 'exercise', exerciseId: 'abs/45-side-bend', series: 4, repetitions: 10, weight: 0, comments: '' },
            { type: 'rest', time: 1.5, unit: 'minutos' },
            { type: 'exercise', exerciseId: 'glutes/dumbbell-lunge', series: 3, repetitions: 12, weight: 6.5, comments: 'Por pierna' },
          ],
        },
      ],
    },
  ],
};

describe('API de Gymbro', () => {
  let studentToken = '';
  let studentId = 0;
  let trainerToken = '';
  let dayId = 0;
  let emptyDayId = 0;

  it('responde /api/health', async () => {
    const res = await api('/api/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { ok: true });
  });

  describe('autenticación', () => {
    it('rechaza una contraseña incorrecta con 401', async () => {
      const res = await login('solgaetmank@gmail.com', 'incorrecta');
      assert.equal(res.status, 401);
    });

    it('inicia sesión como alumna de prueba y no devuelve el hash', async () => {
      const res = await login('solgaetmank@gmail.com');
      assert.equal(res.status, 200);
      assert.equal(res.body.user.role, 'ALUMNO');
      assert.ok(res.body.token);
      assert.ok(!JSON.stringify(res.body).includes('passwordHash'));
    });

    it('exige token en /api/me', async () => {
      assert.equal((await api('/api/me')).status, 401);
      const { body } = await login('solgaetmank@gmail.com');
      const me = await api('/api/me', { token: body.token });
      assert.equal(me.status, 200);
      assert.equal(me.body.user.email, 'solgaetmank@gmail.com');
    });

    it('registra un alumno nuevo (201) con valores por defecto', async () => {
      const res = await api('/api/auth/register', { method: 'POST', body: newStudent });
      assert.equal(res.status, 201);
      assert.equal(res.body.user.role, 'ALUMNO');
      assert.equal(res.body.user.healthInsurance, '-');
      assert.equal(res.body.user.contraindications, 'Ninguna');
      assert.equal(res.body.user.routineId, null);
      studentToken = res.body.token;
      studentId = res.body.user.id;
    });

    it('rechaza email y DNI repetidos con 409', async () => {
      const sameEmail = await api('/api/auth/register', {
        method: 'POST',
        body: { ...newStudent, dni: '11111111' },
      });
      assert.equal(sameEmail.status, 409);
      assert.match(sameEmail.body.error, /email/);

      const sameDni = await api('/api/auth/register', {
        method: 'POST',
        body: { ...newStudent, email: `otro.${unique}@example.com` },
      });
      assert.equal(sameDni.status, 409);
      assert.match(sameDni.body.error, /DNI/);
    });

    it('valida los datos del registro con 400', async () => {
      const badDni = await api('/api/auth/register', {
        method: 'POST',
        body: { ...newStudent, dni: '12.345.678' },
      });
      assert.equal(badDni.status, 400);
      assert.match(badDni.body.error, /DNI/);

      const noBody = await api('/api/auth/register', { method: 'POST', body: {} });
      assert.equal(noBody.status, 400);
    });

    it('ignora un rol enviado por el cliente (siempre ALUMNO)', async () => {
      const res = await api('/api/auth/register', {
        method: 'POST',
        body: {
          ...newStudent,
          email: `rol.${unique}@example.com`,
          dni: String(Number(unique.slice(-8)) + 1).padStart(8, '1'),
          role: 'ENTRENADOR',
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.user.role, 'ALUMNO');
    });
  });

  describe('permisos', () => {
    it('un alumno no puede ver la lista de alumnos (403)', async () => {
      const res = await api('/api/alumnos', { token: studentToken });
      assert.equal(res.status, 403);
    });

    it('el entrenador lista alumnos sin datos sensibles', async () => {
      const res = await login('entrenadormaniana@gmail.com');
      assert.equal(res.status, 200);
      assert.equal(res.body.user.role, 'ENTRENADOR');
      trainerToken = res.body.token;

      const list = await api('/api/alumnos', { token: trainerToken });
      assert.equal(list.status, 200);
      assert.ok(list.body.users.some((u: any) => u.email === 'solgaetmank@gmail.com'));
      assert.ok(list.body.users.every((u: any) => u.role === 'ALUMNO'));
      assert.ok(!JSON.stringify(list.body).includes('passwordHash'));
    });

    it('el entrenador no puede hacer check-in (403)', async () => {
      const res = await api('/api/checkins', {
        method: 'POST',
        token: trainerToken,
        body: { dayId: 1, qr: 'GYMBRO_CHECKIN_V1', ...GYM },
      });
      assert.equal(res.status, 403);
    });
  });

  describe('asistencia al gimnasio', () => {
    it('rechaza la salida si el alumno no tiene una entrada abierta', async () => {
      const res = await api('/api/checkins/salida', {
        method: 'POST',
        token: studentToken,
        body: { qr: 'GYMBRO_CHECKOUT_V1', ...GYM },
      });
      assert.equal(res.status, 409);
    });

    it('registra la entrada, evita duplicados y permite registrar la salida', async () => {
      const entry = await api('/api/checkins/entrada', {
        method: 'POST',
        token: studentToken,
        body: { qr: 'GYMBRO_CHECKIN_V1', ...GYM },
      });
      assert.equal(entry.status, 201);

      const duplicateEntry = await api('/api/checkins/entrada', {
        method: 'POST',
        token: studentToken,
        body: { qr: 'GYMBRO_CHECKIN_V1', ...GYM },
      });
      assert.equal(duplicateEntry.status, 409);

      const active = await api('/api/alumnos/activos', { token: trainerToken });
      assert.equal(active.status, 200);
      assert.ok(active.body.users.some((user: any) => user.id === studentId));

      const exit = await api('/api/checkins/salida', {
        method: 'POST',
        token: studentToken,
        body: { qr: 'GYMBRO_CHECKOUT_V1', ...GYM },
      });
      assert.equal(exit.status, 200);

      const noLongerActive = await api('/api/alumnos/activos', { token: trainerToken });
      assert.ok(!noLongerActive.body.users.some((user: any) => user.id === studentId));

      const duplicateExit = await api('/api/checkins/salida', {
        method: 'POST',
        token: studentToken,
        body: { qr: 'GYMBRO_CHECKOUT_V1', ...GYM },
      });
      assert.equal(duplicateExit.status, 409);
    });

    it('valida el QR y la ubicación para la entrada y la salida', async () => {
      const invalidQr = await api('/api/checkins/entrada', {
        method: 'POST',
        token: studentToken,
        body: { qr: 'QR_INCORRECTO', ...GYM },
      });
      assert.equal(invalidQr.status, 400);

      const farAway = await api('/api/checkins/salida', {
        method: 'POST',
        token: studentToken,
        body: { qr: 'GYMBRO_CHECKOUT_V1', latitude: -34.7, longitude: -58.5 },
      });
      assert.equal(farAway.status, 400);
    });
  });

  describe('rutinas', () => {
    it('el alumno nuevo todavía no tiene rutina', async () => {
      const res = await api('/api/me/rutina', { token: studentToken });
      assert.equal(res.status, 200);
      assert.equal(res.body.routine, null);
    });

    it('el entrenador lee la rutina de un alumno de prueba', async () => {
      const res = await api('/api/alumnos/2/rutina', { token: trainerToken });
      assert.equal(res.status, 200);
      assert.ok(res.body.routine.days.length > 0);
      const firstItem = res.body.routine.days[0].blocks[0].items[0];
      assert.equal(typeof firstItem.id, 'number');
    });

    it('rechaza una rutina inválida con 400 y no guarda nada', async () => {
      const bad = structuredClone(routineBody);
      (bad.days[0].blocks[0].items[0] as any).series = 0;
      const res = await api(`/api/alumnos/${studentId}/rutina`, {
        method: 'PUT',
        token: trainerToken,
        body: bad,
      });
      assert.equal(res.status, 400);
      const after = await api('/api/me/rutina', { token: studentToken });
      assert.equal(after.body.routine, null);
    });

    it('crea la rutina del alumno nuevo (la asigna) y la devuelve ordenada', async () => {
      const res = await api(`/api/alumnos/${studentId}/rutina`, {
        method: 'PUT',
        token: trainerToken,
        body: routineBody,
      });
      assert.equal(res.status, 200);
      const items = res.body.routine.days[0].blocks[0].items;
      assert.deepEqual(
        items.map((i: any) => i.type),
        ['exercise', 'rest', 'exercise']
      );
      assert.equal(items[1].time, 1.5);
      assert.equal(items[2].weight, 6.5);
      dayId = res.body.routine.days[0].id;

      const mine = await api('/api/me/rutina', { token: studentToken });
      assert.equal(mine.body.routine.days[0].id, dayId);
    });

    it('al guardar de nuevo reemplaza los días anteriores', async () => {
      const twoDays = { days: [routineBody.days[0], { name: 'Día 2', blocks: [] }] };
      const res = await api(`/api/alumnos/${studentId}/rutina`, {
        method: 'PUT',
        token: trainerToken,
        body: twoDays,
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.routine.days.length, 2);
      assert.notEqual(res.body.routine.days[0].id, dayId); // los ids se regeneran
      dayId = res.body.routine.days[0].id;
      emptyDayId = res.body.routine.days[1].id;
    });

    it('devuelve 404 para un alumno inexistente y 400 para un id inválido', async () => {
      assert.equal((await api('/api/alumnos/99999/rutina', { token: trainerToken })).status, 404);
      assert.equal((await api('/api/alumnos/abc/rutina', { token: trainerToken })).status, 400);
    });
  });

  describe('check-in y estadísticas', () => {
    it('rechaza un QR que no es de Gymbro (400)', async () => {
      const res = await api('/api/checkins', {
        method: 'POST',
        token: studentToken,
        body: { dayId, qr: 'OTRO_QR', ...GYM },
      });
      assert.equal(res.status, 400);
    });

    it('rechaza estar lejos del gimnasio (400)', async () => {
      const res = await api('/api/checkins', {
        method: 'POST',
        token: studentToken,
        body: { dayId, qr: 'GYMBRO_CHECKIN_V1', latitude: -34.7, longitude: -58.5 },
      });
      assert.equal(res.status, 400);
      assert.match(res.body.error, /lejos/);
    });

    it('rechaza registrar un día sin ejercicios (400)', async () => {
      const res = await api('/api/checkins', {
        method: 'POST',
        token: studentToken,
        body: { dayId: emptyDayId, qr: 'GYMBRO_CHECKIN_V1', ...GYM },
      });
      assert.equal(res.status, 400);
      assert.match(res.body.error, /sin ejercicios|no tiene ejercicios/);
    });

    it('no deja registrar un día de la rutina de otro alumno (404)', async () => {
      const sols = await api('/api/alumnos/2/rutina', { token: trainerToken });
      const res = await api('/api/checkins', {
        method: 'POST',
        token: studentToken,
        body: { dayId: sols.body.routine.days[0].id, qr: 'GYMBRO_CHECKIN_V1', ...GYM },
      });
      assert.equal(res.status, 404);
    });

    it('registra el entrenamiento (201) con ejercicios y grupos del servidor', async () => {
      const res = await api('/api/checkins', {
        method: 'POST',
        token: studentToken,
        body: { dayId, qr: 'GYMBRO_CHECKIN_V1', ...GYM },
      });
      assert.equal(res.status, 201, JSON.stringify(res.body));
      assert.deepEqual(
        res.body.log.exercises.map((e: any) => e.exerciseId),
        ['abs/45-side-bend', 'glutes/dumbbell-lunge']
      );
      assert.deepEqual(
        res.body.log.exercises.map((e: any) => e.muscleGroup),
        ['Abdomen', 'Glúteos']
      );
      assert.match(res.body.log.date, /^\d{4}-\d{2}-\d{2}$/);
    });

    it('lista los registros del mes y cuenta los días entrenados', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const logs = await api(`/api/me/registros?year=${year}&month=${month}`, { token: studentToken });
      assert.equal(logs.status, 200);
      assert.equal(logs.body.logs.length, 1);

      const days = await api(`/api/me/dias-entrenados?year=${year}`, { token: studentToken });
      assert.equal(days.status, 200);
      assert.equal(days.body.days, 1);

      const invalid = await api('/api/me/registros?year=abc&month=13', { token: studentToken });
      assert.equal(invalid.status, 400);
    });

    it('los datos de prueba tienen historial (alumna de prueba)', async () => {
      const { body } = await login('solgaetmank@gmail.com');
      const res = await api('/api/me/registros?year=2026&month=8', { token: body.token });
      assert.equal(res.status, 200);
      assert.ok(res.body.logs.length > 0);
    });
  });

  it('devuelve JSON en rutas inexistentes y en JSON inválido', async () => {
    const missing = await api('/api/nada');
    assert.equal(missing.status, 404);

    const broken = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ no es json',
    });
    assert.equal(broken.status, 400);
    assert.ok((await broken.json()).error);
  });
});
