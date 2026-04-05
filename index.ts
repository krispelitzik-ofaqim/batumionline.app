import { I18nManager } from 'react-native';

// Force RTL for Hebrew
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
}

import 'expo-router/entry';
