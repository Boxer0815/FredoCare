import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { initDb } from '../db/database';

export default function RootLayout() {
  const [bereit, setBereit] = useState(false);

  useEffect(() => {
    initDb().then(() => setBereit(true));
  }, []);

  if (!bereit) {
    return (
      <View style={styles.ladescreen}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
    </>
  );
}

const styles = StyleSheet.create({
  ladescreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
