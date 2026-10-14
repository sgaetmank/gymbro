import './env';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? '',
};

if (!config.jwtSecret) {
  throw new Error('Falta JWT_SECRET en backend/.env (ver .env.example)');
}

// Datos del gimnasio para validar el check-in (los mismos que usaba la app).
export const GYM = {
  qr: 'GYMBRO_CHECKIN_V1',
  latitude: -34.6127955,
  longitude: -58.3661936,
  radiusMeters: 1000, // TEMPORAL para pruebas: volver a 150
  timeZone: 'America/Argentina/Buenos_Aires',
};
