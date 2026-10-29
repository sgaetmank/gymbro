import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type LoadingStateProps = {
  text: string;
  compact?: boolean; // versión chica, para listas y modales
};

// Indicador de carga: ruedita amarilla con un texto. Se muestra mientras se esperan datos.
export default function LoadingState({ text, compact = false }: LoadingStateProps) {
  return (
    <View style={[styles.box, compact && styles.boxCompact]}>
      <ActivityIndicator size={compact ? 'small' : 'large'} color="#FFC107" />
      <Text style={[styles.text, compact && styles.textCompact]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 14,
  },

  boxCompact: {
    paddingVertical: 12,
    gap: 8,
  },

  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  textCompact: {
    color: '#858585',
    fontSize: 14,
    fontWeight: '400',
  },
});
