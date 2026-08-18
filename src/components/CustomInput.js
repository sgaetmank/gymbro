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
    marginBottom: 14,
  },

  label: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },

  input: {
    height: 40,
    backgroundColor: '#292929',
    borderRadius: 7,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 12,
  },
});