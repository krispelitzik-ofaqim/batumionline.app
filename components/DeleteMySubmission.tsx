import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView, Alert, StyleSheet } from 'react-native';
import { API_BASE } from '../constants/api';
import { Colors } from '../constants/colors';

type Item = { id: string; categoryId?: string; mode?: string; name?: string; phone?: string; languages?: string; createdAt?: string };

export default function DeleteMySubmission({ accentColor = Colors.PRIMARY }: { accentColor?: string }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    const p = phone.replace(/[^\d+]/g, '');
    if (!p) { Alert.alert('הזן טלפון'); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/guide-recommend/by-phone?phone=${encodeURIComponent(p)}`);
      const j = await r.json();
      setItems(j.items || []);
    } catch { setItems([]); }
    setLoading(false);
  };

  const del = async (id: string) => {
    const p = phone.replace(/[^\d+]/g, '');
    try {
      const r = await fetch(`${API_BASE}/api/guide-recommend/${encodeURIComponent(id)}?phone=${encodeURIComponent(p)}`, { method: 'DELETE' });
      const j = await r.json();
      if (j.success) {
        setItems(items => (items || []).filter(it => it.id !== id));
        Alert.alert('נמחק');
      } else {
        Alert.alert('שגיאה', j.error || 'מחיקה נכשלה');
      }
    } catch { Alert.alert('שגיאה', 'מחיקה נכשלה'); }
  };

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.85} style={[s.btn, { borderColor: accentColor }]}>
        <Text style={[s.btnTxt, { color: accentColor }]}>🗑️ מחק את ההמלצה שלי</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.header}>
              <TouchableOpacity onPress={() => setOpen(false)}><Text style={s.closeX}>✕</Text></TouchableOpacity>
              <Text style={s.title}>מחיקת ההמלצה שלי</Text>
            </View>
            <View style={{ padding: 14, gap: 10 }}>
              <TextInput
                style={s.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="טלפון שמילאת בהמלצה"
                placeholderTextColor="#94a3b8"
                textAlign="right"
                keyboardType="phone-pad"
              />
              <TouchableOpacity onPress={lookup} disabled={loading} style={[s.lookupBtn, { backgroundColor: accentColor }]}>
                <Text style={s.lookupTxt}>{loading ? 'טוען…' : 'הצג המלצות שלי'}</Text>
              </TouchableOpacity>
            </View>
            {items !== null && (
              <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ padding: 14, gap: 8 }}>
                {items.length === 0 ? (
                  <Text style={s.empty}>לא נמצאו המלצות עם הטלפון הזה</Text>
                ) : (
                  items.map(it => (
                    <View key={it.id} style={s.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.rowName}>{it.name}</Text>
                        <Text style={s.rowMeta}>{it.mode || '—'} · {it.categoryId || '—'} · {it.languages || ''}</Text>
                        <Text style={s.rowDate}>{(it.createdAt || '').split('T')[0]}</Text>
                      </View>
                      <TouchableOpacity onPress={() => del(it.id)} style={s.delBtn}>
                        <Text style={s.delTxt}>מחק</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  btn: { marginHorizontal: 4, marginTop: 4, marginBottom: 14, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', backgroundColor: '#fff' },
  btnTxt: { fontSize: 13, fontWeight: '800', writingDirection: 'rtl' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 16, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl' },
  closeX: { fontSize: 18, color: '#64748b', fontWeight: '700', padding: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, fontSize: 14, color: Colors.TEXT, backgroundColor: '#f8fafc' },
  lookupBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  lookupTxt: { color: '#fff', fontSize: 14, fontWeight: '900' },
  empty: { fontSize: 13, color: '#64748b', textAlign: 'center', padding: 20, writingDirection: 'rtl' },
  row: { flexDirection: 'row-reverse', alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', gap: 8 },
  rowName: { fontSize: 14, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right' },
  rowMeta: { fontSize: 11, color: '#64748b', marginTop: 2, writingDirection: 'rtl', textAlign: 'right' },
  rowDate: { fontSize: 10, color: '#94a3b8', marginTop: 2, writingDirection: 'rtl', textAlign: 'right' },
  delBtn: { backgroundColor: '#e11d48', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  delTxt: { color: '#fff', fontSize: 12, fontWeight: '900' },
});
