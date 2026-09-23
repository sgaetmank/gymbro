import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export default function LoginScreen({ navigation }) {
  const { isLandscape } = useResponsiveLayout();
  const { login } = useAuth();

  // Lo que el usuario escribe y el mensaje de error a mostrar
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Valida que no haya campos vacíos y luego las credenciales.
  // Si son correctas, el navegador cambia de pantalla solo.
  const handleLogin = () => {
    if (!email.trim() || !password) {
      setError('Completa email y contraseña');
      return;
    }

    const result = login(email, password);
    if (!result.ok) setError(result.error ?? '');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isLandscape && styles.scrollContentLandscape,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View style={[styles.card, isLandscape && styles.cardLandscape]}>

        {/* Icono */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>↪</Text>
        </View>

        {/* Título */}
        <Text style={styles.title}>
          Bienvenido de vuelta
        </Text>

        <Text style={styles.subtitle}>
          Ingresa tus credenciales para continuar
        </Text>

        {/* Email */}
        <CustomInput
          label="Email"
          placeholder="tu@email.com"
          keyboardType="email-address"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError(''); //el mensaje de error no debe quedar pegado en pantalla mientras el usuario ya está corrigiendo lo que escribió
          }}
        />

        {/* Contraseña */}
        <CustomInput
          label="Contraseña"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError('');
          }}
        />

        {/* Recordarme */}
        <View style={styles.rememberContainer}>
          <View style={styles.checkbox} />

          <Text style={styles.rememberText}>
            Mantener sesión abierta
          </Text>
        </View>

        {/*Renderizado condicional (si hay errores): Mensaje de error (campos vacíos o credenciales incorrectas) */}
        {error !== '' && <Text style={styles.error}>{error}</Text>}

        {/* Botón */}
        <PrimaryButton title="Iniciar Sesión" onPress={handleLogin} />

        {/* Registro */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>
            ¿No tienes cuenta?
          </Text>

          <TouchableOpacity onPress={() => navigation.navigate('signup')}>
            <Text style={styles.registerLink}>
              Regístrate
            </Text>
          </TouchableOpacity>
        </View>

      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  card: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    padding: 16,
    alignSelf: 'center',
  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2B2615',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },

  scrollContentLandscape: {
    paddingVertical: 16,
  },

  cardLandscape: {
    paddingHorizontal: 24,
  },

  icon: {
    color: '#FFC107',
    fontSize: 25,
    fontWeight: 'bold',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
    textAlign: 'center',
  },

  subtitle: {
    color: '#999999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 26,
  },

  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -3,
    marginBottom: 5,
  },

  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#777777',
    borderRadius: 2,
    marginRight: 8,
  },

  rememberText: {
    color: '#999999',
    fontSize: 15,
  },

  error: {
    color: '#FF4D4D',
    fontSize: 15,
    marginBottom: 6,
  },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },

  registerText: {
    color: '#777777',
    fontSize: 15,
  },

  registerLink: {
    color: '#FFC107',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 3,
  },
});