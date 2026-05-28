import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';

type Crumb = { id?: string; title: string; path?: string };

export default function Breadcrumb({ crumbs, dark = false }: { crumbs: Crumb[]; dark?: boolean }) {
  const items: Crumb[] = [{ title: 'בית', path: '/' }, ...crumbs];
  const visible = items;
  const fontSize = items.length <= 2 ? 17 : items.length === 3 ? 14 : 12;
  const linkColor = dark ? '#7DD3FC' : Colors.PRIMARY;
  const currentColor = dark ? '#F4A94E' : Colors.TEXT;
  const baseColor = dark ? 'rgba(255,255,255,0.7)' : Colors.TEXT + '99';
  const sepColor = dark ? 'rgba(255,255,255,0.4)' : '#cbd5e1';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.bar}
      contentContainerStyle={s.content}
    >
      {visible.map((c, i) => {
        const last = i === visible.length - 1;
        return (
          <View key={`${c.title}-${i}`} style={s.row}>
            {c.path && !last ? (
              <TouchableOpacity onPress={() => router.replace(c.path as any)}>
                <Text style={[s.crumb, { fontSize, color: linkColor }]}>{c.title}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[s.crumb, { fontSize, color: last ? currentColor : baseColor, fontWeight: last ? '800' : '600' }]}>{c.title}</Text>
            )}
            {!last && <Text style={[s.sep, { fontSize, color: sepColor }]}> › </Text>}
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  bar: { backgroundColor: 'transparent', maxHeight: 48 },
  content: { flexDirection: 'row-reverse', alignItems: 'center', paddingLeft: 4, paddingRight: 8, paddingVertical: 4, gap: 2 },
  row: { flexDirection: 'row-reverse', alignItems: 'center' },
  crumb: { fontSize: 17, color: Colors.TEXT + '99', fontWeight: '600', writingDirection: 'rtl' },
  link: { color: Colors.PRIMARY },
  current: { color: Colors.TEXT, fontWeight: '800' },
  sep: { fontSize: 17, color: '#cbd5e1', marginHorizontal: 2 },
});
