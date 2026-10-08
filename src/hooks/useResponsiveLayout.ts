// Hook que expone las dimensiones de la ventana para adaptar la interfaz según la orientación y el tamaño del dispositivo.
//
// Devuelve:
//   - width / height: dimensiones actuales de la ventana (se actualizan al rotar).
//   - isLandscape: true si el ancho es mayor que el alto (modo horizontal).
//   - isWideScreen: true si el ancho es >= 700, útil para detectar tablets.
//
// Uso: las pantallas lo importan para aplicar estilos condicionales, p. ej: isLandscape && styles.contentLandscape

import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,
    isLandscape: width > height,
    isWideScreen: width >= 700,
  };
}

