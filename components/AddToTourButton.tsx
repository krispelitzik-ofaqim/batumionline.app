import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOURS_KEY = '@bo:myTours';
const FAV_TOUR_NAME = '❤️ המועדפים שלי';

type Props = {
  itemId: string;
  itemTitle?: string;
  itemImage?: string;
  itemType?: 'hotel' | 'attraction' | 'restaurant';
  sourcePath?: string;
};

type TourStop = { id: string; title: string; image?: string; type?: string; day?: number; time?: string; sourcePath?: string };
type Tour = { id: string; name: string; createdAt: string; stops: TourStop[] };

async function loadTours(): Promise<Tour[]> {
  try {
    const raw = await AsyncStorage.getItem(TOURS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveTours(list: Tour[]) {
  try { await AsyncStorage.setItem(TOURS_KEY, JSON.stringify(list)); } catch {}
}

function isHearted(tours: Tour[], itemId: string): boolean {
  return tours.some(t => t.stops.some(s => s.id === itemId));
}

export default function AddToTourButton({ itemId, itemTitle, itemImage, itemType, sourcePath }: Props) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    let alive = true;
    loadTours().then(t => { if (alive) setFav(isHearted(t, itemId)); });
    return () => { alive = false; };
  }, [itemId]);

  const toggle = async () => {
    const tours = await loadTours();
    const currentlyFav = isHearted(tours, itemId);

    if (currentlyFav) {
      const next = tours.map(t => ({ ...t, stops: t.stops.filter(s => s.id !== itemId) }));
      await saveTours(next);
      setFav(false);
    } else {
      const stop: TourStop = {
        id: itemId,
        title: itemTitle || 'פריט',
        image: itemImage,
        type: itemType,
        sourcePath,
      };
      const favIdx = tours.findIndex(t => t.name === FAV_TOUR_NAME);
      if (favIdx >= 0) {
        tours[favIdx] = { ...tours[favIdx], stops: [...tours[favIdx].stops, stop] };
      } else {
        tours.unshift({ id: 't_fav_' + Date.now(), name: FAV_TOUR_NAME, createdAt: new Date().toISOString(), stops: [stop] });
      }
      await saveTours(tours);
      setFav(true);
    }
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
