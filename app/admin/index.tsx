import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { AdminContext } from '../../constants/adminContext';

const ADMIN_PASSWORD = 'batumi2024';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const { setAdmin } = useContext(AdminContext);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAdmin(true);
      router.replace('/admin/dashboard');
    } else {
      setError('סיסמה שגויה');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.card, isWide && { maxWidth: 440, padding: 40 }]}>
        <View style={[styles.logoBadge, isWide && { width: 80, height: 80, borderRadius: 20 }]}>
          <Text style={[styles.logoIcon, isWide && { fontSize: 36 }]}>B</Text>
        </View>
        <Text style={[styles.logo, isWide && { fontSize: 32 }]}>Batumi Online</Text>
        <Text style={styles.title}>לוח ניהול</Text>
        <Text style={styles.subtitle}>הזן סיסמה כדי להיכנס</Text>

        <TextInput
          style={styles.input}
          placeholder="סיסמה"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={(t) => { setPassword(t); setError(''); }}
          onSubmitEditing={handleLogin}
          textAlign="right"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.8}>
          <Text style={styles.buttonText}>כניסה</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <Text style={styles.backText}>חזרה לאפליקציה</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.TEXT, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  card: {
    width: '100%', maxWidth: 400, backgroundColor: Colors.WHITE, borderRadius: 24,
    padding: 32, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  logoBadge: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: Colors.PRIMARY,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  logoIcon: { fontSize: 28, fontWeight: '900', color: Colors.WHITE },
  logo: { fontSize: 28, fontWeight: '800', color: Colors.PRIMARY, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.TEXT, marginBottom: 4, writingDirection: 'rtl' },
  subtitle: { fontSize: 14, color: '#999', marginBottom: 28, writingDirection: 'rtl' },
  input: {
    width: '100%', height: 52, borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 14,
    paddingHorizontal: 16, fontSize: 16, color: Colors.TEXT, backgroundColor: '#f9f9f9',
    writingDirection: 'rtl',
  },
  error: { color: '#e74c3c', fontSize: 13, marginTop: 8, writingDirection: 'rtl' },
  button: {
    width: '100%', height: 52, backgroundColor: Colors.PRIMARY, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginTop: 16,
  },
  buttonText: { fontSize: 18, fontWeight: '700', color: Colors.WHITE },
  backBtn: { marginTop: 20 },
  backText: { fontSize: 14, color: Colors.SECONDARY, writingDirection: 'rtl' },
});
