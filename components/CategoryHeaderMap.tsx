import React, { useState } from 'react';
import { View, StyleProp, ViewStyle, TouchableOpacity, Text, ScrollView } from 'react-native';
import { API_BASE } from '../constants/api';

type Point = { name: string; lat: number; lng: number };
type Props = {
  points: Point[];
  color?: string;
  style?: StyleProp<ViewStyle>;
  onExpand?: () => void;
};

export default function CategoryHeaderMap({ points, color = '#1A6B8A', style, onExpand }: Props) {
  const [focus, setFocus] = useState<Point | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  if (!points || points.length === 0) return null;

  const pointsParam = points.map(p => `${p.lat},${p.lng},${encodeURIComponent(p.name)}`).join(';');
  const focusParam = focus ? `&focus=${focus.lat},${focus.lng}` : '';
  const src = `${API_BASE}/api/map-html?points=${encodeURIComponent(pointsParam)}&color=${encodeURIComponent(color)}${focusParam}`;

  const frame = React.createElement('iframe', {
    key: 'mapframe-' + (focus ? `${focus.lat}-${focus.lng}` : 'all'),
    src,
    title: 'category-map',
    style: { width: '100%', height: '100%', border: 0, display: 'block' } as any,
  });

  return (
    <View style={[style, { position: 'relative' }]}>
      <View style={{ position: 'relative', overflow: 'hidden', flex: 1 }}>
        {frame}
        <TouchableOpacity
          onPress={() => setPickerOpen(!pickerOpen)}
          style={{ position: 'absolute', top: 8, right: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(28,43,53,0.9)', zIndex: 6, flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}
          activeOpacity={0.85}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', writingDirection: 'rtl' }}>
            📍 {focus ? focus.name : 'בחר מיקום מבוקש'}
          </Text>
          <Text style={{ color: '#fff', fontSize: 10 }}>{pickerOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {onExpand && (
          <TouchableOpacity
            onPress={onExpand}
            style={{ position: 'absolute', left: 8, bottom: 8, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(28,43,53,0.85)', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>⤢</Text>
          </TouchableOpacity>
        )}
      </View>
      {pickerOpen && (
        <View style={{ position: 'absolute', top: 44, right: 8, width: 240, maxHeight: 280, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', zIndex: 10, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 }}>
          <ScrollView>
            <TouchableOpacity
              onPress={() => { setFocus(null); setPickerOpen(false); }}
              style={{ paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: !focus ? '#eef6fa' : '#fff' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#1C2B35', textAlign: 'right', writingDirection: 'rtl' }}>הצג את כולם</Text>
            </TouchableOpacity>
            {points.map((p, i) => {
              const isOn = focus && focus.lat === p.lat && focus.lng === p.lng;
              return (
                <TouchableOpacity
                  key={`${p.name}-${i}`}
                  onPress={() => { setFocus(p); setPickerOpen(false); }}
                  style={{ paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: isOn ? '#eef6fa' : '#fff' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: isOn ? '900' : '600', color: '#1C2B35', textAlign: 'right', writingDirection: 'rtl' }} numberOfLines={1}>
                    📍 {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
