import { StyleSheet } from 'react-native';

// módulo oficial de Expo para reproducir video
// useVideoPlayer: un hook que crea y controla un "reproductor" 
// VideoView: el componente visual (la superficie donde se dibuja el video en pantalla
import { VideoView, useVideoPlayer } from 'expo-video';

export default function ExerciseVideo({ video }) {

  // Primer argumento (video): la fuente del video
  // Segundo argumento: función que recibe el reproductor recién creado y permite configurarlo.
  const player = useVideoPlayer(video, (player) => {
    player.loop = false; // que no se repita solo al terminar.
    player.play(); // arranca la reproducción automáticamente apenas está listo
  });

  return (
    <VideoView
      player={player} //conecta esta vista con el player creado arriba --> misma relación que value/onChangeText en un input controlado
      style={styles.video}
      nativeControls // play/pause, barra de progreso, volumen, pantalla completa...
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    borderRadius: 7,
    alignSelf: 'center',
  },
});
