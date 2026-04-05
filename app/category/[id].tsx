import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

const CATEGORY_NAMES: Record<string, string> = {
  '1': 'אירוח ולינה',
  '2': 'אתרים ואטרקציות',
  '3': 'סיורים קוליים',
  '4': 'בילוי, פנאי וחיי לילה',
  '5': 'תחבורה',
  '6': 'מסעדות ואוכל',
  '7': 'קניות ומתנות',
  '8': 'ספורט ואיכות חיים',
  '9': 'אקסטרים וסקי',
  '10': 'מדריכים ישראלים וסוכנים',
};

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const title = CATEGORY_NAMES[id || ''] || 'קטגוריה';

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, title, headerBackTitle: 'חזרה' }} />
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>תוכן הקטגוריה יתווסף בקרוב</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.TEXT, marginBottom: 8 },
  sub: { fontSize: 14, color: Colors.TEXT, opacity: 0.5 },
});
