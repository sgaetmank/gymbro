import { StyleSheet } from 'react-native';

// expo-image: el componente de imágenes de Expo. A diferencia del <Image> de
// React Native, reproduce GIFs animados en Android, iOS y web, y los guarda en caché.
import { Image } from 'expo-image';

export default function ExerciseGif({ gif }: { gif: string }) {
  return (
    <Image
      source={{ uri: gif }} // URL del GIF que viene de la API
      style={styles.gif}
      contentFit="contain" // muestra el GIF entero, sin recortarlo
      transition={200} // aparece con un fundido corto cuando termina de cargar
      // autoplay es true por defecto: el GIF se reproduce en loop solo
    />
  );
}

const styles = StyleSheet.create({
  gif: {
    width: '100%',
    aspectRatio: 1, // los GIFs de la API son cuadrados (360x360)
    backgroundColor: '#FFFFFF', // los GIFs tienen fondo blanco
    borderRadius: 7,
    alignSelf: 'center',
  },
});
