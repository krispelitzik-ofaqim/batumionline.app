import React, { useContext, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Colors } from '../constants/colors';
import { ThemeContext } from '../constants/theme';
import SearchModal from './SearchModal';

export default function BottomTabBar() {
  const { dark } = useContext(ThemeContext);
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  const activeColor = dark ? Colors.ACCENT : Colors.PRIMARY;
  const inactiveColor = dark ? Colors.SECONDARY : Colors.PRIMARY + '60';
  const bg = dark ? Colors.TEXT : Colors.WHITE;
  const borderColor = dark ? Colors.PRIMARY + '40' : Colors.SECONDARY + '20';

  const is = (p: string) => pathname === p;

  return (
    <View style={[styles.bar, { backgroundColor: bg, borderTopColor: borderColor }]}>
      <TouchableOpacity style={styles.btn} onPress={() => router.replace('/contact')}>
        <FontAwesome name="whatsapp" size={22} color="#25D366" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => router.replace('/info')}>
        <Ionicons name="information-circle" size={22} color={is('/info') ? activeColor : inactiveColor} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => router.replace('/map')}>
        <Ionicons name="map" size={22} color={is('/map') ? activeColor : inactiveColor} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => setSearchOpen(true)}>
        <Ionicons name="search" size={22} color={inactiveColor} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => router.replace('/')}>
        <Ionicons name="home" size={22} color={is('/') ? activeColor : inactiveColor} />
      </TouchableOpacity>
      <SearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    height: 50, borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 4 : 4,
    paddingTop: 4,
  },
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
});
