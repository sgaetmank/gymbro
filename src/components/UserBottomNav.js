import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function UserBottomNav({ activeScreen, isLandscape }) {
  return (
    <View
      style={[
        styles.bottomNav,
        isLandscape && styles.bottomNavLandscape,
      ]}
    >
      <TouchableOpacity style={styles.navItem}>
        <Text
          style={[
            styles.navIcon,
            activeScreen === 'home' && styles.active,
          ]}
        >
          ⌂
        </Text>

        <Text
          style={[
            styles.navText,
            activeScreen === 'home' && styles.active,
          ]}
        >
          Inicio
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem}>
        <Text
          style={[
            styles.navIcon,
            activeScreen === 'routine' && styles.active,
          ]}
        >
          ⚒
        </Text>

        <Text
          style={[
            styles.navText,
            activeScreen === 'routine' && styles.active,
          ]}
        >
          Rutinas
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
        <Text
          style={[
            styles.navIcon,
            activeScreen === 'account' && styles.active,
          ]}
        >
          ♙
        </Text>

        <Text
          style={[
            styles.navText,
            activeScreen === 'account' && styles.active,
          ]}
        >
          Mi Cuenta
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    minHeight: '8%',
    backgroundColor: '#1D1D1D',
    borderTopWidth: 1,
    borderTopColor: '#292929',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  bottomNavLandscape: {
    minHeight: 56,
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
