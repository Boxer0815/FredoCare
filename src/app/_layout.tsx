import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { initDb } from '../db/database';

export default function RootLayout() {
  const [bereit, setBereit] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    initDb()
      .then(() => setBereit(true))
      .catch((e: unknown) => setFehler(String(e)));
  }, []);

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="symptom-erfassen"
          options={{ presentation: 'modal', title: 'Symptom erfassen' }}
        />
        <Stack.Screen
          name="symptom-bearbeiten/[id]"
          options={{ title: 'Eintrag bearbeiten' }}
        />
        <Stack.Screen
          name="arztbesuch-erfassen"
          options={{ presentation: 'modal', title: 'Arztbesuch erfassen' }}
        />
        <Stack.Screen
          name="arztbesuch-bearbeiten/[id]"
          options={{ title: 'Arztbesuch bearbeiten' }}
        />
        <Stack.Screen
          name="profil"
          options={{ title: 'Mein Profil' }}
        />
      </Stack>
      <StatusBar style="auto" />
      {!bereit && !fehler && (
        <View style={styles.ladeOverlay}>
          <ActivityIndicator size="large" color="#5B8DEF" />
        </View>
      )}
      {fehler && (
        <View style={styles.ladeOverlay}>
          <Text style={styles.fehlerText}>DB-Fehler:{'\n'}{fehler}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  ladeOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fehlerText: { color: 'red', textAlign: 'center', padding: 20, fontSize: 14 },
});
