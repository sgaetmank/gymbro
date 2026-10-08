import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SearchUserScreen from '../screens/buscar_usuario_trainer';
import UserDataScreen from '../screens/ver_datos_trainer';
import EditRoutineScreen from '../screens/editar_rutina_trainer';
import TrainerProfileScreen from '../screens/mi_cuenta_trainer';

const Tab = createBottomTabNavigator();
const SearchStack = createNativeStackNavigator();

// Mismos glifos que usaba TrainerBottomNav, para no cambiar el look del nav.
const TAB_ICONS = {
  search: '⌕',
  account: '♙',
};

function makeTabIcon(key) {
  return function TabIcon({ color }) {
    return <Text style={{ fontSize: 22, color }}>{TAB_ICONS[key]}</Text>;
  };
}

// El tab "Buscar Usuario" es el único con drill-down (ver datos / editar
// rutina de un usuario encontrado), por eso tiene su propio
// Stack.Navigator anidado en vez de ser una screen plana.
// La pantalla raíz de este stack se nombra distinto al tab que la contiene
// ("buscar_usuario_trainer_root" vs "buscar_usuario_trainer"): si tuvieran
// el mismo nombre, React Navigation advierte por rutas duplicadas anidadas
// una en la otra.
function SearchTabStack() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="buscar_usuario_trainer_root" component={SearchUserScreen} />
      <SearchStack.Screen name="ver_datos_trainer" component={UserDataScreen} />
      <SearchStack.Screen name="editar_rutina_trainer" component={EditRoutineScreen} />
    </SearchStack.Navigator>
  );
}

export default function TrainerTabs() {
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
        name="buscar_usuario_trainer"
        component={SearchTabStack}
        options={{ title: 'Buscar Usuario', tabBarIcon: makeTabIcon('search') }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('buscar_usuario_trainer', { screen: 'buscar_usuario_trainer_root' });
          },
        })}
      />
      <Tab.Screen
        name="mi_cuenta_trainer"
        component={TrainerProfileScreen}
        options={{ title: 'Mi Cuenta', tabBarIcon: makeTabIcon('account') }}
      />
    </Tab.Navigator>
  );
}
