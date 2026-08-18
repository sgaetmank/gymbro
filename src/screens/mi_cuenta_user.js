import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function UserProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Mi Cuenta
        </Text>
      </View>


      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* PERFIL */}

        <View style={styles.profile}>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              SG
            </Text>
          </View>

          <Text style={styles.name}>
            Sol Gaetmank
          </Text>

          <Text style={styles.email}>
            solgaetmank@gmail.com
          </Text>

        </View>


        {/* DATOS PERSONALES */}

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            Datos Personales
          </Text>

          <View style={styles.dataRow}>
            <Text style={styles.icon}>◉</Text>

            <View>
              <Text style={styles.label}>DNI</Text>
              <Text style={styles.value}>44363966</Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.icon}>♙</Text>

            <View>
              <Text style={styles.label}>Género</Text>
              <Text style={styles.value}>Femenino</Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.icon}>〽</Text>

            <View>
              <Text style={styles.label}>Edad</Text>
              <Text style={styles.value}>23 años</Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.icon}>〽</Text>

            <View>
              <Text style={styles.label}>Peso</Text>
              <Text style={styles.value}>75.5 kg</Text>
            </View>

          </View>

          <View style={styles.dataRow}>
            <Text style={styles.icon}>〽</Text>

            <View>
              <Text style={styles.label}>Altura</Text>
              <Text style={styles.value}>160 cm</Text>
            </View>
          </View>

        </View>


        {/* CONTACTO Y SALUD */}

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            Contacto y Salud
          </Text>

          <View style={styles.dataRow}>
            <Text style={styles.icon}>☎</Text>

            <View>
              <Text style={styles.label}>Teléfono</Text>
              <Text style={styles.value}>3794033628</Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.icon}>☎</Text>

            <View>
              <Text style={styles.label}>Tel. Emergencia</Text>
              <Text style={styles.value}>3794033620</Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.icon}>♡</Text>

            <View>
              <Text style={styles.label}>Obra Social</Text>
              <Text style={styles.value}>-</Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.icon}>▣</Text>

            <View>
              <Text style={styles.label}>
                Contraindicaciones
              </Text>

              <Text style={styles.value}>
                Ninguna
              </Text>
            </View>
          </View>

        </View>


        {/* OBJETIVOS */}

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            Objetivos
          </Text>

          <View style={styles.objective}>

            <Text style={styles.objectiveIcon}>
              ◎
            </Text>

            <Text style={styles.objectiveText}>
              Tonificar
            </Text>

          </View>

        </View>


        {/* CERRAR SESIÓN */}

        <TouchableOpacity style={styles.logoutButton}>

          <Text style={styles.logoutText}>
            Cerrar Sesión
          </Text>

        </TouchableOpacity>

      </ScrollView>


      {/* NAVEGACIÓN INFERIOR */}

      <View style={styles.bottomNav}>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>⌂</Text>
          <Text style={styles.navText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>⚒</Text>
          <Text style={styles.navText}>Rutinas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcon, styles.active]}>
            ♙
          </Text>

          <Text style={[styles.navText, styles.active]}>
            Mi Cuenta
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>◷</Text>
          <Text style={styles.navText}>Reloj</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>▣</Text>
          <Text style={styles.navText}>Explorar</Text>
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

  scroll: {
    flex: 1,
  },

  content: {
    padding: 10,
    paddingBottom: 20,
  },


  /* HEADER */

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


  /* PERFIL */

  profile: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 4,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 7,
  },

  avatarText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },

  name: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  email: {
    color: '#777777',
    fontSize: 8,
    marginTop: 3,
  },


  /* CARDS */

  card: {
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    padding: 11,
    marginBottom: 9,
  },

  sectionTitle: {
    color: '#FFC107',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
  },


  /* DATOS */

  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderTopWidth: 1,
    borderTopColor: '#292929',
  },

  icon: {
    color: '#FFC107',
    fontSize: 13,
    width: 32,
    textAlign: 'center',
    marginRight: 5,
  },

  label: {
    color: '#777777',
    fontSize: 7,
    marginBottom: 2,
  },

  value: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },



  /* OBJETIVO */

  objective: {
    height: 38,
    backgroundColor: '#292929',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  objectiveIcon: {
    color: '#FFC107',
    fontSize: 15,
    marginRight: 9,
  },

  objectiveText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },


  /* CERRAR SESIÓN */

  logoutButton: {
    height: 40,
    backgroundColor: '#FF4D4D',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },

  logoutText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },


  /* NAVEGACIÓN */

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

  active: {
    color: '#FFC107',
  },

});