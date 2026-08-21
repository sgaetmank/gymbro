import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.card}>

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
        />

        {/* Contraseña */}
        <CustomInput
          label="Contraseña"
          placeholder="••••••••"
          secureTextEntry
        />

        {/* Recordarme */}
        <View style={styles.rememberContainer}>
          <View style={styles.checkbox} />

          <Text style={styles.rememberText}>
            Mantener sesión abierta
          </Text>
        </View>

        {/* Botón */}
        <PrimaryButton title="Iniciar Sesión" />

        {/* Registro */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>
            ¿No tienes cuenta?
          </Text>

          <Text style={styles.registerLink}>
            Regístrate
          </Text>
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2B2615',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  scrollContent: {
  flexGrow: 1,
  justifyContent: 'center',
  paddingVertical: 20,
},

  icon: {
    color: '#FFC107',
    fontSize: 23,
    fontWeight: 'bold',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },

  subtitle: {
    color: '#999999',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 22,
  },

  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -3,
    marginBottom: 5,
  },

  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#777777',
    borderRadius: 2,
    marginRight: 6,
  },

  rememberText: {
    color: '#999999',
    fontSize: 9,
  },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },

  registerText: {
    color: '#777777',
    fontSize: 9,
  },

  registerLink: {
    color: '#FFC107',
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 3,
  },
});