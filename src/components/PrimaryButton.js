import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function PrimaryButton({ title }) {
  return (
    <TouchableOpacity style={styles.button}>
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
    fontSize: 15,
    fontWeight: '700',
  },
});
