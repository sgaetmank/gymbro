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

        {day.blocks.map((block) => (

          <View
            key={block.id}
            style={styles.block}
          >

            {/* ENCABEZADO DEL BLOQUE */}

            <View style={styles.blockHeader}>

              <Text style={styles.blockTitle}>
                {block.name}
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
                        Descanso: {item.time}
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


  /* TÍTULO */

  title: {
    color: '#FFC107',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },


  /* BLOQUE */

  block: {
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    marginBottom: '2.5%',
    overflow: 'hidden',
  },

  blockHeader: {
    backgroundColor: '#292929',
    paddingHorizontal: '2.5%',
    paddingVertical: '2.5%',
  },

  blockContent: {
    padding: '2%',
  },

  blockTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },



  /* EJERCICIO */

  item: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },

  exerciseName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 7,
  },


  /* DATOS */

  exerciseData: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },

  dataBox: {
    flex: 1,
    backgroundColor: '#292929',
    borderRadius: 5,
    paddingVertical: '1.5%',
    alignItems: 'center',
  },

  dataLabel: {
    color: '#777777',
    fontSize: 9,
    marginBottom: 2,
  },

  dataValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },


  /* COMENTARIOS */

  comments: {
    color: '#888888',
    fontSize: 10,
    marginBottom: 6,
  },


  /* BOTONES */

  buttons: {
    flexDirection: 'row',
    gap: 8,
  },

  button: {
    backgroundColor: '#3A2B0D',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  buttonText: {
    color: '#FFC107',
    fontSize: 10,
    fontWeight: '600',
  },


  /* DESCANSO */

  rest: {
    backgroundColor: '#202C35',
    borderRadius: 5,
    paddingVertical: '2%',
    paddingHorizontal: '2.3%',
  },

  restText: {
    color: '#66B8FF',
    fontSize: 11,
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
    borderRadius: 10,
    padding: '4%',
  },

  modalLandscape: {
    width: '90%',
    maxWidth: 700,
  },

  modalTitle: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },

  exerciseModalName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 10,
  },

  /* INSTRUCCIONES */

  instructionsScroll: {
    maxHeight: 250,
  },

  instructionsText: {
    color: '#CCCCCC',
    fontSize: 10,
    lineHeight: 17,
  },

  /* BOTÓN CERRAR */

  closeButton: {
    backgroundColor: '#FFC107',
    borderRadius: 7,
    paddingVertical: '2.3%',
    alignItems: 'center',
    marginTop: '4%',
  },

  closeButtonText: {
    color: '#111111',
    fontSize: 9,
    fontWeight: '700',
  },

});

 