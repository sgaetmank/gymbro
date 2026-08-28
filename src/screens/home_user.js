import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import UserBottomNav from '../components/UserBottomNav';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export default function UserHomeScreen() {
  const { isLandscape } = useResponsiveLayout();

  return (
    <SafeAreaView style={styles.container}>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <View
        style={[
          styles.header,
          isLandscape && styles.headerLandscape,
        ]}
      >
        <Text style={styles.headerTitle}>
          Inicio
        </Text>
      </View>


      {/* ======================================================
          CONTENIDO PRINCIPAL
      ====================================================== */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          isLandscape && styles.contentLandscape,
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* SALUDO */}

        <View style={styles.greetingContainer}>

          <Text style={styles.greeting}>
            Hola, Sol!
          </Text>

          <Text style={styles.subtitle}>
            Listo para destruir tus metas de hoy?
          </Text>

        </View>


        {/* ====================================================
            ESTADÍSTICAS
        ==================================================== */}

        <View style={styles.statsRow}>

          {/* DÍAS EN RACHA */}

          <View style={styles.statCard}>

            <Text style={styles.statIcon}>
              〽
            </Text>

            <Text style={styles.statNumber}>
              0
            </Text>

            <Text style={styles.statLabel}>
              Días en racha
            </Text>

          </View>


          {/* PUESTO EN EL GIMNASIO */}

          <View style={styles.statCard}>

            <Text style={styles.statIcon}>
              ◎
            </Text>

            <Text style={styles.statNumber}>
              #12
            </Text>

            <Text style={styles.statLabel}>
              Puesto en el gimnasio
            </Text>

          </View>

        </View>


        {/* ====================================================
            PROGRESO DIARIO
        ==================================================== */}

        <Text style={styles.sectionTitle}>
          Progreso Diario
        </Text>

        <View style={styles.progressCard}>

          <View style={styles.progressInfo}>

            <Text style={styles.progressTitle}>
              ¿Ya entrenaste hoy?
            </Text>

            <Text style={styles.progressSubtitle}>
              Registra tu sesión para no perder la racha.
            </Text>

          </View>

          <TouchableOpacity style={styles.smallButton}>

            <Text style={styles.smallButtonText}>
              Sí, entrené
            </Text>

          </TouchableOpacity>

        </View>


        {/* ====================================================
            PRÓXIMO ENTRENAMIENTO
        ==================================================== */}

        <Text style={styles.sectionTitle}>
          Tu próximo entrenamiento
        </Text>

        <View style={styles.nextWorkoutCard}>

          <View style={styles.workoutInfo}>

            <Text style={styles.workoutTitle}>
              Sin rutinas
            </Text>

            <Text style={styles.workoutSubtitle}>
              Contacta al entrenador
            </Text>

          </View>


          {/* BOTÓN A ENTRENAR */}

          <TouchableOpacity
            style={styles.trainButton}
            onPress={() => {
              
            }}
          >

            <Text style={styles.trainIcon}>
              ◉
            </Text>

            <Text style={styles.trainButtonText}>
              A entrenar
            </Text>

          </TouchableOpacity>

        </View>

      </ScrollView>


      <UserBottomNav
        activeScreen="home"
        isLandscape={isLandscape}
      />

    </SafeAreaView>
  );
}


// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  /* ==========================================================
     GENERAL
  ========================================================== */

  container: {
    flex: 1,
    backgroundColor: '#101010',
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: '2.5%',
    paddingTop: '5%',
    paddingBottom: '5%',
  },

  contentLandscape: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  /* ==========================================================
     HEADER
  ========================================================== */

  header: {
    minHeight: '7%',
    paddingVertical: '1.5%',
    backgroundColor: '#1D1D1D',
    justifyContent: 'center',
    paddingHorizontal: '4%',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },

  headerLandscape: {
    paddingHorizontal: 24,
    minHeight: 56,
  },


  /* ==========================================================
     SALUDO
  ========================================================== */

  greetingContainer: {
   marginBottom: '4%'
  },

  greeting: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

  subtitle: {
    color: '#777777',
    fontSize: 9,
  },


  /* ==========================================================
     ESTADÍSTICAS
  ========================================================== */

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 17,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '4%',
    paddingHorizontal: '2%',
  },

  statIcon: {
    color: '#FFC107',
    fontSize: 21,
    marginBottom: 2,
  },

  statNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  statLabel: {
    color: '#888888',
    fontSize: 7,
    marginTop: 2,
    textAlign: 'center',
  },


  /* ==========================================================
     TÍTULOS DE SECCIÓN
  ========================================================== */

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 7,
  },


  /* ==========================================================
     PROGRESO DIARIO
  ========================================================== */

  progressCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    padding: '3%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '4%',
  },

  nextWorkoutCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    padding: '3%',
    flexDirection: 'row',
    alignItems: 'center',
  },

  progressInfo: {
    flex: 1,
    paddingRight: 8,
  },

  progressTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },

  progressSubtitle: {
    color: '#777777',
    fontSize: 7,
    lineHeight: 10,
  },

  smallButton: {
    backgroundColor: '#FFC107',
    borderRadius: 18,
    paddingHorizontal: '3.5%',
    paddingVertical: '2%',
  },

  smallButtonText: {
    color: '#111111',
    fontSize: 8,
    fontWeight: '700',
  },


  /* ==========================================================
     PRÓXIMO ENTRENAMIENTO
  ========================================================== */

  nextWorkoutCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    padding: 11,
    minHeight: 61,
    flexDirection: 'row',
    alignItems: 'center',
  },

  workoutInfo: {
    flex: 1,
  },

  workoutTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },

  workoutSubtitle: {
    color: '#777777',
    fontSize: 7,
  },

  trainButton: {
    backgroundColor: '#FFC107',
    borderRadius: 18,
    paddingHorizontal: '3.5%',
    paddingVertical: '2%',
    flexDirection: 'row',
    alignItems: 'center',
  },

  trainIcon: {
    color: '#111111',
    fontSize: 10,
    marginRight: 4,
  },

  trainButtonText: {
    color: '#111111',
    fontSize: 8,
    fontWeight: '700',
  },


});