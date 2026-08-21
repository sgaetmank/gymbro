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
