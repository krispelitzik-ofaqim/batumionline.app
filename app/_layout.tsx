import React, { useState, useMemo } from 'react';
import { Text, TextInput, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Assistant_400Regular,
  Assistant_500Medium,
  Assistant_600SemiBold,
  Assistant_700Bold,
  Assistant_800ExtraBold,
} from '@expo-google-fonts/assistant';
import { Colors } from '../constants/colors';
import { ThemeContext } from '../constants/theme';
import { AdminContext } from '../constants/adminContext';
import { PreviewContext, PreviewMode } from '../constants/previewContext';

// Set Assistant as the default font for all Text and TextInput components
const defaultTextStyle = { fontFamily: 'Assistant_400Regular' };
const originalTextRender = (Text as any).render;
(Text as any).render = function (...args: any[]) {
  const origin = originalTextRender.call(this, ...args);
  return React.cloneElement(origin, {
    style: [defaultTextStyle, origin.props.style],
  });
};
const originalTextInputRender = (TextInput as any).render;
(TextInput as any).render = function (...args: any[]) {
  const origin = originalTextInputRender.call(this, ...args);
  return React.cloneElement(origin, {
    style: [defaultTextStyle, origin.props.style],
  });
};

const PREVIEW_WIDTHS: Record<string, number> = { mobile: 375, tablet: 768, desktop: 1024 };

export default function RootLayout() {
  const [dark, setDark] = useState(false);
  const [isAdmin, setAdmin] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>(null);
  const { width: realWidth } = useWindowDimensions();
  const [fontsLoaded] = useFonts({
    Assistant_400Regular,
    Assistant_500Medium,
    Assistant_600SemiBold,
    Assistant_700Bold,
    Assistant_800ExtraBold,
  });

  const simW = previewMode ? PREVIEW_WIDTHS[previewMode] : null;
  const effectiveWidth = simW ? Math.min(simW, realWidth) : null;

  const previewCtx = useMemo(() => ({
    mode: previewMode,
    setMode: setPreviewMode,
    simulatedWidth: effectiveWidth,
  }), [previewMode, effectiveWidth]);

  if (!fontsLoaded) return null;

  return (
    <PreviewContext.Provider value={previewCtx}>
      <AdminContext.Provider value={{ isAdmin, setAdmin }}>
        <ThemeContext.Provider value={{ dark, toggle: () => setDark(!dark) }}>
          <StatusBar style={dark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: dark ? Colors.TEXT : Colors.BACKGROUND },
            }}
          />
        </ThemeContext.Provider>
      </AdminContext.Provider>
    </PreviewContext.Provider>
  );
}
