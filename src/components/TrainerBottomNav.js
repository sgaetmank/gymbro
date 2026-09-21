import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function TrainerBottomNav({ activeScreen, isLandscape, navigation }) {
  return (
    <View
      style={[
        styles.bottomNav,
        isLandscape && styles.bottomNavLandscape,
      ]}
    >
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('buscar_usuario_trainer')}
      >
        <Text
          style={[
            styles.navIcon,
            activeScreen === 'search' && styles.active,
          ]}
        >
          ⌕
        </Text>

        <Text
          style={[
            styles.navText,
            activeScreen === 'search' && styles.active,
          ]}
        >
          Buscar Usuario
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('mi_cuenta_trainer')}
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
    fontSize: 22,
    marginBottom: 4,
  },

  navText: {
    color: '#666666',
    fontSize: 13,
  },

  active: {
    color: '#FFC107',
  },
});
