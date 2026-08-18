import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function UserRoutineScreen() {

  // ============================================================
  // RUTINA DE EJEMPLO
  // Esta estructura es la misma que utilizamos para el entrenador.
  // Más adelante estos datos vendrán de la base de datos.
  // ============================================================

  const routine = {
    name: 'Mi Rutina',

    days: [
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
                repetitions: '20',
                weight: '0 kg',
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
                repetitions: '15',
                weight: '1 kg',
                comments: '',
              },

              {
                id: 5,
                type: 'exercise',
                name: 'Jalón lateral alternativo',
                series: '4',
                repetitions: '23',
                weight: '5 kg',
                comments: 'Nota: 32 PER LADO',
              },
            ],
          },
        ],
      },
    ],
  };


  // ============================================================
  // PANTALLA
  // ============================================================

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>

        <Text style={styles.headerTitle}>
          Rutinas
        </Text>

      </View>


      {/* CONTENIDO */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
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


      {/* NAVEGACIÓN INFERIOR */}

      <View style={styles.bottomNav}>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>
            ⌂
          </Text>

          <Text style={styles.navText}>
            Inicio
          </Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcon, styles.active]}>
            ⚒
          </Text>

          <Text style={[styles.navText, styles.active]}>
            Rutinas
          </Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>
            ♙
          </Text>

          <Text style={styles.navText}>
            Mi Cuenta
          </Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>
            ◷
          </Text>

          <Text style={styles.navText}>
            Reloj
          </Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>
            ▣
          </Text>

          <Text style={styles.navText}>
            Explorar
          </Text>
        </TouchableOpacity>

      </View>

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
    padding: 10,
    paddingBottom: 20,
  },


  /* HEADER */

  header: {
    height: 58,
    backgroundColor: '#1D1D1D',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
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
    fontSize: 12,
    fontWeight: '700',
  },

  dayButton: {
    backgroundColor: '#3A2B0D',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  dayButtonText: {
    color: '#FFC107',
    fontSize: 7,
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
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },


  /* EJERCICIO / DESCANSO */

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#292929',
  },

  itemIcon: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#3A2B0D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  itemIconText: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: '700',
  },

  itemInfo: {
    flex: 1,
  },

  exerciseName: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 3,
  },

  exerciseDetails: {
    color: '#888888',
    fontSize: 7,
  },

  comments: {
    color: '#FFC107',
    fontSize: 7,
    marginTop: 3,
  },

  restText: {
    color: '#888888',
    fontSize: 8,
  },


  /* NAVEGACIÓN */

  bottomNav: {
    height: 60,
    backgroundColor: '#1D1D1D',
    borderTopWidth: 1,
    borderTopColor: '#292929',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navIcon: {
    color: '#666666',
    fontSize: 16,
    marginBottom: 3,
  },

  navText: {
    color: '#666666',
    fontSize: 6.5,
  },

  active: {
    color: '#FFC107',
  },

});