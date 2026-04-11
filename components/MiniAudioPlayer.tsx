import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Colors } from '../constants/colors';

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MiniAudioPlayer({
  source,
  label,
}: {
  source: any;
  label?: string;
}) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [positionMs, setPositionMs] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const onStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setDurationMs(status.durationMillis ?? 0);
    setPositionMs(status.positionMillis ?? 0);
    setIsPlaying(status.isPlaying);
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPositionMs(0);
      soundRef.current?.setPositionAsync(0).catch(() => {});
    }
  };

  const toggle = async () => {
    try {
      if (!soundRef.current) {
        setLoading(true);
        const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true }, onStatus);
        soundRef.current = sound;
        setLoading(false);
        return;
      }
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch {
      setLoading(false);
    }
  };

  const remainingMs = Math.max(0, durationMs - positionMs);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={toggle} style={styles.btn} activeOpacity={0.8}>
        <Text style={styles.btnIcon}>{loading ? '⋯' : isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
      {label ? <Text style={styles.label} numberOfLines={1}>{label}</Text> : <View style={{ flex: 1 }} />}
      <Text style={styles.time}>{formatTime(remainingMs || durationMs)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  btn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIcon: {
    color: Colors.WHITE,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 1,
  },
  label: {
    flex: 1,
    fontSize: 12,
    color: Colors.TEXT,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  time: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'left',
  },
});
