import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';

const STORAGE_KEY = '@bo:myTours';

type TourStop = { id: string; title: string; image?: string; type?: string };
type Tour = { id: string; name: string; createdAt: string; stops: TourStop[] };

type Props = {
  itemId: string;
  itemTitle: string;
  itemImage?: string;
  itemType?: 'hotel' | 'attraction' | 'restaurant';
};

async function loadTours(): Promise<Tour[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
async function saveTours(list: Tour[]) {
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

export default function AddToTourButton({ itemId, itemTitle, itemImage, itemType }: Props) {
  const [open, setOpen] = useState(false);
  const [tours, setTours] = useState<Tour[]>([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const onPress = async () => {
    setTours(await loadTours());
    setOpen(true);
  };

  const addToTour = async (tourId: string) => {
    const list = await loadTours();
    const idx = list.findIndex(t => t.id === tourId);
    if (idx < 0) return;
    if (list[idx].stops.some(s => s.id === itemId)) {
      Alert.alert('כבר קיים', 'הפריט הזה כבר נמצא בסיור');
      return;
    }
    list[idx].stops.push({ id: itemId, title: itemTitle, image: itemImage, type: itemType });
    await saveTours(list);
    setOpen(false);
    Alert.alert('✓ נוסף', `נוסף ל"${list[idx].name}"`);
  };

  const createAndAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const t: Tour = {
      id: 't_' + Date.now(),
      name,
      createdAt: new Date().toISOString(),
      stops: [{ id: itemId, title: itemTitle, image: itemImage, type: itemType }],
    };
    const list = await loadTours();
    await saveTours([t, ...list]);
    setNewName('');
    setCreating(false);
    setOpen(false);
    Alert.alert('✓ נוצר', `סיור "${name}" נוצר ונוסף הפריט`);
  };

  return (
    <>
      <TouchableOpacity onPress={onPress} style={s.btn} activeOpacity={0.8}>
        <Text style={s.plus}>+</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={s.backdrop}>
          <View style={s.sheet}>
            <View style={s.header}>
              <TouchableOpacity onPress={() => setOpen(false)}><Text style={s.closeX}>✕</Text></TouchableOpacity>
              <Text style={s.title}>שמור ב"הסיורים שלי"</Text>
            </View>
            <Text style={s.subtitle} numberOfLines={2}>{itemTitle}</Text>
            <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
              {creating ? (
                <View style={{ gap: 8 }}>
                  <TextInput
                    style={s.input}
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="שם הסיור החדש"
                    placeholderTextColor="#94a3b8"
                    textAlign="right"
                    autoFocus
                  />
                  <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                    <TouchableOpacity onPress={createAndAdd} style={[s.actionBtn, { flex: 1, backgroundColor: Colors.PRIMARY }]}>
                      <Text style={s.actionTxt}>✓ צור והוסף</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setCreating(false); setNewName(''); }} style={[s.actionBtn, { flex: 1, backgroundColor: '#cbd5e1' }]}>
                      <Text style={[s.actionTxt, { color: '#1C2B35' }]}>ביטול</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setCreating(true)} style={[s.actionBtn, { backgroundColor: Colors.PRIMARY }]}>
                  <Text style={s.actionTxt}>+ צור סיור חדש</Text>
                </TouchableOpacity>
              )}
              {tours.length > 0 && (
                <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'right', writingDirection: 'rtl', marginTop: 6 }}>הוסף לסיור קיים:</Text>
              )}
              {tours.map(t => (
                <TouchableOpacity key={t.id} onPress={() => addToTour(t.id)} style={s.tourRow}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.TEXT, textAlign: 'right', writingDirection: 'rtl' }}>{t.name}</Text>
                  <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'right', writingDirection: 'rtl', marginTop: 1 }}>{t.stops.length} עצירות</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  btn: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(26,107,138,0.92)', alignItems: 'center', justifyContent: 'center', zIndex: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 },
  plus: { color: '#fff', fontSize: 22, fontWeight: '900', lineHeight: 24, marginTop: -2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: '75%' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 15, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl' },
  closeX: { fontSize: 18, color: '#64748b', fontWeight: '700', padding: 4 },
  subtitle: { fontSize: 13, color: '#475569', textAlign: 'right', writingDirection: 'rtl', paddingHorizontal: 14, paddingTop: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 14, color: Colors.TEXT },
  actionBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  actionTxt: { color: '#fff', fontWeight: '900', fontSize: 14 },
  tourRow: { padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
});
