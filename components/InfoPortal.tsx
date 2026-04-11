import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { fetchContent } from '../constants/api';

type Item = { id: string; title: string; subtitle?: string; icon: string; bg?: string };

const INITIAL_ITEMS: Item[] = [
  { id: 'health', title: 'בריאות', subtitle: 'מידע רפואי חשוב', icon: '🏥', bg: Colors.SECONDARY + '25' },
  { id: 'insurance', title: 'ביטוחים', subtitle: 'ביטוח נסיעות ובריאות', icon: '🛡️', bg: Colors.ACCENT + '25' },
  { id: 'telecom', title: 'תקשורת וסלולר', subtitle: 'סים מקומי וחבילות', icon: '📱', bg: Colors.PRIMARY + '25' },
  { id: 'tips', title: 'טיפים', subtitle: 'עצות מנוסים', icon: '💡', bg: Colors.ACCENT + '30' },
  { id: 'tax', title: 'החזרי מס', subtitle: 'VAT ומכס', icon: '💰', bg: Colors.SECONDARY + '30' },
  { id: 'embassy', title: 'שגרירות ישראל', subtitle: 'חירום ושירותי קונסול', icon: '🇮🇱', bg: Colors.PRIMARY + '25' },
  { id: 'culture', title: 'תרבות וכשרות', subtitle: 'בתי כנסת ומסעדות כשרות', icon: '✡️', bg: Colors.ACCENT + '25' },
];

const CARD_W = 100;
const CARD_H = 180;
const GAP = 10;
const STEP = CARD_W + GAP;

export default function InfoPortal() {
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const [selected, setSelected] = useState<Item | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchContent().then(data => {
      if (Array.isArray(data.infoPortal) && data.infoPortal.length) setItems(data.infoPortal);
    }).catch(() => {});
  }, []);

  const total = items.length;
  const tripled = total > 0 ? [...items, ...items, ...items] : [];
  const middleStart = total * STEP;

  useEffect(() => {
    if (total > 0) {
      setTimeout(() => scrollRef.current?.scrollTo({ x: middleStart, animated: false }), 0);
    }
  }, [total, middleStart]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (total === 0) return;
    const x = e.nativeEvent.contentOffset.x;
    const sectionW = total * STEP;
    if (x < sectionW * 0.5) {
      scrollRef.current?.scrollTo({ x: x + sectionW, animated: false });
    } else if (x > sectionW * 1.5) {
      scrollRef.current?.scrollTo({ x: x - sectionW, animated: false });
    }
  };

  const openInfoPage = () => {
    if (!selected) return;
    const id = selected.id;
    setSelected(null);
    router.push(`/info/${id}` as any);
  };

  if (total === 0) return null;

  const selectedIsImage = !!selected && (selected.icon.startsWith('data:') || selected.icon.startsWith('http'));

  return (
    <View>
      <Text style={styles.sectionTitle}>פורטל המידע</Text>

      {selected ? (
        <View style={styles.expandedWrap}>
          <TouchableOpacity activeOpacity={0.9} style={styles.expandedCard} onPress={openInfoPage}>
            <View style={[styles.expandedTop, { backgroundColor: selected.bg || Colors.SECONDARY + '25' }]}>
              {selectedIsImage ? (
                <Image source={{ uri: selected.icon }} style={styles.expandedImage} resizeMode="cover" />
              ) : (
                <Text style={styles.expandedEmoji}>{selected.icon}</Text>
              )}
            </View>
            <View style={styles.expandedBottom}>
              <Text style={styles.expandedTitle}>{selected.title}</Text>
              <Text style={styles.expandedSub}>{selected.subtitle || ''}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.expandedClose} onPress={() => setSelected(null)}>
            <Text style={styles.expandedCloseX}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          onMomentumScrollEnd={onScrollEnd}
          onScrollEndDrag={onScrollEnd}
          scrollEventThrottle={16}
        >
          {tripled.map((item, i) => {
            const isImage = !!item.icon && (item.icon.startsWith('data:') || item.icon.startsWith('http'));
            return (
              <TouchableOpacity key={`${item.id}-${i}`} activeOpacity={0.85} style={styles.card} onPress={() => setSelected(item)}>
                <View style={[styles.cardTop, { backgroundColor: item.bg || Colors.SECONDARY + '25' }]}>
                  {isImage ? (
                    <Image source={{ uri: item.icon }} style={styles.cardImage} resizeMode="cover" />
                  ) : (
                    <Text style={styles.cardEmoji}>{item.icon}</Text>
                  )}
                </View>
                <View style={styles.cardBottom}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: 'normal', color: '#999999', textAlign: 'right', writingDirection: 'rtl', marginBottom: 8, paddingHorizontal: 4 },
  row: { gap: GAP, paddingHorizontal: 4, paddingVertical: 4 },
  card: {
    width: CARD_W, height: CARD_H, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.WHITE,
    shadowColor: Colors.TEXT, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  cardTop: { height: CARD_H * (2 / 3), alignItems: 'center', justifyContent: 'center' },
  cardImage: { width: '100%', height: '100%' },
  cardEmoji: { fontSize: 44 },
  cardBottom: { flex: 1, backgroundColor: Colors.WHITE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: Colors.TEXT, textAlign: 'center', writingDirection: 'rtl', lineHeight: 16 },

  expandedWrap: { paddingHorizontal: 4, paddingVertical: 4, position: 'relative' },
  expandedClose: {
    position: 'absolute', top: 10, left: 10, width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  expandedCloseX: { fontSize: 14, color: Colors.WHITE, fontWeight: '700' },
  expandedCard: {
    width: '100%', height: 180, borderRadius: 18, overflow: 'hidden', backgroundColor: Colors.WHITE,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4,
  },
  expandedTop: { height: 120, alignItems: 'center', justifyContent: 'center' },
  expandedImage: { width: '100%', height: '100%' },
  expandedEmoji: { fontSize: 64 },
  expandedBottom: { flex: 1, backgroundColor: Colors.WHITE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  expandedTitle: { fontSize: 16, fontWeight: '900', color: Colors.TEXT, textAlign: 'center', writingDirection: 'rtl' },
  expandedSub: { fontSize: 12, color: '#666', textAlign: 'center', writingDirection: 'rtl', marginTop: 2 },
});
