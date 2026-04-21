import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';

type Crumb = { id?: string; title: string; path?: string };

export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  const items: Crumb[] = [{ title: 'בית', path: '/' }, ...crumbs];
  const visible = items;
  const fontSize = items.length <= 2 ? 17 : items.length === 3 ? 14 : 12;

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
                <Text style={[s.crumb, s.link, { fontSize }]}>{c.title}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[s.crumb, last && s.current, { fontSize }]}>{c.title}</Text>
            )}
            {!last && <Text style={[s.sep, { fontSize }]}> › </Text>}
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  bar: { backgroundColor: 'transparent', maxHeight: 48 },
  content: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 4, gap: 2 },
  row: { flexDirection: 'row-reverse', alignItems: 'center' },
  crumb: { fontSize: 17, color: Colors.TEXT + '99', fontWeight: '600', writingDirection: 'rtl' },
  link: { color: Colors.PRIMARY },
  current: { color: Colors.TEXT, fontWeight: '800' },
  sep: { fontSize: 17, color: '#cbd5e1', marginHorizontal: 2 },
});
