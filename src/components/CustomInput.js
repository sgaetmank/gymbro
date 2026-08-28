import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function CustomInput({
  label,
  placeholder,
  secureTextEntry = false,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#777"
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },

  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 7,
  },

  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#292929',
    borderRadius: 7,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
});