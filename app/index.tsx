import { SafeAreaProvider } from 'react-native-safe-area-context';

import UserDayScreen from '../src/screens/ver_dia_x_user';

export default function App() {
  return (
    <SafeAreaProvider>
      <UserDayScreen />
    </SafeAreaProvider>
  );
}
