import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
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
