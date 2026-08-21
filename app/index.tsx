import { SafeAreaProvider } from 'react-native-safe-area-context';

import UserRoutineScreen from '../src/screens/mi_rutina_user';

export default function App() {
  return (
    <SafeAreaProvider>
      <UserRoutineScreen />
    </SafeAreaProvider>
  );
}
