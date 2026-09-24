import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import UserBottomNav from '../components/UserBottomNav';
import { useAuth } from '../context/AuthContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export default function UserHomeScreen({ navigation }) {
  const { isLandscape } = useResponsiveLayout();
  const { user } = useAuth();

  // Sin sesión (ej: mientras se anima el cierre de sesión) no se dibuja nada
  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <View style={[styles.header, isLandscape && styles.headerLandscape, ]}>
        <Text style={styles.headerTitle}>Inicio</Text>
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

          <Text style={styles.greeting}> Hola, {user.firstName}! </Text>

          <Text style={styles.subtitle}> Listo para destruir tus metas de hoy? </Text>

        </View>


        {/* ====================================================
            ESTADÍSTICAS
        ==================================================== */}

        <View style={styles.sectionBox}>

          <Text style={styles.sectionTitle}> Estadísticas </Text>

          <View style={styles.statsRow}>

            {/* DÍAS EN RACHA */}

            <View style={styles.statCard}>

              <Text style={styles.statIcon}> 〽 </Text>

              <Text style={styles.statNumber}> 0 </Text>

              <Text style={styles.statLabel}> Días en racha </Text>

            </View>

          </View>

        </View>


        {/* ====================================================
            PROGRESO DIARIO
        ==================================================== */}

        <View style={styles.sectionBox}>

          <View style={styles.progressRow}>

            <View style={styles.progressInfo}>

              <Text style={styles.progressTitle}> ¿Ya entrenaste hoy? </Text>

              <Text style={styles.progressSubtitle}> Escanea el QR para no perder la racha. </Text>

            </View>

            <TouchableOpacity style={styles.smallButton}>

              <Text style={styles.smallButtonText}> Escanear </Text>

            </TouchableOpacity>

          </View>

        </View>


        {/* ====================================================
            PRÓXIMO ENTRENAMIENTO
        ==================================================== */}

        <View style={styles.sectionBox}>


          <View style={styles.workoutRow}>

            <View style={styles.workoutInfo}>

              <Text style={styles.workoutTitle}> Tu rutina </Text>

              <Text style={styles.workoutSubtitle}> Clickea para ver los ejercicios. </Text>

            </View>


            {/* BOTÓN A ENTRENAR */}

            <TouchableOpacity style={styles.trainButton} onPress={() => navigation.navigate('mi_rutina_user')} >

              <Text style={styles.trainButtonText}> A entrenar </Text>

            </TouchableOpacity>

          </View>

        </View>

      </ScrollView>


      <UserBottomNav
        activeScreen="home"
        isLandscape={isLandscape}
        navigation={navigation}
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
    fontSize: 16,
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },

  subtitle: {
    color: '#777777',
    fontSize: 15,
  },


  /* ==========================================================
     CONTENEDOR DE SECCIÓN (Estadísticas / Progreso / Próximo
     entrenamiento). Cada sección es una única "caja" con borde
     amarillo claro, para diferenciarlas visualmente entre sí.
  ========================================================== */

  sectionBox: {
    backgroundColor: '#1D1D1D',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFE082',
    padding: '5.5%',
    marginBottom: '5%',
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },


  /* ==========================================================
     ESTADÍSTICAS
  ========================================================== */

  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '5%',
    paddingHorizontal: '3%',
  },

  statIcon: {
    color: '#FFC107',
    fontSize: 28,
    marginBottom: 2,
  },

  statNumber: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
  },

  statLabel: {
    color: '#888888',
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },


  /* ==========================================================
     PROGRESO DIARIO
  ========================================================== */

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  progressInfo: {
    flex: 1,
    paddingRight: 8,
  },

  progressTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },

  progressSubtitle: {
    color: '#777777',
    fontSize: 13,
    lineHeight: 14,
  },

  smallButton: {
    backgroundColor: '#FFC107',
    borderRadius: 18,
    paddingHorizontal: '4.5%',
    paddingVertical: '3%',
  },

  smallButtonText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },


  /* ==========================================================
     PRÓXIMO ENTRENAMIENTO
  ========================================================== */

  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  workoutInfo: {
    flex: 1,
  },

  workoutTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },

  workoutSubtitle: {
    color: '#777777',
    fontSize: 13,
  },

  trainButton: {
    backgroundColor: '#FFC107',
    borderRadius: 18,
    paddingHorizontal: '4.5%',
    paddingVertical: '3%',
    flexDirection: 'row',
    alignItems: 'center',
  },

  trainIcon: {
    color: '#111111',
    fontSize: 13,
    marginRight: 4,
  },

  trainButtonText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },


});