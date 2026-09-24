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

export default function UserDataScreen({ navigation, route }) {
  const { isLandscape } = useResponsiveLayout();
  const user = route?.params?.user;

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}

      <View
        style={[
          styles.header,
          isLandscape && styles.headerLandscape,
        ]}
      >

        <TouchableOpacity onPress={() => navigation.navigate('buscar_usuario_trainer')}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Datos del Usuario
        </Text>

      </View>


      {/* CONTENIDO CON SCROLL */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          isLandscape && styles.contentLandscape,
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* PERFIL (sin recuadro amarillo, mismo estilo que mi_cuenta_user.js) */}

        <View style={styles.profile}>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.initials || '--'}
            </Text>
          </View>

          <Text style={styles.name}>
            {user ? `${user.firstName} ${user.lastName}` : 'Sin usuario seleccionado'}
          </Text>

          <Text style={styles.email}>
            {user?.email || '-'}
          </Text>

        </View>


        {/* DATOS PERSONALES */}

        <View style={styles.card}>

          <Text style={styles.title}>
            Datos Personales
          </Text>

          <View style={styles.row}>
            <View style={styles.box}>
              <Text style={styles.label}>Nombre</Text>
              <Text style={styles.value}>{user?.firstName || '-'}</Text>
            </View>

            <View style={styles.box}>
              <Text style={styles.label}>Apellido</Text>
              <Text style={styles.value}>{user?.lastName || '-'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.box}>
              <Text style={styles.label}>DNI</Text>
              <Text style={styles.value}>{user?.dni || '-'}</Text>
            </View>

            <View style={styles.box}>
              <Text style={styles.label}>Género</Text>
              <Text style={styles.value}>{user?.gender || '-'}</Text>
            </View>
          </View>

        </View>


        {/* DATOS FÍSICOS */}

        <View style={styles.card}>

          <Text style={styles.title}>
            Datos Físicos
          </Text>

          <View style={styles.row}>

            <View style={styles.box}>
              <Text style={styles.label}>Edad</Text>
              <Text style={styles.value}>{user?.age || '-'}</Text>
            </View>

            <View style={styles.box}>
              <Text style={styles.label}>Peso</Text>
              <Text style={styles.value}>{user?.weight || '-'}</Text>
            </View>

            <View style={styles.box}>
              <Text style={styles.label}>Altura</Text>
              <Text style={styles.value}>{user?.height || '-'}</Text>
            </View>

          </View>

        </View>


        {/* CONTACTO Y SALUD */}

        <View style={styles.card}>

          <Text style={styles.title}>
            Contacto y Salud
          </Text>

          <View style={styles.box}>
            <Text style={styles.label}>
              Teléfono de Contacto
            </Text>

            <Text style={styles.value}>
              {user?.phone || '-'}
            </Text>
          </View>

          <View style={styles.box}>
            <Text style={styles.label}>
              Teléfono de Emergencia
            </Text>

            <Text style={styles.value}>
              {user?.emergencyPhone || '-'}
            </Text>
          </View>

          <View style={styles.box}>
            <Text style={styles.label}>
              Obra Social
            </Text>

            <Text style={styles.value}>
              {user?.healthInsurance || '-'}
            </Text>
          </View>

          <View style={styles.box}>
            <Text style={styles.label}>
              Contraindicaciones Médicas
            </Text>

            <Text style={styles.value}>
              {user?.contraindications || '-'}
            </Text>
          </View>

        </View>


        {/* ENTRENAMIENTO */}

        <View style={styles.card}>

          <Text style={styles.title}>
            Entrenamiento
          </Text>

          <Text style={styles.label}>
            Objetivo Principal
          </Text>

          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {user?.goal || '-'}
            </Text>
          </View>

        </View>

      </ScrollView>

      <TrainerBottomNav
        activeScreen="search"
        isLandscape={isLandscape}
        navigation={navigation}
      />

    </SafeAreaView>
  );
}


const styles = StyleSheet.create({

  /* GENERAL */

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '4%',
  },

  backIcon: {
    color: '#FFFFFF',
    fontSize: 29,
    marginRight: 12,
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


  /* TARJETAS */

  card: {
    backgroundColor: '#1D1D1D',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFE082',
    padding: '3.5%',
    marginBottom: '4%',
  },


  /* PERFIL (sin recuadro amarillo, mismo estilo que mi_cuenta_user.js) */

  profile: {
    alignItems: 'center',
    paddingVertical: '3.5%',
    marginBottom: '3%',
  },

  avatar: {
    width: '16%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '3%',
  },
  avatarText: {
    color: '#111111',
    fontSize: 19,
    fontWeight: '700',
  },

  name: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },

  email: {
    color: '#777777',
    fontSize: 17,
    marginTop: 5,
  },


  /* TÍTULOS */

  title: {
    color: '#FFC107',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 14,
  },


  /* DATOS */

  row: {
    flexDirection: 'row',
    gap: '3%',
    marginBottom: '3%',
  },

  box: {
    flex: 1,
    backgroundColor: '#292929',
    borderRadius: 10,
    padding: '3.2%',
    marginBottom: '3%',
  },

  label: {
    color: '#999999',
    fontSize: 15,
    marginBottom: 5,
  },

  value: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '500',
  },


  /* OBJETIVO */

  tag: {
    alignSelf: 'flex-start',
    backgroundColor: '#3A2B0D',
    borderRadius: 18,
    paddingHorizontal: '4%',
    paddingVertical: '2.5%',
    marginTop: '1%',
  },

  tagText: {
    color: '#FFC107',
    fontSize: 17,
    fontWeight: '600',
  },

});