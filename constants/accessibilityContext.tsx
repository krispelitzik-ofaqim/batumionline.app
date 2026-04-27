import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@accessibility_settings';

export type AccessibilitySettings = {
  fontScale: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  reduceMotion: boolean;
  underlineLinks: boolean;
};

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  fontScale: 'normal',
  highContrast: false,
  reduceMotion: false,
  underlineLinks: false,
};

const FONT_MULTIPLIERS = { normal: 1, large: 1.2, xlarge: 1.5 };

type Ctx = {
  settings: AccessibilitySettings;
  update: (patch: Partial<AccessibilitySettings>) => void;
  reset: () => void;
  fontMultiplier: number;
};

export const AccessibilityContext = createContext<Ctx>({
  settings: DEFAULT_ACCESSIBILITY,
  update: () => {},
  reset: () => {},
  fontMultiplier: 1,
});

export function useAccessibility() { return useContext(AccessibilityContext); }

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (raw) try { setSettings({ ...DEFAULT_ACCESSIBILITY, ...JSON.parse(raw) }); } catch {}
    });
  }, []);

  const fontMultiplier = FONT_MULTIPLIERS[settings.fontScale];

  const update = (patch: Partial<AccessibilitySettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  };
  const reset = () => {
    setSettings(DEFAULT_ACCESSIBILITY);
    AsyncStorage.setItem(KEY, JSON.stringify(DEFAULT_ACCESSIBILITY)).catch(() => {});
  };

  return (
    <AccessibilityContext.Provider value={{ settings, update, reset, fontMultiplier }}>
      {children}
    </AccessibilityContext.Provider>
  );
}
