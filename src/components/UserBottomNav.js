import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function UserBottomNav({ activeScreen, isLandscape, navigation }) {
  return (
    <View
      style={[
        styles.bottomNav,
        isLandscape && styles.bottomNavLandscape,
      ]}
    >
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('home_user')}
      >
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

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('mi_rutina_user')}
      >
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


      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('reloj')}
      >
        <Text
          style={[
            styles.navIcon,
            activeScreen === 'clock' && styles.active,
          ]}
        >
          ◷
        </Text>

        <Text
          style={[
            styles.navText,
            activeScreen === 'clock' && styles.active,
          ]}
        >
          Reloj
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('mi_cuenta_user')}
      >
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
    fontSize: 18,
    marginBottom: 3,
  },

  navText: {
    color: '#666666',
    fontSize: 11,
  },

  active: {
    color: '#FFC107',
  },
});
