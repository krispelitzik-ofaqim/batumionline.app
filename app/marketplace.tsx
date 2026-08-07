import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import { useI18n } from '../constants/i18n';
import BottomTabBar from '../components/BottomTabBar';

type Listing = { id: string; title: string; price: string; phone: string };
const STORE = '@market:items';

export default function MarketplaceScreen() {
  const { t, isRTL } = useI18n();
  const wd = isRTL ? 'rtl' : 'ltr';
  const ta = isRTL ? 'right' : 'left';
  const [items, setItems] = useState<Listing[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(STORE).then((raw) => { if (raw) { try { setItems(JSON.parse(raw)); } catch {} } }).catch(() => {});
  }, []);

  const save = (list: Listing[]) => { setItems(list); AsyncStorage.setItem(STORE, JSON.stringify(list)).catch(() => {}); };

  const publish = () => {
    setMsg('');
    if (!title.trim() || !phone.trim()) { setMsg(t('mk.missing')); return; }
    save([{ id: 'm_' + Date.now(), title: title.trim(), price: price.trim(), phone: phone.trim() }, ...items]);
    setTitle(''); setPrice(''); setPhone(''); setOpen(false);
  };

  const remove = (id: string) => save(items.filter((x) => x.id !== id));
  const contact = (p: string) => Linking.openURL(`https://wa.me/${p.replace(/[^0-9]/g, '')}`);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.hTitle, { textAlign: ta, writingDirection: wd }]}>🛒 {t('mk.classifieds')}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={s.clHead}>
          <Text style={[s.clSub, { flex: 1, textAlign: ta, writingDirection: wd }]}>{t('mk.classifiedsSub')}</Text>
          <TouchableOpacity style={s.postBtn} onPress={() => setOpen((o) => !o)}>
            <Text style={s.postTxt}>+ {t('mk.post')}</Text>
          </TouchableOpacity>
        </View>

        {open && (
          <View style={s.form}>
            <TextInput value={title} onChangeText={setTitle} placeholder={t('mk.itemTitle')} placeholderTextColor="#94a3b8" style={[s.input, { textAlign: ta, writingDirection: wd }]} />
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 }}>
              <TextInput value={price} onChangeText={setPrice} placeholder={t('mk.price')} placeholderTextColor="#94a3b8" style={[s.input, { flex: 1, textAlign: ta, writingDirection: wd }]} />
              <TextInput value={phone} onChangeText={setPhone} placeholder={t('mk.phone')} placeholderTextColor="#94a3b8" keyboardType="phone-pad" style={[s.input, { flex: 1, textAlign: ta, writingDirection: wd }]} />
            </View>
            {!!msg && <Text style={s.err}>{msg}</Text>}
            <TouchableOpacity style={s.publishBtn} onPress={publish}><Text style={s.publishTxt}>{t('mk.publish')}</Text></TouchableOpacity>
          </View>
        )}

        {items.length === 0 ? (
          <Text style={[s.empty, { writingDirection: wd }]}>{t('mk.empty')}</Text>
        ) : (
          items.map((it) => (
            <View key={it.id} style={s.item}>
              <View style={{ flex: 1 }}>
                <Text style={[s.itemTitle, { textAlign: ta, writingDirection: wd }]} numberOfLines={2}>{it.title}</Text>
                {!!it.price && <Text style={[s.itemPrice, { textAlign: ta }]}>{it.price}</Text>}
              </View>
              <TouchableOpacity style={s.contactBtn} onPress={() => contact(it.phone)}><Text style={s.contactTxt}>{t('mk.contact')}</Text></TouchableOpacity>
              <TouchableOpacity style={s.removeBtn} onPress={() => remove(it.id)}><Text style={s.removeTxt}>{t('mk.remove')}</Text></TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
      <BottomTabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.BACKGROUND },
  header: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, gap: 8, backgroundColor: Colors.PRIMARY },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 24, fontWeight: '300' },
  hTitle: { flex: 1, fontSize: 19, fontWeight: '900', color: '#fff' },
  clHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 12 },
  clSub: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  postBtn: { backgroundColor: Colors.ACCENT, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  postTxt: { color: '#fff', fontWeight: '900', fontSize: 13 },
  form: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0', gap: 8 },
  input: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  err: { color: '#dc2626', fontSize: 13 },
  publishBtn: { backgroundColor: Colors.PRIMARY, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  publishTxt: { color: '#fff', fontWeight: '900', fontSize: 15 },
  empty: { textAlign: 'center', color: '#94a3b8', fontSize: 14, marginTop: 24 },
  item: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#eef2f5' },
  itemTitle: { fontSize: 15, fontWeight: '800', color: Colors.TEXT },
  itemPrice: { fontSize: 13, fontWeight: '900', color: '#0f766e', marginTop: 2 },
  contactBtn: { backgroundColor: '#25D366', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  contactTxt: { color: '#fff', fontWeight: '800', fontSize: 11 },
  removeBtn: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  removeTxt: { color: '#64748b', fontWeight: '800', fontSize: 11 },
});
