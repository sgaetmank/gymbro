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
import UserBottomNav from '../components/UserBottomNav';
import { useExercises } from '../context/ExercisesContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export default function UserDayScreen({ navigation, route }) {

  const { isLandscape } = useResponsiveLayout();

  // Ejercicios traídos de la API (ver ExercisesContext)
  const { getExerciseById, loading, error, retry } = useExercises();

  const day = route?.params?.day;

    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedExercise, setSelectedExercise] = useState(null);

    const showGif = (exercise) => {
      setSelectedExercise(exercise);
      setModalType('gif');
      setModalVisible(true);
    };

    const showInstructions = (exercise) => {
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

    const [activeRestId, setActiveRestId] = useState(null);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [isRestRunning, setIsRestRunning] = useState(false);
    const intervalRef = useRef(null);

    const toSeconds = (time, unit) =>
      unit === 'minutos' ? time * 60 : time;

    const formatRestUnit = (time, unit) =>
      Number(time) === 1 ? unit.slice(0, -1) : unit;

    const clearRestInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    useEffect(() => clearRestInterval, []);

    const startRest = (itemId, time, unit) => {
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

    const formatRestTime = (totalSeconds) => {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    };


  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}

      <View style={[ styles.header, isLandscape && styles.headerLandscape,]}>

        <TouchableOpacity onPress={() => navigation.navigate('mi_rutina_user')}>
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

        <Text style={styles.title}> {day.name} </Text>


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
                        {' '}{getExerciseById(item.exerciseId)?.name ?? (loading ? 'Cargando…' : 'Ejercicio no disponible')}{' '}
                      </Text>


                      {/* DATOS DEL EJERCICIO */}

                      <View style={styles.exerciseData}>

                        <View style={styles.dataBox}>
                          <Text style={styles.dataLabel}> Series </Text>
                          <Text style={styles.dataValue}> {item.series} </Text>
                        </View>


                        <View style={styles.dataBox}>
                          <Text style={styles.dataLabel}> Reps </Text>
                          <Text style={styles.dataValue}>{item.repetitions} </Text>
                        </View>


                        <View style={styles.dataBox}>
                          <Text style={styles.dataLabel}> Peso </Text>
                          <Text style={styles.dataValue}> {item.weight} </Text>
                        </View>

                      </View>


                      {/* COMENTARIOS */}

                      {item.comments && (
                        <Text style={styles.comments}> {item.comments} </Text>
                      )}


                      {/* BOTONES */}
                      {/* Deshabilitados hasta que el ejercicio esté cargado */}

                      <View style={styles.buttons}>

                        <TouchableOpacity
                          style={styles.button}
                          disabled={!getExerciseById(item.exerciseId)}
                          onPress={() => showGif(getExerciseById(item.exerciseId))}
                        >
                            <Text style={styles.buttonText}> Ver ejercicio </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.button}
                          disabled={!getExerciseById(item.exerciseId)}
                          onPress={() => showInstructions(getExerciseById(item.exerciseId))}
                        >
                            <Text style={styles.buttonText}> Ver instrucciones </Text>
                        </TouchableOpacity>

                      </View>

                    </>

                  ) : (

                    /* DESCANSO */

                    <View style={styles.rest}>

                      <Text style={styles.restText}> Descanso: {item.time} {formatRestUnit(item.time, item.unit)} </Text>

                      <View style={styles.restTimerRow}>

                        <Text style={styles.restTimerText}>
                          {activeRestId === item.id
                            ? remainingSeconds === 0
                              ? '¡Descanso terminado!'
                              : formatRestTime(remainingSeconds)
                            : formatRestTime(toSeconds(item.time, item.unit))}
                        </Text>

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

    <UserBottomNav
      activeScreen="routine"
      isLandscape={isLandscape}
      navigation={navigation}
    />

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
    fontWeight: '300',
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


  /* TÍTULO */

  title: {
    color: '#FFC107',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 14,
  },


  /* BLOQUE */

  block: {
    backgroundColor: '#1D1D1D',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFE082',
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: '700',
  },



  /* EJERCICIO — cada item es su propia tarjeta, para diferenciarlos
     fácilmente de un vistazo mientras se entrena */

  item: {
    backgroundColor: '#242424',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    padding: '4%',
    marginBottom: 12,
  },

  exerciseName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },


  /* DATOS */

  exerciseData: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },

  dataBox: {
    flex: 1,
    backgroundColor: '#2E2E2E',
    borderRadius: 10,
    paddingVertical: '2.5%',
    alignItems: 'center',
  },

  dataLabel: {
    color: '#999999',
    fontSize: 13,
    marginBottom: 3,
  },

  dataValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },


  /* COMENTARIOS */

  comments: {
    color: '#AAAAAA',
    fontSize: 15,
    marginBottom: 10,
  },


  /* BOTONES */

  buttons: {
    flexDirection: 'row',
    gap: 10,
  },

  button: {
    flex: 1,
    backgroundColor: '#3A2B0D',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: '600',
  },


  /* DESCANSO */

  rest: {
    backgroundColor: '#202C35',
    borderRadius: 10,
    paddingVertical: '3%',
    paddingHorizontal: '3.5%',
  },

  restText: {
    color: '#66B8FF',
    fontSize: 17,
    fontWeight: '500',
  },

  restTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  restTimerText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },

  restPlayButton: {
    backgroundColor: '#66B8FF',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  restPlayButtonText: {
    color: '#101010',
    fontSize: 16,
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
    borderRadius: 16,
    padding: '6.5%',
  },

  modalLandscape: {
    width: '90%',
    maxWidth: 700,
  },

  modalTitle: {
    color: '#FFC107',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },

  exerciseModalName: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
    marginBottom: 16,
  },

  /* INSTRUCCIONES */

  instructionsScroll: {
    maxHeight: 420,
  },

  instructionsText: {
    color: '#CCCCCC',
    fontSize: 18,
    lineHeight: 27,
    marginBottom: 10,
  },

  /* ERROR DE CARGA */

  errorBox: {
    backgroundColor: '#3A1D1D',
    borderRadius: 10,
    padding: '3.5%',
    marginBottom: 14,
  },

  errorText: {
    color: '#FF8A80',
    fontSize: 15,
    marginBottom: 6,
  },

  retryText: {
    color: '#FFC107',
    fontSize: 15,
    fontWeight: '700',
  },

  /* BOTÓN CERRAR */

  closeButton: {
    backgroundColor: '#FFC107',
    borderRadius: 10,
    paddingVertical: '3.5%',
    alignItems: 'center',
    marginTop: '6%',
  },

  closeButtonText: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '700',
  },

});

 