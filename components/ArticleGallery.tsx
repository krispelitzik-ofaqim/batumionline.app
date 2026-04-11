import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors } from '../constants/colors';

type Mode = 'slider' | 'grid' | 'stack';

export default function ArticleGallery({
  images,
  defaultMode = 'slider',
  defaultVisible = true,
}: {
  images: string[];
  defaultMode?: Mode;
  defaultVisible?: boolean;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [visible, setVisible] = useState(defaultVisible);
  const { width: screenW } = useWindowDimensions();

  if (!images || images.length === 0) return null;

  const containerW = Math.min(screenW, 600);
  const gridItemW = (containerW - 32 - 16) / 3;

  const modeBtn = (m: Mode, icon: string, label: string) => {
    const active = mode === m;
    return (
      <TouchableOpacity
        key={m}
        onPress={() => setMode(m)}
        style={[styles.modeBtn, active && styles.modeBtnActive]}
      >
        <Text style={[styles.modeBtnIcon, active && { color: '#fff' }]}>{icon}</Text>
        <Text style={[styles.modeBtnLabel, active && { color: '#fff' }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setVisible(v => !v)} style={styles.toggleBtn}>
          <Text style={styles.toggleBtnTxt}>{visible ? 'הסתר גלריה' : `הצג גלריה (${images.length})`}</Text>
        </TouchableOpacity>
        {visible && (
          <View style={styles.modeRow}>
            {modeBtn('slider', '◀▶', 'סליידר')}
            {modeBtn('grid', '▦', 'רשת')}
            {modeBtn('stack', '≡', 'רצף')}
          </View>
        )}
      </View>

      {visible && mode === 'slider' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={250 + 10}
          decelerationRate="fast"
          contentContainerStyle={{ gap: 10, paddingHorizontal: 10 }}
        >
          {images.map((uri, i) => (
            <View key={i} style={styles.sliderItem}>
              <Image source={{ uri }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />
            </View>
          ))}
        </ScrollView>
      )}

      {visible && mode === 'grid' && (
        <View style={styles.grid}>
          {images.map((uri, i) => (
            <View key={i} style={[styles.gridItem, { width: gridItemW, height: gridItemW }]}>
              <Image source={{ uri }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />
            </View>
          ))}
        </View>
      )}

      {visible && mode === 'stack' && (
        <View style={{ gap: 10, paddingHorizontal: 10 }}>
          {images.map((uri, i) => (
            <View key={i} style={styles.stackItem}>
              <Image source={{ uri }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  toggleBtn: {
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  toggleBtnTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  modeRow: {
    flexDirection: 'row-reverse',
    gap: 4,
  },
  modeBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modeBtnActive: {
    backgroundColor: Colors.PRIMARY,
  },
  modeBtnIcon: {
    fontSize: 11,
    color: Colors.TEXT,
  },
  modeBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.TEXT,
  },
  sliderItem: {
    width: 250,
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
  },
  gridItem: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  stackItem: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
});
