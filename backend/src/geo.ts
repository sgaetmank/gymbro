type Coordinates = { latitude: number; longitude: number };

/*
La fórmula de Haversine calcula la distancia más corta entre dos puntos sobre una esfera a partir de sus latitudes y longitudes. 
No se puede usar Pitágoras con coordenadas porque la Tierra es curva y un grado de longitud mide menos cerca de los polos.
*/
export function getDistanceInMeters(first: Coordinates, second: Coordinates): number {
  const earthRadius = 6371000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDifference = toRadians(second.latitude - first.latitude);
  const longitudeDifference = toRadians(second.longitude - first.longitude);
  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(first.latitude)) *
      Math.cos(toRadians(second.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Fecha de hoy como 'YYYY-MM-DD' en la zona horaria dada (no en UTC).
// timeZone: 'America/Argentina/Buenos_Aires'
export function todayInTimeZone(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
