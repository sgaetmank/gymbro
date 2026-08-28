import { StyleSheet } from 'react-native';

import { VideoView, useVideoPlayer } from 'expo-video';

export default function ExerciseVideo({ video }) {
  const player = useVideoPlayer(video, (player) => {
    player.loop = false;
    player.play();
  });

  return (
    <VideoView
      player={player}
      style={styles.video}
      nativeControls
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
