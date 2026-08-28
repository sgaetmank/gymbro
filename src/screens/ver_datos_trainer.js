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

        {/* PERFIL */}

        <View style={styles.card}>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.initials || '--'}
            </Text>
          </View>

          <View>
            <Text style={styles.name}>
              {user ? `${user.firstName} ${user.lastName}` : 'Sin usuario seleccionado'}
            </Text>

            <Text style={styles.email}>
              {user?.email || '-'}
            </Text>
          </View>

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
    fontSize: 27,
    marginRight: 12,
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


  /* TARJETAS */

  card: {
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    padding: '3%',
    marginBottom: '2.5%',
  },


  /* PERFIL */

  avatar: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#3A2B0D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '2%',
  },
  avatarText: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: '700',
  },

  name: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  email: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
  },


  /* TÍTULOS */

  title: {
    color: '#FFC107',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },


  /* DATOS */

  row: {
    flexDirection: 'row',
    gap: '2%',
    marginBottom: '2%',
  },

  box: {
    flex: 1,
    backgroundColor: '#292929',
    borderRadius: 6,
    padding: '2.3%',
    marginBottom: '2%',
  },

  label: {
    color: '#777777',
    fontSize: 11,
    marginBottom: 4,
  },

  value: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },


  /* OBJETIVO */

  tag: {
    alignSelf: 'flex-start',
    backgroundColor: '#3A2B0D',
    borderRadius: 15,
    paddingHorizontal: '3%',
    paddingVertical: '1.8%',
    marginTop: '0.5%',
  },

  tagText: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: '600',
  },

});