import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/colors';
import { ThemeContext } from '../constants/theme';

export default function RootLayout() {
  const [dark, setDark] = useState(false);

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(!dark) }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: dark ? Colors.TEXT : Colors.BACKGROUND },
        }}
      />
    </ThemeContext.Provider>
  );
}
