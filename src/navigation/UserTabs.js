import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import UserHomeScreen from '../screens/home_user';
import UserRoutineScreen from '../screens/mi_rutina_user';
import UserDayScreen from '../screens/ver_dia_x_user';
import StopwatchScreen from '../screens/reloj';
import UserStatisticsScreen from '../screens/estadisticas_user';
import UserProfileScreen from '../screens/mi_cuenta_user';

const Tab = createBottomTabNavigator();
const RoutineStack = createNativeStackNavigator();

// Mismos glifos que usaba UserBottomNav, para no cambiar el look del nav.
const TAB_ICONS = {
  home: '⌂',
  routine: '⚒',
  clock: '◷',
  stats: '▥',
  account: '♙',
};

function makeTabIcon(key) {
  return function TabIcon({ color }) {
    return <Text style={{ fontSize: 18, color }}>{TAB_ICONS[key]}</Text>;
  };
}

// El tab "Rutinas" es el único con drill-down (día de rutina), por eso
// tiene su propio Stack.Navigator anidado en vez de ser una screen plana.
// La pantalla raíz de este stack se nombra distinto al tab que la contiene
// ("mi_rutina_user_root" vs "mi_rutina_user"): si tuvieran el mismo nombre,
// React Navigation advierte por rutas duplicadas anidadas una en la otra.
function RoutineTabStack() {
  return (
    <RoutineStack.Navigator screenOptions={{ headerShown: false }}>
      <RoutineStack.Screen name="mi_rutina_user_root" component={UserRoutineScreen} />
      <RoutineStack.Screen name="ver_dia_x_user" component={UserDayScreen} />
    </RoutineStack.Navigator>
  );
}

export default function UserTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      // "none": atrás nunca cambia de tab, aunque haya historial de tabs
      // visitados. Parado en la raíz de cualquier tab, el botón atrás de
      // Android cierra la app directamente en vez de volver al tab anterior.
      backBehavior="none"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFC107',
        tabBarInactiveTintColor: '#666666',
        // 60dp de zona de ícono+label (más holgada que el mínimo de 56),
        // más el inset real de la barra de sistema como margen de aire
        // abajo, para que no quede pegado a los botones de Android.
        tabBarStyle: {
          backgroundColor: '#1D1D1D',
          borderTopWidth: 1,
          borderTopColor: '#292929',
          height: 72 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 22,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="home_user"
        component={UserHomeScreen}
        options={{ title: 'Inicio', tabBarIcon: makeTabIcon('home') }}
      />
      <Tab.Screen
        name="mi_rutina_user"
        component={RoutineTabStack}
        options={{ title: 'Rutinas', tabBarIcon: makeTabIcon('routine') }}
      />
      <Tab.Screen
        name="reloj"
        component={StopwatchScreen}
        options={{ title: 'Reloj', tabBarIcon: makeTabIcon('clock') }}
      />
      <Tab.Screen
        name="estadisticas_user"
        component={UserStatisticsScreen}
        options={{ title: 'Estadísticas', tabBarIcon: makeTabIcon('stats') }}
      />
      <Tab.Screen
        name="mi_cuenta_user"
        component={UserProfileScreen}
        options={{ title: 'Mi Cuenta', tabBarIcon: makeTabIcon('account') }}
      />
    </Tab.Navigator>
  );
}
