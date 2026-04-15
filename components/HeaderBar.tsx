import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Colors } from '../constants/colors';
import { ThemeContext } from '../constants/theme';

function useBatumiClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Tbilisi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const update = () => setTime(fmt.format(new Date()));
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
      {/* LEFT — back arrow ‹ (or logo on home) */}
      {isHome ? (
        <View style={styles.btn}>
          <Image source={require('../assets/images/batumi_icon.png')} style={styles.logo} resizeMode="contain" />
        </View>
      ) : (
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={{ fontSize: 28, color: fg, fontWeight: '300' }}>‹</Text>
        </TouchableOpacity>
      )}

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
  logo: {
    width: 36,
    height: 36,
  },
});
