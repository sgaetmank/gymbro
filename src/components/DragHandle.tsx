import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sortable from 'react-native-sortables';

// Barrita de arrastre: al mantenerla presionada y moverla, se desplaza el elemento.
// Solo puede usarse dentro de un Sortable.Flex con la prop customHandle.
export default function DragHandle() {
  return (
    <Sortable.Handle style={styles.handle}>
      <Ionicons name="reorder-two" size={20} color="#666666" />
    </Sortable.Handle>
  );
}

const styles = StyleSheet.create({
  handle: {
    width: 28,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
