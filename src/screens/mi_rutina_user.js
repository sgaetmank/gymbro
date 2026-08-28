import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import UserBottomNav from '../components/UserBottomNav';
import { getRoutineById } from '../data/routines';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export default function UserRoutineScreen({ navigation }) {
  const { isLandscape } = useResponsiveLayout();

  const routine = getRoutineById(4);


  // ============================================================
  // PANTALLA
  // ============================================================

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}

      <View
        style={[
          styles.header,
          isLandscape && styles.headerLandscape,
        ]}
      >

        <Text style={styles.headerTitle}>
          Rutinas
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

        <Text style={styles.screenTitle}>
          {routine.name}
        </Text>


        {/* ======================================================
            DÍAS
        ====================================================== */}

        {routine.days.map((day) => (

          <View
            key={day.id}
            style={styles.dayContainer}
          >

            {/* TÍTULO DEL DÍA */}

            <View style={styles.dayHeader}>

              <Text style={styles.dayTitle}>
                {day.name}
              </Text>

              <TouchableOpacity
                style={styles.dayButton}
                onPress={() => navigation.navigate('ver_dia_x_user', { day })}
              >
                <Text style={styles.dayButtonText}>
                  Ver día
                </Text>
              </TouchableOpacity>

            </View>


            {/* ==================================================
                BLOQUES
            ================================================== */}

            {day.blocks.map((block) => (

              <View
                key={block.id}
                style={styles.block}
              >

                {/* NOMBRE DEL BLOQUE */}

                <Text style={styles.blockTitle}>
                  {block.name}
                </Text>


                {/* =================================================
                    EJERCICIOS / DESCANSOS
                ================================================= */}

                {block.items.map((item) => (

                  <View
                    key={item.id}
                    style={styles.item}
                  >

                    {/* ÍCONO */}

                    <View style={styles.itemIcon}>

                      <Text style={styles.itemIconText}>
                        {item.type === 'exercise'
                          ? '⌁'
                          : '◷'}
                      </Text>

                    </View>


                    {/* INFORMACIÓN */}

                    <View style={styles.itemInfo}>

                      {item.type === 'exercise' ? (

                        <>
                          <Text style={styles.exerciseName}>
                            {item.name}
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
                          Descanso · {item.time} {item.unit}
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
    fontSize: 13,
    fontWeight: '500',
  },

  headerLandscape: {
    minHeight: 56,
    paddingHorizontal: 24,
  },


  /* TÍTULO */

  screenTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },


  /* DÍA */

  dayContainer: {
    marginBottom: 14,
  },

  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },

  dayTitle: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: '700',
  },

  dayButton: {
    backgroundColor: '#3A2B0D',
    borderRadius: 12,
    paddingHorizontal: '3.5%',
    paddingVertical: '2%',
  },

  dayButtonText: {
    color: '#FFC107',
    fontSize: 10,
    fontWeight: '600',
  },


  /* BLOQUE */

  block: {
    backgroundColor: '#1D1D1D',
    borderRadius: 8,
    marginBottom: 7,
    overflow: 'hidden',
  },

  blockTitle: {
    color: '#FFFFFF',
    backgroundColor: '#292929',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: '3%',
    paddingVertical: '2.5%',
  },


  /* EJERCICIO / DESCANSO */

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '3%',
    paddingVertical: '2.3%',
    borderTopWidth: 1,
    borderTopColor: '#292929',
  },

  itemIcon: {
    width: '7%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#3A2B0D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '2.5%',
  },

  itemIconText: {
    color: '#FFC107',
    fontSize: 16,
    fontWeight: '700',
  },

  itemInfo: {
    flex: 1,
  },

  exerciseName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },

  exerciseDetails: {
    color: '#888888',
    fontSize: 10,
  },

  comments: {
    color: '#FFC107',
    fontSize: 10,
    marginTop: 3,
  },

  restText: {
    color: '#888888',
    fontSize: 11,
  },


});