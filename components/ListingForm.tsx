import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, Platform, Linking } from 'react-native';
import { Colors } from '../constants/colors';
import { API_BASE } from '../constants/api';

type Props = {
  visible: boolean;
  onClose: () => void;
  defaultType: 'sale' | 'rent' | 'hotels';
  onSubmitted?: () => void;
};

const PERIODS = [
  { key: 'daily', label: 'יומי' },
  { key: 'monthly', label: 'חודשי' },
  { key: 'yearly', label: 'שנתי' },
  { key: 'other', label: 'אחר' },
] as const;

export default function ListingForm({ visible, onClose, defaultType, onSubmitted }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly' | 'other'>('monthly');
  const [size, setSize] = useState<'banner' | 'full'>('banner');

  const reset = () => {
    setTitle(''); setDescription(''); setPrice(''); setLocation(''); setPhone(''); setImages([]); setDone(false);
  };

  const pickImage = async () => {
    if (Platform.OS !== 'web') return;
    const input = (document as any).createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e: any) => {
      const files: File[] = Array.from(e.target.files || []);
      if (files.length === 0) return;
      setUploading(true);
      const urls: string[] = [];
      for (const f of files.slice(0, 8 - images.length)) {
        const fd = new FormData();
        fd.append('file', f);
        try {
          const r = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd });
          const j = await r.json();
          if (j.url) urls.push(j.url);
        } catch {}
      }
      setImages(prev => [...prev, ...urls]);
      setUploading(false);
    };
    input.click();
  };

  const submit = async () => {
    if (!title || !phone) return;
    setSubmitting(true);
    try {
      const payload: any = { type: defaultType, title, description, price, location, phone, images, size };
      if (defaultType === 'rent') payload.period = period;
      await fetch(`${API_BASE}/api/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setDone(true);
      onSubmitted?.();
    } catch {}
    setSubmitting(false);
  };

  const typeLabel = defaultType === 'sale' ? 'למכירה' : defaultType === 'rent' ? 'להשכרה' : 'פרויקט מלונאי';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Text style={s.closeX}>✕</Text>
            </TouchableOpacity>
            <Text style={s.title}>פרסום מודעה · {typeLabel}</Text>
          </View>

          {done ? (
            <View style={{ padding: 40, alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 40 }}>✅</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.TEXT, textAlign: 'center', writingDirection: 'rtl' }}>המודעה נשלחה לאישור!</Text>
              <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', writingDirection: 'rtl' }}>אישור תוך 3 שעות</Text>
              <TouchableOpacity onPress={() => { reset(); onClose(); }} style={s.submitBtn}>
                <Text style={s.submitTxt}>סגור</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }}>
              <TextInput style={s.input} placeholder="כותרת (לדוגמה: דירת 2 חדרים מפוארת)" value={title} onChangeText={setTitle} textAlign="right" placeholderTextColor="#94a3b8" />
              {defaultType === 'rent' && (
                <View>
                  <Text style={s.sectionLabel}>תקופת השכירות</Text>
                  <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
                    {PERIODS.map(p => (
                      <TouchableOpacity key={p.key} onPress={() => setPeriod(p.key)} style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: period === p.key ? Colors.PRIMARY : '#f1f5f9', alignItems: 'center', borderWidth: 1, borderColor: period === p.key ? Colors.PRIMARY : '#cbd5e1' }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: period === p.key ? '#fff' : Colors.TEXT }}>{p.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              <TextInput style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="תיאור (פרטים, מיקום מדויק, אמצעים)" value={description} onChangeText={setDescription} textAlign="right" multiline placeholderTextColor="#94a3b8" />
              <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                <TextInput style={[s.input, { flex: 1 }]} placeholder={defaultType === 'sale' ? 'מחיר $' : 'מחיר $ / חודש'} value={price} onChangeText={setPrice} textAlign="right" keyboardType="numeric" placeholderTextColor="#94a3b8" />
                <TextInput style={[s.input, { flex: 1 }]} placeholder="מיקום/שכונה" value={location} onChangeText={setLocation} textAlign="right" placeholderTextColor="#94a3b8" />
              </View>
              <TextInput style={s.input} placeholder="טלפון ליצירת קשר" value={phone} onChangeText={setPhone} textAlign="right" keyboardType="phone-pad" placeholderTextColor="#94a3b8" />

              <View>
                <Text style={s.sectionLabel}>סוג תצוגה</Text>
                <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
                  {([
                    { key: 'banner', label: 'מודעה קטנה', price: 'חינם' },
                    { key: 'full', label: 'מודעה גדולה', price: '$10/חודש' },
                  ] as const).map(opt => (
                    <TouchableOpacity key={opt.key} onPress={() => setSize(opt.key)} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, backgroundColor: size === opt.key ? Colors.PRIMARY : '#f1f5f9', alignItems: 'center', borderWidth: 1, borderColor: size === opt.key ? Colors.PRIMARY : '#cbd5e1' }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: size === opt.key ? '#fff' : Colors.TEXT }}>{opt.label}</Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: size === opt.key ? '#fff' : (opt.price === 'חינם' ? '#10b981' : '#f59e0b'), marginTop: 2, opacity: size === opt.key ? 0.9 : 1 }}>{opt.price}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text style={s.sectionLabel}>תמונות ({images.length}/8)</Text>
                <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 }}>
                  {images.map((url, i) => (
                    <View key={i} style={{ position: 'relative' }}>
                      <Image source={{ uri: url }} style={{ width: 70, height: 70, borderRadius: 8 }} />
                      <TouchableOpacity onPress={() => setImages(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 10, color: '#fff', fontWeight: '900' }}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {images.length < 8 && (
                    <TouchableOpacity onPress={pickImage} disabled={uploading} style={{ width: 70, height: 70, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 22, color: '#94a3b8' }}>{uploading ? '…' : '+'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <TouchableOpacity onPress={submit} disabled={!title || !phone || submitting} style={[s.submitBtn, (!title || !phone || submitting) && { opacity: 0.5 }]}>
                <Text style={s.submitTxt}>{submitting ? 'שולח…' : 'פרסם מודעה'}</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', writingDirection: 'rtl', marginTop: 6 }}>המודעה תופיע אחרי אישור המנהל</Text>
            </ScrollView>
          )}
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
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 10, fontSize: 14, color: Colors.TEXT, writingDirection: 'rtl' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#475569', writingDirection: 'rtl', textAlign: 'right', marginBottom: 6 },
  submitBtn: { backgroundColor: Colors.PRIMARY, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  submitTxt: { color: Colors.WHITE, fontSize: 14, fontWeight: '900' },
});
