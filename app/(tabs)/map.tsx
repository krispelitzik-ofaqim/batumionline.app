import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { ThemeContext } from '../../constants/theme';

const CATEGORIES = ['הכל', 'לינה', 'מסעדות', 'אטרקציות', 'מסלולי טיולים', 'אוכל', 'קניות', 'בילויים'];
const MY_MAPS = ['הוסף מיקום', 'תכנן סיור', 'שמור מסלול'];

export default function MapScreen() {
  const { dark } = useContext(ThemeContext);
  const [active, setActive] = useState('הכל');
  const bg = dark ? Colors.TEXT : Colors.BACKGROUND;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barContent} style={styles.bar}>
        {CATEGORIES.map((c) => {
          const on = c === active;
          return (
            <TouchableOpacity key={c} onPress={() => setActive(c)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barContent} style={styles.bar}>
        <View style={styles.myLabel}><Text style={styles.myLabelText}>המפות שלי</Text></View>
        {MY_MAPS.map((c) => (
          <TouchableOpacity key={c} style={[styles.chip, styles.chipAccent]}>
            <Text style={[styles.chipText, styles.chipTextOn]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <iframe
        title="batumi-map"
        src="https://www.google.com/maps?q=Batumi,Georgia&hl=iw&z=13&output=embed"
        style={{ flex: 1, border: 0 } as any}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bar: { maxHeight: 52, flexGrow: 0 },
  barContent: { paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row-reverse', alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.WHITE, marginHorizontal: 4, borderWidth: 1, borderColor: Colors.SECONDARY },
  chipOn: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  chipAccent: { backgroundColor: Colors.ACCENT, borderColor: Colors.ACCENT },
  chipText: { color: Colors.PRIMARY, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: Colors.WHITE },
  myLabel: { paddingHorizontal: 8 },
  myLabelText: { color: Colors.PRIMARY, fontWeight: '700', fontSize: 13 },
});

