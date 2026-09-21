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

export default function UserProfileScreen({ navigation }) {
  const { isLandscape } = useResponsiveLayout();
  const { user, logout } = useAuth();

  // Sin sesión (ej: mientras se anima el cierre de sesión) no se dibuja nada
  if (!user) return null;

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
              {user.initials}
            </Text>
          </View>

          <Text style={styles.name}>
            {user.name}
          </Text>

          <Text style={styles.email}>
            {user.email}
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
              <Text style={styles.value}>{user.dni}</Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.icon}>♙</Text>

            <View>
              <Text style={styles.label}>Género</Text>
              <Text style={styles.value}>{user.gender}</Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.icon}>〽</Text>

            <View>
              <Text style={styles.label}>Edad</Text>
              <Text style={styles.value}>{user.age}</Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.icon}>〽</Text>

            <View>
              <Text style={styles.label}>Peso</Text>
              <Text style={styles.value}>{user.weight}</Text>
            </View>

          </View>

          <View style={styles.dataRow}>
            <Text style={styles.icon}>〽</Text>

            <View>
              <Text style={styles.label}>Altura</Text>
              <Text style={styles.value}>{user.height}</Text>
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
              <Text style={styles.value}>{user.phone}</Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.icon}>☎</Text>

            <View>
              <Text style={styles.label}>Tel. Emergencia</Text>
              <Text style={styles.value}>{user.emergencyPhone}</Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.icon}>♡</Text>

            <View>
              <Text style={styles.label}>Obra Social</Text>
              <Text style={styles.value}>{user.healthInsurance}</Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.icon}>▣</Text>

            <View>
              <Text style={styles.label}>
                Contraindicaciones
              </Text>

              <Text style={styles.value}>
                {user.contraindications}
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
              {user.goal}
            </Text>

          </View>

        </View>


        {/* CERRAR SESIÓN */}

        <TouchableOpacity style={styles.logoutButton}
        onPress={logout}>

          <Text style={styles.logoutText}>
            Cerrar Sesión
          </Text>

        </TouchableOpacity>

      </ScrollView>


      <UserBottomNav
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