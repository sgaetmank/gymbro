/* Tarjeta reutilizable para mostrar una sección de datos de perfil (ej. "Datos Personales",
   "Contacto y Salud"). Recibe un título y una lista de filas {icon, label, value} y las
   dibuja todas con el mismo estilo, en vez de repetir el mismo bloque JSX fila por fila.

   Se usa en mi_cuenta_user.js y mi_cuenta_trainer.js. */

import { StyleSheet, Text, View } from 'react-native';

export default function ProfileDataCard({ title, rows }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {rows.map((row) => (
        <View key={row.label} style={styles.dataRow}>
          
          <Text style={styles.icon}>{row.icon}</Text>

          <View>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>

        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1D1D1D',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFE082',
    padding: '5.5%',
    marginBottom: '5%',
  },

  sectionTitle: {
    color: '#FFC107',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },

  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '3.5%',
    borderTopWidth: 1,
    borderTopColor: '#292929',
  },

  icon: {
    color: '#FFC107',
    fontSize: 16,
    width: '9%',
    textAlign: 'center',
    marginRight: '1.5%',
  },

  label: {
    color: '#777777',
    fontSize: 13,
    marginBottom: 2,
  },

  value: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
