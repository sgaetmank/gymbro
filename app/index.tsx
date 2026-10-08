import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ExercisesProvider } from '../src/context/ExercisesContext';
import type { AppStackParamList } from '../src/navigation/types';
import LooginScreen from '../src/screens/login';
import SignUpScreen from '../src/screens/signup';
import ScanQrUserScreen from '../src/screens/escanear_qr_user';
import TrainerTabs from '../src/navigation/TrainerTabs';
import UserTabs from '../src/navigation/UserTabs';

const Stack = createNativeStackNavigator<AppStackParamList>();

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
        // Entrenador: una sola screen que monta el Tab.Navigator (ver
        // src/navigation/TrainerTabs.tsx).
        <Stack.Screen name="TrainerTabs" component={TrainerTabs} />
      ) : (
        // Usuario común: una sola screen que monta el Tab.Navigator (ver
        // src/navigation/UserTabs.tsx). Los tabs individuales resuelven sus
        // propias rutas internamente.
        <>
          <Stack.Screen name="UserTabs" component={UserTabs} />
          <Stack.Screen
            name="escanear_qr_user"
            component={ScanQrUserScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider> {/* guarda quien esta logueado */ }
        <ExercisesProvider> {/* trae los ejercicios de la API y los comparte */ }
          <NavigationContainer>
            <AppNavigator /> {/* decide qué pantallas existen según haya o no usuario */ }
          </NavigationContainer>
        </ExercisesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
