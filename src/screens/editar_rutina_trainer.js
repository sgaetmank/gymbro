import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import TrainerBottomNav from '../components/TrainerBottomNav';
import { exercises, getExerciseById } from '../data/exercises';
import { createRoutine, getRoutineById, updateRoutineDays } from '../data/routines';
import { setUserRoutine } from '../data/users';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export default function EditRoutineScreen({ navigation, route }) {
  const { isLandscape } = useResponsiveLayout();
  // Usuario al que se le está editando la rutina (viene de la pantalla de búsqueda)
  const editedUser = route?.params?.user;
  // Un alumno recién registrado todavía no tiene rutina: se crea al guardar por primera vez
  const routine = getRoutineById(editedUser?.id_rutina);
  // Id de la rutina del alumno (null hasta que se cree), para no crearla dos veces
  const routineId = useRef(routine?.id ?? null);

  // Saca tildes/acentos para que la búsqueda no dependa de escribirlos bien
  const normalizar = (texto) =>
    texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();

  // ============================================================
  // DATOS INICIALES DE EJEMPLO
  // ============================================================

  const [days, setDays] = useState(routine?.days ?? []);

  // Foto de lo último guardado, para detectar cambios pendientes
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(routine?.days ?? [])
  );
  const hasUnsavedChanges = JSON.stringify(days) !== savedSnapshot;

  // Se activa justo antes de salir para que el aviso no se repita
  const skipExitPrompt = useRef(false);

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
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
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

        // "Bloque N" no se guarda: se calcula al mostrarlo, según la posición del bloque
        const newBlock = {
          id: Date.now(),
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
    setSelectedExerciseId(null);
    setSeries('');
    setRepetitions('');
    setWeight('');
    setComments('');

    setExerciseModalVisible(true);
  };

  // Ejercicios que coinciden con lo buscado (nombre o grupo muscular), sin importar tildes
  const ejerciciosFiltrados = exercises.filter((exercise) =>
    normalizar(`${exercise.name} ${exercise.muscleGroup}`).includes(
      normalizar(exerciseName)
    )
  ).slice(0, 3); //limita el resultado a los primeros 3 matches para no saturar la pantalla con una lista larga

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

    if (!selectedExerciseId) {
      return;
    }

    const newExercise = {
      id: Date.now(),
      type: 'exercise',
      exerciseId: selectedExerciseId,
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
  // GUARDAR Y AVISO AL SALIR
  // ============================================================

  // Pasa el borrador a datos guardados. Si el alumno no tenía rutina, la crea y se la asigna.
  const persistRoutine = () => {
    if (routineId.current === null) {
      const created = createRoutine(days);
      setUserRoutine(editedUser.id, created.id);
      routineId.current = created.id;
    } else {
      updateRoutineDays(routineId.current, days);
    }
  };

  const saveChanges = () => {
    persistRoutine();
    setSavedSnapshot(JSON.stringify(days)); // anota "esto es lo último guardado"
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedChanges || skipExitPrompt.current) { // nada que avisar: dejá pasar
        return;
      }

      // congela la salida. El usuario sigue en la pantalla hasta que el entrenador elija
      e.preventDefault(); 

      const leave = () => {
        skipExitPrompt.current = true;
        // Retoma la salida original (atrás, cambio de pestaña, etc.)
        navigation.dispatch(e.data.action);
      };

      // Preguntá qué hacer
      Alert.alert( 
        'Cambios sin guardar',
        'Hiciste cambios en la rutina que todavía no se guardaron.',
        [
          { text: 'Seguir editando', style: 'cancel' },
          {
            text: 'Salir sin guardar',
            style: 'destructive',
            onPress: leave,
          },
          {
            text: 'Guardar y salir',
            onPress: () => {
              persistRoutine();
              leave();
            },
          },
        ],
        // Tocar afuera equivale a "Seguir editando"
        { cancelable: true }
      );
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges, persistRoutine]);

  //"Buscar Usuario" hace goBack() y "Mi Cuenta" hace replace(...), que reemplaza la pantalla
  const guardedNavigation = {
    navigate: (screen) =>
      screen === 'buscar_usuario_trainer'
        ? navigation.goBack()
        : navigation.replace(screen),
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

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Editar
        </Text>

        <TouchableOpacity
          style={[
            styles.saveButton,
            !hasUnsavedChanges && styles.saveButtonDisabled,
          ]}
          disabled={!hasUnsavedChanges}
          onPress={saveChanges}
        >
          <Text style={styles.saveText}>
            {hasUnsavedChanges ? 'Guardar' : 'Guardado ✓'}
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
            Rutina de <Text style={styles.routineTitleName}>{editedUser?.firstName}</Text>
          </Text>

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

            {day.blocks.map((block, blockIndex) => (

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
                        {`Bloque ${blockIndex + 1}`}
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
                              {getExerciseById(item.exerciseId)?.name}
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


            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >

            {/* BUSCADOR */}

            <TextInput
              style={styles.modalInput}
              placeholder="Buscar ejercicio o grupo muscular..."
              placeholderTextColor="#777777"
              value={exerciseName}
              onChangeText={(text) => {
                setExerciseName(text);
                setSelectedExerciseId(null);
              }}
            />


            {/* EJERCICIOS DE EJEMPLO */}

            <View style={styles.exerciseSuggestions}>

              <Text style={styles.suggestionTitle}>
                Ejercicios sugeridos
              </Text>

              {ejerciciosFiltrados.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={() => {
                    setExerciseName(exercise.name);
                    setSelectedExerciseId(exercise.id);
                  }}
                >
                  <Text style={styles.suggestion}>
                    {exercise.name}
                  </Text>

                  <Text style={styles.suggestionCategory}>
                    {exercise.muscleGroup}
                  </Text>
                </TouchableOpacity>
              ))}

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

            </ScrollView>

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

      <TrainerBottomNav
        activeScreen="search"
        isLandscape={isLandscape}
        navigation={guardedNavigation}
      />

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
    minHeight: 48,
    paddingHorizontal: 16,
  },

  saveButton: {
    marginLeft: 'auto',
    backgroundColor: '#D93A3F', // rojo: hay cambios sin guardar
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },

  saveButtonDisabled: {
    backgroundColor: '#2E9E5B', // verde: todo guardado
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },

  routineTitleName: {
    color: '#FFC107',
  },

  
  /* ==============================================================
     DÍA
  ============================================================== */

  dayContainer: {
    backgroundColor: '#191919',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFE082',
    padding: '2.8%',
    marginBottom: '3%',
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
    width: 32,
    height: 28,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },

  arrow: {
    color: '#AAAAAA',
    fontSize: 18,
    lineHeight: 16,
    textAlign: 'center',
  },

  disabledArrow: {
  color: '#444444',
},

  dayTitle: {
    color: '#FFC107',
    fontSize: 20,
    fontWeight: '700',
  },

  dayActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  deleteIcon: {
    color: '#FF5A5F',
    fontSize: 16,
    fontWeight: '700',
  },


  /* ==============================================================
     BLOQUE
  ============================================================== */

  blockContainer: {
    backgroundColor: '#2B2B2B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    padding: '2.3%',
    marginBottom: '2.3%',
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
    fontSize: 20,
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
    fontSize: 18,
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
    borderRadius: 8,
    borderWidth: 1,
    padding: '2.3%',
    marginBottom: '1.5%',
  },

  exerciseCard: {
    backgroundColor: '#1D1D1D',
    borderColor: '#2E2E2E',
  },

  restCard: {
    backgroundColor: '#16232C',
    borderColor: '#2C4A63',
  },

  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemArrows: {
    marginRight: 6,
  },

  itemArrowButton: {
    width: 30,
    height: 26,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },

  itemArrow: {
    color: '#AAAAAA',
    fontSize: 16,
    lineHeight: 14,
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
    fontSize: 17,
    fontWeight: '600',
  },

  exerciseDetails: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 3,
  },

  comment: {
    color: '#FFC107',
    fontSize: 12,
    marginTop: 3,
  },

  restText: {
    color: '#52A9E8',
    fontSize: 17,
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
    fontSize: 16,
  },


  /* ==============================================================
     AGREGAR EJERCICIO / DESCANSO
  ============================================================== */

  addItemRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },

  addItemButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#302714',
    borderWidth: 1,
    borderColor: '#59430E',
    borderRadius: 7,
  },

  addItemText: {
    color: '#FFC107',
    fontSize: 14,
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
    fontSize: 14,
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
    fontSize: 16,
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
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },

  closeButton: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '300',
  },

  modalLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },

  modalInput: {
    paddingVertical: '3.5%',
    paddingHorizontal: '3%',
    backgroundColor: '#101010',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#292929',
    color: '#FFFFFF',
    fontSize: 15
  },

  commentInput: {
    paddingVertical: '3.5%',
    paddingHorizontal: '3%',
    backgroundColor: '#101010',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#292929',
    color: '#FFFFFF',
    fontSize: 15,
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
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 7,
  },

  suggestion: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#292929',
  },

  suggestionCategory: {
    color: '#777777',
    fontSize: 12,
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
    fontSize: 14,
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
    fontSize: 15,
    fontWeight: '700',
  },

});