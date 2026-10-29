// constantes del servidor

import './env'; // Garantiza que el .env ya esté cargado

export const config = {
  port: Number(process.env.PORT ?? 3000), // Si no hay PORT, usa 3000.
  jwtSecret: process.env.JWT_SECRET ?? '', //  Si no hay JWT_SECRET, se lanza un error más abajo.
};

if (!config.jwtSecret) {  
  // Falla rápido: sin JWT_SECRET el servidor ni arranca. 
  // Es mejor que arrancar y firmar tokens con un secreto vacío (inseguro)
  throw new Error('Falta JWT_SECRET en backend/.env (ver .env.example)'); 
}

// Los datos del gimnasio que valida el check-in: texto del QR, coordenadas, radio de 150 m y zona horaria.
export const GYM = {
  qr: 'GYMBRO_CHECKIN_V1',
  exitQr: 'GYMBRO_CHECKOUT_V1',
  latitude: -34.6127955,
  longitude: -58.3661936,
  radiusMeters: 150,
  timeZone: 'America/Argentina/Buenos_Aires',
};
