import { useState } from 'react';

import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import ExerciseVideo from '../components/ExerciseVideo';
import UserBottomNav from '../components/UserBottomNav';
import { getExerciseById } from '../data/exercises';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export default function UserDayScreen({ navigation, route }) {

  const { isLandscape } = useResponsiveLayout();


  const day = route?.params?.day;

    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedExercise, setSelectedExercise] = useState(null);

    const showVideo = (exercise) => {
      setSelectedExercise(exercise);
      setModalType('video');
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


  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}

      <View
        style={[
          styles.header,
          isLandscape && styles.headerLandscape,
        ]}
      >

        <TouchableOpacity onPress={() => navigation.navigate('mi_rutina_user')}>
          <Text style={styles.backIcon} >
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {day.name}
        </Text>

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

        {/* TÍTULO */}

        <Text style={styles.title}>
          {day.name}
        </Text>


        {/* BLOQUES */}

        {day.blocks.map((block, blockIndex) => (

          <View
            key={block.id}
            style={styles.block}
          >

            {/* ENCABEZADO DEL BLOQUE (no se guarda: se calcula según la posición) */}

            <View style={styles.blockHeader}>

              <Text style={styles.blockTitle}>
                {`Bloque ${blockIndex + 1}`}
              </Text>

            </View>


            {/* CONTENIDO DEL BLOQUE */}

            <View style={styles.blockContent}>

              {block.items.map((item) => (

                <View
                  key={item.id}
                  style={styles.item}
                >

                  {item.type === 'exercise' ? (

                    <>

                      {/* NOMBRE DEL EJERCICIO */}

                      <Text style={styles.exerciseName}>
                        {getExerciseById(item.exerciseId)?.name}
                      </Text>


                      {/* DATOS DEL EJERCICIO */}

                      <View style={styles.exerciseData}>

                        <View style={styles.dataBox}>
                          <Text style={styles.dataLabel}>
                            Series
                          </Text>

                          <Text style={styles.dataValue}>
                            {item.series}
                          </Text>
                        </View>


                        <View style={styles.dataBox}>
                          <Text style={styles.dataLabel}>
                            Reps
                          </Text>

                          <Text style={styles.dataValue}>
                            {item.repetitions}
                          </Text>
                        </View>


                        <View style={styles.dataBox}>
                          <Text style={styles.dataLabel}>
                            Peso
                          </Text>

                          <Text style={styles.dataValue}>
                            {item.weight}
                          </Text>
                        </View>

                      </View>


                      {/* COMENTARIOS */}

                      {item.comments && (
                        <Text style={styles.comments}>
                          {item.comments}
                        </Text>
                      )}


                      {/* BOTONES */}

                      <View style={styles.buttons}>

                        <TouchableOpacity style={styles.button} onPress={() => showVideo(getExerciseById(item.exerciseId))}>
                            <Text style={styles.buttonText}>
                                Ver ejercicio
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.button} onPress={() => showInstructions(getExerciseById(item.exerciseId))}>
                            <Text style={styles.buttonText}>
                                Ver instrucciones
                            </Text>
                        </TouchableOpacity>

                      </View>

                    </>

                  ) : (

                    /* DESCANSO */

                    <View style={styles.rest}>

                      <Text style={styles.restText}>
                        Descanso: {item.time} {item.unit}
                      </Text>

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
        >

        <View style={styles.modalBackground}>

            <View
              style={[
                styles.modal,
                isLandscape && styles.modalLandscape,
              ]}
            >


            {/* CONTENIDO */}

            {selectedExercise && modalType === 'video' && (
                <ExerciseVideo
                video={selectedExercise.video}
                />
            )}


            {selectedExercise && modalType === 'instructions' && (

                <ScrollView
                style={styles.instructionsScroll}
                showsVerticalScrollIndicator={false}
                >

                <Text style={styles.exerciseModalName}>
                    {selectedExercise.name}
                </Text>

                <Text style={styles.instructionsText}>
                    {selectedExercise.description}
                </Text>

                </ScrollView>

            )}


            {/* CERRAR */}

            <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
            >

                <Text style={styles.closeButtonText}>
                Cerrar
                </Text>

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

   /* MODAL */
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },

  modal: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#1D1D1D',
    borderRadius: 16,
    padding: '5.5%',
  },

  modalLandscape: {
    width: '90%',
    maxWidth: 700,
  },

  modalTitle: {
    color: '#FFC107',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 14,
  },

  exerciseModalName: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '600',
    marginBottom: 14,
  },

  /* INSTRUCCIONES */

  instructionsScroll: {
    maxHeight: 320,
  },

  instructionsText: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 22,
  },

  /* BOTÓN CERRAR */

  closeButton: {
    backgroundColor: '#FFC107',
    borderRadius: 10,
    paddingVertical: '3%',
    alignItems: 'center',
    marginTop: '5%',
  },

  closeButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },

});

 