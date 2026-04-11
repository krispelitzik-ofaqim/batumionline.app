import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { Colors } from '../constants/colors';
import { fetchContent } from '../constants/api';

type Item = { id: string; title: string; subtitle?: string; icon: string; bg?: string };

const INITIAL_ITEMS: Item[] = [
  { id: 'health', title: 'בריאות', subtitle: 'מידע רפואי חשוב', icon: '🏥', bg: Colors.SECONDARY + '25' },
  { id: 'insurance', title: 'ביטוחים', subtitle: 'ביטוח נסיעות ובריאות', icon: '🛡️', bg: Colors.ACCENT + '25' },
  { id: 'telecom', title: 'תקשורת וסלולר', subtitle: 'סים מקומי וחבילות', icon: '📱', bg: Colors.PRIMARY + '25' },
  { id: 'tips', title: 'טיפים', subtitle: 'עצות מנוסים', icon: '💡', bg: Colors.ACCENT + '30' },
  { id: 'tax', title: 'החזרי מס', subtitle: 'VAT ומכס', icon: '💰', bg: Colors.SECONDARY + '30' },
];

export default function InfoPortal() {
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetchContent().then(data => {
      if (Array.isArray(data.infoPortal) && data.infoPortal.length) setItems(data.infoPortal);
    }).catch(() => {});
  }, []);

  const cardW = Math.min(width - 32, 340);
  const total = items.length;
  const wrap = (i: number) => ((i % total) + total) % total;
  const next = () => setIdx(i => wrap(i + 1));
  const prev = () => setIdx(i => wrap(i - 1));

  if (total === 0) return null;
  const item = items[idx];
  const isImage = !!item.icon && (item.icon.startsWith('data:') || item.icon.startsWith('http'));

  return (
    <View>
      <Text style={styles.sectionTitle}>פורטל המידע</Text>
      <View style={styles.stage}>
        <View style={[styles.card, { width: cardW }]}>
          {isImage ? (
            <Image source={{ uri: item.icon }} style={styles.imageTop} resizeMode="cover" />
          ) : (
            <View style={[styles.imageTop, { backgroundColor: item.bg || Colors.SECONDARY + '25', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={styles.iconEmoji}>{item.icon}</Text>
            </View>
          )}
          <View style={styles.textBottom}>
            <Text style={styles.title}>{item.title}</Text>
            {item.subtitle ? <Text style={styles.sub}>{item.subtitle}</Text> : null}
          </View>

          <TouchableOpacity style={[styles.arrowBtn, { right: 0 }]} onPress={prev}>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.arrowBtn, { left: 0 }]} onPress={next}>
            <Text style={styles.arrow}>‹</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.dots}>
        {items.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setIdx(i)}>
            <View style={[styles.dot, i === idx && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: 'normal', color: '#999999', textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 },
  stage: { alignItems: 'center' },
  card: {
    height: 200, borderRadius: 16, overflow: 'hidden',
    backgroundColor: Colors.WHITE,
    shadowColor: Colors.TEXT, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  imageTop: { width: '100%', height: 140 },
  iconEmoji: { fontSize: 64 },
  textBottom: { paddingHorizontal: 14, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  sub: { fontSize: 12, color: Colors.TEXT, opacity: 0.6, marginTop: 2, textAlign: 'right', writingDirection: 'rtl' },
  arrow: { fontSize: 32, color: Colors.TEXT, fontWeight: '700', opacity: 0.5 },
  arrowBtn: {
    position: 'absolute', top: 0, bottom: 0, width: 40,
    justifyContent: 'center', alignItems: 'center', zIndex: 2,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ccc' },
  dotActive: { backgroundColor: Colors.PRIMARY, width: 18 },
});
