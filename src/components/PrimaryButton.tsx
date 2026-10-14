import { StyleSheet, Text, TouchableOpacity } from 'react-native';

// title: el texto que se muestra dentro del botón (string). Ej: "Iniciar Sesión", "Registrarme".
// onPress: la función que se ejecuta cuando el usuario toca el botón
// disabled: bloquea el toque y atenúa el botón (ej: mientras se espera la respuesta del servidor)

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function PrimaryButton({ title, onPress, disabled = false }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 52,
    backgroundColor: '#FFC107',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  text: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '700',
  },
});
