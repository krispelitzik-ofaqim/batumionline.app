import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Colors } from '../constants/colors';
import { ThemeContext } from '../constants/theme';

function useBatumiClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const batumi = new Date(now.getTime() + (4 * 60 - now.getTimezoneOffset()) * 60000);
      const h = batumi.getUTCHours().toString().padStart(2, '0');
      const m = batumi.getUTCMinutes().toString().padStart(2, '0');
      setTime(`${h}:${m}`);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  return time;
}

export default function HeaderBar() {
  const { dark, toggle } = useContext(ThemeContext);
  const time = useBatumiClock();
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '/index';
  const bg = dark ? Colors.TEXT : Colors.BACKGROUND;
  const fg = dark ? Colors.BACKGROUND : Colors.TEXT;

  return (
    <View style={[styles.bar, { backgroundColor: bg, borderBottomColor: dark ? Colors.PRIMARY : Colors.SECONDARY + '30' }]}>
      {/* LEFT — back arrow ‹ */}
      <TouchableOpacity style={styles.btn} onPress={() => router.back()} disabled={isHome}>
        <Text style={{ fontSize: 28, color: isHome ? bg : fg, fontWeight: '300' }}>‹</Text>
      </TouchableOpacity>

      {/* CENTER — clock */}
      <Text style={[styles.clock, { color: fg }]}>{time}</Text>

      {/* RIGHT — toggle light/dark */}
      <TouchableOpacity style={styles.btn} onPress={toggle}>
        <Ionicons name={dark ? 'sunny' : 'moon'} size={22} color={dark ? Colors.ACCENT : Colors.PRIMARY} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  btn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clock: {
    fontSize: 18,
    fontWeight: '800',
  },
});
