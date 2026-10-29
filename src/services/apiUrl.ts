// Dónde está el servidor de Gymbro. Es una función pura (sin imports) para poder probarla sola.
const API_PORT = 3000;

// 1) Si EXPO_PUBLIC_API_URL está definida (en .env.local), esa manda.
// 2) Si no, en desarrollo Expo Go carga la app desde la PC: esa misma dirección (hostUri,
//    por ejemplo "192.168.0.117:8081") es la del servidor, solo cambia el puerto.
//    Así no hay que tocar nada cuando la PC cambia de red y de IP.
// 3) Sin ninguna de las dos (versión web, simulador de iOS): localhost.

export function buildApiUrl(explicit: string | undefined, hostUri: string | undefined): string {
  if (explicit) return explicit.replace(/\/$/, '');

  const host = hostUri?.split(':')[0];
  return `http://${host || 'localhost'}:${API_PORT}`;
}
