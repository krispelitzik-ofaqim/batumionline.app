import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { ThemeContext } from '../../constants/theme';
import { PreviewContext } from '../../constants/previewContext';
import { AdminContext } from '../../constants/adminContext';
import DevicePreviewBar from '../../components/DevicePreviewBar';
import { fetchContent } from '../../constants/api';

type Item = {
  id: string; title: string; subtitle?: string; icon: string; bg?: string;
  bgDark?: string; description?: string; summary?: string; heroBg?: string;
  layout?: 'card' | 'banner'; children?: Item[];
};

function SubCard({ item, width, onPress }: { item: Item; width: number; onPress: () => void }) {
  const iconIsImage = !!item.icon && (item.icon.startsWith('data:') || item.icon.startsWith('http'));
  const bg = item.bg || '#3DA5C4';
  const bgDark = item.bgDark || '#1A6B8A';
  return (
    <TouchableOpacity style={[st.card, { width }]} activeOpacity={0.7} onPress={onPress}>
      {iconIsImage ? (
        <Image source={{ uri: item.icon }} style={st.cardTop} resizeMode="cover" />
      ) : (
        <LinearGradient colors={[bg, bgDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.cardTop}>
          <Text style={st.cardIcon}>{item.icon}</Text>
        </LinearGradient>
      )}
      <View style={st.cardBottom}>
        <Text style={st.cardTitle}>{item.title}</Text>
        {item.subtitle ? <Text style={st.cardSub}>{item.subtitle}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

function SubBanner({ item, width, onPress }: { item: Item; width: number; onPress: () => void }) {
  const iconIsImage = !!item.icon && (item.icon.startsWith('data:') || item.icon.startsWith('http'));
  const bg = item.bg || '#3DA5C4';
  const bgDark = item.bgDark || '#1A6B8A';
  return (
    <TouchableOpacity style={[st.banner, { width }]} activeOpacity={0.7} onPress={onPress}>
      {iconIsImage ? (
        <Image source={{ uri: item.icon }} style={st.bannerImg} resizeMode="cover" />
      ) : (
        <LinearGradient colors={[bg, bgDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.bannerImg}>
          <Text style={st.bannerImgIcon}>{item.icon}</Text>
        </LinearGradient>
      )}
      <View style={st.bannerText}>
        <Text style={st.bannerTitle} numberOfLines={1}>{item.title}</Text>
        {item.subtitle ? <Text style={st.bannerSub} numberOfLines={1}>{item.subtitle}</Text> : null}
        {item.summary ? <Text style={st.bannerSummary} numberOfLines={2}>{item.summary}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dark } = useContext(ThemeContext);
  const { simulatedWidth } = useContext(PreviewContext);
  const { isAdmin } = useContext(AdminContext);
  const { width: screenW } = useWindowDimensions();
  const w = simulatedWidth ? Math.min(simulatedWidth, screenW) : screenW;
  const cardW = (w - 48) / 2;

  const [cat, setCat] = useState<Item | null>(null);

  useEffect(() => {
    fetchContent().then(data => {
      const all = [...(data.mainCategories || []), ...(data.extraCategories || [])];
      const found = all.find((c: Item) => c.id === id);
      if (found) setCat(found);
    }).catch(() => {});
  }, [id]);

  if (!cat) {
    return (
      <SafeAreaView style={st.safe}>
        <Stack.Screen options={{ headerShown: true, title: 'קטגוריה', headerBackTitle: 'חזרה' }} />
        <View style={st.emptyWrap}>
          <Text style={st.emptyTxt}>טוען…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const children = cat.children || [];

  return (
    <SafeAreaView style={[st.safe, dark && { backgroundColor: Colors.TEXT }]}>
      <Stack.Screen options={{ headerShown: true, title: cat.title, headerBackTitle: 'חזרה' }} />
      <DevicePreviewBar />
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxWidth: w, alignSelf: 'center', width: '100%' }}>
        <View style={[st.hero, { backgroundColor: cat.heroBg || cat.bg || '#3DA5C4' }]}>
          <Text style={st.heroTitle}>{cat.title}</Text>
          {cat.subtitle ? <Text style={st.heroSub}>{cat.subtitle}</Text> : null}
        </View>

        {children.length > 0 ? (
          (() => {
            const isBanner = children.some(c => c.layout === 'banner');
            const bannerW = Math.min(w - 32, 350);
            return (
              <View style={st.section}>
                {isBanner ? (
                  <View style={{ alignItems: 'center', gap: 12 }}>
                    {children.map(ch => (
                      <SubBanner
                        key={ch.id}
                        item={ch}
                        width={bannerW}
                        onPress={() => router.push(cat.id === '3' ? `/tour/${ch.id}` as any : `/category/${ch.id}` as any)}
                      />
                    ))}
                    {isAdmin && (
                      <TouchableOpacity
                        style={[st.banner, st.addBanner, { width: bannerW }]}
                        activeOpacity={0.7}
                        onPress={() => router.push('/admin/dashboard' as any)}
                      >
                        <Text style={st.addPlus}>+</Text>
                        <Text style={st.addLabel}>הוסף באנר</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={st.grid}>
                    {children.map(ch => (
                      <SubCard
                        key={ch.id}
                        item={ch}
                        width={cardW}
                        onPress={() => router.push(`/category/${ch.id}` as any)}
                      />
                    ))}
                    {isAdmin && (
                      <TouchableOpacity
                        style={[st.card, st.addCard, { width: cardW }]}
                        activeOpacity={0.7}
                        onPress={() => router.push('/admin/dashboard' as any)}
                      >
                        <Text style={st.addPlus}>+</Text>
                        <Text style={st.addLabel}>הוסף אייקון</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })()
        ) : (
          <View style={st.body}>
            <Text style={[st.content, dark && { color: Colors.BACKGROUND }]}>
              {cat.description || 'אין תוכן עדיין'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTxt: { fontSize: 16, color: '#999', writingDirection: 'rtl' },

  hero: { paddingVertical: 30, paddingHorizontal: 24, alignItems: 'center' },
  heroTitle: { fontSize: 26, fontWeight: '800', color: Colors.WHITE, textAlign: 'center', writingDirection: 'rtl' },
  heroSub: { fontSize: 14, color: Colors.WHITE, opacity: 0.85, marginTop: 4, textAlign: 'center', writingDirection: 'rtl' },

  section: { paddingHorizontal: 16, marginTop: 16, marginBottom: 24 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },

  card: {
    borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.WHITE,
    shadowColor: Colors.TEXT, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, marginBottom: 4,
  },
  cardTop: { height: 100, alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: 68 },
  cardBottom: { backgroundColor: Colors.WHITE, paddingVertical: 10, paddingHorizontal: 12 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1C2B35', textAlign: 'right', writingDirection: 'rtl' },
  cardSub: { fontSize: 12, color: '#666', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },

  addCard: {
    backgroundColor: '#f0f2f5', borderWidth: 2, borderStyle: 'dashed',
    borderColor: Colors.PRIMARY, alignItems: 'center', justifyContent: 'center',
    minHeight: 150, shadowOpacity: 0,
  },

  banner: {
    height: 100, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.WHITE,
    flexDirection: 'row-reverse', alignItems: 'center',
    shadowColor: Colors.TEXT, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  bannerImg: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  bannerImgIcon: { fontSize: 57, color: Colors.WHITE },
  bannerText: { flex: 1, paddingHorizontal: 12, paddingVertical: 8 },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  bannerSub: { fontSize: 12, fontWeight: '600', color: Colors.PRIMARY, textAlign: 'right', writingDirection: 'rtl', marginTop: 1 },
  bannerSummary: { fontSize: 11, color: '#666', textAlign: 'right', writingDirection: 'rtl', marginTop: 3, lineHeight: 15 },
  addBanner: {
    backgroundColor: '#f0f2f5', borderWidth: 2, borderStyle: 'dashed',
    borderColor: Colors.PRIMARY, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0, flexDirection: 'column',
  },
  addPlus: { fontSize: 40, color: Colors.PRIMARY, fontWeight: '300' },
  addLabel: { fontSize: 13, color: Colors.PRIMARY, fontWeight: '600', marginTop: 4 },

  body: { padding: 24 },
  content: { fontSize: 16, color: Colors.TEXT, lineHeight: 28, textAlign: 'right', writingDirection: 'rtl' },
});
