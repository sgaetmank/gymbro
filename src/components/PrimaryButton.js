import { StyleSheet, Text, TouchableOpacity } from 'react-native';

// title: el texto que se muestra dentro del botón (string). Ej: "Iniciar Sesión", "Registrarme".
// onPress: la función que se ejecuta cuando el usuario toca el botón

export default function PrimaryButton({ title, onPress }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
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

  text: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '700',
  },
});
