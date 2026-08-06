import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, TextInput, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import { API_BASE, resolveUri } from '../constants/api';
import { useI18n } from '../constants/i18n';

type Listing = {
  id: string;
  title: string;
  price?: string;
  location?: string;
  phone?: string;
  images?: string[];
  approved?: boolean;
  type?: string;
};

async function getDeviceId(): Promise<string> {
  try {
    const id = await AsyncStorage.getItem('@bo:deviceId');
    return id || '';
  } catch { return ''; }
}

export default function MyListingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [phoneRecover, setPhoneRecover] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const loadByDevice = useCallback(async () => {
    setLoading(true);
    try {
      const deviceId = await getDeviceId();
      if (!deviceId) { setListings([]); setLoading(false); return; }
      const r = await fetch(`${API_BASE}/api/listings/mine?deviceId=${encodeURIComponent(deviceId)}&_t=${Date.now()}`);
      const j = await r.json();
      setListings(j.listings || []);
    } catch { setListings([]); }
    setLoading(false);
  }, []);

  const loadByPhone = useCallback(async (phone: string) => {
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/listings/mine?phone=${encodeURIComponent(phone.trim())}&_t=${Date.now()}`);
      const j = await r.json();
      setListings(j.listings || []);
      setShowPhoneInput(false);
    } catch { setListings([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (visible) loadByDevice();
  }, [visible, loadByDevice]);

  const deleteListing = async (l: Listing) => {
    const confirm = () => new Promise<boolean>(resolve => {
      Alert.alert(t('fm.deleteListing'), `${t('fm.deletePrefix')} "${l.title}"?`, [
        { text: t('c.cancel'), style: 'cancel', onPress: () => resolve(false) },
        { text: t('c.delete'), style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
    if (!(await confirm())) return;
    const deviceId = await getDeviceId();
    const body = phoneRecover ? { phone: phoneRecover } : { deviceId };
    try {
      const r = await fetch(`${API_BASE}/api/listings/${l.id}/owner-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (j.success) {
        setListings(prev => prev.filter(x => x.id !== l.id));
      } else {
        Alert.alert(t('c.error'), j.error || t('fm.deleteFailed'));
      }
    } catch { Alert.alert(t('c.error'), t('fm.networkError')); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.header}>
            <TouchableOpacity onPress={onClose}><Text style={s.closeX}>✕</Text></TouchableOpacity>
            <Text style={s.title}>{t('fm.myListings')}</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 60 }}>
            {loading ? (
              <Text style={{ textAlign: 'center', color: '#64748b', padding: 30 }}>{t('c.loading')}</Text>
            ) : listings.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 24, gap: 12 }}>
                <Text style={{ fontSize: 36 }}>📭</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.TEXT, textAlign: 'center' }}>{t('fm.noListingsOnDevice')}</Text>
                {!showPhoneInput && (
                  <TouchableOpacity onPress={() => setShowPhoneInput(true)} style={s.linkBtn}>
                    <Text style={s.linkBtnTxt}>{t('fm.postedFromAnotherDevice')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              listings.map(l => (
                <View key={l.id} style={s.card}>
                  {l.images && l.images.length > 0 && (
                    <Image source={{ uri: resolveUri(l.images[0]) }} style={s.cardImg} />
                  )}
                  <View style={{ flex: 1, padding: 10 }}>
                    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 6 }}>
                      <Text style={s.cardTitle} numberOfLines={2}>{l.title}</Text>
                      <View style={[s.badge, { backgroundColor: l.approved ? '#10b981' : '#f59e0b' }]}>
                        <Text style={s.badgeTxt}>{l.approved ? t('fm.approved') : t('fm.pending')}</Text>
                      </View>
                    </View>
                    {!!l.price && <Text style={s.cardPrice}>{l.price}</Text>}
                    {!!l.location && <Text style={s.cardSub}>📍 {l.location}</Text>}
                    <TouchableOpacity onPress={() => deleteListing(l)} style={s.deleteBtn}>
                      <Text style={s.deleteTxt}>{t('fm.deleteListingBtn')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            {showPhoneInput && (
              <View style={{ padding: 12, backgroundColor: '#fff7ed', borderRadius: 10, gap: 8 }}>
                <Text style={{ fontSize: 12, color: Colors.TEXT, textAlign: 'right' }}>{t('fm.enterPostingPhone')}</Text>
                <TextInput
                  style={s.input}
                  value={phoneRecover}
                  onChangeText={setPhoneRecover}
                  placeholder={t('c.phone')}
                  keyboardType="phone-pad"
                  textAlign="right"
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity onPress={() => loadByPhone(phoneRecover)} style={s.primaryBtn}>
                  <Text style={s.primaryTxt}>{t('c.search')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { height: '85%', backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 15, fontWeight: '800', color: Colors.TEXT, writingDirection: 'rtl' },
  closeX: { fontSize: 18, color: '#64748b', fontWeight: '700', padding: 6 },
  card: { flexDirection: 'row-reverse', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  cardImg: { width: 90, height: 100 },
  cardTitle: { flex: 1, fontSize: 13, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  cardPrice: { fontSize: 14, fontWeight: '900', color: '#10b981', textAlign: 'right', marginTop: 4 },
  cardSub: { fontSize: 11, color: '#64748b', textAlign: 'right', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  badgeTxt: { fontSize: 9, fontWeight: '900', color: '#fff' },
  deleteBtn: { marginTop: 8, paddingVertical: 7, borderRadius: 8, backgroundColor: '#fee2e2', alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  deleteTxt: { fontSize: 12, fontWeight: '800', color: '#dc2626' },
  linkBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa' },
  linkBtnTxt: { fontSize: 12, fontWeight: '700', color: '#c2410c' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 14, color: Colors.TEXT },
  primaryBtn: { backgroundColor: Colors.PRIMARY, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  primaryTxt: { color: '#fff', fontSize: 13, fontWeight: '900' },
});
