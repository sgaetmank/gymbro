import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import LoadingState from '../components/LoadingState';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import type { TrainerStackParamList } from '../navigation/types';
import { ApiError, getAlumnosActivos } from '../services/api';
import type { User } from '../types';

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function TrainerHomeScreen({
  navigation,
}: NativeStackScreenProps<TrainerStackParamList, 'inicio_trainer_root'>) {
  const { isLandscape } = useResponsiveLayout();
  const [filtro, setFiltro] = useState('');
  // Alumno actualmente seleccionado (muestra sus botones de acción)
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [alumnos, setAlumnos] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAlumnos = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      setAlumnos(await getAlumnosActivos());
    } catch (e) {
      setAlumnos([]);
      setError(e instanceof ApiError ? e.message : 'No se pudo cargar la lista de alumnos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAlumnos();
      const interval = setInterval(loadAlumnos, 30_000);
      return () => clearInterval(interval);
    }, [loadAlumnos])
  );

  const alumnosFiltrados = alumnos.filter((user) =>
    normalizar(`${user.firstName} ${user.lastName}`).includes(normalizar(filtro))
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        <Text style={styles.headerTitle}>Alumnos activos</Text>
      </View>

      <View style={[styles.content, isLandscape && styles.contentLandscape]}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o apellido..."
            placeholderTextColor="#777777"
            value={filtro}
            onChangeText={setFiltro}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {error !== '' && (
            <>
              <Text style={styles.stateText}>{error}</Text>
              <TouchableOpacity onPress={loadAlumnos}>
                <Text style={styles.retryText}>Tocá para reintentar</Text>
              </TouchableOpacity>
            </>
          )}

          {error === '' && loading && alumnosFiltrados.length === 0 && (
            <LoadingState text="Cargando alumnos activos…" />
          )}

          {error === '' && !loading && alumnosFiltrados.length === 0 && (
            <Text style={styles.stateText}>
              {alumnos.length === 0
                ? 'No hay alumnos entrenando en este momento.'
                : 'No se encontraron alumnos'}
            </Text>
          )}

          {alumnosFiltrados.map((user) => {
            const isSelected = selectedUser === user.id;

            return (
              <TouchableOpacity
                key={user.id}
                style={[styles.userCard, isSelected && styles.selectedCard]}
                onPress={() => setSelectedUser(user.id)}
                activeOpacity={0.8}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user.initials}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
                <View style={styles.activeIndicator} />

                {/* BOTONES DEL ALUMNO SELECCIONADO */}
                {isSelected && (
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={styles.dataButton}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('ver_datos_trainer', { user })}
                    >
                      <Text style={styles.dataIcon}>♙</Text>
                      <Text style={styles.dataButtonText}>Ver datos</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.routineButton}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('editar_rutina_trainer', { user })}
                    >
                      <Text style={styles.routineIcon}>✎</Text>
                      <Text style={styles.routineButtonText}>Editar rutina</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#101010',
  },
  header: {
    minHeight: '7%',
    paddingVertical: '2%',
    backgroundColor: '#1D1D1D',
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 21,
    marginRight: 7,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 0,
  },
  list: {
    paddingBottom: 20,
  },
  stateText: {
    color: '#858585',
    fontSize: 15,
    marginBottom: 12,
  },
  retryText: {
    color: '#FFC107',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
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
    fontSize: 16,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  userEmail: {
    color: '#858585',
    fontSize: 13,
    marginTop: 3,
  },
  activeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginLeft: 12,
  },
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
    fontSize: 14,
    marginRight: 5,
  },
  dataButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
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
    fontSize: 14,
    marginRight: 5,
  },
  routineButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },
});
