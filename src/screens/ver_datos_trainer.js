import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function UserDataScreen() {
  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>

        <TouchableOpacity>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Datos del Usuario
        </Text>

      </View>

      {/* CONTENIDO */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* PERFIL */}
        <View style={styles.profileCard}>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              SG
            </Text>
          </View>

          <View style={styles.profileInfo}>

            <Text style={styles.name}>
              Sol Gaetmank
            </Text>

            <Text style={styles.email}>
              solgaetmank@gmail.com
            </Text>

          </View>

        </View>


        {/* DATOS PERSONALES */}
        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Datos Personales
          </Text>

          <View style={styles.row}>

            <View style={styles.dataBox}>
              <Text style={styles.label}>
                Nombre
              </Text>

              <Text style={styles.value}>
                Sol
              </Text>
            </View>

            <View style={styles.dataBox}>
              <Text style={styles.label}>
                Apellido
              </Text>

              <Text style={styles.value}>
                Gaetmank
              </Text>
            </View>

          </View>

          <View style={styles.row}>

            <View style={styles.dataBox}>
              <Text style={styles.label}>
                DNI
              </Text>

              <Text style={styles.value}>
                12345678
              </Text>
            </View>

            <View style={styles.dataBox}>
              <Text style={styles.label}>
                Género
              </Text>

              <Text style={styles.value}>
                Femenino
              </Text>
            </View>

          </View>

        </View>


        {/* DATOS FÍSICOS */}
        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Datos Físicos
          </Text>

          <View style={styles.row}>

            <View style={styles.dataBox}>
              <Text style={styles.label}>
                Edad
              </Text>

              <Text style={styles.value}>
                23 años
              </Text>
            </View>

            <View style={styles.dataBox}>
              <Text style={styles.label}>
                Peso
              </Text>

              <Text style={styles.value}>
                70.5 kg
              </Text>
            </View>

            <View style={styles.dataBox}>
              <Text style={styles.label}>
                Altura
              </Text>

              <Text style={styles.value}>
                175 cm
              </Text>
            </View>

          </View>

        </View>


        {/* CONTACTO Y SALUD */}
        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Contacto y Salud
          </Text>

          <View style={styles.fullDataBox}>

            <Text style={styles.label}>
              Teléfono de Contacto
            </Text>

            <Text style={styles.value}>
              1123456789
            </Text>

          </View>

          <View style={styles.fullDataBox}>

            <Text style={styles.label}>
              Teléfono de Emergencia
            </Text>

            <Text style={styles.value}>
              1122344556
            </Text>

          </View>

          <View style={styles.fullDataBox}>

            <Text style={styles.label}>
              Obra Social
            </Text>

            <Text style={styles.value}>
              OSDE
            </Text>

          </View>

          <View style={styles.fullDataBox}>

            <Text style={styles.label}>
              Contraindicaciones Médicas
            </Text>

            <Text style={styles.value}>
              Ninguna registrada
            </Text>

          </View>

        </View>


        {/* ENTRENAMIENTO */}
        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Entrenamiento
          </Text>

          <Text style={styles.label}>
            Objetivo Principal
          </Text>

          <View style={styles.tag}>
            <Text style={styles.tagText}>
              Ganar fuerza
            </Text>
          </View>

        </View>

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  /* CONTENEDOR */

  container: {
    flex: 1,
    backgroundColor: '#101010',
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20,
  },

  /* HEADER */

  header: {
    height: 58,
    backgroundColor: '#1D1D1D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  backIcon: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '300',
    marginRight: 12,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },

  /* PERFIL */

  profileCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3A2B0D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarText: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: '700',
  },

  profileInfo: {
    flex: 1,
  },

  name: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  email: {
    color: '#888888',
    fontSize: 9,
    marginTop: 4,
  },

  /* SECCIONES */

  section: {
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },

  sectionTitle: {
    color: '#FFC107',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 12,
  },

  /* DATOS */

  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },

  dataBox: {
    flex: 1,
    backgroundColor: '#292929',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  fullDataBox: {
    backgroundColor: '#292929',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },

  label: {
    color: '#777777',
    fontSize: 8,
    marginBottom: 4,
  },

  value: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },

  /* OBJETIVO */

  tag: {
    alignSelf: 'flex-start',
    backgroundColor: '#3A2B0D',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 2,
  },

  tagText: {
    color: '#FFC107',
    fontSize: 9,
    fontWeight: '600',
  },

});