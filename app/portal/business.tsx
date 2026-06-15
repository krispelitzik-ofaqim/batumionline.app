import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Modal, Linking, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { fetchContent, resolveUri } from '../../constants/api';
import BottomTabBar from '../../components/BottomTabBar';

type BusinessItem = {
  id: string;
  title: string;
  caption?: string;
  image?: string;
  category?: string;
  article?: string;
};

type BusinessCategory = { id: string; title: string; icon: string };

export default function BusinessPortal() {
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<BusinessItem[]>([]);
  const [cats, setCats] = useState<BusinessCategory[]>([]);
  const [open, setOpen] = useState<BusinessItem | null>(null);
  const [activeCat, setActiveCat] = useState<string | null>(null);

  useEffect(() => {
    fetchContent().then(d => {
      if (Array.isArray(d?.businessProjects)) setItems(d.businessProjects);
      if (Array.isArray(d?.businessCategories)) setCats(d.businessCategories);
    }).catch(() => {});
  }, []);

  const filtered = activeCat ? items.filter(i => i.category === activeCat) : items;
  const grouped = cats.length > 0 && !activeCat
    ? cats.map(c => ({ cat: c, items: items.filter(i => i.category === c.id) })).filter(g => g.items.length > 0)
    : null;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>פורטל העסקים</Text>
      </View>

      {cats.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 50 }} contentContainerStyle={{ paddingHorizontal: 12, gap: 8, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setActiveCat(null)} style={[s.chip, !activeCat && s.chipActive]}>
            <Text style={[s.chipTxt, !activeCat && s.chipTxtActive]}>הכל</Text>
          </TouchableOpacity>
          {cats.map(c => (
            <TouchableOpacity key={c.id} onPress={() => setActiveCat(c.id)} style={[s.chip, activeCat === c.id && s.chipActive]}>
              <Text style={[s.chipTxt, activeCat === c.id && s.chipTxtActive]}>{c.icon} {c.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView style={{ flex: 1 }}>
        {grouped ? grouped.map(g => (
          <View key={g.cat.id} style={{ marginTop: 16 }}>
            <Text style={s.groupTitle}>{g.cat.icon} {g.cat.title}</Text>
            <View style={s.grid}>
              {g.items.map(it => <BusinessCard key={it.id} item={it} width={width - 32} onPress={() => setOpen(it)} />)}
            </View>
          </View>
        )) : (
          <View style={[s.grid, { marginTop: 16 }]}>
            {filtered.map(it => <BusinessCard key={it.id} item={it} width={width - 32} onPress={() => setOpen(it)} />)}
          </View>
        )}
        {items.length === 0 && (
          <Text style={{ textAlign: 'center', color: '#94a3b8', marginTop: 40, writingDirection: 'rtl', fontSize: 14 }}>אין פריטים עדיין</Text>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', maxHeight: '90%' }}>
            <View style={{ width: '100%', height: 240, backgroundColor: '#000', position: 'relative' }}>
              {open?.image && <Image source={{ uri: resolveUri(open.image) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />}
              <TouchableOpacity onPress={() => setOpen(null)} style={{ position: 'absolute', top: 10, left: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }}>{open?.title}</Text>
                {!!open?.caption && <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'right', writingDirection: 'rtl', marginTop: 4 }}>{open.caption}</Text>}
                {!!open?.article && <Text style={{ fontSize: 13, color: '#475569', textAlign: 'right', writingDirection: 'rtl', marginTop: 14, lineHeight: 20 }}>{open.article}</Text>}
                {open?.id === 'bp_bank' ? (
                  <TouchableOpacity
                    onPress={() => Linking.openURL('https://www.batumionline.biz')}
                    style={{ marginTop: 18, backgroundColor: Colors.PRIMARY, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', writingDirection: 'rtl' }}>לפתיחת חשבון בנק ←</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => { setOpen(null); router.push('/contact'); }}
                    style={{ marginTop: 18, backgroundColor: Colors.PRIMARY, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', writingDirection: 'rtl' }}>צור קשר ←</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <BottomTabBar />
    </SafeAreaView>
  );
}

function BusinessCard({ item, width, onPress }: { item: BusinessItem; width: number; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[s.card, { width }]}>
      {item.image && <Image source={{ uri: resolveUri(item.image) }} style={s.cardImg} resizeMode="cover" />}
      <View style={s.cardOverlay}>
        <Text style={s.cardTitle}>{item.title}</Text>
        {!!item.caption && <Text style={s.cardCaption}>{item.caption}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, gap: 8, backgroundColor: '#1A6B8A' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 22, fontWeight: '300' },
  title: { flex: 1, fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  chipTxt: { fontSize: 12, fontWeight: '800', color: '#475569', writingDirection: 'rtl' },
  chipTxtActive: { color: '#fff' },
  groupTitle: { fontSize: 15, fontWeight: '900', color: Colors.TEXT, paddingHorizontal: 16, marginBottom: 8, writingDirection: 'rtl', textAlign: 'right' },
  grid: { paddingHorizontal: 16, gap: 12 },
  card: { height: 180, borderRadius: 14, overflow: 'hidden', backgroundColor: '#000', position: 'relative' },
  cardImg: { width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14, backgroundColor: 'rgba(0,0,0,0.55)' },
  cardTitle: { fontSize: 17, fontWeight: '900', color: '#fff', textAlign: 'right', writingDirection: 'rtl' },
  cardCaption: { fontSize: 12, color: '#cbd5e1', textAlign: 'right', writingDirection: 'rtl', marginTop: 4 },
});
