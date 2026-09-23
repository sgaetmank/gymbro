import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../src/context/AuthContext';
import SearchUserScreen from '../src/screens/buscar_usuario_trainer';
import EditRoutineScreen from '../src/screens/editar_rutina_trainer';
import UserHomeScreen from '../src/screens/home_user';
import LooginScreen from '../src/screens/login';
import TrainerProfileScreen from '../src/screens/mi_cuenta_trainer';
import UserProfileScreen from '../src/screens/mi_cuenta_user';
import UserRoutineScreen from '../src/screens/mi_rutina_user';
import StopwatchScreen from '../src/screens/reloj';
import SignUpScreen from '../src/screens/signup';
import UserDataScreen from '../src/screens/ver_datos_trainer';
import UserDayScreen from '../src/screens/ver_dia_x_user';

const Stack = createNativeStackNavigator();

// Elige qué pantallas existen según la sesión.
function AppNavigator() {
  // useAuth() lee el AuthContext. Cuando login()/logout() cambian "user" con
  // setUser, este componente se re-renderiza solo, sin llamarlo manualmente.
  const { user } = useAuth(); // guarda quien esta logueado

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Sin sesión: solo login y registro
        <>
          <Stack.Screen name="login" component={LooginScreen} />
          <Stack.Screen name="signup" component={SignUpScreen} />
        </>
      ) : user.isTrainer ? (
        // Entrenador
        <>
          <Stack.Screen name="buscar_usuario_trainer" component={SearchUserScreen} />
          <Stack.Screen name="editar_rutina_trainer" component={EditRoutineScreen} />
          <Stack.Screen name="mi_cuenta_trainer" component={TrainerProfileScreen} />
          <Stack.Screen name="ver_datos_trainer" component={UserDataScreen} />
        </>
      ) : (
        // Usuario común. React Navigation muestra la primera screen de este
        // grupo (home_user) apenas cambia el conjunto de rutas disponibles.
        <>
          <Stack.Screen name="home_user" component={UserHomeScreen} />
          <Stack.Screen name="mi_rutina_user" component={UserRoutineScreen} />
          <Stack.Screen name="mi_cuenta_user" component={UserProfileScreen} />
          <Stack.Screen name="ver_dia_x_user" component={UserDayScreen} />
          <Stack.Screen name="reloj" component={StopwatchScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider> {/* guarda quien esta logueado */ }
        <NavigationContainer> 
          <AppNavigator /> {/* decide qué pantallas existen según haya o no usuario */ }
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
