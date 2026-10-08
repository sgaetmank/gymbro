import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getWorkoutLogsByUser, type WorkoutLog } from '../data/workoutLogs';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Alto (en px) del área de barras del gráfico semanal
const WEEK_CHART_HEIGHT = 120;


// ============================================================
// CÁLCULOS
// ============================================================

// Arma la fecha con el mismo formato que los registros: 'YYYY-MM-DD'
function toDateKey(year: number, month: number, day: number) {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// Divide el mes en semanas (de lunes a domingo) y cuenta cuántas veces
// entrenó en cada una.
function getWeeksOfMonth(year: number, month: number, monthLogs: WorkoutLog[]) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const trainedDates = new Set(monthLogs.map((log) => log.date));

  const weeks: { from: number; to: number; trained: number }[] = [];
  let week: { from: number; to: number; trained: number } | null = null;

  for (let day = 1; day <= daysInMonth; day++) {
    // getDay(): 0 = domingo, 1 = lunes. Cada lunes arranca una semana nueva.
    if (!week || new Date(year, month, day).getDay() === 1) {
      week = { from: day, to: day, trained: 0 };
      weeks.push(week);
    }
    week.to = day;
    if (trainedDates.has(toDateKey(year, month, day))) week.trained++;
  }

  return weeks;
}

// Cuenta cuántos ejercicios de cada grupo muscular hizo, de mayor a menor
function countByMuscleGroup(
  monthLogs: WorkoutLog[]
): { group: string; count: number }[] {
  const counts: Record<string, number> = {};
  monthLogs.forEach((log) => {
    log.exercises.forEach((exercise) => {
      counts[exercise.muscleGroup] = (counts[exercise.muscleGroup] ?? 0) + 1;
    });
  });

  return Object.entries(counts)
    .map(([group, count]) => ({ group, count }))
    .sort((a, b) => b.count - a.count);
}


export default function UserStatisticsScreen() {
  const { isLandscape } = useResponsiveLayout();
  const { user } = useAuth();

  // Mes que se está mirando (arranca en el actual)
  const today = new Date();
  const [selected, setSelected] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  // Sin sesión (ej: mientras se anima el cierre de sesión) no se dibuja nada
  if (!user) return null;

  const monthPrefix = toDateKey(selected.year, selected.month, 1).slice(0, 7); // 'YYYY-MM'

  const userLogs = getWorkoutLogsByUser(user.id);
  const monthLogs = userLogs.filter((log) => log.date.startsWith(monthPrefix));

  function changeMonth(delta: number) {
    const date = new Date(selected.year, selected.month + delta, 1);
    setSelected({ year: date.getFullYear(), month: date.getMonth() });
  }

  const weeks = getWeeksOfMonth(selected.year, selected.month, monthLogs);
  const muscleGroups = countByMuscleGroup(monthLogs);
  const exercisesDone = monthLogs.reduce((total, log) => total + log.exercises.length, 0);

  // Valores máximos para escalar las barras
  const maxWeekValue = Math.max(1, ...weeks.map((w) => w.trained));
  const maxGroupCount = muscleGroups[0]?.count ?? 1;


  // ============================================================
  // PANTALLA
  // ============================================================

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* HEADER */}

      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        <Text style={styles.headerTitle}>Estadísticas</Text>
      </View>


      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          isLandscape && styles.contentLandscape,
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* ======================================================
            SELECTOR DE MES
        ====================================================== */}

        <View style={styles.monthSelector}>

          <TouchableOpacity
            style={styles.monthArrow}
            onPress={() => changeMonth(-1)}
          >
            <Text style={styles.monthArrowText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.monthTitle}>
            {MONTH_NAMES[selected.month]} {selected.year}
          </Text>

          <TouchableOpacity
            style={styles.monthArrow}
            onPress={() => changeMonth(1)}
          >
            <Text style={styles.monthArrowText}>›</Text>
          </TouchableOpacity>

        </View>


        {/* ======================================================
            RESUMEN DEL MES
        ====================================================== */}

        <View style={styles.sectionBox}>

          <Text style={styles.sectionTitle}>Resumen del mes</Text>

          <View style={styles.statsRow}>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{monthLogs.length}</Text>
              <Text style={styles.statLabel}>Entrenamientos</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{exercisesDone}</Text>
              <Text style={styles.statLabel}>Ejercicios hechos</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{muscleGroups.length}</Text>
              <Text style={styles.statLabel}>Grupos musculares</Text>
            </View>

          </View>

        </View>


        {monthLogs.length === 0 ? (

          // Mes sin registros: en vez de gráficos vacíos, un mensaje
          <View style={styles.sectionBox}>
            <Text style={styles.emptyText}>
              No hay entrenamientos registrados en este mes.
            </Text>
          </View>

        ) : (

          <>

            {/* ==================================================
                ENTRENAMIENTOS POR SEMANA
                Una barra por semana: cuántos días entrenó.
            ================================================== */}

            <View style={styles.sectionBox}>

              <Text style={styles.sectionTitle}>Entrenamientos por semana</Text>

              <View style={styles.weekChart}>

                {weeks.map((week) => (

                  <View key={week.from} style={styles.weekColumn}>

                    {/* BARRA */}
                    <View style={styles.weekBarArea}>

                      <View
                        style={[
                          styles.weekTrainedBar,
                          { height: (week.trained / maxWeekValue) * WEEK_CHART_HEIGHT },
                        ]}
                      />

                    </View>

                    {/* VALOR (cantidad de días entrenados) */}
                    <Text style={styles.weekValue}>{week.trained}</Text>

                  </View>

                ))}

              </View>

            </View>


            {/* ==================================================
                EJERCICIOS POR GRUPO MUSCULAR
            ================================================== */}

            <View style={styles.sectionBox}>

              <Text style={styles.sectionTitle}>Ejercicios por grupo muscular</Text>

              {muscleGroups.map(({ group, count }) => (

                <View key={group} style={styles.groupRow}>

                  <Text style={styles.groupName} numberOfLines={1}>
                    {group}
                  </Text>

                  <View style={styles.groupBarArea}>
                    <View
                      style={[
                        styles.groupBar,
                        { width: `${(count / maxGroupCount) * 100}%` },
                      ]}
                    />
                  </View>

                  <Text style={styles.groupCount}>{count}</Text>

                </View>

              ))}

            </View>

          </>

        )}

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
    paddingHorizontal: '2.5%',
    paddingTop: '5%',
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
    paddingHorizontal: 24,
    minHeight: 56,
  },


  /* SELECTOR DE MES */

  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '5%',
  },

  monthArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3A2B0D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  monthArrowText: {
    color: '#FFC107',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 28,
  },

  monthTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },


  /* CONTENEDOR DE SECCIÓN (mismo estilo que el inicio) */

  sectionBox: {
    backgroundColor: '#1D1D1D',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFE082',
    padding: '5.5%',
    marginBottom: '5%',
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },

  emptyText: {
    color: '#888888',
    fontSize: 15,
    textAlign: 'center',
  },


  /* RESUMEN */

  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '3%',
  },

  statNumber: {
    color: '#FFC107',
    fontSize: 26,
    fontWeight: '700',
  },

  statLabel: {
    color: '#888888',
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },


  /* GRÁFICO SEMANAL */

  weekChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  weekColumn: {
    flex: 1,
    alignItems: 'center',
  },

  weekValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },

  weekBarArea: {
    height: WEEK_CHART_HEIGHT,
    width: '50%',
    justifyContent: 'flex-end',
  },

  weekTrainedBar: {
    backgroundColor: '#FFC107',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },


  /* GRÁFICO POR GRUPO MUSCULAR */

  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  groupName: {
    width: '30%',
    color: '#FFFFFF',
    fontSize: 14,
  },

  groupBarArea: {
    flex: 1,
    marginHorizontal: 8,
  },

  groupBar: {
    height: 12,
    backgroundColor: '#FFC107',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },

  groupCount: {
    width: 28,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },

});
