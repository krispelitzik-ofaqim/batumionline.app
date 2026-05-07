import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated } from 'react-native';

const IMAGES = [
  require('../assets/welcome/galery1.jpg'),
  require('../assets/welcome/galery2.jpg'),
  require('../assets/welcome/galery3.jpg'),
  require('../assets/welcome/galery4.jpg'),
  require('../assets/welcome/galery5.jpg'),
  require('../assets/welcome/galery6.jpg'),
];

const DWELL_MS = 5000;
const FADE_MS = 1500;

export default function HomeGallery() {
  const { width } = useWindowDimensions();
  const [idx, setIdx] = useState(0);
  const [nextIdx, setNextIdx] = useState(1);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setInterval(() => {
      Animated.timing(fade, { toValue: 1, duration: FADE_MS, useNativeDriver: true }).start(() => {
        setIdx(prev => (prev + 1) % IMAGES.length);
        setNextIdx(prev => (prev + 1) % IMAGES.length);
        fade.setValue(0);
      });
    }, DWELL_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={[styles.wrap, { width: width - 32 }]}>
      <Animated.Image
        source={IMAGES[idx]}
        style={[StyleSheet.absoluteFillObject, { opacity: fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
        resizeMode="cover"
      />
      <Animated.Image
        source={IMAGES[nextIdx]}
        style={[StyleSheet.absoluteFillObject, { opacity: fade }]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
});
