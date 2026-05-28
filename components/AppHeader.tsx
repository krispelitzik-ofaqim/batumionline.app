import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import Breadcrumb from './Breadcrumb';

type Crumb = { id?: string; title: string; path?: string };

export default function AppHeader({ crumbs = [], dark = false }: { crumbs?: Crumb[]; dark?: boolean }) {
  const bg = dark ? '#1C2B35' : '#fff';
  const borderColor = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const buttonBg = dark ? 'rgba(255,255,255,0.12)' : '#f1f5f9';
  const arrowColor = dark ? '#F4A94E' : Colors.PRIMARY;
  const arrowBorder = dark ? 'rgba(255,255,255,0.18)' : '#e2e8f0';

  return (
    <View style={[s.container, { backgroundColor: bg, borderBottomColor: borderColor }]}>
      <TouchableOpacity
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        style={s.backBtn}
        accessibilityLabel="חזור"
      >
        <Text style={[s.arrow, { color: arrowColor }]}>←</Text>
      </TouchableOpacity>
      <View style={s.crumbs}>
        <Breadcrumb crumbs={crumbs} dark={dark} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    height: 52,
    justifyContent: 'center',
    borderBottomWidth: 1,
    position: 'relative',
  },
  crumbs: {
    position: 'absolute',
    right: 0,
    left: 60,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backBtn: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  arrow: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 26,
  },
});
