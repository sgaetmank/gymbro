import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function UserHomeScreen() {
  return (
    <SafeAreaView style={styles.container}>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Inicio
        </Text>
      </View>


      {/* ======================================================
          CONTENIDO PRINCIPAL
      ====================================================== */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
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


      {/* ======================================================
          BARRA DE NAVEGACIÓN INFERIOR
      ====================================================== */}

      <View style={styles.bottomNav}>

        {/* INICIO */}

        <TouchableOpacity
          style={styles.navItem}
        >

          <Text style={[styles.navIcon, styles.activeNavIcon]}>
            ⌂
          </Text>

          <Text style={[styles.navText, styles.activeNavText]}>
            Inicio
          </Text>

        </TouchableOpacity>


        {/* RUTINAS */}

        <TouchableOpacity
          style={styles.navItem}
        >

          <Text style={styles.navIcon}>
            ⚒
          </Text>

          <Text style={styles.navText}>
            Rutinas
          </Text>

        </TouchableOpacity>


        {/* MI CUENTA */}

        <TouchableOpacity
          style={styles.navItem}
        >

          <Text style={styles.navIcon}>
            ♙
          </Text>

          <Text style={styles.navText}>
            Mi Cuenta
          </Text>

        </TouchableOpacity>


        {/* RELOJ */}

        <TouchableOpacity
          style={styles.navItem}
        >

          <Text style={styles.navIcon}>
            ◷
          </Text>

          <Text style={styles.navText}>
            Reloj
          </Text>

        </TouchableOpacity>


        {/* EXPLORAR */}

        <TouchableOpacity
          style={styles.navItem}
        >

          <Text style={styles.navIcon}>
            ▣
          </Text>

          <Text style={styles.navText}>
            Explorar
          </Text>

        </TouchableOpacity>

      </View>

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
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 20,
  },


  /* ==========================================================
     HEADER
  ========================================================== */

  header: {
    height: 58,
    backgroundColor: '#1D1D1D',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },


  /* ==========================================================
     SALUDO
  ========================================================== */

  greetingContainer: {
    marginBottom: 17,
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
    minHeight: 78,
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
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
    padding: 11,
    minHeight: 61,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
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


  /* ==========================================================
     BARRA DE NAVEGACIÓN
  ========================================================== */

  bottomNav: {
    height: 60,
    backgroundColor: '#1D1D1D',
    borderTopWidth: 1,
    borderTopColor: '#292929',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navIcon: {
    color: '#666666',
    fontSize: 16,
    marginBottom: 3,
  },

  navText: {
    color: '#666666',
    fontSize: 6.5,
  },

  activeNavIcon: {
    color: '#FFC107',
  },

  activeNavText: {
    color: '#FFC107',
  },

});