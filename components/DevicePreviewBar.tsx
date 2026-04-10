import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { PreviewContext, PreviewMode } from '../constants/previewContext';

const MODES: { key: PreviewMode; label: string; icon: string; w: number }[] = [
  { key: 'mobile', label: 'נייד', icon: '📱', w: 375 },
  { key: 'tablet', label: 'אייפד', icon: '📲', w: 768 },
  { key: 'desktop', label: 'מחשב', icon: '🖥️', w: 1024 },
];

export default function DevicePreviewBar() {
  const { mode, setMode, simulatedWidth } = useContext(PreviewContext);

  return (
    <View style={s.bar}>
      <Text style={s.label}>תצוגה:</Text>
      {MODES.map(m => (
        <TouchableOpacity
          key={m.key}
          style={[s.btn, mode === m.key && s.btnActive]}
          onPress={() => setMode(mode === m.key ? null : m.key)}
        >
          <Text style={s.icon}>{m.icon}</Text>
          <Text style={[s.btnTxt, mode === m.key && s.btnTxtActive]}>{m.label}</Text>
        </TouchableOpacity>
      ))}
      {mode && (
        <Text style={s.size}>{simulatedWidth}px</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: Colors.TEXT, borderBottomWidth: 1, borderBottomColor: Colors.PRIMARY + '40',
  },
  label: { fontSize: 12, color: Colors.WHITE, opacity: 0.5, marginEnd: 4, writingDirection: 'rtl' },
  btn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  btnActive: { backgroundColor: Colors.PRIMARY },
  icon: { fontSize: 14 },
  btnTxt: { fontSize: 12, color: Colors.WHITE, opacity: 0.5, writingDirection: 'rtl' },
  btnTxtActive: { opacity: 1, fontWeight: '700' },
  size: { fontSize: 11, color: Colors.ACCENT, fontWeight: '600', marginStart: 6 },
});
