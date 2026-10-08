import { useEffect, useRef, useState } from 'react';

import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import ExerciseGif from '../components/ExerciseGif';
import { useExercises } from '../context/ExercisesContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import type { Exercise } from '../services/exercisesApi';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { UserRoutineStackParamList } from '../navigation/types';

export default function UserDayScreen({
  navigation,
  route,
}: NativeStackScreenProps<UserRoutineStackParamList, 'ver_dia_x_user'>) {

  const { isLandscape } = useResponsiveLayout();

  // Ejercicios traídos de la API (ver ExercisesContext)
  const { getExerciseById, loading, error, retry } = useExercises();

  const day = route.params.day;

    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'' | 'gif' | 'instructions'>('');
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

    const showGif = (exercise: Exercise) => {
      setSelectedExercise(exercise);
      setModalType('gif');
      setModalVisible(true);
    };

    const showInstructions = (exercise: Exercise) => {
      setSelectedExercise(exercise);
      setModalType('instructions');
      setModalVisible(true);
    };

    const closeModal = () => {
      setModalVisible(false);
      setSelectedExercise(null);
      setModalType('');
    };


    // TEMPORIZADOR DE DESCANSO (solo uno activo a la vez)

    const [activeRestId, setActiveRestId] = useState<number | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [isRestRunning, setIsRestRunning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const toSeconds = (time: string, unit: string) =>
      unit === 'minutos' ? Number(time) * 60 : Number(time);

    const formatRestUnit = (time: string, unit: string) =>
      Number(time) === 1 ? unit.slice(0, -1) : unit;

    const clearRestInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    useEffect(() => clearRestInterval, []);

    const startRest = (itemId: number, time: string, unit: string) => {
      clearRestInterval();
      setActiveRestId(itemId);
      setRemainingSeconds(toSeconds(time, unit));
      setIsRestRunning(true);
    };

    const pauseRest = () => {
      clearRestInterval();
      setIsRestRunning(false);
    };

    const resumeRest = () => {
      setIsRestRunning(true);
    };

    useEffect(() => {
      if (!isRestRunning) return;

      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearRestInterval();
            setIsRestRunning(false);
            Vibration.vibrate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return clearRestInterval;
    }, [isRestRunning]);

    const formatRestTime = (totalSeconds: number) => {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    };


  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* HEADER */}

      <View style={[ styles.header, isLandscape && styles.headerLandscape,]}>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon} > ‹ </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}> {day.name} </Text>

      </View>


      {/* CONTENIDO */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, isLandscape && styles.contentLandscape,]}
        showsVerticalScrollIndicator={false}
      >

        {/* TÍTULO */}

        <Text style={styles.subtitle}>
          {`${day.blocks.reduce((total, block) => total + block.items.filter((i) => i.type === 'exercise').length, 0)} ejercicios · ${day.blocks.length} bloques`}
        </Text>


        {/* ERROR AL CARGAR LOS EJERCICIOS */}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}> No se pudieron cargar los ejercicios. Revisá tu conexión. </Text>
            <TouchableOpacity onPress={retry}>
              <Text style={styles.retryText}> Reintentar </Text>
            </TouchableOpacity>
          </View>
        )}


        {/* BLOQUES */}

        {day.blocks.map((block, blockIndex) => (

          <View key={block.id} style={styles.block} >

            {/* ENCABEZADO DEL BLOQUE (no se guarda: se calcula según la posición) */}

            <View style={styles.blockHeader}>

              <Text style={styles.blockTitle}> {`Bloque ${blockIndex + 1}`} </Text>

            </View>


            {/* CONTENIDO DEL BLOQUE */}

            <View style={styles.blockContent}>

              {block.items.map((item) => (

                <View key={item.id} style={styles.item} >

                  {item.type === 'exercise' ? (

                    <>

                      {/* NOMBRE DEL EJERCICIO */}

                      <Text style={styles.exerciseName}>
                        {getExerciseById(item.exerciseId)?.name ?? (loading ? 'Cargando…' : 'Ejercicio no disponible')}
                      </Text>


                      {/* DATOS DEL EJERCICIO */}

                      <View style={styles.exerciseData}>

                        <View style={styles.dataBox}>
                          <Text style={styles.dataLabel}>Series</Text>
                          <Text style={styles.dataValue}>{item.series}</Text>
                        </View>


                        <View style={styles.dataBox}>
                          <Text style={styles.dataLabel}>Reps</Text>
                          <Text style={styles.dataValue}>{item.repetitions}</Text>
                        </View>


                        <View style={styles.dataBox}>
                          <Text style={styles.dataLabel}>Peso</Text>
                          <Text style={styles.dataValue}>{item.weight}</Text>
                        </View>

                      </View>


                      {/* COMENTARIOS */}

                      {!!item.comments?.trim() && (
                        <Text style={styles.comments}>
                          <Text style={styles.commentsLabel}>Nota: </Text>
                          {item.comments}
                        </Text>
                      )}


                      {/* BOTONES */}
                      {/* Deshabilitados hasta que el ejercicio esté cargado */}

                      <View style={styles.buttons}>

                        <TouchableOpacity
                          style={[styles.button, !getExerciseById(item.exerciseId) && styles.buttonDisabled]}
                          disabled={!getExerciseById(item.exerciseId)}
                          onPress={() => {
                            const exercise = getExerciseById(item.exerciseId);
                            if (exercise) showGif(exercise);
                          }}
                        >
                            <Text style={styles.buttonText}>Ver ejercicio</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.button, !getExerciseById(item.exerciseId) && styles.buttonDisabled]}
                          disabled={!getExerciseById(item.exerciseId)}
                          onPress={() => {
                            const exercise = getExerciseById(item.exerciseId);
                            if (exercise) showInstructions(exercise);
                          }}
                        >
                            <Text style={styles.buttonText}>Ver instrucciones</Text>
                        </TouchableOpacity>

                      </View>

                    </>

                  ) : (

                    /* DESCANSO */

                    <View style={styles.rest}>

                      <View style={styles.restInfo}>

                        <Text style={styles.restText}>Descanso: {item.time} {formatRestUnit(item.time, item.unit)}</Text>

                        <Text style={[styles.restTimerText, activeRestId === item.id && remainingSeconds === 0 && styles.restTimerDone]}>
                          {activeRestId === item.id
                            ? remainingSeconds === 0
                              ? '¡Descanso terminado!'
                              : formatRestTime(remainingSeconds)
                            : formatRestTime(toSeconds(item.time, item.unit))}
                        </Text>

                      </View>

                      <TouchableOpacity
                        style={styles.restPlayButton}
                        onPress={() => {
                          if (activeRestId !== item.id) {
                            startRest(item.id, item.time, item.unit);
                          } else if (isRestRunning) {
                            pauseRest();
                          } else if (remainingSeconds === 0) {
                            startRest(item.id, item.time, item.unit);
                          } else {
                            resumeRest();
                          }
                        }}
                      >
                        <Text style={styles.restPlayButtonText}>
                          {activeRestId === item.id && isRestRunning ? '⏸' : '▶'}
                        </Text>
                      </TouchableOpacity>

                    </View>

                  )}

                </View>

              ))}

            </View>

          </View>

        ))}

      </ScrollView>

        <Modal
            visible={modalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={closeModal}
        >

        <View style={styles.modalBackground}>

            {/* Tocar fuera del modal lo cierra */}
            <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />

            <View style={[styles.modal, isLandscape && styles.modalLandscape,]}>


            {/* CONTENIDO */}

            {selectedExercise && modalType === 'gif' && (
                <ExerciseGif gif={selectedExercise.gif} />
            )}


            {selectedExercise && modalType === 'instructions' && (

                <ScrollView style={styles.instructionsScroll} showsVerticalScrollIndicator={false}>

                <Text style={styles.exerciseModalName}> {selectedExercise.name} </Text>

                {/* La API da las instrucciones como lista de pasos */}
                {selectedExercise.instructions.map((step, index) => (
                  <Text key={index} style={styles.instructionsText}> {index + 1}. {step} </Text>
                ))}

                </ScrollView>

            )}


            {/* CERRAR */}

            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>

                <Text style={styles.closeButtonText}> Cerrar </Text>

            </TouchableOpacity>

            </View>

        </View>

    </Modal>

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
    paddingHorizontal: '2.5%',
    paddingTop: '2.5%',
    paddingBottom: '7%',
  },

  contentLandscape: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 22,
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
    fontSize: 26,
    fontWeight: '300',
    marginRight: 11,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  headerLandscape: {
    minHeight: 50,
    paddingHorizontal: 22,
  },


  /* TÍTULO */

  subtitle: {
    color: '#999999',
    fontSize: 14,
    marginBottom: 13,
  },


  /* BLOQUE */

  block: {
    backgroundColor: '#1D1D1D',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFE082',
    marginBottom: 14,
    overflow: 'hidden',
  },

  blockHeader: {
    backgroundColor: '#292929',
    paddingHorizontal: '4%',
    paddingVertical: '3.5%',
  },

  blockContent: {
    padding: '3.5%',
  },

  blockTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },



  /* EJERCICIO — cada item es su propia tarjeta, para diferenciarlos
     fácilmente de un vistazo mientras se entrena */

  item: {
    backgroundColor: '#242424',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    padding: '4%',
    marginBottom: 11,
  },

  exerciseName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 9,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    paddingLeft: 9,
  },


  /* DATOS */

  exerciseData: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 9,
  },

  dataBox: {
    flex: 1,
    backgroundColor: '#2E2E2E',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#4A3A10',
    paddingVertical: 9,
    alignItems: 'center',
  },

  dataLabel: {
    color: '#B0B0B0',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 3,
  },

  dataValue: {
    color: '#FFC107',
    fontSize: 22,
    fontWeight: '700',
  },


  /* COMENTARIOS */

  comments: {
    color: '#AAAAAA',
    fontSize: 14,
    marginBottom: 9,
  },

  commentsLabel: {
    color: '#FF6B6B',
  },


  /* BOTONES */

  buttons: {
    flexDirection: 'row',
    gap: 9,
  },

  button: {
    flex: 1,
    backgroundColor: '#FFC107',
    borderRadius: 13,
    paddingHorizontal: 11,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderTopColor: '#FFE082',
    borderLeftColor: '#FFD54F',
    borderRightColor: '#E0A800',
    borderBottomColor: '#B88700',
    borderBottomWidth: 4,
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },

  buttonDisabled: {
    opacity: 0.45,
  },

  buttonText: {
    color: '#1A1300',
    fontSize: 13,
    fontWeight: '700',
  },


  /* DESCANSO */

  rest: {
    backgroundColor: '#202C35',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2F5A7A',
    paddingVertical: '3%',
    paddingHorizontal: '3.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  restInfo: {
    flex: 1,
  },

  restText: {
    color: '#66B8FF',
    fontSize: 15,
    fontWeight: '500',
  },

  restTimerText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '700',
    marginTop: 5,
  },

  restTimerDone: {
    fontSize: 18,
  },

  restPlayButton: {
    backgroundColor: '#66B8FF',
    borderRadius: 23,
    width: 47,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderTopColor: '#B5DEFF',
    borderLeftColor: '#8CCBFF',
    borderRightColor: '#4A97D6',
    borderBottomColor: '#2F78B5',
    borderBottomWidth: 4,
    shadowColor: '#66B8FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
  },

  restPlayButtonText: {
    color: '#101010',
    fontSize: 18,
    fontWeight: '700',
  },

   /* MODAL */
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },

  modal: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#1D1D1D',
    borderRadius: 14,
    padding: '6.5%',
  },

  modalLandscape: {
    width: '90%',
    maxWidth: 700,
  },

  modalTitle: {
    color: '#FFC107',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
  },

  exerciseModalName: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 14,
  },

  /* INSTRUCCIONES */

  instructionsScroll: {
    maxHeight: 380,
  },

  instructionsText: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 9,
  },

  /* ERROR DE CARGA */

  errorBox: {
    backgroundColor: '#3A1D1D',
    borderRadius: 9,
    padding: '3.5%',
    marginBottom: 13,
  },

  errorText: {
    color: '#FF8A80',
    fontSize: 14,
    marginBottom: 5,
  },

  retryText: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: '700',
  },

  /* BOTÓN CERRAR */

  closeButton: {
    backgroundColor: '#FFC107',
    borderRadius: 9,
    paddingVertical: '3.5%',
    alignItems: 'center',
    marginTop: '6%',
  },

  closeButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },

});

 