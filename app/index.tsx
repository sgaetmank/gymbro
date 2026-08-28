import { SafeAreaProvider } from 'react-native-safe-area-context';

import UserProfileScreen from '../src/screens/mi_cuenta_user';

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProfileScreen />
    </SafeAreaProvider>
  );
}
