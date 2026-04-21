import React, { useState } from 'react';
import { View, Text, ScrollView, Platform, TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '../../constants/colors';

const PHONES = [
  { name: 'iPhone SE', w: 375, h: 667 },
  { name: 'iPhone 13 mini', w: 375, h: 812 },
  { name: 'Galaxy S21', w: 360, h: 800 },
  { name: 'Galaxy S22 Ultra', w: 384, h: 832 },
  { name: 'iPhone 12', w: 390, h: 844 },
  { name: 'iPhone 14', w: 390, h: 844 },
  { name: 'iPhone 14 Pro', w: 393, h: 852 },
  { name: 'Pixel 7', w: 412, h: 915 },
  { name: 'OnePlus 10', w: 412, h: 919 },
  { name: 'iPhone 15 Pro Max', w: 430, h: 932 },
  { name: 'iPad Pro 12.9"', w: 1024, h: 1366 },
];

export default function PhonesPreview() {
  const [path, setPath] = useState('/');
  const [scale, setScale] = useState(0.65);
  if (Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 16, textAlign: 'center', writingDirection: 'rtl' }}>התצוגה זמינה רק בדפדפן (expo web)</Text>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ padding: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, backgroundColor: '#f1f5f9', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl' }}>📱 תצוגת 10 ניידים</Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 11, color: '#64748b' }}>נתיב:</Text>
        <TextInput
          value={path}
          onChangeText={setPath}
          style={{ borderWidth: 1, borderColor: '#cbd5e1', color: Colors.TEXT, backgroundColor: '#ffffff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, minWidth: 120 }}
          placeholder="/"
          placeholderTextColor="#94a3b8"
        />
        <Text style={{ fontSize: 11, color: '#64748b' }}>זום:</Text>
        {[0.5, 0.65, 0.8, 1].map(s => (
          <TouchableOpacity key={s} onPress={() => setScale(s)} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: scale === s ? Colors.PRIMARY : '#e2e8f0' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: scale === s ? '#fff' : Colors.TEXT }}>{Math.round(s * 100)}%</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator style={{ flex: 1 }} contentContainerStyle={{ padding: 38, gap: 38, alignItems: 'flex-end' }}>
        {PHONES.map((p, i) => {
          const scaledW = p.w * scale;
          const scaledH = p.h * scale;
          return (
            <View key={i} style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.TEXT, marginBottom: 38 }}>{p.name}</Text>
              <Text style={{ fontSize: 10, color: '#64748b', marginBottom: 38 }}>{p.w} × {p.h}</Text>
              {React.createElement('div', {
                style: { width: scaledW + 12, height: scaledH + 12, backgroundColor: '#000', borderRadius: 28, padding: 6, boxSizing: 'border-box' },
              }, React.createElement('div', {
                style: { width: scaledW, height: scaledH, borderRadius: 22, overflow: 'hidden', backgroundColor: '#fff', position: 'relative' },
              }, React.createElement('iframe', {
                src: path,
                width: p.w,
                height: p.h,
                style: {
                  border: 0,
                  width: `${p.w}px`,
                  height: `${p.h}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: '0 0',
                  display: 'block',
                },
              })))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
