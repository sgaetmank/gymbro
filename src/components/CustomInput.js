import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CustomInput({
  label,
  placeholder,
  secureTextEntry = false,
  value,
  onChangeText,
  autoCapitalize = 'none',
  keyboardType,
}) {
  // Si la contraseña se ve o no (solo aplica cuando secureTextEntry es true)
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        {/* value/onChangeText: el padre controla lo que se escribe */}
        <TextInput
          style={[styles.input, secureTextEntry && styles.inputWithIcon]}
          placeholder={placeholder}
          placeholderTextColor="#777"
          secureTextEntry={secureTextEntry && !visible}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
        />

        {/* Ojito: tachado = contraseña oculta, abierto = visible */}
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setVisible((v) => !v)}
          >
            <Ionicons
              name={visible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#777"
            />
          </TouchableOpacity>
        )}
      </View>
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

  inputWrapper: {
    width: '100%',
    justifyContent: 'center',
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

  // Deja lugar a la derecha para que el texto no quede debajo del ojito
  inputWithIcon: {
    paddingRight: 46,
  },

  eyeButton: {
    position: 'absolute',
    right: 0,
    height: 52,
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
});