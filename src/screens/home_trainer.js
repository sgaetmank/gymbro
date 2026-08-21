import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeTrainerScreen() {
  return (
    <SafeAreaView style={styles.container}>

      {/* Barra superior */}
      <View style={styles.header}>
        <Text style={styles.backIcon}>‹</Text>

        <Text style={styles.headerTitle}>
          Panel de Entrenador
        </Text>
      </View>

      {/* Contenido */}
      <View style={styles.content}>

        <Text style={styles.title}>
          Hola, Entrenador!
        </Text>

        <Text style={styles.subtitle}>
          ¿Qué deseas hacer hoy?
        </Text>

        {/* Buscar usuario */}
        <TouchableOpacity style={styles.card}>

          <View style={styles.iconContainer}>
            <Text style={styles.icon}>
              ⌕
            </Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Buscar Usuario
            </Text>

            <Text style={styles.cardDescription}>
              Busca un alumno existente para ver sus
              datos o editar su rutina de entrenamiento.
            </Text>
          </View>

        </TouchableOpacity>

      </View>

      {/* Cerrar sesión */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.logoutButton}>

          <Text style={styles.logoutIcon}>
            ⇥
          </Text>

          <Text style={styles.logoutText}>
            Cerrar Sesión
          </Text>

        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010',
  },

  /* HEADER */

  header: {
    minHeight: '7%',
    paddingVertical: '1.5%',
    backgroundColor: '#1D1D1D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '4%',
  },

  backIcon: {
    color: '#FFFFFF',
    fontSize: 27,
    marginRight: 12,
    fontWeight: '300',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },

  /* CONTENIDO */

  content: {
    flex: 1,
    paddingHorizontal: '2.5%',
    paddingTop: '4.5%',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  subtitle: {
    color: '#FFC107',
    fontSize: 10,
    marginTop: '1%',
    marginBottom: '4%',
  },

  /* CARD */

  card: {
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    minHeight: '8%',
    padding: '3%',
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconContainer: {
    width: '10%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#2B2615',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '3%',
  },

  icon: {
    color: '#FFC107',
    fontSize: 26,
    fontWeight: '300',
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },

  cardDescription: {
    color: '#8E8E8E',
    fontSize: 9,
    lineHeight: 13,
  },

  /* CERRAR SESIÓN */

  bottomContainer: {
    paddingHorizontal: '2.5%',
    paddingBottom: '2.5%',
  },

  logoutButton: {
    paddingVertical: '3%',
    backgroundColor: '#FF4D55',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  logoutIcon: {
    color: '#FFFFFF',
    fontSize: 15,
    marginRight: 5,
  },

  logoutText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});