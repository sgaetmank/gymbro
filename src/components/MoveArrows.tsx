import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type MoveArrowsSize = 'day' | 'block' | 'item';

type MoveArrowsProps = {
  size?: MoveArrowsSize;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

// Dimensiones según el nivel de la jerarquía (día > bloque > ejercicio)
const SIZES: Record<MoveArrowsSize, { width: number; height: number; icon: number }> = {
  day: { width: 32, height: 28, icon: 18 },
  block: { width: 30, height: 26, icon: 16 },
  item: { width: 28, height: 24, icon: 15 },
};

export default function MoveArrows({
  size = 'day',
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: MoveArrowsProps) {
  const { width, height, icon } = SIZES[size];

  const renderButton = (
    name: 'chevron-up' | 'chevron-down',
    enabled: boolean,
    onPress: () => void,
    isLast: boolean
  ) => (
    <TouchableOpacity
      style={[
        styles.button,
        { width, height },
        !isLast && styles.buttonSpacing,
        !enabled && styles.buttonDisabled,
      ]}
      disabled={!enabled}
      activeOpacity={0.6}
      onPress={onPress}
    >
      <Ionicons name={name} size={icon} color={enabled ? '#FFC107' : '#444444'} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.column}>
      {renderButton('chevron-up', canMoveUp, onMoveUp, false)}
      {renderButton('chevron-down', canMoveDown, onMoveDown, true)}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    marginRight: 6,
  },

  button: {
    backgroundColor: '#2A2A2A',
    borderRadius: 7,
    borderWidth: 1,
    borderTopColor: '#4A4A4A',
    borderLeftColor: '#3A3A3A',
    borderRightColor: '#262626',
    borderBottomColor: '#141414',
    borderBottomWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonSpacing: {
    marginBottom: 3,
  },

  buttonDisabled: {
    backgroundColor: '#222222',
    borderTopColor: '#2E2E2E',
    borderBottomColor: '#1A1A1A',
  },
});
