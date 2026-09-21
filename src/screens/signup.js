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

const GENDERS = ['Femenino', 'Masculino'];
const GOALS = ['Salud', 'Bajar de peso', 'Fuerza', 'Tonificar', 'Otro'];

// Todo lo que el usuario completa en el formulario
const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  dni: '',
  password: '',
  confirmPassword: '',
  gender: '',
  age: '',
  weight: '',
  height: '',
  phone: '',
  emergencyPhone: '',
  healthInsurance: '',
  contraindications: '',
  goal: '',
};

// Campos que no se pueden dejar vacíos (Obra Social y Contraindicaciones son opcionales)
const REQUIRED_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'dni',
  'password',
  'confirmPassword',
  'gender',
  'age',
  'weight',
  'height',
  'phone',
  'emergencyPhone',
  'goal',
];

// Fila de opciones tipo "pastilla": la elegida se resalta en amarillo
function OptionChips({ options, selected, onSelect }) {
  return (
    <View style={styles.optionsRow}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.option, selected === option && styles.optionSelected]}
          onPress={() => onSelect(option)}
        >
          <Text
            style={[
              styles.optionText,
              selected === option && styles.optionTextSelected,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function SignUpScreen({ navigation }) {
  const { isLandscape } = useResponsiveLayout();
  const { register } = useAuth();

  // Lo que el usuario escribe y el mensaje de error a mostrar
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  // Devuelve la función que actualiza un campo y borra el error anterior
  const setField = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  // Valida el formulario y luego crea el usuario.
  // Si se crea bien, queda logueado y el navegador cambia de pantalla solo.
  const handleRegister = () => {
    if (REQUIRED_FIELDS.some((field) => !form[field].trim())) {
      setError('Completa todos los campos obligatorios');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError('El email no es válido');
      return;
    }

    if (!/^\d{7,8}$/.test(form.dni.trim())) {
      setError('El DNI debe tener 7 u 8 números, sin puntos');
      return;
    }

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // El peso y la altura pueden escribirse con coma (70,5)
    const age = Number(form.age);
    const weight = Number(form.weight.replace(',', '.'));
    const height = Number(form.height.replace(',', '.'));

    if (!Number.isInteger(age) || age <= 0 || !(weight > 0) || !(height > 0)) {
      setError('Edad, peso y altura deben ser números válidos');
      return;
    }

    const result = register({
      ...form,
      age: String(age),
      weight: String(weight),
      height: String(height),
    });
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
            <Text style={styles.icon}>♙</Text>
          </View>

          {/* Título */}
          <Text style={styles.title}>
            Crear Cuenta
          </Text>

          <Text style={styles.subtitle}>
            Únete al gimnasio y empieza a entrenar.
          </Text>

          {/* DATOS PERSONALES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Datos Personales
            </Text>

            <CustomInput
              label="Nombre"
              placeholder="Tu nombre"
              autoCapitalize="words"
              value={form.firstName}
              onChangeText={setField('firstName')}
            />

            <CustomInput
              label="Apellido"
              placeholder="Tu apellido"
              autoCapitalize="words"
              value={form.lastName}
              onChangeText={setField('lastName')}
            />

            <CustomInput
              label="Email"
              placeholder="tu@email.com"
              keyboardType="email-address"
              value={form.email}
              onChangeText={setField('email')}
            />

            <CustomInput
              label="DNI (Sin puntos)"
              placeholder="12345678"
              keyboardType="numeric"
              value={form.dni}
              onChangeText={setField('dni')}
            />

            <CustomInput
              label="Contraseña"
              placeholder="••••••••"
              secureTextEntry
              value={form.password}
              onChangeText={setField('password')}
            />

            <CustomInput
              label="Confirmar Contraseña"
              placeholder="••••••••"
              secureTextEntry
              value={form.confirmPassword}
              onChangeText={setField('confirmPassword')}
            />

            {/* Género */}
            <Text style={styles.label}>
              Género
            </Text>

            <OptionChips
              options={GENDERS}
              selected={form.gender}
              onSelect={setField('gender')}
            />

            {/* Datos físicos */}
            <View style={styles.physicalRow}>

              <View style={styles.physicalInput}>
                <CustomInput
                  label="Edad"
                  placeholder="21"
                  keyboardType="numeric"
                  value={form.age}
                  onChangeText={setField('age')}
                />
              </View>

              <View style={styles.physicalInput}>
                <CustomInput
                  label="Peso (kg)"
                  placeholder="70.5"
                  keyboardType="decimal-pad"
                  value={form.weight}
                  onChangeText={setField('weight')}
                />
              </View>

              <View style={styles.physicalInput}>
                <CustomInput
                  label="Altura (cm)"
                  placeholder="175"
                  keyboardType="numeric"
                  value={form.height}
                  onChangeText={setField('height')}
                />
              </View>

            </View>
          </View>

          {/* CONTACTO Y SALUD */}
          <View style={styles.section}>

            <Text style={styles.sectionTitle}>
              Contacto y Salud
            </Text>

            <CustomInput
              label="Teléfono de Contacto"
              placeholder="112345678"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={setField('phone')}
            />

            <CustomInput
              label="Tel. Emergencia"
              placeholder="112234455"
              keyboardType="phone-pad"
              value={form.emergencyPhone}
              onChangeText={setField('emergencyPhone')}
            />

            <CustomInput
              label="Obra Social (Opcional)"
              placeholder="OSDE, Swiss Medical..."
              autoCapitalize="words"
              value={form.healthInsurance}
              onChangeText={setField('healthInsurance')}
            />

            <CustomInput
              label="Contraindicaciones Médicas (Opcional)"
              placeholder="Alergias, lesiones, etc."
              autoCapitalize="sentences"
              value={form.contraindications}
              onChangeText={setField('contraindications')}
            />

          </View>

          {/* ENTRENAMIENTO */}
          <View style={styles.section}>

            <Text style={styles.sectionTitle}>
              Entrenamiento
            </Text>

            <Text style={styles.label}>
              Objetivo Principal
            </Text>

            <OptionChips
              options={GOALS}
              selected={form.goal}
              onSelect={setField('goal')}
            />

          </View>

          {/* Mensaje de error (campos vacíos, datos inválidos o cuenta ya existente) */}
          {error !== '' && <Text style={styles.error}>{error}</Text>}

          {/* Botón */}
          <PrimaryButton title="Registrarme" onPress={handleRegister} />

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },

  scrollContentLandscape: {
    paddingVertical: 12,
  },

  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    padding: 16,
  },

  cardLandscape: {
    maxWidth: 600,
    paddingHorizontal: 24,
  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2B2615',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
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
    marginBottom: 22,
  },

  section: {
    backgroundColor: '#181818',
    borderRadius: 7,
    padding: 12,
    marginBottom: 12,
  },

  sectionTitle: {
    color: '#FFC107',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },

  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },

  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 10,
  },

  option: {
    backgroundColor: '#292929',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  optionSelected: {
    backgroundColor: '#FFC107',
  },

  optionText: {
    color: '#AAAAAA',
    fontSize: 15,
  },

  optionTextSelected: {
    color: '#111111',
    fontWeight: '700',
  },

  physicalRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 3,
  },

  physicalInput: {
    flex: 1,
  },

  error: {
    color: '#FF4D4D',
    fontSize: 15,
    marginBottom: 6,
  },
});
