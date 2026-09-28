import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  useColorScheme, RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useArztbesuche } from '../../hooks/useArztbesuche';
import LeerZustand from '../../components/LeerZustand';
import type { Arztbesuch } from '../../types';

const FACHRICHTUNGEN: Record<string, string> = {
  'Allgemein': '👨‍⚕️',
  'Neurologie': '🧠',
  'HNO': '👂',
  'Kardiologie': '❤️',
  'Orthopädie': '🦴',
  'Augenheilkunde': '👁️',
  'Dermatologie': '🩹',
  'Psychiatrie': '💬',
  'Sonstige': '🏥',
};

function monatsGruppen(besuche: Arztbesuch[]): { monat: string; eintraege: Arztbesuch[] }[] {
  const gruppen = new Map<string, Arztbesuch[]>();
  for (const b of besuche) {
    const d = new Date(b.datum);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!gruppen.has(key)) gruppen.set(key, []);
    gruppen.get(key)!.push(b);
  }
  return Array.from(gruppen.entries()).map(([monat, eintraege]) => ({ monat, eintraege }));
}

function monatsTitel(key: string): string {
  const [jahr, monat] = key.split('-');
  const d = new Date(Number(jahr), Number(monat) - 1, 1);
  return d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

function BesuchKarte({
  besuch, onPress, dunkel,
}: { besuch: Arztbesuch; onPress: () => void; dunkel: boolean }) {
  const kartenHg = dunkel ? '#1C1C1E' : '#FFF';
  const textFarbe = dunkel ? '#FFF' : '#000';
  const subtextFarbe = dunkel ? '#8E8E93' : '#6C6C70';

  const datum = new Date(besuch.datum);
  const icon = FACHRICHTUNGEN[besuch.fachrichtung] ?? '🏥';

  return (
    <TouchableOpacity
      style={[styles.karte, { backgroundColor: kartenHg }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.karteZeile}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.karteInfo}>
          <Text style={[styles.arztname, { color: textFarbe }]}>{besuch.arztname}</Text>
          <Text style={[styles.fachrichtung, { color: '#5B8DEF' }]}>{besuch.fachrichtung}</Text>
          {besuch.grund ? (
            <Text style={[styles.grund, { color: subtextFarbe }]} numberOfLines={1}>
              {besuch.grund}
            </Text>
          ) : null}
        </View>
        <View style={styles.karteDatum}>
          <Text style={[styles.datumTag, { color: textFarbe }]}>
            {datum.getDate()}
          </Text>
          <Text style={[styles.datumMonat, { color: subtextFarbe }]}>
            {datum.toLocaleDateString('de-DE', { month: 'short' })}
          </Text>
        </View>
      </View>
      {besuch.befund ? (
        <View style={styles.befundZeile}>
          <Text style={[styles.befundLabel, { color: subtextFarbe }]}>Befund: </Text>
          <Text style={[styles.befundText, { color: textFarbe }]} numberOfLines={2}>
            {besuch.befund}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export default function ArztbesucheScreen() {
  const dunkel = useColorScheme() === 'dark';
  const { besuche, laden, neu } = useArztbesuche();

  useFocusEffect(useCallback(() => { neu(); }, [neu]));

  const hg = dunkel ? '#000' : '#F2F2F7';
  const textFarbe = dunkel ? '#FFF' : '#000';
  const gruppen = monatsGruppen(besuche);

  return (
    <View style={[styles.container, { backgroundColor: hg }]}>
      <ScrollView
        contentContainerStyle={styles.inhalt}
        refreshControl={<RefreshControl refreshing={laden} onRefresh={neu} />}
      >
        {besuche.length === 0 && !laden ? (
          <LeerZustand
            emoji="🏥"
            titel="Noch keine Arztbesuche"
            beschreibung="Dokumentiere deine Arztbesuche, Befunde und Diagnosen an einem Ort."
          />
        ) : (
          gruppen.map(({ monat, eintraege }) => (
            <View key={monat}>
              <Text style={[styles.monatsTitel, { color: textFarbe }]}>
                {monatsTitel(monat)}
              </Text>
              {eintraege.map((b) => (
                <BesuchKarte
                  key={b.id}
                  besuch={b}
                  dunkel={dunkel}
                  onPress={() => router.push(`/arztbesuch-bearbeiten/${b.id}`)}
                />
              ))}
            </View>
          ))
        )}
        <View style={{ height: 90 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/arztbesuch-erfassen')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+ Arztbesuch</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inhalt: { padding: 16, gap: 4, paddingBottom: 40 },
  monatsTitel: { fontSize: 20, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  karte: {
    borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  karteZeile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#EEF3FE', justifyContent: 'center', alignItems: 'center',
  },
  icon: { fontSize: 22 },
  karteInfo: { flex: 1 },
  arztname: { fontSize: 16, fontWeight: '600' },
  fachrichtung: { fontSize: 13, fontWeight: '500', marginTop: 1 },
  grund: { fontSize: 13, marginTop: 2 },
  karteDatum: { alignItems: 'center', minWidth: 36 },
  datumTag: { fontSize: 22, fontWeight: '700' },
  datumMonat: { fontSize: 12, textTransform: 'uppercase' },
  befundZeile: { flexDirection: 'row', marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA' },
  befundLabel: { fontSize: 13, fontWeight: '600' },
  befundText: { fontSize: 13, flex: 1 },
  fab: {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    backgroundColor: '#5B8DEF', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#5B8DEF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
});
