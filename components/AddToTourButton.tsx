import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@bo:favorites';

type Props = {
  itemId: string;
  itemTitle?: string;
  itemImage?: string;
  itemType?: 'hotel' | 'attraction' | 'restaurant';
  sourcePath?: string;
};

async function loadFavs(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch { return new Set(); }
}

async function saveFavs(set: Set<string>) {
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...set])); } catch {}
}

export default function AddToTourButton({ itemId }: Props) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    let alive = true;
    loadFavs().then(s => { if (alive) setFav(s.has(itemId)); });
    return () => { alive = false; };
  }, [itemId]);

  const toggle = async () => {
    const s = await loadFavs();
    if (s.has(itemId)) s.delete(itemId); else s.add(itemId);
    await saveFavs(s);
    setFav(s.has(itemId));
  };

  return (
    <TouchableOpacity onPress={toggle} style={s.btn} activeOpacity={0.8}>
      <Text style={[s.heart, fav && s.heartFav]}>{fav ? '♥' : '♡'}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  heart: { color: '#e11d48', fontSize: 20, fontWeight: '900', lineHeight: 22 },
  heartFav: { color: '#e11d48' },
});
