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

import LoadingState from '../components/LoadingState';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { ApiError, getAlumnosActivos } from '../services/api';
import type { User } from '../types';

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function TrainerHomeScreen() {
  const { isLandscape } = useResponsiveLayout();
  const [filtro, setFiltro] = useState('');
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

          {alumnosFiltrados.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.initials}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <View style={styles.activeIndicator} />
            </View>
          ))}
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
});
