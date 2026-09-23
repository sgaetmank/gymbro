/*Es un campo de texto reutilizable. Muestra una etiqueta arriba (por ejemplo "Email") y debajo el input, 
con el estilo oscuro de la app. Si es un campo de contraseña, agrega un ojito para mostrar u ocultar el texto.*/

//Sin este componente habría que repetir en cada pantalla el Text de la etiqueta, el TextInput, los estilos y la lógica del ojito. Se usa en dos pantallas:

// login.js:64: Email y Contraseña.
// signup.js:48: Nombre, Apellido, Email, DNI, Contraseña, Confirmar contraseña, y otros más abajo


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
  label, //Texto de la etiqueta arriba del input.
  placeholder, //Texto gris de ayuda cuando el campo está vacío.
  secureTextEntry = false, //Si es true, es un campo de contraseña. Por defecto false.
  value, //	El texto actual del campo
  onChangeText, //Función que se llama cuando el texto cambia. Recibe el nuevo texto como argumento.
  autoCapitalize = 'none', // Por defecto 'none', para que el teclado no ponga mayúscula automática
  keyboardType, //	Tipo de teclado, por ejemplo email-address para que aparezca la arroba
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
          secureTextEntry={secureTextEntry && !visible} //El texto se oculta solo si es un campo de contraseña y además el usuario no apretó el ojito.
          value={value}
          onChangeText={onChangeText}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
        />

        {
        // Es renderizado condicional: el botón solo existe si es campo de contraseña.
        }
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
    fontSize: 16,
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
    fontSize: 17,
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