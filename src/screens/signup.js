import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';

export default function SignUpScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.card}>

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
            />

            <CustomInput
              label="Apellido"
              placeholder="Tu apellido"
            />

            <CustomInput
              label="Email"
              placeholder="tu@email.com"
            />

            <CustomInput
              label="DNI (Sin puntos)"
              placeholder="12345678"
            />

            <CustomInput
              label="Contraseña"
              placeholder="••••••••"
              secureTextEntry
            />

            <CustomInput
              label="Confirmar Contraseña"
              placeholder="••••••••"
              secureTextEntry
            />

            {/* Género */}
            <Text style={styles.label}>
              Género
            </Text>

            <View style={styles.optionsRow}>
              <View style={styles.option}>
                <Text style={styles.optionText}>
                  Femenino
                </Text>
              </View>

              <View style={styles.option}>
                <Text style={styles.optionText}>
                  Masculino
                </Text>
              </View>
            </View>

            {/* Datos físicos */}
            <View style={styles.physicalRow}>

              <View style={styles.physicalInput}>
                <Text style={styles.label}>
                  Edad
                </Text>

                <View style={styles.smallInput}>
                  <Text style={styles.placeholder}>
                    21
                  </Text>
                </View>
              </View>

              <View style={styles.physicalInput}>
                <Text style={styles.label}>
                  Peso (kg)
                </Text>

                <View style={styles.smallInput}>
                  <Text style={styles.placeholder}>
                    70.5
                  </Text>
                </View>
              </View>

              <View style={styles.physicalInput}>
                <Text style={styles.label}>
                  Altura (cm)
                </Text>

                <View style={styles.smallInput}>
                  <Text style={styles.placeholder}>
                    175
                  </Text>
                </View>
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
            />

            <CustomInput
              label="Tel. Emergencia"
              placeholder="112234455"
            />

            <CustomInput
              label="Obra Social (Opcional)"
              placeholder="OSDE, Swiss Medical..."
            />

            <CustomInput
              label="Contraindicaciones Médicas (Opcional)"
              placeholder="Alergias, lesiones, etc."
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

            <View style={styles.optionsRow}>
              <View style={styles.option}>
                <Text style={styles.optionText}>
                  Salud
                </Text>
              </View>

              <View style={styles.option}>
                <Text style={styles.optionText}>
                  Bajar de peso
                </Text>
              </View>

              <View style={styles.option}>
                <Text style={styles.optionText}>
                  Fuerza
                </Text>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <View style={styles.option}>
                <Text style={styles.optionText}>
                  Tonificar
                </Text>
              </View>

              <View style={styles.option}>
                <Text style={styles.optionText}>
                  Otro
                </Text>
              </View>
            </View>

          </View>

          {/* Botón */}
          <PrimaryButton title="Registrarme" />

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

  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    padding: 16,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2B2615',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
    marginBottom: 18,
  },

  section: {
    backgroundColor: '#181818',
    borderRadius: 7,
    padding: 12,
    marginBottom: 12,
  },

  sectionTitle: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 14,
  },

  label: {
    color: '#FFFFFF',
    fontSize: 10,
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
    paddingVertical: 7,
    paddingHorizontal: 12,
  },

  optionText: {
    color: '#AAAAAA',
    fontSize: 9,
  },

  physicalRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 3,
  },

  physicalInput: {
    flex: 1,
  },

  smallInput: {
    height: 40,
    backgroundColor: '#292929',
    borderRadius: 7,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  placeholder: {
    color: '#777777',
    fontSize: 11,
  },
});