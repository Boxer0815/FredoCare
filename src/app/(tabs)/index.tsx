import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  useColorScheme, RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useEintraege } from '../../hooks/useSymptome';
import EintragKarte from '../../components/EintragKarte';
import LeerZustand from '../../components/LeerZustand';
import type { SymptomEintrag } from '../../types';

function letzte7Tage(eintraege: SymptomEintrag[]): SymptomEintrag[] {
  const grenze = new Date();
  grenze.setDate(grenze.getDate() - 7);
  return eintraege.filter((e) => new Date(e.datum) >= grenze);
}

export default function UebersichtScreen() {
  const dunkel = useColorScheme() === 'dark';
  const { eintraege, laden, neu } = useEintraege();

  useFocusEffect(useCallback(() => { neu(); }, [neu]));

  const heutigeEintraege = eintraege.filter(
    (e) => new Date(e.datum).toDateString() === new Date().toDateString()
  );
  const wochenEintraege = letzte7Tage(eintraege);

  const hg = dunkel ? '#000' : '#F2F2F7';
  const textFarbe = dunkel ? '#FFF' : '#000';
  const subtextFarbe = dunkel ? '#8E8E93' : '#6C6C70';
  const kartenHg = dunkel ? '#1C1C1E' : '#FFF';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: hg }]}
      contentContainerStyle={styles.inhalt}
      refreshControl={<RefreshControl refreshing={laden} onRefresh={neu} />}
    >
      {/* Statistik-Karten */}
      <View style={styles.statsReihe}>
        <View style={[styles.statKarte, { backgroundColor: kartenHg }]}>
          <Text style={[styles.statZahl, { color: '#5B8DEF' }]}>{heutigeEintraege.length}</Text>
          <Text style={[styles.statLabel, { color: subtextFarbe }]}>Heute</Text>
        </View>
        <View style={[styles.statKarte, { backgroundColor: kartenHg }]}>
          <Text style={[styles.statZahl, { color: '#5B8DEF' }]}>{wochenEintraege.length}</Text>
          <Text style={[styles.statLabel, { color: subtextFarbe }]}>Letzte 7 Tage</Text>
        </View>
      </View>

      {/* Schnell-Erfassen-Button */}
      <TouchableOpacity
        style={styles.erfassenButton}
        onPress={() => router.push('/symptom-erfassen')}
        activeOpacity={0.85}
      >
        <Text style={styles.erfassenButtonText}>+ Symptom erfassen</Text>
      </TouchableOpacity>

      {/* Heutige Einträge */}
      <Text style={[styles.sektionTitel, { color: textFarbe }]}>Heute</Text>
      {heutigeEintraege.length === 0 ? (
        <View style={[styles.leerKarte, { backgroundColor: kartenHg }]}>
          <Text style={[styles.leerText, { color: subtextFarbe }]}>
            Noch keine Einträge heute. Wie fühlst du dich?
          </Text>
        </View>
      ) : (
        heutigeEintraege.map((e) => (
          <EintragKarte
            key={e.id}
            eintrag={e}
            onPress={() => router.push(`/symptom-bearbeiten/${e.id}`)}
          />
        ))
      )}

      {/* Letzte 7 Tage */}
      {wochenEintraege.filter(
        (e) => new Date(e.datum).toDateString() !== new Date().toDateString()
      ).length > 0 && (
        <>
          <Text style={[styles.sektionTitel, { color: textFarbe }]}>Letzte 7 Tage</Text>
          {wochenEintraege
            .filter((e) => new Date(e.datum).toDateString() !== new Date().toDateString())
            .slice(0, 5)
            .map((e) => (
              <EintragKarte
                key={e.id}
                eintrag={e}
                onPress={() => router.push(`/symptom-bearbeiten/${e.id}`)}
              />
            ))}
        </>
      )}

      {eintraege.length === 0 && !laden && (
        <LeerZustand
          emoji="💊"
          titel="Willkommen bei FredoCare"
          beschreibung="Erfasse deine Symptome mit wenigen Taps und behalte den Überblick über deine Gesundheit."
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inhalt: { paddingVertical: 16, gap: 8 },
  statsReihe: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 4 },
  statKarte: {
    flex: 1, borderRadius: 12, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  statZahl: { fontSize: 32, fontWeight: '700' },
  statLabel: { fontSize: 13, marginTop: 2 },
  erfassenButton: {
    marginHorizontal: 16,
    backgroundColor: '#5B8DEF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  erfassenButtonText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
  sektionTitel: { fontSize: 20, fontWeight: '700', paddingHorizontal: 16, marginTop: 8 },
  leerKarte: {
    marginHorizontal: 16, borderRadius: 12, padding: 16,
  },
  leerText: { fontSize: 14, lineHeight: 20 },
});
