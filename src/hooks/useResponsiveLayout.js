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

"isLandscape indica si el ancho es mayor que el alto"
"isWideScreen permite identificar pantallas más amplias, como tablets"

"El hook es importado en las pantallas para aplicar estilos específicos cuando el dispositivo está en horizontal. "
"Se utilizaron estilos condicionales mediante expresiones como: isLandscape && styles.contentLandscape"