import { useEffect, useMemo, useRef, useState } from 'react';

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

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import ExerciseGif from '../components/ExerciseGif';
import { useExercises } from '../context/ExercisesContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import type { UserRoutineStackParamList } from '../navigation/types';
import type { Exercise } from '../services/exercisesApi';
import { buildSteps } from '../utils/buildSteps';

// Distancia mínima (en px) que hay que deslizar para cambiar de paso
const SWIPE_DISTANCE = 60;

export default function GuidedDayScreen({
  navigation,
  route,
}: NativeStackScreenProps<UserRoutineStackParamList, 'entrenar_dia_user'>) {

  const { isLandscape } = useResponsiveLayout();

  // Ejercicios traídos de la API (ver ExercisesContext)
  const { getExerciseById, loading, error, retry } = useExercises();

  const day = route.params.day;
  const steps = useMemo(() => buildSteps(day), [day]);

  // Paso actual. stepIndex === steps.length es el paso final (felicitación).
  const [stepIndex, setStepIndex] = useState(0);
  const isFinished = stepIndex >= steps.length;
  const step = steps[stepIndex];

  // Ejercicio del paso actual (undefined si es un descanso, si ya terminó
  // o si todavía no se cargó desde la API)
  const exercise =
    step && step.item.type === 'exercise'
      ? getExerciseById(step.item.exerciseId)
      : undefined;


  // MODAL DE GIF / INSTRUCCIONES

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'' | 'gif' | 'instructions'>('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const showModal = (ex: Exercise, type: 'gif' | 'instructions') => {
    setSelectedExercise(ex);
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedExercise(null);
    setModalType('');
  };


  // MODAL CON LA RUTINA DEL DÍA (para pispear y saltar a otro paso)

  const [listVisible, setListVisible] = useState(false);


  // TEMPORIZADOR DE DESCANSO

  const [activeRestId, setActiveRestId] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRestRunning, setIsRestRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toSeconds = (time: string, unit: string) =>
    unit === 'minutos' ? Number(time) * 60 : Number(time);

  const formatRestUnit = (time: string, unit: string) =>
    Number(time) === 1 ? unit.slice(0, -1) : unit;

  const clearRestInterval = () => {
    if (intervalRef.current) { // ¿hay una alarma guardada?
      clearInterval(intervalRef.current); // apagarla
      intervalRef.current = null; // y anotar que ya no hay ninguna
    } 
  };

  useEffect(() => clearRestInterval, []); // corta el intervalo si salís de la pantalla, para que no siga corriendo y vibrando de fondo

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

  // Al cambiar de paso el descanso en curso se descarta
  const cancelRest = () => {
    clearRestInterval();
    setActiveRestId(null);
    setRemainingSeconds(0);
    setIsRestRunning(false);
  };

  // Depende también de activeRestId: al pasar de un descanso a otro con uno
  // corriendo, isRestRunning sigue en true y sin esto el effect no se re-ejecuta.
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
  }, [isRestRunning, activeRestId]);

  const formatRestTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };


  // NAVEGACIÓN ENTRE PASOS

  const goNext = () => {
    cancelRest();
    setStepIndex((i) => Math.min(i + 1, steps.length));
  };

  const goPrevious = () => {
    cancelRest();
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  // Deslizar el dedo cambia de paso: a la izquierda avanza, a la derecha vuelve.
  const swipe = Gesture.Pan()
    .runOnJS(true)
    .enabled(!isFinished) // lo apaga en la pantalla final
    .activeOffsetX([-30, 30]) // activeOffsetX: solo se activa con un movimiento claramente horizontal de mas de 60 px;
    .failOffsetY([-20, 20]) // failOffsetY: si el dedo sube o baja primero, es scroll y el gesto se descarta.

    // goNext/goPrevious tocan la ref del timer, pero solo al soltar el dedo
    // (nunca durante el render): el aviso de react-hooks/refs es un falso positivo.
    // eslint-disable-next-line react-hooks/refs
    .onEnd((e) => {
      if (e.translationX <= -SWIPE_DISTANCE) goNext();
      else if (e.translationX >= SWIPE_DISTANCE) goPrevious();
    });

  // Salta a cualquier paso desde el modal de la rutina
  const goToStep = (index: number) => {
    cancelRest();
    setStepIndex(index);
    setListVisible(false);
  };


  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* HEADER */}

      <View style={[styles.header, isLandscape && styles.headerLandscape]}>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}> ‹ </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}> {day.name} </Text>

        {!isFinished && (
          <TouchableOpacity onPress={() => setListVisible(true)}>
            <Text style={styles.listLink}>Ver rutina</Text>
          </TouchableOpacity>
        )}

      </View>


      {/* CONTENIDO (deslizable de costado para cambiar de paso) */}

      <GestureDetector gesture={swipe}>
      <View style={styles.swipeArea}>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, isLandscape && styles.contentLandscape]}
        showsVerticalScrollIndicator={false}
      >

        {/* ERROR AL CARGAR LOS EJERCICIOS */}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}> No se pudieron cargar los ejercicios. Revisá tu conexión. </Text>
            <TouchableOpacity onPress={retry}>
              <Text style={styles.retryText}> Reintentar </Text>
            </TouchableOpacity>
          </View>
        )}

        {isFinished ? (

          /* PASO FINAL */

          <View style={styles.finished}>

            <Text style={styles.finishedIcon}>✔</Text>

            <Text style={styles.finishedTitle}>¡Terminaste el día!</Text>

            <Text style={styles.finishedSubtitle}>{day.name} completado. ¡Buen trabajo!</Text>

            <TouchableOpacity style={styles.navButton} onPress={() => navigation.popToTop()}> {/*// popToPop: vuelve a la pantalla inicial del stack (mis rutinas) */}
              <Text style={styles.navButtonText}>Volver a mi rutina</Text>
            </TouchableOpacity>

          </View>

        ) : (
          <>

            {/* PROGRESO */}

            <Text style={styles.progressText}>
              {`Bloque ${step.blockIndex + 1} · Paso ${stepIndex + 1} de ${steps.length}`}
            </Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${((stepIndex + 1) / steps.length) * 100}%` }]} />
            </View>


            {/* PASO ACTUAL (centrado en el espacio que queda) */}

            <View style={styles.stepArea}>

            <View style={styles.stepCard}>

              {step.item.type === 'exercise' ? (

                <>

                  {/* NOMBRE DEL EJERCICIO */}

                  <Text style={styles.exerciseName}>
                    {exercise?.name ?? (loading ? 'Cargando…' : 'Ejercicio no disponible')}
                  </Text>


                  {/* DATOS DEL EJERCICIO */}

                  <View style={styles.exerciseData}>

                    <View style={styles.dataBox}>
                      <Text style={styles.dataLabel}>Series</Text>
                      <Text style={styles.dataValue}>{step.item.series}</Text>
                    </View>

                    <View style={styles.dataBox}>
                      <Text style={styles.dataLabel}>Reps</Text>
                      <Text style={styles.dataValue}>{step.item.repetitions}</Text>
                    </View>

                    <View style={styles.dataBox}>
                      <Text style={styles.dataLabel}>Peso</Text>
                      <Text style={styles.dataValue}>{step.item.weight}</Text>
                    </View>

                  </View>


                  {/* COMENTARIOS */}

                  {!!step.item.comments?.trim() && (
                    <Text style={styles.comments}>
                      <Text style={styles.commentsLabel}>Nota: </Text>
                      {step.item.comments}
                    </Text>
                  )}


                  {/* BOTONES */}
                  {/* Deshabilitados hasta que el ejercicio esté cargado */}

                  <View style={styles.buttons}>

                    <TouchableOpacity
                      style={[styles.button, !exercise && styles.buttonDisabled]}
                      disabled={!exercise}
                      onPress={() => exercise && showModal(exercise, 'gif')}
                    >
                      <Text style={styles.buttonText}>Ver ejercicio</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, !exercise && styles.buttonDisabled]}
                      disabled={!exercise}
                      onPress={() => exercise && showModal(exercise, 'instructions')}
                    >
                      <Text style={styles.buttonText}>Ver instrucciones</Text>
                    </TouchableOpacity>

                  </View>

                </>

              ) : (

                /* DESCANSO */

                <View style={styles.rest}>

                  <View style={styles.restInfo}>

                    <Text style={styles.restText}>
                      Descanso: {step.item.time} {formatRestUnit(step.item.time, step.item.unit)}
                    </Text>

                    <Text style={[styles.restTimerText, activeRestId === step.item.id && remainingSeconds === 0 && styles.restTimerDone]}>
                      {activeRestId === step.item.id
                        ? remainingSeconds === 0
                          ? '¡Descanso terminado!'
                          : formatRestTime(remainingSeconds)
                        : formatRestTime(toSeconds(step.item.time, step.item.unit))}
                    </Text>

                  </View>

                  <TouchableOpacity
                    style={styles.restPlayButton}
                    onPress={() => {
                      if (step.item.type !== 'rest') return;
                      const { id, time, unit } = step.item;

                      if (activeRestId !== id) {
                        startRest(id, time, unit);
                      } else if (isRestRunning) {
                        pauseRest();
                      } else if (remainingSeconds === 0) {
                        startRest(id, time, unit);
                      } else {
                        resumeRest();
                      }
                    }}
                  >
                    <Text style={styles.restPlayButtonText}>
                      {activeRestId === step.item.id && isRestRunning ? '⏸' : '▶'}
                    </Text>
                  </TouchableOpacity>

                </View>

              )}

            </View>

            </View>

          </>
        )}

      </ScrollView>

      </View>
      </GestureDetector>


      {/* ANTERIOR / SIGUIENTE (fuera del scroll, siempre a mano) */}

      {!isFinished && (

        <View style={[styles.footer, isLandscape && styles.footerLandscape]}>

          <TouchableOpacity
            style={[styles.navButton, styles.footerButton, stepIndex === 0 && styles.buttonDisabled]}
            disabled={stepIndex === 0}
            onPress={goPrevious}
          >
            <Text style={styles.navButtonText}>‹ Anterior</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navButton, styles.footerButton]} onPress={goNext}>
            <Text style={styles.navButtonText}>
              {stepIndex === steps.length - 1 ? 'Finalizar' : 'Siguiente ›'}
            </Text>
          </TouchableOpacity>

        </View>

      )}


      {/* MODAL GIF / INSTRUCCIONES */}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >

        <View style={styles.modalBackground}>

          {/* Tocar fuera del modal lo cierra */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />

          <View style={[styles.modal, isLandscape && styles.modalLandscape]}>

            {selectedExercise && modalType === 'gif' && (
              <ExerciseGif gif={selectedExercise.gif} />
            )}

            {selectedExercise && modalType === 'instructions' && (

              <ScrollView style={styles.instructionsScroll} showsVerticalScrollIndicator={false}>

                <Text style={styles.exerciseModalName}> {selectedExercise.name} </Text>

                {/* La API da las instrucciones como lista de pasos */}
                {selectedExercise.instructions.map((instruction, index) => (
                  <Text key={index} style={styles.instructionsText}> {index + 1}. {instruction} </Text>
                ))}

              </ScrollView>

            )}

            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}> Cerrar </Text>
            </TouchableOpacity>

          </View>

        </View>

      </Modal>


      {/* MODAL RUTINA DEL DÍA: tocar un paso salta a ese paso */}

      <Modal
        visible={listVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setListVisible(false)}
      >

        <View style={styles.modalBackground}>

          <Pressable style={StyleSheet.absoluteFill} onPress={() => setListVisible(false)} />

          <View style={[styles.modal, isLandscape && styles.modalLandscape]}>

            <Text style={styles.exerciseModalName}> {day.name} </Text>

            <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>

              {day.blocks.map((block, blockIndex) => {

                // Índice del primer paso del bloque (los pasos están en el mismo orden)
                const firstStep = steps.findIndex((s) => s.blockIndex === blockIndex);

                return (
                  <View key={block.id} style={styles.listBlock}>

                    <Text style={styles.listBlockTitle}>{`Bloque ${blockIndex + 1}`}</Text>

                    {block.items.map((item, itemIndex) => {
                      const index = firstStep + itemIndex;
                      const isCurrent = index === stepIndex;

                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.listItem, isCurrent && styles.listItemCurrent]}
                          onPress={() => goToStep(index)}
                        >

                          {item.type === 'exercise' ? (
                            <>
                              <Text style={styles.listItemName}>
                                {getExerciseById(item.exerciseId)?.name ?? (loading ? 'Cargando…' : 'Ejercicio no disponible')}
                              </Text>
                              <Text style={styles.listItemDetails}>
                                {item.series} series · {item.repetitions} reps · {item.weight}
                              </Text>
                            </>
                          ) : (
                            <Text style={styles.listRestText}>
                              Descanso · {item.time} {formatRestUnit(item.time, item.unit)}
                            </Text>
                          )}

                          {isCurrent && <Text style={styles.listHere}>Estás acá</Text>}

                        </TouchableOpacity>
                      );
                    })}

                  </View>
                );
              })}

            </ScrollView>

            <TouchableOpacity style={styles.closeButton} onPress={() => setListVisible(false)}>
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

  swipeArea: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: '2.5%',
    paddingTop: '4%',
    paddingBottom: '5%',
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

  headerLandscape: {
    minHeight: 50,
    paddingHorizontal: 22,
  },

  backIcon: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '300',
    marginRight: 11,
  },

  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  /* PROGRESO */

  progressText: {
    color: '#999999',
    fontSize: 14,
    marginBottom: 8,
  },

  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#292929',
    overflow: 'hidden',
    marginBottom: 16,
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#FFC107',
  },


  /* PASO ACTUAL */

  stepArea: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  stepCard: {
    backgroundColor: '#242424',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    padding: '4%',
  },


  /* EJERCICIO */

  exerciseName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 9,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    paddingLeft: 9,
  },

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
    paddingHorizontal: 6,
    alignItems: 'center',
  },

  dataLabel: {
    color: '#B0B0B0',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 3,
    textAlign: 'center',
  },

  dataValue: {
    color: '#FFC107',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },

  comments: {
    color: '#AAAAAA',
    fontSize: 14,
    marginBottom: 9,
  },

  commentsLabel: {
    color: '#FF6B6B',
  },

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


  /* PASO FINAL */

  finished: {
    alignItems: 'center',
    paddingVertical: '12%',
  },

  finishedIcon: {
    color: '#FFC107',
    fontSize: 56,
    fontWeight: '700',
    marginBottom: 12,
  },

  finishedTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },

  finishedSubtitle: {
    color: '#999999',
    fontSize: 15,
    marginBottom: 28,
    textAlign: 'center',
  },


  /* ANTERIOR / SIGUIENTE */

  footer: {
    flexDirection: 'row',
    gap: 11,
    paddingHorizontal: '2.5%',
    paddingTop: 10,
    paddingBottom: 16,
    // Mismo fondo que la pantalla, para que no se confunda con la barra de pestañas
    backgroundColor: '#101010',
  },

  footerLandscape: {
    paddingHorizontal: 22,
  },

  // Anterior y Siguiente ocupan el mismo ancho
  footerButton: {
    flex: 1,
  },

  // Estilo único de los botones de navegación (Anterior / Siguiente / Volver)
  navButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    paddingHorizontal: 22,
    paddingVertical: 12,
    alignItems: 'center',
  },

  navButtonText: {
    color: '#CCCCCC',
    fontSize: 15,
    fontWeight: '600',
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

  exerciseModalName: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 14,
  },

  instructionsScroll: {
    maxHeight: 380,
  },

  instructionsText: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 9,
  },

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


  /* HEADER: VER RUTINA */

  listLink: {
    color: '#FFC107',
    fontSize: 13,
    fontWeight: '600',
  },


  /* MODAL RUTINA DEL DÍA */

  listScroll: {
    flexGrow: 0,
  },

  listBlock: {
    marginBottom: 14,
  },

  listBlockTitle: {
    color: '#FFC107',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },

  listItem: {
    backgroundColor: '#242424',
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#3A3A3A',
    padding: 12,
    marginBottom: 8,
  },

  listItemCurrent: {
    borderColor: '#FFC107',
  },

  listItemName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },

  listItemDetails: {
    color: '#888888',
    fontSize: 13,
  },

  listRestText: {
    color: '#66B8FF',
    fontSize: 14,
  },

  listHere: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
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

});
