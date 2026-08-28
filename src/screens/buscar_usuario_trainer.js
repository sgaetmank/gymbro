import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import TrainerBottomNav from '../components/TrainerBottomNav';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export default function SearchUserScreen({ navigation }) {
  const { isLandscape } = useResponsiveLayout();

  // Usuarios de ejemplo
  const users = [
    {
      id: 1,
      name: 'Entrenador Mañana',
      email: 'entrenadormaniana@gmail.com',
      initials: 'EM',
      isTrainer: true,
      routineId: 1,
      firstName: 'Entrenador',
      lastName: 'Mañana',
      dni: '30123456',
      gender: 'Masculino',
      age: '32 años',
      weight: '82 kg',
      height: '180 cm',
      phone: '3794112233',
      emergencyPhone: '3794112244',
      healthInsurance: 'OSDE',
      contraindications: 'Ninguna registrada',
      goal: 'Ganar fuerza',
    },
    {
      id: 2,
      name: 'Sol Gaetmank',
      email: 'solgaetmank@gmail.com',
      initials: 'SG',
      isTrainer: false,
      routineId: 1,
      firstName: 'Sol',
      lastName: 'Gaetmank',
      dni: '44363966',
      gender: 'Femenino',
      age: '23 años',
      weight: '75.5 kg',
      height: '160 cm',
      phone: '3794033628',
      emergencyPhone: '3794033620',
      healthInsurance: '-',
      contraindications: 'Ninguna',
      goal: 'Tonificar',
    },
    {
      id: 3,
      name: 'Lucía Fernández',
      email: 'luciafernandez@gmail.com',
      initials: 'LF',
      isTrainer: false,
      routineId: 1,
      firstName: 'Lucía',
      lastName: 'Fernández',
      dni: '42123456',
      gender: 'Femenino',
      age: '26 años',
      weight: '64 kg',
      height: '168 cm',
      phone: '3794223344',
      emergencyPhone: '3794223355',
      healthInsurance: 'Swiss Medical',
      contraindications: 'Lesión leve en rodilla',
      goal: 'Bajar de peso',
    },
    {
      id: 4,
      name: 'Martín Rodríguez',
      email: 'martinrodriguez@gmail.com',
      initials: 'MR',
      isTrainer: false,
      routineId: 1,
      firstName: 'Martín',
      lastName: 'Rodríguez',
      dni: '39876543',
      gender: 'Masculino',
      age: '29 años',
      weight: '88 kg',
      height: '182 cm',
      phone: '3794334455',
      emergencyPhone: '3794334466',
      healthInsurance: 'Medifé',
      contraindications: 'Ninguna',
      goal: 'Ganar fuerza',
    },
    {
      id: 5,
      name: 'Entrenador Tarde',
      email: 'entrenadortarde@gmail.com',
      initials: 'ET',
      isTrainer: true,
      routineId: 1,
      firstName: 'Entrenador',
      lastName: 'Tarde',
      dni: '28987654',
      gender: 'Masculino',
      age: '35 años',
      weight: '90 kg',
      height: '185 cm',
      phone: '3794556677',
      emergencyPhone: '3794556688',
      healthInsurance: 'OSDE',
      contraindications: 'Ninguna registrada',
      goal: 'Mantener masa muscular',
    },
  ];

  // Usuario actualmente seleccionado
  const [selectedUser, setSelectedUser] = useState(null);

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
          Buscar Usuario
        </Text>

      </View>

      {/* CONTENIDO */}
      <View
        style={[
          styles.content,
          isLandscape && styles.contentLandscape,
        ]}
      >

        {/* BUSCADOR */}
        <View style={styles.searchContainer}>

          <Text style={styles.searchIcon}>
            ⌕
          </Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, apellido o email..."
            placeholderTextColor="#777777"
          />

        </View>

        {/* LISTA DE USUARIOS */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >

          {users.map((user) => {

            const isSelected = selectedUser === user.id;

            return (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.userCard,
                  isSelected && styles.selectedCard,
                ]}
                onPress={() => setSelectedUser(user.id)}
                activeOpacity={0.8}
              >

                {/* AVATAR */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.initials}
                  </Text>
                </View>

                {/* INFORMACIÓN */}
                <View style={styles.userInfo}>

                  <View style={styles.nameRow}>

                    <Text style={styles.userName}>
                      {user.name}
                    </Text>

                    {user.isTrainer && (
                      <View style={styles.trainerBadge}>
                        <Text style={styles.trainerText}>
                          ENTRENADOR
                        </Text>
                      </View>
                    )}

                  </View>

                  <Text style={styles.userEmail}>
                    {user.email}
                  </Text>

                </View>

                {/* BOTONES DEL USUARIO SELECCIONADO */}
                {isSelected && (
                  <View style={styles.actionsContainer}>

                    <TouchableOpacity
                      style={styles.dataButton}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('ver_datos_trainer', { user })}
                    >
                      <Text style={styles.dataIcon}>
                        ♙
                      </Text>

                      <Text style={styles.dataButtonText}>
                        Ver datos
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.routineButton}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('editar_rutina_trainer', { user })}
                    >
                      <Text style={styles.routineIcon}>
                        ✎
                      </Text>

                      <Text style={styles.routineButtonText}>
                        Editar rutina
                      </Text>
                    </TouchableOpacity>

                  </View>
                )}

              </TouchableOpacity>
            );
          })}

        </ScrollView>

      </View>

      <TrainerBottomNav
        activeScreen="search"
        isLandscape={isLandscape}
        navigation={navigation}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  /* CONTENEDOR PRINCIPAL */

  container: {
    flex: 1,
    backgroundColor: '#101010',
  },

  /* HEADER */

  header: {
    minHeight: '7%',
    paddingVertical: '2%',
    backgroundColor: '#1D1D1D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '4%',
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

  headerLandscape: {
    minHeight: 56,
    paddingHorizontal: 24,
  },

  /* CONTENIDO */

  content: {
    flex: 1,
    paddingHorizontal: '2.5%',
    paddingTop: '2.5%',
  },

  contentLandscape: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  /* BUSCADOR */

  searchContainer: {
    minHeight: '5%',
    paddingVertical: '1.5%',
    paddingHorizontal: '3%',
    marginBottom: '2.5%',
    backgroundColor: '#1D1D1D',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#292929',
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchIcon: {
    color: '#BBBBBB',
    fontSize: 19,
    marginRight: 7,
  },

  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 0,
  },

  /* LISTA */

  list: {
    paddingBottom: 20,
  },

  /* TARJETA */

  userCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#292929',
      padding: '3.5%',
    marginBottom: '2%',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  selectedCard: {
    borderColor: '#FFC107',
  },

  /* AVATAR */

  avatar: {
    width: '9%',
    aspectRatio: 1,      
    borderRadius: 999,    
    backgroundColor: '#3A2B0D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '3%',
  },

  avatarText: {
    color: '#FFC107',
    fontSize: 13,
    fontWeight: '700',
  },

  /* INFORMACIÓN */

  userInfo: {
    flex: 1,
    minWidth: 0,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  userName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  userEmail: {
    color: '#858585',
    fontSize: 11,
    marginTop: 3,
  },

  /* ETIQUETA ENTRENADOR */

  trainerBadge: {
    backgroundColor: '#3A2B0D',
    borderRadius: 3,
    paddingHorizontal: '2%',
    paddingVertical: '1%',
    marginLeft: '2%',
  },

  trainerText: {
    color: '#FFC107',
    fontSize: 10,
    fontWeight: '800',
  },

  /* BOTONES */

  actionsContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: '2%',
    marginTop: '2.5%',
  },

  dataButton: {
    flex: 1,
    paddingVertical: '2.5%',
    height: 42,
    backgroundColor: '#363636',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  dataIcon: {
    color: '#FFFFFF',
    fontSize: 11,
    marginRight: 5,
  },

  dataButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  routineButton: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFC107',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: '2.5%',
  },

  routineIcon: {
    color: '#111111',
    fontSize: 11,
    marginRight: 5,
  },

  routineButtonText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '700',
  },

});