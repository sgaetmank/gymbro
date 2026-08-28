import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import TrainerBottomNav from '../components/TrainerBottomNav';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export default function TrainerProfileScreen({ navigation }) {
  const { isLandscape } = useResponsiveLayout();

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}

      <View
        style={[
          styles.header,
          isLandscape && styles.headerLandscape,
        ]}
      >
        <Text style={styles.headerTitle}>
          Mi Cuenta
        </Text>
      </View>


      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          isLandscape && styles.contentLandscape,
        ]}
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


        {/* CERRAR SESIÓN */}

        <TouchableOpacity style={styles.logoutButton}
        onPress={() => navigation.navigate('login')}>

          <Text style={styles.logoutText}>
            Cerrar Sesión
          </Text>

        </TouchableOpacity>

      </ScrollView>


      <TrainerBottomNav
        activeScreen="account"
        navigation={navigation}
      />

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
    padding: '2.5%',
    paddingBottom: '5%',
  },

  contentLandscape: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  /* HEADER */

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
    minHeight: 56,
    paddingHorizontal: 24,
  },


  /* PERFIL */

  profile: {
    alignItems: 'center',
    paddingVertical: '3.5%',
    marginBottom: '1%',
  },

  avatar: {
    width: '14%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '2%',
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
    fontSize: 11,
    marginTop: 3,
  },


  /* CARDS */

  card: {
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    padding: '3%',
    marginBottom: '2.3%',
  },

  sectionTitle: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },


  /* DATOS */
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '3.5%',
    borderTopWidth: 1,
    borderTopColor: '#292929',
  },

  icon: {
    color: '#FFC107',
    fontSize: 13,
    width: '9%',
    textAlign: 'center',
    marginRight: '1.5%',
  },

  label: {
    color: '#777777',
    fontSize: 10,
    marginBottom: 2,
  },

  value: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },



  /* OBJETIVO */

  objective: {
    paddingVertical: '2.5%',
    backgroundColor: '#292929',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '3%',
  },

  objectiveIcon: {
    color: '#FFC107',
    fontSize: 15,
    marginRight: 9,
  },

  objectiveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },


  /* CERRAR SESIÓN */

  logoutButton: {
    paddingVertical: '3%',
    backgroundColor: '#FF4D4D',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '1.3%',
  },

  logoutText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },


});