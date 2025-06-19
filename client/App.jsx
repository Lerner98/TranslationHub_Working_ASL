// App.jsx
import { I18nManager } from 'react-native';
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// ✅ Force LTR globally
if (I18nManager.isRTL) {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);
}

export default function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
