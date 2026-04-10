import React, { useRef, useState } from 'react';
import {
  ScrollView, TouchableOpacity, Text, View, StyleSheet,
  NativeSyntheticEvent, NativeScrollEvent,
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
  const cardW = 340;
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
      <Text style={styles.sectionTitle}>פורטל המידע</Text>
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
          <View key={item.id} style={[styles.card, { backgroundColor: item.bg }]}>
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.textWrap}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.sub}>{item.subtitle}</Text>
            </View>
            <TouchableOpacity style={[styles.arrowBtn, { right: 0 }]} onPress={() => goTo(Math.max(0, activeIdx - 1))}>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.arrowBtn, { left: 0 }]} onPress={() => goTo(Math.min(ITEMS.length - 1, activeIdx + 1))}>
              <Text style={styles.arrow}>‹</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: 'normal', color: '#999999', textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 },
  row: { gap: 12 },
  arrow: { fontSize: 28, color: Colors.WHITE, fontWeight: '700' },
  arrowBtn: {
    position: 'absolute', top: 0, bottom: 0, width: 36,
    justifyContent: 'center', alignItems: 'center', zIndex: 2,
    backgroundColor: 'transparent',
  },
  card: {
    width: 340, height: 200, borderRadius: 16, overflow: 'hidden',
    flexDirection: 'row-reverse', alignItems: 'center', padding: 18, gap: 14,
  },
  icon: { fontSize: 40 },
  textWrap: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  sub: { fontSize: 12, color: Colors.TEXT, opacity: 0.5, marginTop: 4, textAlign: 'right', writingDirection: 'rtl' },
});
