import { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export default function EditRoutineScreen() {
  const { isLandscape } = useResponsiveLayout();

  // ============================================================
  // DATOS INICIALES DE EJEMPLO
  // ============================================================

  const [days, setDays] = useState([
    {
      id: 1,
      name: 'Día 1',
      blocks: [
        {
          id: 1,
          name: 'Bloque 1',
          items: [
            {
              id: 1,
              type: 'exercise',
              name: 'Curva lateral de 45°',
              series: '4',
              repetitions: '10',
              weight: '0 kg',
              comments: '',
            },
            {
              id: 2,
              type: 'rest',
              time: '1',
              unit: 'minutos',
            },
          ],
        },
        {
          id: 2,
          name: 'Bloque 2',
          items: [
            {
              id: 3,
              type: 'exercise',
              name: 'Estiramiento del equipo a cuatro patas',
              series: '2',
              repetitions: '2',
              weight: '2 kg',
              comments: '',
            },
          ],
        },
      ],
    },
    {
      id: 2,
      name: 'Día 2',
      blocks: [
        {
          id: 3,
          name: 'Bloque 1',
          items: [
            {
              id: 4,
              type: 'exercise',
              name: 'Bicicleta de aire',
              series: '2',
              repetitions: '33 reps',
              weight: '1 kg',
              comments: 'Nota: 33 por lado',
            },
            {
              id: 5,
              type: 'exercise',
              name: 'Jalón lateral alternativo',
              series: '4',
              repetitions: '22 reps',
              weight: '5 kg',
              comments: '',
            },
          ],
        },
      ],
    },
  ]);

  // ============================================================
  // ESTADOS DE LOS MODALES
  // ============================================================

  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [restModalVisible, setRestModalVisible] = useState(false);

  const [selectedDayId, setSelectedDayId] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);

  // ============================================================
  // CAMPOS PARA AGREGAR EJERCICIO
  // ============================================================

  const [exerciseName, setExerciseName] = useState('');
  const [series, setSeries] = useState('');
  const [repetitions, setRepetitions] = useState('');
  const [weight, setWeight] = useState('');
  const [comments, setComments] = useState('');

  // ============================================================
  // CAMPOS PARA AGREGAR DESCANSO
  // ============================================================

  const [restTime, setRestTime] = useState('');
  const [restUnit, setRestUnit] = useState('minutos');

  // ============================================================
  // AGREGAR DÍA
  // ============================================================

  const addDay = () => {
    const newDay = {
      id: Date.now(),
      name: `Día ${days.length + 1}`,
      blocks: [],
    };

    setDays([...days, newDay]);
  };

  // ============================================================
  // AGREGAR BLOQUE
  // ============================================================

  const addBlock = (dayId) => {
    setDays(
      days.map((day) => {
        if (day.id !== dayId) {
          return day;
        }

        const newBlock = {
          id: Date.now(),
          name: `Bloque ${day.blocks.length + 1}`,
          items: [],
        };

        return {
          ...day,
          blocks: [...day.blocks, newBlock],
        };
      })
    );
  };

  // ============================================================
  // ABRIR MODAL DE EJERCICIO
  // ============================================================

  const openExerciseModal = (dayId, blockId) => {
    setSelectedDayId(dayId);
    setSelectedBlockId(blockId);

    setExerciseName('');
    setSeries('');
    setRepetitions('');
    setWeight('');
    setComments('');

    setExerciseModalVisible(true);
  };

  // ============================================================
  // ABRIR MODAL DE DESCANSO
  // ============================================================

  const openRestModal = (dayId, blockId) => {
    setSelectedDayId(dayId);
    setSelectedBlockId(blockId);

    setRestTime('');
    setRestUnit('minutos');

    setRestModalVisible(true);
  };

  // ============================================================
  // AGREGAR EJERCICIO A UN BLOQUE
  // ============================================================

  const addExercise = () => {

    if (!exerciseName.trim()) {
      return;
    }

    const newExercise = {
      id: Date.now(),
      type: 'exercise',
      name: exerciseName,
      series: series || '0',
      repetitions: repetitions || '0',
      weight: weight || '0 kg',
      comments: comments,
    };

    setDays(
      days.map((day) => {

        if (day.id !== selectedDayId) {
          return day;
        }

        return {
          ...day,

          blocks: day.blocks.map((block) => {

            if (block.id !== selectedBlockId) {
              return block;
            }

            return {
              ...block,
              items: [...block.items, newExercise],
            };
          }),
        };
      })
    );

    setExerciseModalVisible(false);
  };

  // ============================================================
  // AGREGAR DESCANSO A UN BLOQUE
  // ============================================================

  const addRest = () => {

    if (!restTime.trim()) {
      return;
    }

    const newRest = {
      id: Date.now(),
      type: 'rest',
      time: restTime,
      unit: restUnit,
    };

    setDays(
      days.map((day) => {

        if (day.id !== selectedDayId) {
          return day;
        }

        return {
          ...day,

          blocks: day.blocks.map((block) => {

            if (block.id !== selectedBlockId) {
              return block;
            }

            return {
              ...block,
              items: [...block.items, newRest],
            };
          }),
        };
      })
    );

    setRestModalVisible(false);
  };

  // ============================================================
// MOVER DÍA
// ============================================================

const moveDay = (dayId, direction) => {

  const currentIndex = days.findIndex(
    (day) => day.id === dayId
  );

  const newIndex =
    direction === 'up'
      ? currentIndex - 1
      : currentIndex + 1;

  // Si está en el límite, no hacemos nada
  if (
    currentIndex === -1 ||
    newIndex < 0 ||
    newIndex >= days.length
  ) {
    return;
  }

  const newDays = [...days];

  // Intercambiamos las posiciones
  const temp = newDays[currentIndex];

  newDays[currentIndex] = newDays[newIndex];
  newDays[newIndex] = temp;

  setDays(newDays);
};

// ============================================================
// MOVER BLOQUE DENTRO DE UN DÍA
// ============================================================

const moveBlock = (dayId, blockId, direction) => {

  setDays(
    days.map((day) => {

      // Si no es el día correspondiente,
      // no modificamos nada
      if (day.id !== dayId) {
        return day;
      }

      const currentIndex = day.blocks.findIndex(
        (block) => block.id === blockId
      );

      const newIndex =
        direction === 'up'
          ? currentIndex - 1
          : currentIndex + 1;

      // Si está en un límite, no hacemos nada
      if (
        currentIndex === -1 ||
        newIndex < 0 ||
        newIndex >= day.blocks.length
      ) {
        return day;
      }

      const newBlocks = [...day.blocks];

      // Intercambiamos los bloques
      const temp = newBlocks[currentIndex];

      newBlocks[currentIndex] = newBlocks[newIndex];
      newBlocks[newIndex] = temp;

      return {
        ...day,
        blocks: newBlocks,
      };
    })
  );
};


// ============================================================
// MOVER EJERCICIO / DESCANSO DENTRO DE UN BLOQUE
// ============================================================

const moveItem = (dayId, blockId, itemId, direction) => {

  setDays(
    days.map((day) => {

      // Buscar el día correcto
      if (day.id !== dayId) {
        return day;
      }

      return {
        ...day,

        blocks: day.blocks.map((block) => {

          // Buscar el bloque correcto
          if (block.id !== blockId) {
            return block;
          }

          const currentIndex = block.items.findIndex(
            (item) => item.id === itemId
          );

          const newIndex =
            direction === 'up'
              ? currentIndex - 1
              : currentIndex + 1;

          // Si está en un límite, no hacemos nada
          if (
            currentIndex === -1 ||
            newIndex < 0 ||
            newIndex >= block.items.length
          ) {
            return block;
          }

          const newItems = [...block.items];

          // Intercambiamos los elementos
          const temp = newItems[currentIndex];

          newItems[currentIndex] = newItems[newIndex];
          newItems[newIndex] = temp;

          return {
            ...block,
            items: newItems,
          };
        }),
      };
    })
  );
};

  // ============================================================
  // ELIMINAR EJERCICIO / DESCANSO
  // ============================================================

  const deleteItem = (dayId, blockId, itemId) => {

    setDays(
      days.map((day) => {

        if (day.id !== dayId) {
          return day;
        }

        return {
          ...day,

          blocks: day.blocks.map((block) => {

            if (block.id !== blockId) {
              return block;
            }

            return {
              ...block,
              items: block.items.filter(
                (item) => item.id !== itemId
              ),
            };
          }),
        };
      })
    );
  };

  // ============================================================
  // ELIMINAR BLOQUE
  // ============================================================

  const deleteBlock = (dayId, blockId) => {

    setDays(
      days.map((day) => {

        if (day.id !== dayId) {
          return day;
        }

        return {
          ...day,
          blocks: day.blocks.filter(
            (block) => block.id !== blockId
          ),
        };
      })
    );
  };

  // ============================================================
  // ELIMINAR DÍA
  // ============================================================

  const deleteDay = (dayId) => {

    setDays(
      days.filter((day) => day.id !== dayId)
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <SafeAreaView style={styles.container}>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <View
        style={[
          styles.header,
          isLandscape && styles.headerLandscape,
        ]}
      >

        <TouchableOpacity>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Editar
        </Text>

        <View style={styles.headerSpacer} />

        <TouchableOpacity
          style={[
            styles.saveButton,
            isLandscape && styles.saveButtonLandscape,
          ]}
        >
          <Text style={styles.saveIcon}>
            ▣
          </Text>
        </TouchableOpacity>

      </View>


      {/* ======================================================
          CONTENIDO
      ====================================================== */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          isLandscape && styles.contentLandscape,
        ]}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.titleRow}>

          <Text style={styles.routineTitle}>
            Rutina de Sol
          </Text>

          <View style={styles.unsavedBadge}>
            <Text style={styles.unsavedText}>
              Cambios sin guardar
            </Text>
          </View>

        </View>


        {/* ====================================================
            DÍAS
        ==================================================== */}

        {days.map((day) => (

          <View
            key={day.id}
            style={styles.dayContainer}
          >

            {/* HEADER DEL DÍA */}

            <View style={styles.dayHeader}>

              <View style={styles.dayTitleContainer}>

                <View style={styles.arrowColumn}>

                <TouchableOpacity
                  style={styles.arrowButton}
                    disabled={days.findIndex(
                    (d) => d.id === day.id
                    ) === 0}
                    onPress={() =>
                    moveDay(day.id, 'up')
                    }
                >
                    <Text
                    style={[
                        styles.arrow,
                        days.findIndex(
                        (d) => d.id === day.id
                        ) === 0 && styles.disabledArrow,
                    ]}
                    >
                    ⌃
                    </Text>
                </TouchableOpacity>


                <TouchableOpacity
                  style={styles.arrowButton}
                    disabled={days.findIndex(
                    (d) => d.id === day.id
                    ) === days.length - 1}
                    onPress={() =>
                    moveDay(day.id, 'down')
                    }
                >
                    <Text
                    style={[
                        styles.arrow,
                        days.findIndex(
                        (d) => d.id === day.id
                        ) === days.length - 1 &&
                        styles.disabledArrow,
                    ]}
                    >
                    ⌄
                    </Text>
                </TouchableOpacity>

                </View>

                <Text style={styles.dayTitle}>
                  {day.name}
                </Text>

              </View>

              <View style={styles.dayActions}>

                <TouchableOpacity style={styles.viewDayButton}>
                  <Text style={styles.viewDayText}>
                    ◉ Ver día
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => deleteDay(day.id)}
                >
                  <Text style={styles.deleteIcon}>
                    🗑
                  </Text>
                </TouchableOpacity>

              </View>

            </View>


            {/* =================================================
                BLOQUES DEL DÍA
            ================================================= */}

            {day.blocks.map((block) => (

              <View
                key={block.id}
                style={styles.blockContainer}
              >

                {/* HEADER DEL BLOQUE */}

                <View style={styles.blockHeader}>

                    <View style={styles.blockTitleContainer}>

                    <View style={styles.blockArrowColumn}>

                        <TouchableOpacity
                        style={styles.smallArrowButton}
                        disabled={
                            day.blocks.findIndex(
                            (b) => b.id === block.id
                            ) === 0
                        }
                        onPress={() =>
                            moveBlock(
                            day.id,
                            block.id,
                            'up'
                            )
                        }
                        >
                        <Text
                            style={[
                            styles.smallArrow,
                            day.blocks.findIndex(
                                (b) => b.id === block.id
                            ) === 0 && styles.disabledSmallArrow,
                            ]}
                        >
                            ⌃
                        </Text>
                        </TouchableOpacity>


                        <TouchableOpacity
                        style={styles.smallArrowButton}
                        disabled={
                            day.blocks.findIndex(
                            (b) => b.id === block.id
                            ) === day.blocks.length - 1
                        }
                        onPress={() =>
                            moveBlock(
                            day.id,
                            block.id,
                            'down'
                            )
                        }
                        >
                        <Text
                            style={[
                            styles.smallArrow,
                            day.blocks.findIndex(
                                (b) => b.id === block.id
                            ) === day.blocks.length - 1 &&
                                styles.disabledSmallArrow,
                            ]}
                        >
                            ⌄
                        </Text>
                        </TouchableOpacity>

                    </View>

                    <Text style={styles.blockTitle}>
                        {block.name}
                    </Text>

                    </View>

                  <TouchableOpacity
                    onPress={() =>
                      deleteBlock(day.id, block.id)
                    }
                  >
                    <Text style={styles.deleteIcon}>
                      🗑
                    </Text>
                  </TouchableOpacity>

                </View>


                {/* =================================================
                    EJERCICIOS / DESCANSOS
                ================================================= */}

                {block.items.map((item) => (

                  <View
                    key={item.id}
                    style={[
                      styles.itemCard,
                      item.type === 'rest'
                        ? styles.restCard
                        : styles.exerciseCard,
                    ]}
                  >

                    <View style={styles.itemMain}>

                        <View style={styles.itemArrows}>

                        <TouchableOpacity
                          style={styles.itemArrowButton}
                            disabled={
                            block.items.findIndex(
                                (i) => i.id === item.id
                            ) === 0
                            }
                            onPress={() =>
                            moveItem(
                                day.id,
                                block.id,
                                item.id,
                                'up'
                            )
                            }
                        >
                            <Text
                            style={[
                                styles.itemArrow,
                                block.items.findIndex(
                                (i) => i.id === item.id
                                ) === 0 &&
                                styles.disabledItemArrow,
                            ]}
                            >
                            ⌃
                            </Text>
                        </TouchableOpacity>


                        <TouchableOpacity
                          style={styles.itemArrowButton}
                            disabled={
                            block.items.findIndex(
                                (i) => i.id === item.id
                            ) === block.items.length - 1
                            }
                            onPress={() =>
                            moveItem(
                                day.id,
                                block.id,
                                item.id,
                                'down'
                            )
                            }
                        >
                            <Text
                            style={[
                                styles.itemArrow,
                                block.items.findIndex(
                                (i) => i.id === item.id
                                ) === block.items.length - 1 &&
                                styles.disabledItemArrow,
                            ]}
                            >
                            ⌄
                            </Text>
                        </TouchableOpacity>

                        </View>

                      <View style={styles.itemInfo}>

                        {item.type === 'exercise' ? (

                          <>
                            <Text style={styles.exerciseName}>
                              {item.name}
                            </Text>

                            <Text style={styles.exerciseDetails}>
                              {item.series} series de{' '}
                              {item.repetitions} - {item.weight}
                            </Text>

                            {item.comments ? (
                              <Text style={styles.comment}>
                                Nota: {item.comments}
                              </Text>
                            ) : null}
                          </>

                        ) : (

                          <Text style={styles.restText}>
                            ⏳ Descanso: {item.time} {item.unit}
                          </Text>

                        )}

                      </View>

                      {/* ACCIONES */}

                      <View style={styles.itemActions}>

                        <TouchableOpacity>
                          <Text style={styles.editIcon}>
                            ✎
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            deleteItem(
                              day.id,
                              block.id,
                              item.id
                            )
                          }
                        >
                          <Text style={styles.deleteIcon}>
                            🗑
                          </Text>
                        </TouchableOpacity>

                      </View>

                    </View>

                  </View>

                ))}


                {/* =================================================
                    AGREGAR EJERCICIO / DESCANSO
                ================================================= */}

                <View style={styles.addItemRow}>

                  <TouchableOpacity
                    style={styles.addItemButton}
                    onPress={() =>
                      openExerciseModal(
                        day.id,
                        block.id
                      )
                    }
                  >
                    <Text style={styles.addItemText}>
                      ＋ Ejercicio
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.addItemButton}
                    onPress={() =>
                      openRestModal(
                        day.id,
                        block.id
                      )
                    }
                  >
                    <Text style={styles.addItemText}>
                      ＋ Descanso
                    </Text>
                  </TouchableOpacity>

                </View>

              </View>

            ))}


            {/* =================================================
                AGREGAR BLOQUE
            ================================================= */}

            <TouchableOpacity
              style={styles.addBlockButton}
              onPress={() => addBlock(day.id)}
            >
              <Text style={styles.addBlockText}>
                ＋ Agregar Bloque
              </Text>
            </TouchableOpacity>

          </View>

        ))}


        {/* ======================================================
            AGREGAR DÍA
        ====================================================== */}

        <TouchableOpacity
          style={styles.addDayButton}
          onPress={addDay}
        >
          <Text style={styles.addDayText}>
            ＋ Añadir Día
          </Text>
        </TouchableOpacity>

      </ScrollView>


      {/* ========================================================
          MODAL: AGREGAR EJERCICIO
      ======================================================== */}

      <Modal
        visible={exerciseModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setExerciseModalVisible(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View
            style={[
              styles.modal,
              isLandscape && styles.modalLandscape,
            ]}
          >

            <View style={styles.modalHeader}>

              <Text style={styles.modalTitle}>
                Agregar Ejercicio
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setExerciseModalVisible(false)
                }
              >
                <Text style={styles.closeButton}>
                  ×
                </Text>
              </TouchableOpacity>

            </View>


            {/* BUSCADOR */}

            <TextInput
              style={styles.modalInput}
              placeholder="Buscar ejercicio o grupo muscular..."
              placeholderTextColor="#777777"
              value={exerciseName}
              onChangeText={setExerciseName}
            />


            {/* EJERCICIOS DE EJEMPLO */}

            <View style={styles.exerciseSuggestions}>

              <Text style={styles.suggestionTitle}>
                Ejercicios sugeridos
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setExerciseName('3/4 abdominales')
                }
              >
                <Text style={styles.suggestion}>
                  3/4 abdominales
                </Text>

                <Text style={styles.suggestionCategory}>
                  Abdomen
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setExerciseName('Curva lateral de 45°')
                }
              >
                <Text style={styles.suggestion}>
                  Curva lateral de 45°
                </Text>

                <Text style={styles.suggestionCategory}>
                  Abdomen
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setExerciseName('Bicicleta de aire')
                }
              >
                <Text style={styles.suggestion}>
                  Bicicleta de aire
                </Text>

                <Text style={styles.suggestionCategory}>
                  Abdomen
                </Text>
              </TouchableOpacity>

            </View>


            {/* DATOS DEL EJERCICIO */}

            <Text style={styles.modalLabel}>
              Series
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ej: 4"
              placeholderTextColor="#777777"
              keyboardType="numeric"
              value={series}
              onChangeText={setSeries}
            />

            <Text style={styles.modalLabel}>
              Repeticiones por Serie
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ej: 10"
              placeholderTextColor="#777777"
              keyboardType="numeric"
              value={repetitions}
              onChangeText={setRepetitions}
            />

            <Text style={styles.modalLabel}>
              Peso
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ej: 60"
              placeholderTextColor="#777777"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />

            <Text style={styles.modalLabel}>
              Comentarios (Opcional)
            </Text>

            <TextInput
              style={styles.commentInput}
              placeholder="Técnica, cadencia..."
              placeholderTextColor="#777777"
              multiline
              value={comments}
              onChangeText={setComments}
            />


            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={addExercise}
            >
              <Text style={styles.modalPrimaryText}>
                Añadir a la rutina
              </Text>
            </TouchableOpacity>

          </View>

        </View>

      </Modal>


      {/* ========================================================
          MODAL: AGREGAR DESCANSO
      ======================================================== */}

      <Modal
        visible={restModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setRestModalVisible(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View
            style={[
              styles.modal,
              isLandscape && styles.modalLandscape,
            ]}
          >

            <View style={styles.modalHeader}>

              <Text style={styles.modalTitle}>
                Agregar Descanso
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setRestModalVisible(false)
                }
              >
                <Text style={styles.closeButton}>
                  ×
                </Text>
              </TouchableOpacity>

            </View>


            <Text style={styles.modalLabel}>
              Unidad de Tiempo
            </Text>

            <View style={styles.unitRow}>

              <TouchableOpacity
                style={[
                  styles.unitButton,
                  restUnit === 'minutos' &&
                    styles.selectedUnit,
                ]}
                onPress={() =>
                  setRestUnit('minutos')
                }
              >
                <Text
                  style={[
                    styles.unitText,
                    restUnit === 'minutos' &&
                      styles.selectedUnitText,
                  ]}
                >
                  Minutos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.unitButton,
                  restUnit === 'segundos' &&
                    styles.selectedUnit,
                ]}
                onPress={() =>
                  setRestUnit('segundos')
                }
              >
                <Text
                  style={[
                    styles.unitText,
                    restUnit === 'segundos' &&
                      styles.selectedUnitText,
                  ]}
                >
                  Segundos
                </Text>
              </TouchableOpacity>

            </View>


            <Text style={styles.modalLabel}>
              Tiempo
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ej: 1.5"
              placeholderTextColor="#777777"
              keyboardType="numeric"
              value={restTime}
              onChangeText={setRestTime}
            />


            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={addRest}
            >
              <Text style={styles.modalPrimaryText}>
                Agregar
              </Text>
            </TouchableOpacity>

          </View>

        </View>

      </Modal>

    </SafeAreaView>
  );
}


// =================================================================
// ESTILOS
// =================================================================

const styles = StyleSheet.create({

  /* ==============================================================
     GENERAL
  ============================================================== */

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
    paddingBottom: '6%',
  },

  contentLandscape: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },


  /* ==============================================================
     HEADER
  ============================================================== */

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
    minHeight: 48,
    paddingHorizontal: 16,
  },

  headerSpacer: {
    flex: 1,
  },

  saveButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFC107',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonLandscape: {
    width: 36,
    height: 36,
  },

  saveIcon: {
    color: '#111111',
    fontSize: 15,
  },


  /* ==============================================================
     TÍTULO
  ============================================================== */

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  routineTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },

  unsavedBadge: {
    backgroundColor: '#D63E3E',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  unsavedText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '700',
  },


  /* ==============================================================
     DÍA
  ============================================================== */

  dayContainer: {
    backgroundColor: '#191919',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#292929',
    padding: '2.3%',
    marginBottom: '2.5%',
  },

  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#292929',
    paddingBottom: '1.8%',
    marginBottom: '2%',
  },

  dayTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  arrowColumn: {
    marginRight: 6,
  },

  arrowButton: {
    width: 34,
    height: 30,
    backgroundColor: '#302714',
    borderWidth: 1,
    borderColor: '#59430E',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },

  arrow: {
    color: '#FFC107',
    fontSize: 20,
    lineHeight: 20,
    textAlign: 'center',
  },

  disabledArrow: {
  color: '#444444',
},

  dayTitle: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: '700',
  },

  dayActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  viewDayButton: {
    backgroundColor: '#302714',
    borderWidth: 1,
    borderColor: '#59430E',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginRight: 8,
  },

  viewDayText: {
    color: '#FFC107',
    fontSize: 7,
    fontWeight: '700',
  },

  deleteIcon: {
    color: '#FF5A5F',
    fontSize: 14,
    fontWeight: '700',
  },


  /* ==============================================================
     BLOQUE
  ============================================================== */

  blockContainer: {
    backgroundColor: '#242424',
    borderRadius: 7,
    padding: '2%',
    marginBottom: '2%',
  },

  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '1.8%',
  },

  blockTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  smallArrow: {
    color: '#8A8A8A',
    fontSize: 18,
    lineHeight: 18,
    textAlign: 'center',
  },

  smallArrowButton: {
    width: 32,
    height: 28,
    backgroundColor: '#303030',
    borderWidth: 1,
    borderColor: '#4A4A4A',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },

  blockTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },

  blockArrowColumn: {
  marginRight: 5,
},

disabledSmallArrow: {
  color: '#444444',
},

  /* ==============================================================
     EJERCICIO / DESCANSO
  ============================================================== */

  itemCard: {
    borderRadius: 6,
    padding: '2%',
    marginBottom: '1.3%',
  },

  exerciseCard: {
    backgroundColor: '#181818',
  },

  restCard: {
    backgroundColor: '#1B1B1B',
  },

  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemArrows: {
    marginRight: 6,
  },

  itemArrowButton: {
    width: 32,
    height: 30,
    backgroundColor: '#302714',
    borderWidth: 1,
    borderColor: '#59430E',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },

  itemArrow: {
    color: '#FFC107',
    fontSize: 17,
    lineHeight: 17,
    textAlign: 'center',
  },

  disabledItemArrow: {
  color: '#444444',
},

  itemInfo: {
    flex: 1,
  },

  exerciseName: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },

  exerciseDetails: {
    color: '#AAAAAA',
    fontSize: 8,
    marginTop: 3,
  },

  comment: {
    color: '#FFC107',
    fontSize: 7,
    marginTop: 3,
  },

  restText: {
    color: '#52A9E8',
    fontSize: 9,
    fontWeight: '600',
  },

  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 5,
  },

  editIcon: {
    color: '#4CA8E8',
    fontSize: 14,
  },


  /* ==============================================================
     AGREGAR EJERCICIO / DESCANSO
  ============================================================== */

  addItemRow: {
    flexDirection: 'row',
    marginTop: 4,
  },

  addItemButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
  },

  addItemText: {
    color: '#FFC107',
    fontSize: 9,
    fontWeight: '700',
  },


  /* ==============================================================
     AGREGAR BLOQUE
  ============================================================== */

  addBlockButton: {
    paddingVertical: '2.5%',
    backgroundColor: '#303030',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  addBlockText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },


  /* ==============================================================
     AGREGAR DÍA
  ============================================================== */

  addDayButton: {
    paddingVertical: '3%',
    backgroundColor: '#FFC107',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  addDayText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '700',
  },


  /* ==============================================================
     MODALES
  ============================================================== */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    justifyContent: 'flex-end',
  },

  modal: {
    backgroundColor: '#1D1D1D',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: '4%',
    maxHeight: '85%',
  },

  modalLandscape: {
    width: '90%',
    maxWidth: 700,
    alignSelf: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 24,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  modalTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },

  closeButton: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
  },

  modalLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },

  modalInput: {
    paddingVertical: '2.8%',
    paddingHorizontal: '3%',
    backgroundColor: '#101010',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#292929',
    color: '#FFFFFF',
    fontSize: 10
  },

  commentInput: {
    paddingVertical: '3%',
    paddingHorizontal: '3%',
    backgroundColor: '#101010',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#292929',
    color: '#FFFFFF',
    fontSize: 10,
    paddingTop: 10,
    textAlignVertical: 'top',
    minHeight: '13%',
  },

  /* SUGERENCIAS */

  exerciseSuggestions: {
    backgroundColor: '#181818',
    borderRadius: 7,
    padding: '2.5%',
    marginTop: '2%',
  },

  suggestionTitle: {
    color: '#FFC107',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 7,
  },

  suggestion: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#292929',
  },

  suggestionCategory: {
    color: '#777777',
    fontSize: 7,
    paddingBottom: 5,
  },

  /* UNIDAD DE TIEMPO */

  unitRow: {
    flexDirection: 'row',
    gap: 7,
  },

  unitButton: {
    flex: 1,
    paddingVertical: '2.8%', 
    borderRadius: 7,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedUnit: {
    backgroundColor: '#3A2B0D',
    borderColor: '#FFC107',
  },

  unitText: {
    color: '#888888',
    fontSize: 9,
    fontWeight: '600',
  },

  selectedUnitText: {
    color: '#FFC107',
  },

  /* BOTÓN MODAL */

  modalPrimaryButton: {
    paddingVertical: '3%',
    backgroundColor: '#FFC107',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '3.5%',
  },

  modalPrimaryText: {
    color: '#111111',
    fontSize: 10,
    fontWeight: '700',
  },

});