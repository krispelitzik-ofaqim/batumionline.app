import React, { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { fetchContent } from '../constants/api';

type Item = { id: string; title: string; subtitle?: string; icon: string; bg?: string };

const INITIAL_ITEMS: Item[] = [
  { id: '1', title: 'ברוכים הבאים', subtitle: 'מדריך מקיף לבטומי', icon: '👋', bg: Colors.PRIMARY },
  { id: '2', title: 'נחיתה רכה', subtitle: 'מה צריך לדעת', icon: '✈️', bg: Colors.SECONDARY },
  { id: '3', title: 'היסטוריה כללית', subtitle: 'סיפור העיר', icon: '🏛️', bg: Colors.TEXT },
  { id: '4', title: 'היסטוריה יהודית', subtitle: 'קהילה ומורשת', icon: '✡️', bg: Colors.ACCENT },
  { id: '5', title: 'חוזרים הביתה', subtitle: 'טיפים ליום האחרון', icon: '🏠', bg: Colors.PRIMARY },
];

export default function WelcomeSlider() {
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);

  useEffect(() => {
    fetchContent().then(data => {
      if (Array.isArray(data.welcome)) setItems(data.welcome);
    }).catch(() => {});
  }, []);

  return (
    <View>
      <Text style={styles.sectionTitle}>ברוכים הבאים</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map(item => {
          const isImage = !!item.icon && (item.icon.startsWith('data:') || item.icon.startsWith('http'));
          return (
            <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.7}>
              {isImage ? (
                <>
                  <Image source={{ uri: item.icon }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.75)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                </>
              ) : (
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: item.bg || Colors.PRIMARY }]}>
                  <Text style={styles.icon}>{item.icon}</Text>
                </View>
              )}
              <View style={styles.textWrap}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                {item.subtitle ? <Text style={styles.sub} numberOfLines={1}>{item.subtitle}</Text> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: 'normal', color: '#999999', textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 },
  row: { gap: 10, paddingVertical: 4 },
  card: {
    width: 140, height: 120, borderRadius: 16, overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  icon: { fontSize: 44, textAlign: 'center', marginTop: 14 },
  textWrap: { paddingHorizontal: 12, paddingVertical: 10 },
  title: { fontSize: 15, fontWeight: '800', color: Colors.WHITE, textAlign: 'right', writingDirection: 'rtl' },
  sub: { fontSize: 11, color: Colors.WHITE, opacity: 0.9, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
});
