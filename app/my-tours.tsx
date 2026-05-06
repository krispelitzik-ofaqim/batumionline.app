import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Image } from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import AppHeader from '../components/AppHeader';
import BottomTabBar from '../components/BottomTabBar';

type TourStop = { id: string; title: string; image?: string; type?: string; day?: number; time?: string };
type Tour = { id: string; name: string; createdAt: string; stops: TourStop[] };

const STORAGE_KEY = '@bo:myTours';

function sortStops(stops: TourStop[]) {
  return [...stops].sort((a, b) => {
    const da = a.day ?? 99, db = b.day ?? 99;
    if (da !== db) return da - db;
    const ta = a.time || '99:99', tb = b.time || '99:99';
    return ta.localeCompare(tb);
  });
}

function groupByDay(stops: TourStop[]): { day: number; items: TourStop[] }[] {
  const sorted = sortStops(stops);
  const map = new Map<number, TourStop[]>();
  for (const s of sorted) {
    const d = s.day ?? 0;
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(s);
  }
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([day, items]) => ({ day, items }));
}

export default function MyToursScreen() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingStop, setEditingStop] = useState<{ tourId: string; stopId: string } | null>(null);
  const [editDay, setEditDay] = useState('');
  const [editTime, setEditTime] = useState('');

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

  const removeStop = (tourId: string, stopId: string) => {
    saveTours(tours.map(t => t.id === tourId ? { ...t, stops: t.stops.filter(s => s.id !== stopId) } : t));
  };

  const startEdit = (tourId: string, stop: TourStop) => {
    setEditingStop({ tourId, stopId: stop.id });
    setEditDay(stop.day != null ? String(stop.day) : '');
    setEditTime(stop.time || '');
  };

  const saveEdit = () => {
    if (!editingStop) return;
    const day = parseInt(editDay, 10);
    saveTours(tours.map(t => t.id !== editingStop.tourId ? t : ({
      ...t,
      stops: t.stops.map(s => s.id !== editingStop.stopId ? s : ({
        ...s,
        day: isNaN(day) ? undefined : day,
        time: editTime.trim() || undefined,
      })),
    })));
    setEditingStop(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.BACKGROUND }}>
      <AppHeader crumbs={[{ title: 'אתרים ואטרקציות', path: '/category/2' }, { title: '❤️ הסיורים שלי' }]} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', marginBottom: 6 }}>❤️ הסיורים שלי</Text>
        <Text style={s.intro}>בנה סיור משלך לפי ימים ושעות. לחץ על "✏️" ליד עצירה כדי לקבוע יום ושעה.</Text>

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
              <View style={{ marginTop: 10, gap: 8 }}>
                {groupByDay(t.stops).map(({ day, items }) => (
                  <View key={day} style={{ gap: 4 }}>
                    <Text style={s.dayHeader}>{day === 0 ? 'ללא יום משויך' : `יום ${day}`}</Text>
                    {items.map(stop => {
                      const isEditing = editingStop?.tourId === t.id && editingStop?.stopId === stop.id;
                      return (
                        <View key={stop.id} style={s.stopRow}>
                          {stop.image ? <Image source={{ uri: stop.image }} style={s.thumb} /> : null}
                          <View style={{ flex: 1 }}>
                            <Text style={s.stopTxt} numberOfLines={1}>{stop.title}</Text>
                            {!isEditing && stop.time ? <Text style={s.stopTime}>🕐 {stop.time}</Text> : null}
                            {isEditing && (
                              <View style={{ flexDirection: 'row-reverse', gap: 6, marginTop: 6 }}>
                                <TextInput style={[s.input, { flex: 1, paddingVertical: 6 }]} value={editDay} onChangeText={setEditDay} placeholder="יום (1)" placeholderTextColor="#94a3b8" keyboardType="numeric" textAlign="right" />
                                <TextInput style={[s.input, { flex: 1, paddingVertical: 6 }]} value={editTime} onChangeText={setEditTime} placeholder="שעה (10:00)" placeholderTextColor="#94a3b8" textAlign="right" />
                                <TouchableOpacity onPress={saveEdit} style={[s.smallBtn, { backgroundColor: Colors.PRIMARY }]}>
                                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>✓</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                          {!isEditing && (
                            <View style={{ flexDirection: 'row-reverse', gap: 4 }}>
                              <TouchableOpacity onPress={() => startEdit(t.id, stop)} style={s.smallBtn}>
                                <Text style={{ fontSize: 14 }}>✏️</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => removeStop(t.id, stop.id)} style={s.smallBtn}>
                                <Text style={{ fontSize: 14, color: '#dc2626' }}>🗑</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })}
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
  intro: { fontSize: 13, color: '#475569', textAlign: 'right', writingDirection: 'rtl', lineHeight: 19, marginBottom: 14 },
  createBox: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#cbd5e1', gap: 8 },
  createLabel: { fontSize: 13, fontWeight: '700', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 13, color: Colors.TEXT },
  btn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '900', fontSize: 14 },
  smallBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 36, gap: 10 },
  emptyTxt: { fontSize: 15, fontWeight: '800', color: Colors.TEXT },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', flex: 1 },
  cardSub: { fontSize: 11, color: '#64748b', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  dayHeader: { fontSize: 12, fontWeight: '900', color: Colors.PRIMARY, textAlign: 'right', writingDirection: 'rtl', marginTop: 6, marginBottom: 2 },
  stopRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 8, backgroundColor: '#f8fafc', borderRadius: 8 },
  thumb: { width: 36, height: 36, borderRadius: 6 },
  stopTxt: { fontSize: 13, color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl', fontWeight: '700' },
  stopTime: { fontSize: 11, color: '#64748b', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
});
