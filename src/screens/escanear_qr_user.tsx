import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useExercises } from '../context/ExercisesContext';
import { getRoutineById, type RoutineDay } from '../data/routines';
import { addWorkoutLog, type WorkoutExercise } from '../data/workoutLogs';
import type { Exercise } from '../services/exercisesApi';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';

const QR_GYMBRO = 'GYMBRO_CHECKIN_V1';

function getDayDescription(
  day: RoutineDay,
  getExerciseById: (id: string) => Exercise | undefined,
  loading: boolean,
  error: string | null
) {
  const muscleGroups = [
    ...new Set(
      day.blocks
        .flatMap((block) => block.items)
        .filter((item) => item.type === 'exercise')
        .map((item) => getExerciseById(item.exerciseId)?.muscleGroup)
        .filter(Boolean)
    ),
  ];

  if (muscleGroups.length) {
    return `Trabaja principalmente: ${muscleGroups.join(', ')}.`;
  }
  if (loading) return 'Cargando descripción de ejercicios...';
  if (error) return 'No se pudo cargar la descripción de ejercicios.';
  return 'Este día todavía no tiene ejercicios asignados.';
}

export default function ScanQrUserScreen({
  navigation,
}: NativeStackScreenProps<AppStackParamList, 'escanear_qr_user'>) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [qrValid, setQrValid] = useState(false);
  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const scanProcessed = useRef(false);
  const { user } = useAuth();
  const { getExerciseById, loading, error } = useExercises();
  const routine = user ? getRoutineById(user.id_rutina) : null;
  const selectedDay = routine?.days.find((day) => day.id === selectedDayId);

  const pedirPermiso = () => {
    if (!permission) return;

    if (!permission.canAskAgain) {
      Linking.openSettings();
      return;
    }

    requestPermission();
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanProcessed.current) return;

    scanProcessed.current = true;
    setScanned(true);

    if (data === QR_GYMBRO) {
      setQrValid(true);
      return;
    }

    Alert.alert(
      'QR no válido',
      'Este código no corresponde a Gymbro.',
      [
        {
          text: 'Intentar de nuevo',
          onPress: () => {
            scanProcessed.current = false;
            setScanned(false);
          },
        },
      ]
    );
  };

  const handleSubmit = () => {
    if (!user || !selectedDay) {
      Alert.alert('Elegí un día', 'Seleccioná el día de la rutina que realizaste.');
      return;
    }

    if (loading || error) {
      Alert.alert(
        'Ejercicios no disponibles',
        'No se pudieron cargar los ejercicios para guardar el entrenamiento.'
      );
      return;
    }

    const exercises = selectedDay.blocks
      .flatMap((block) => block.items)
      .filter((item) => item.type === 'exercise')
      .map((item) => {
        const exercise = getExerciseById(item.exerciseId);
        return exercise
          ? { exerciseId: item.exerciseId, muscleGroup: exercise.muscleGroup }
          : null;
      });

    if (exercises.some((exercise) => !exercise)) {
      Alert.alert(
        'Ejercicios no disponibles',
        'No se pudieron encontrar todos los ejercicios de este día.'
      );
      return;
    }

    const today = new Date();
    const date = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    addWorkoutLog({
      userId: user.id,
      date,
      exercises: exercises.filter(
        (exercise): exercise is WorkoutExercise => exercise !== null
      ),
    });

    navigation.replace('UserTabs', {
      screen: 'mi_rutina_user',
      params: {
        screen: 'ver_dia_x_user',
        params: { day: selectedDay },
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {qrValid ? 'Registrar entrenamiento' : 'Escanear QR'}
        </Text>
      </View>

      {!permission ? (
        <View style={styles.permissionMessage}>
          <Text style={styles.messageText}>Cargando...</Text>
        </View>
      ) : permission.granted ? (
        qrValid ? (
          <ScrollView
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.formTitle}>¿Qué día entrenaste?</Text>
            <Text style={styles.formSubtitle}>
              QR de Gymbro validado. Elegí el día de tu rutina.
            </Text>

            {routine?.days.length ? (
              <>
                <Text style={styles.label}>Día de la rutina</Text>
                <TouchableOpacity
                  style={styles.dayPicker}
                  onPress={() => setDayPickerVisible(true)}
                >
                  <Text
                    style={[
                      styles.dayPickerText,
                      !selectedDay && styles.placeholderText,
                    ]}
                  >
                    {selectedDay ? selectedDay.name : 'Seleccionar día'}
                  </Text>
                  <Text style={styles.dropdownIcon}>⌄</Text>
                </TouchableOpacity>

                {selectedDay && (
                  <Text style={styles.dayDescription}>
                    {getDayDescription(selectedDay, getExerciseById, loading, error)}
                  </Text>
                )}

                <PrimaryButton title="Confirmar día" onPress={handleSubmit} />

                <Modal
                  visible={dayPickerVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setDayPickerVisible(false)}
                >
                  <View style={styles.modalBackground}>
                    <Pressable
                      style={StyleSheet.absoluteFill}
                      onPress={() => setDayPickerVisible(false)}
                    />
                    <View style={styles.modal}>
                      <Text style={styles.modalTitle}>Elegí un día</Text>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {routine.days.map((day) => (
                          <TouchableOpacity
                            key={day.id}
                            style={styles.dayOption}
                            onPress={() => {
                              setSelectedDayId(day.id);
                              setDayPickerVisible(false);
                            }}
                          >
                            <Text style={styles.dayOptionTitle}>{day.name}</Text>
                            <Text style={styles.dayDescription}>
                              {getDayDescription(day, getExerciseById, loading, error)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setDayPickerVisible(false)}
                      >
                        <Text style={styles.closeButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </>
            ) : (
              <Text style={styles.messageText}>
                No tenés una rutina asignada para elegir un día.
              </Text>
            )}
          </ScrollView>
        ) : (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          />
        )
      ) : (
        <View style={styles.permissionMessage}>
          <Text style={styles.messageText}>
            Necesitamos permiso para usar la cámara.
          </Text>
          <PrimaryButton
            title={permission.canAskAgain ? 'Dar permiso' : 'Abrir configuración'}
            onPress={pedirPermiso}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  header: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D1D1D',
  },
  backButton: {
    width: 64,
  },
  backButtonText: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  camera: {
    flex: 1,
  },
  permissionMessage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  formContent: {
    flexGrow: 1,
    padding: 24,
  },
  formTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  formSubtitle: {
    color: '#999999',
    fontSize: 15,
    marginTop: 6,
    marginBottom: 28,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dayPicker: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 7,
    backgroundColor: '#292929',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayPickerText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  placeholderText: {
    color: '#777777',
  },
  dropdownIcon: {
    color: '#FFC107',
    fontSize: 22,
  },
  dayDescription: {
    color: '#999999',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modal: {
    maxHeight: '80%',
    padding: 20,
    borderRadius: 8,
    backgroundColor: '#1D1D1D',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  dayOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#292929',
  },
  dayOptionTitle: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
    padding: 8,
  },
  closeButtonText: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: '600',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
});
