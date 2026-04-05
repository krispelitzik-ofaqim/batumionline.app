import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { ThemeContext } from '../../constants/theme';

export default function InfoScreen() {
  const { dark } = useContext(ThemeContext);
  return (
    <View style={[styles.container, dark && { backgroundColor: Colors.TEXT }]}>
      <Text style={[styles.title, dark && { color: Colors.BACKGROUND }]}>ℹ️ מידע</Text>
      <Text style={[styles.sub, dark && { color: Colors.SECONDARY }]}>מידע שימושי לתייר הישראלי בבטומי</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: Colors.BACKGROUND },
  title: { fontSize: 24, fontWeight: '700', color: Colors.TEXT, marginBottom: 8, textAlign: 'right', writingDirection: 'rtl' },
  sub: { fontSize: 14, color: Colors.TEXT, opacity: 0.5, textAlign: 'right', writingDirection: 'rtl' },
});
