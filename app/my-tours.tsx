import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import AppHeader from '../components/AppHeader';
import BottomTabBar from '../components/BottomTabBar';

type TourStop = { id: string; title: string; image?: string };
type Tour = { id: string; name: string; createdAt: string; stops: TourStop[] };

const STORAGE_KEY = '@bo:myTours';

export default function MyToursScreen() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setTours(raw ? JSON.parse(raw) : []);
    } catch { setTours([]); }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const saveTours = async (list: Tour[]) => {
    setTours(list);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
  };

  const createTour = () => {
    const name = newName.trim();
    if (!name) return;
    const t: Tour = { id: 't_' + Date.now(), name, createdAt: new Date().toISOString(), stops: [] };
    saveTours([t, ...tours]);
    setNewName('');
    setCreating(false);
  };

  const removeTour = (id: string) => {
    Alert.alert('מחיקת סיור', 'למחוק את הסיור?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: () => saveTours(tours.filter(t => t.id !== id)) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.BACKGROUND }}>
      <AppHeader />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.title}>🗺️ הסיורים שלי</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={s.intro}>בנה סיור משלך — בחר אטרקציות ושמור אותן בסיור עם שם משלך.</Text>

        {creating ? (
          <View style={s.createBox}>
            <Text style={s.createLabel}>שם הסיור החדש:</Text>
            <TextInput
              style={s.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="לדוגמה: סוף שבוע ראשון בבטומי"
              placeholderTextColor="#94a3b8"
              textAlign="right"
              autoFocus
            />
            <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
              <TouchableOpacity onPress={createTour} style={[s.btn, { backgroundColor: Colors.PRIMARY, flex: 1 }]}>
                <Text style={s.btnTxt}>✓ צור סיור</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setCreating(false); setNewName(''); }} style={[s.btn, { backgroundColor: '#cbd5e1', flex: 1 }]}>
                <Text style={[s.btnTxt, { color: '#1C2B35' }]}>ביטול</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setCreating(true)} style={[s.btn, { backgroundColor: Colors.PRIMARY, marginBottom: 16 }]}>
            <Text style={s.btnTxt}>+ צור סיור חדש</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <Text style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>טוען...</Text>
        ) : tours.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 50 }}>🗺️</Text>
            <Text style={s.emptyTxt}>עדיין לא יצרת סיורים</Text>
            <Text style={s.emptySub}>כשתוסיף אטרקציה לסיור היא תופיע כאן</Text>
          </View>
        ) : tours.map(t => (
          <View key={t.id} style={s.card}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.cardTitle}>{t.name}</Text>
              <TouchableOpacity onPress={() => removeTour(t.id)}>
                <Text style={{ color: '#dc2626', fontSize: 18 }}>🗑</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.cardSub}>{t.stops.length} עצירות · {new Date(t.createdAt).toLocaleDateString('he-IL')}</Text>
            {t.stops.length > 0 && (
              <View style={{ marginTop: 8, gap: 6 }}>
                {t.stops.map((stop, i) => (
                  <View key={stop.id} style={s.stopRow}>
                    <Text style={s.stopNum}>{i + 1}</Text>
                    <Text style={s.stopTxt}>{stop.title}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.PRIMARY },
  backBtn: { padding: 4 },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', writingDirection: 'rtl' },
  intro: { fontSize: 13, color: '#475569', textAlign: 'right', writingDirection: 'rtl', lineHeight: 19, marginBottom: 14 },
  createBox: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#cbd5e1', gap: 8 },
  createLabel: { fontSize: 13, fontWeight: '700', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 14, color: Colors.TEXT },
  btn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '900', fontSize: 14 },
  empty: { alignItems: 'center', padding: 36, gap: 10 },
  emptyTxt: { fontSize: 15, fontWeight: '800', color: Colors.TEXT },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', flex: 1 },
  cardSub: { fontSize: 11, color: '#64748b', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  stopRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 6, backgroundColor: '#f8fafc', borderRadius: 6 },
  stopNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.PRIMARY, color: '#fff', fontSize: 11, fontWeight: '900', textAlign: 'center', lineHeight: 22 },
  stopTxt: { flex: 1, fontSize: 13, color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
});
