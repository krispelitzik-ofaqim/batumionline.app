import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Colors } from '../constants/colors';

type Track = { title?: string; url: string };
type Props = { tracks: Track[]; title?: string; compact?: boolean };

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ tracks, title, compact }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const soundRef = useRef<any>(null);
  const audioElRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync?.();
    };
  }, []);

  const current = tracks[activeIdx];

  const toggle = async () => {
    if (Platform.OS === 'web') {
      if (!audioElRef.current) {
        audioElRef.current = new (window as any).Audio(current.url);
        audioElRef.current.ontimeupdate = () => {
          setPos((audioElRef.current.currentTime || 0) * 1000);
          setDur((audioElRef.current.duration || 0) * 1000);
        };
        audioElRef.current.onended = () => setPlaying(false);
      }
      if (playing) {
        audioElRef.current.pause();
        setPlaying(false);
      } else {
        audioElRef.current.play();
        setPlaying(true);
      }
      return;
    }

    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync({ uri: current.url }, { shouldPlay: true });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((st: any) => {
        if (!st.isLoaded) return;
        setPos(st.positionMillis || 0);
        setDur(st.durationMillis || 0);
        setPlaying(st.isPlaying);
      });
      setPlaying(true);
    } else {
      const st = await soundRef.current.getStatusAsync();
      if (st.isPlaying) {
        await soundRef.current.pauseAsync();
        setPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setPlaying(true);
      }
    }
  };

  const pickTrack = async (i: number) => {
    if (Platform.OS === 'web') {
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current = null;
      }
    } else if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setActiveIdx(i);
    setPlaying(false);
    setPos(0);
    setDur(0);
  };

  const pct = dur > 0 ? (pos / dur) * 100 : 0;

  if (!tracks || tracks.length === 0) return null;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {title && <Text style={styles.header}>{title}</Text>}
      <Text style={[styles.nowTitle, compact && styles.nowTitleCompact]}>{current?.title || `שיר ${activeIdx + 1}`}</Text>

      <View style={styles.row}>
        <TouchableOpacity style={[styles.playBtn, compact && styles.playBtnCompact]} onPress={toggle} activeOpacity={0.85}>
          <Text style={[styles.playIcon, compact && styles.playIconCompact]}>{playing ? '❚❚' : '▶'}</Text>
        </TouchableOpacity>
        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.time}>{fmt(pos)}</Text>
            <Text style={styles.time}>{fmt(dur)}</Text>
          </View>
        </View>
      </View>

      {tracks.length > 1 && (
        <View style={styles.list}>
          {tracks.map((t, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => pickTrack(i)}
              style={[styles.listItem, i === activeIdx && styles.listItemActive]}
            >
              <Text style={styles.listIcon}>🎧</Text>
              <Text style={[styles.listTxt, i === activeIdx && styles.listTxtActive]}>
                {t.title || `שיר ${i + 1}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardCompact: { padding: 10, borderRadius: 14 },
  nowTitleCompact: { fontSize: 14, marginBottom: 6 },
  playBtnCompact: { width: 40, height: 40, borderRadius: 20 },
  playIconCompact: { fontSize: 15 },
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.SECONDARY + '25',
  },
  header: { fontSize: 13, color: '#888', fontWeight: '700', writingDirection: 'rtl', textAlign: 'right', marginBottom: 6 },
  nowTitle: { fontSize: 17, fontWeight: '900', color: Colors.TEXT, writingDirection: 'rtl', textAlign: 'right', marginBottom: 14 },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  playBtn: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.PRIMARY,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playIcon: { color: Colors.WHITE, fontSize: 20, fontWeight: '900', marginLeft: 2 },
  progressWrap: { flex: 1 },
  progressBg: { height: 6, backgroundColor: '#E5EEF2', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.SECONDARY, borderRadius: 3 },
  timeRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 6 },
  time: { fontSize: 11, color: '#888', fontVariant: ['tabular-nums'] },
  list: { marginTop: 16, gap: 6 },
  listItem: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: '#F7F9FB',
    borderWidth: 1, borderColor: 'transparent',
  },
  listItemActive: { backgroundColor: Colors.SECONDARY + '20', borderColor: Colors.SECONDARY + '60' },
  listIcon: { fontSize: 16 },
  listTxt: { fontSize: 13, color: Colors.TEXT, fontWeight: '600', writingDirection: 'rtl', flex: 1, textAlign: 'right' },
  listTxtActive: { color: Colors.PRIMARY, fontWeight: '800' },
});

