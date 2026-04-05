import React, { useRef, useState } from 'react';
import {
  ScrollView, TouchableOpacity, Text, View, StyleSheet,
  useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { Colors } from '../constants/colors';

const ITEMS = [
  { id: 'health', title: 'בריאות', subtitle: 'מידע רפואי חשוב', icon: '🏥', bg: Colors.SECONDARY + '25' },
  { id: 'insurance', title: 'ביטוחים', subtitle: 'ביטוח נסיעות ובריאות', icon: '🛡️', bg: Colors.ACCENT + '25' },
  { id: 'telecom', title: 'תקשורת וסלולר', subtitle: 'סים מקומי וחבילות', icon: '📱', bg: Colors.PRIMARY + '25' },
  { id: 'tips', title: 'טיפים', subtitle: 'עצות מנוסים', icon: '💡', bg: Colors.ACCENT + '30' },
  { id: 'tax', title: 'החזרי מס', subtitle: 'VAT ומכס', icon: '💰', bg: Colors.SECONDARY + '30' },
];

export default function InfoPortal() {
  const { width } = useWindowDimensions();
  const cardW = width - 64;
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (cardW + 12));
    setActiveIdx(idx);
  };

  const goTo = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * (cardW + 12), animated: true });
    setActiveIdx(idx);
  };

  return (
    <View>
      <View style={styles.arrowRow}>
        <TouchableOpacity onPress={() => goTo(Math.max(0, activeIdx - 1))}>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => goTo(Math.min(ITEMS.length - 1, activeIdx + 1))}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        snapToInterval={cardW + 12}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.row}
      >
        {ITEMS.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.card, { width: cardW, backgroundColor: item.bg }]} activeOpacity={0.7}>
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.textWrap}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.sub}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {ITEMS.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View style={[styles.dot, i === activeIdx && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 12, paddingVertical: 4 },
  arrowRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 6 },
  arrow: { fontSize: 28, color: Colors.PRIMARY, fontWeight: '700', paddingHorizontal: 8 },
  card: {
    borderRadius: 16, padding: 18, minHeight: 110,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 14,
  },
  icon: { fontSize: 40 },
  textWrap: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  sub: { fontSize: 12, color: Colors.TEXT, opacity: 0.5, marginTop: 4, textAlign: 'right', writingDirection: 'rtl' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.SECONDARY + '40' },
  dotActive: { backgroundColor: Colors.PRIMARY, width: 20 },
});
