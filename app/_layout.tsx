import React, { useState, useMemo, useEffect } from 'react';
import { Text, TextInput, View, ScrollView, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: any) { console.warn('RootErrorBoundary caught:', error, info); }
  render() {
    if (this.state.error) {
      const e = this.state.error as any;
      return (
        <View style={{ flex: 1, backgroundColor: '#1C2B35', padding: 24, paddingTop: 80 }}>
          <Text style={{ color: '#F4A94E', fontSize: 20, fontWeight: '800', marginBottom: 12, writingDirection: 'rtl' }}>שגיאה בפתיחה</Text>
          <Text selectable style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>{String(e?.message || e)}</Text>
          <ScrollView style={{ flex: 1 }}>
            <Text selectable style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}>{String(e?.stack || '')}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}
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

// Note: Previously set Assistant font via Text.defaultProps — removed because
// defaultProps is deprecated in React 19 and caused iOS crash on launch under
// newArchEnabled=true. System font is used as fallback until we add a wrapper.

const PREVIEW_WIDTHS: Record<string, number> = { mobile: 375, tablet: 768, desktop: 1024 };

export default function RootLayout() {
  const [dark, setDark] = useState(false);
  const [isAdmin, setAdmin] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>(null);
  const { width: realWidth } = useWindowDimensions();
  const [fontsLoaded, fontError] = useFonts({
    Assistant_400Regular,
    Assistant_500Medium,
    Assistant_600SemiBold,
    Assistant_700Bold,
    Assistant_800ExtraBold,
  });
  const [fontTimedOut, setFontTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFontTimedOut(true), 1500);
    return () => clearTimeout(t);
  }, []);
  const fontsReady = fontsLoaded || fontError || fontTimedOut;

  const simW = previewMode ? PREVIEW_WIDTHS[previewMode] : null;
  const effectiveWidth = simW ? Math.min(simW, realWidth) : null;

  const previewCtx = useMemo(() => ({
    mode: previewMode,
    setMode: setPreviewMode,
    simulatedWidth: effectiveWidth,
  }), [previewMode, effectiveWidth]);

  if (!fontsReady) return null;

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
