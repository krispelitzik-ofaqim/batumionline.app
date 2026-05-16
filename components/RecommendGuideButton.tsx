import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView, Alert, Image, Platform, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE } from '../constants/api';
import { Colors } from '../constants/colors';
import { markSubmitted } from './DeleteMySubmission';

type Props = { categoryId: string; mode: 'israeli' | 'local' };

export default function RecommendGuideButton({ categoryId, mode }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [languages, setLanguages] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [facebook, setFacebook] = useState('');
  const [website, setWebsite] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const pickPhoto = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
      });
      if (!res.canceled && res.assets[0]) {
        const a = res.assets[0];
        setPhoto(a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri);
      }
    } catch {}
  };

  const submit = async () => {
    if (!name.trim() || !phone.trim()) { Alert.alert('חסר מידע', 'שם וטלפון חובה'); return; }
    setSending(true);
    try {
      await fetch(`${API_BASE}/api/guide-recommend`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, mode, name, phone, languages, whatsapp, facebook, website, note, photo }),
      });
      await markSubmitted(phone);
      Alert.alert('תודה!', 'הפנייה שלך התקבלה. נחזור אליך בקרוב.');
      setOpen(false);
      setName(''); setPhone(''); setLanguages(''); setWhatsapp(''); setFacebook(''); setWebsite(''); setNote(''); setPhoto(null);
    } catch {
      Alert.alert('שגיאה', 'לא הצלחנו לשלוח. נסה שוב.');
    }
    setSending(false);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.85} style={s.btn}>
        <Text style={s.btnIcon}>➕</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.btnTitle}>המלץ על מדריך / הוסף את עצמך</Text>
          <Text style={s.btnSub}>{mode === 'israeli' ? 'ישראלי דובר עברית' : 'מקומי שמכיר את האזור'}</Text>
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.header}>
              <TouchableOpacity onPress={() => setOpen(false)}><Text style={s.closeX}>✕</Text></TouchableOpacity>
              <Text style={s.title}>המלצה / הוספת מדריך</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }} keyboardShouldPersistTaps="handled">
              <TextInput style={s.input} value={name} onChangeText={setName} placeholder="שם מלא *" placeholderTextColor="#94a3b8" textAlign="right" />
              <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="טלפון / WhatsApp *" placeholderTextColor="#94a3b8" textAlign="right" keyboardType="phone-pad" />
              <TextInput style={s.input} value={languages} onChangeText={setLanguages} placeholder="שפות (עברית, אנגלית, רוסית...)" placeholderTextColor="#94a3b8" textAlign="right" />
              <TextInput style={s.input} value={whatsapp} onChangeText={setWhatsapp} placeholder="קישור WhatsApp (אופציונלי)" placeholderTextColor="#94a3b8" textAlign="right" />
              <TextInput style={s.input} value={facebook} onChangeText={setFacebook} placeholder="עמוד פייסבוק (אופציונלי)" placeholderTextColor="#94a3b8" textAlign="right" />
              <TextInput style={s.input} value={website} onChangeText={setWebsite} placeholder="אתר (אופציונלי)" placeholderTextColor="#94a3b8" textAlign="right" />
              <TextInput style={[s.input, { height: 80 }]} value={note} onChangeText={setNote} placeholder="התמחות והערות..." placeholderTextColor="#94a3b8" textAlign="right" multiline />

              <TouchableOpacity onPress={pickPhoto} style={s.photoBtn} activeOpacity={0.85}>
                {photo ? (
                  <Image source={{ uri: photo }} style={{ width: 90, height: 90, borderRadius: 10 }} />
                ) : (
                  <>
                    <Text style={{ fontSize: 26 }}>📷</Text>
                    <Text style={{ fontSize: 13, color: '#475569', fontWeight: '700', marginTop: 6 }}>הוסף תמונה</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={submit} disabled={sending} style={[s.submit, sending && { opacity: 0.5 }]} activeOpacity={0.85}>
                <Text style={s.submitTxt}>{sending ? 'שולח…' : 'שלח'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  btn: { marginHorizontal: 12, marginTop: 10, marginBottom: 14, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#F4A94E', flexDirection: 'row-reverse', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  btnIcon: { fontSize: 22 },
  btnTitle: { fontSize: 14, fontWeight: '900', color: '#1C2B35', writingDirection: 'rtl', textAlign: 'right' },
  btnSub: { fontSize: 11, color: '#1C2B35', writingDirection: 'rtl', textAlign: 'right', opacity: 0.75, marginTop: 2 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 16, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl' },
  closeX: { fontSize: 18, color: '#64748b', fontWeight: '700', padding: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, fontSize: 14, color: Colors.TEXT, backgroundColor: '#f8fafc' },
  photoBtn: { alignSelf: 'flex-end', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', minHeight: 90, minWidth: 90 },
  submit: { backgroundColor: Colors.PRIMARY, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
