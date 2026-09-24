import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileDataCard from '../components/ProfileDataCard';
import UserBottomNav from '../components/UserBottomNav';
import { useAuth } from '../context/AuthContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export default function UserProfileScreen({ navigation }) {
  const { isLandscape } = useResponsiveLayout();
  const { user, logout } = useAuth();

  // Sin sesión (ej: mientras se anima el cierre de sesión) no se dibuja nada
  if (!user) return null;

  // Pide confirmación antes de cerrar sesión, para evitar un toque accidental
  const confirmLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
      ],
      // Tocar afuera del cuadro de diálogo equivale a "Cancelar" (solo tiene efecto
      // en Android; en iOS el sistema no permite cerrar el Alert tocando afuera).
      { cancelable: true, onDismiss: () => {} }
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}

      <View style={[styles.header,isLandscape && styles.headerLandscape,]}>
        <Text style={styles.headerTitle}>Mi Cuenta</Text>
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
            <Text style={styles.avatarText}> {user.initials} </Text>
          </View>

          <Text style={styles.name}> {user.name}</Text>

          <Text style={styles.email}>{user.email}</Text>

        </View>


        {/* DATOS PERSONALES */}

        <ProfileDataCard
          title="Datos Personales"
          rows={[
            { icon: '◉', label: 'DNI', value: user.dni },
            { icon: '♙', label: 'Género', value: user.gender },
            { icon: '〽', label: 'Edad', value: user.age },
            { icon: '〽', label: 'Peso', value: user.weight },
            { icon: '〽', label: 'Altura', value: user.height },
          ]}
        />


        {/* CONTACTO Y SALUD */}

        <ProfileDataCard
          title="Contacto y Salud"
          rows={[
            { icon: '☎', label: 'Teléfono', value: user.phone },
            { icon: '☎', label: 'Tel. Emergencia', value: user.emergencyPhone },
            { icon: '♡', label: 'Obra Social', value: user.healthInsurance },
            { icon: '▣', label: 'Contraindicaciones', value: user.contraindications },
          ]}
        />


        {/* OBJETIVOS */}

        <View style={styles.card}>

          <Text style={styles.sectionTitle}> Objetivos </Text>

          <View style={styles.objective}>

            <Text style={styles.objectiveIcon}> ◎ </Text>
            <Text style={styles.objectiveText}> {user.goal} </Text>

          </View>

        </View>


        {/* CERRAR SESIÓN */}

        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>

          <Text style={styles.logoutText}> Cerrar Sesión </Text>

        </TouchableOpacity>

      </ScrollView>


      <UserBottomNav
        activeScreen="account"
        isLandscape={isLandscape}
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
    fontSize: 16,
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
    fontSize: 17,
    fontWeight: '700',
  },

  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  email: {
    color: '#777777',
    fontSize: 14,
    marginTop: 3,
  },


  /* CARDS */

  card: {
    backgroundColor: '#1D1D1D',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFE082',
    padding: '5.5%',
    marginBottom: '5%',
  },

  sectionTitle: {
    color: '#FFC107',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
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
    fontSize: 17,
    marginRight: 9,
  },

  objectiveText: {
    color: '#FFFFFF',
    fontSize: 15,
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
    fontSize: 16,
    fontWeight: '700',
  },


});