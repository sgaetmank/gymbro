import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import { useExercises } from '../context/ExercisesContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { buildSteps } from '../utils/buildSteps';
import type { UserRoutineStackParamList } from '../navigation/types';
import { ApiError, getMyRoutine } from '../services/api';
import type { Routine, RoutineDay } from '../types';

export default function UserRoutineScreen({
  navigation,
}: NativeStackScreenProps<UserRoutineStackParamList, 'mi_rutina_user_root'>) {
  const { isLandscape } = useResponsiveLayout();
  const { user } = useAuth();
  // Ejercicios traídos de la API (ver ExercisesContext)
  const { getExerciseById, loading } = useExercises();

  // Rutina asignada al usuario logueado, pedida al servidor (puede no tener)
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loadingRoutine, setLoadingRoutine] = useState(true);
  const [routineError, setRoutineError] = useState('');

  const loadRoutine = useCallback(async () => {
    setRoutineError('');
    try {
      setRoutine(await getMyRoutine());
    } catch (e) {
      setRoutineError(e instanceof ApiError ? e.message : 'No se pudo cargar tu rutina.');
    } finally {
      setLoadingRoutine(false);
    }
  }, []);

  // Se vuelve a pedir cada vez que la pantalla recupera el foco (el entrenador pudo cambiarla)
  useFocusEffect(
    useCallback(() => {
      loadRoutine();
    }, [loadRoutine])
  );

  // Días desplegados (puede haber varios abiertos a la vez)
  const [openDayIds, setOpenDayIds] = useState<number[]>([]);

  const toggleDay = (dayId: number) =>
    setOpenDayIds((ids) =>
      ids.includes(dayId) ? ids.filter((id) => id !== dayId) : [...ids, dayId]
    );

  // Sin sesión (ej: mientras se anima el cierre de sesión) no se dibuja nada
  if (!user) return null;

  const formatRestUnit = (time: string, unit: string) =>
    Number(time) === 1 ? unit.slice(0, -1) : unit;

  // Cantidad de ejercicios del día (los descansos no cuentan)
  const countExercises = (day: RoutineDay) =>
    day.blocks.reduce(
      (total, block) => total + block.items.filter((i) => i.type === 'exercise').length,
      0
    );


  // ============================================================
  // PANTALLA
  // ============================================================

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* HEADER */}

      <View style={[styles.header,isLandscape && styles.headerLandscape,]}>

        <Text style={styles.headerTitle}>Rutinas</Text>

      </View>


      {/* CONTENIDO */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          isLandscape && styles.contentLandscape,
        ]}
        showsVerticalScrollIndicator={false}
      >

        {loadingRoutine && !routine ? (
          <LoadingState text="Cargando tu rutina…" />
        ) : (
          <Text style={styles.screenTitle}>
            {routine ? routine.name : routineError || 'Todavía no tenés una rutina asignada'}
          </Text>
        )}

        {routineError !== '' && (
          <TouchableOpacity onPress={loadRoutine}>
            <Text style={styles.retryText}>Tocá para reintentar</Text>
          </TouchableOpacity>
        )}


        {/* ======================================================
            DÍAS
        ====================================================== */}

        {routine?.days.map((day) => (

          <View key={day.id} style={styles.dayContainer}>

            {/* TÍTULO DEL DÍA */}

            <View style={styles.dayHeader}>

              <Text style={styles.dayTitle}>{day.name}</Text>

            </View>


            {/* RESUMEN */}

            <Text style={styles.daySummary}>
              {`${countExercises(day)} ejercicios · ${day.blocks.length} bloques`}
            </Text>


            {/* COMENZAR ENTRENAMIENTO (paso a paso) */}

            <TouchableOpacity
              style={[styles.startButton, buildSteps(day).length === 0 && styles.startButtonDisabled]}
              disabled={buildSteps(day).length === 0}
              onPress={() => navigation.navigate('entrenar_dia_user', { day })}
            >
              <Text style={styles.startButtonText}>Comenzar entrenamiento</Text>
            </TouchableOpacity>


            {/* VER EJERCICIOS (despliega el día) */}

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => toggleDay(day.id)}
            >
              <Text style={styles.toggleButtonText}>
                {openDayIds.includes(day.id) ? 'Ocultar ejercicios ▴' : 'Ver ejercicios ▾'}
              </Text>
            </TouchableOpacity>


            {/* ==================================================
                BLOQUES
            ================================================== */}

            {openDayIds.includes(day.id) && day.blocks.map((block, blockIndex) => (

              <View key={block.id} style={styles.block}>

                {/* NOMBRE DEL BLOQUE (no se guarda: se calcula según la posición) */}

                <Text style={styles.blockTitle}>{`Bloque ${blockIndex + 1}`}</Text>


                {/* =================================================
                    EJERCICIOS / DESCANSOS
                ================================================= */}

                {block.items.map((item) => (

                  <View key={item.id} style={styles.item}>

                    {/* ÍCONO */}

                    <View style={styles.itemIcon}>

                      <Text style={styles.itemIconText}>
                        {item.type === 'exercise' ? '⌁' : '◷'}
                      </Text>

                    </View>


                    {/* INFORMACIÓN */}

                    <View style={styles.itemInfo}>

                      {item.type === 'exercise' ? (

                        <>
                          <Text style={styles.exerciseName}>
                            {getExerciseById(item.exerciseId)?.name ?? (loading ? 'Cargando…' : 'Ejercicio no disponible')}
                          </Text>

                          <Text style={styles.exerciseDetails}>
                            {item.series} series ·{' '}
                            {item.repetitions} reps ·{' '}
                            {item.weight}
                          </Text>

                          {item.comments !== '' && (
                            <Text style={styles.comments}>
                              {item.comments}
                            </Text>
                          )}
                        </>

                      ) : (

                        <Text style={styles.restText}>
                          Descanso · {item.time} {formatRestUnit(item.time, item.unit)}
                        </Text>

                      )}

                    </View>

                  </View>

                ))}

              </View>

            ))}

          </View>

        ))}

      </ScrollView>

    </SafeAreaView>
  );
}


// ============================================================
// ESTILOS
// ============================================================

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
    maxWidth: 1000,
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


  /* TÍTULO */

  retryText: {
    color: '#FFC107',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },

  screenTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
  },


  /* DÍA */

  // Cada día es una tarjeta; plegada ocupa poco para que entren varios
  dayContainer: {
    backgroundColor: '#1D1D1D',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFE082',
    padding: '4.5%',
    marginBottom: 14,
  },

  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  dayTitle: {
    color: '#FFC107',
    fontSize: 21,
    fontWeight: '700',
  },

  daySummary: {
    color: '#999999',
    fontSize: 14,
    marginBottom: 4,
  },


  startButton: {
    backgroundColor: '#3A2B0D',
    borderRadius: 16,
    paddingVertical: '3.5%',
    alignItems: 'center',
    marginTop: 10,
  },

  toggleButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 2,
  },

  toggleButtonText: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: '600',
  },

  startButtonDisabled: {
    opacity: 0.45,
  },

  startButtonText: {
    color: '#FFC107',
    fontSize: 15,
    fontWeight: '600',
  },


  /* BLOQUE */

  block: {
    backgroundColor: '#1D1D1D',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFE082',
    marginBottom: 14,
    overflow: 'hidden',
  },

  blockTitle: {
    color: '#FFFFFF',
    backgroundColor: '#292929',
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: '4.5%',
    paddingVertical: '3.8%',
  },


  /* EJERCICIO / DESCANSO */

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '4.5%',
    paddingVertical: '3.8%',
    borderTopWidth: 1,
    borderTopColor: '#292929',
  },

  itemIcon: {
    width: '11%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#3A2B0D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '3.5%',
  },

  itemIconText: {
    color: '#FFC107',
    fontSize: 23,
    fontWeight: '700',
  },

  itemInfo: {
    flex: 1,
  },

  exerciseName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },

  exerciseDetails: {
    color: '#888888',
    fontSize: 15,
  },

  comments: {
    color: '#FFC107',
    fontSize: 15,
    marginTop: 5,
  },

  restText: {
    color: '#66B8FF',
    fontSize: 18,
  },


});