import { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SearchUserScreen() {

  // Usuarios de ejemplo
  const users = [
    {
      id: 1,
      name: 'Entrenador Mañana',
      email: 'entrenadormaniana@gmail.com',
      initials: 'EM',
      isTrainer: true,
    },
    {
      id: 2,
      name: 'Sol Gaetmank',
      email: 'solgaetmank@gmail.com',
      initials: 'SG',
      isTrainer: false,
    },
    {
      id: 3,
      name: 'Lucía Fernández',
      email: 'luciafernandez@gmail.com',
      initials: 'LF',
      isTrainer: false,
    },
    {
      id: 4,
      name: 'Martín Rodríguez',
      email: 'martinrodriguez@gmail.com',
      initials: 'MR',
      isTrainer: false,
    },
    {
      id: 5,
      name: 'Entrenador Tarde',
      email: 'entrenadortarde@gmail.com',
      initials: 'ET',
      isTrainer: true,
    },
  ];

  // Usuario actualmente seleccionado
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>

        <TouchableOpacity>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Buscar Usuario
        </Text>

      </View>

      {/* CONTENIDO */}
      <View style={styles.content}>

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

  /* CONTENIDO */

  content: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
  },

  /* BUSCADOR */

  searchContainer: {
    height: 40,
    backgroundColor: '#1D1D1D',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#292929',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  searchIcon: {
    color: '#BBBBBB',
    fontSize: 19,
    marginRight: 7,
  },

  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 10,
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
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  selectedCard: {
    borderColor: '#FFC107',
  },

  /* AVATAR */

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#3A2B0D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  avatarText: {
    color: '#FFC107',
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: '700',
  },

  userEmail: {
    color: '#858585',
    fontSize: 9,
    marginTop: 3,
  },

  /* ETIQUETA ENTRENADOR */

  trainerBadge: {
    backgroundColor: '#3A2B0D',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginLeft: 7,
  },

  trainerText: {
    color: '#FFC107',
    fontSize: 7,
    fontWeight: '800',
  },

  /* BOTONES */

  actionsContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 7,
    marginTop: 10,
  },

  dataButton: {
    flex: 1,
    height: 32,
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
    fontSize: 9,
    fontWeight: '700',
  },

  routineButton: {
    flex: 1,
    height: 32,
    backgroundColor: '#FFC107',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  routineIcon: {
    color: '#111111',
    fontSize: 11,
    marginRight: 5,
  },

  routineButtonText: {
    color: '#111111',
    fontSize: 9,
    fontWeight: '700',
  },

});