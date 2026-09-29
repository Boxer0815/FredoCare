import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
  Alert, useColorScheme, RefreshControl, ScrollView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, useMemo } from 'react';
import { useEintraege, useSymptomTypen } from '../../hooks/useSymptome';
import EintragKarte from '../../components/EintragKarte';
import LeerZustand from '../../components/LeerZustand';
import type { SymptomEintrag } from '../../types';

interface Sektion {
  title: string;
  data: SymptomEintrag[];
}

function gruppiereNachTag(eintraege: SymptomEintrag[]): Sektion[] {
  const map = new Map<string, SymptomEintrag[]>();
  for (const e of eintraege) {
    const tag = new Date(e.datum).toLocaleDateString('de-DE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const heute = new Date().toLocaleDateString('de-DE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const label = tag === heute ? 'Heute' : tag;
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(e);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export default function SymptomeScreen() {
  const dunkel = useColorScheme() === 'dark';
  const { eintraege, laden, loeschen, neu } = useEintraege();
  const { typen } = useSymptomTypen();
  const [filterTypId, setFilterTypId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { neu(); }, [neu]));

  const gefilterteEintraege = useMemo(() =>
    filterTypId ? eintraege.filter((e) => e.symptomTypId === filterTypId) : eintraege,
    [eintraege, filterTypId]
  );

  const sektionen = useMemo(() => gruppiereNachTag(gefilterteEintraege), [gefilterteEintraege]);

  function handleLoeschen(id: string, name: string) {
    Alert.alert(
      'Eintrag löschen',
      `„${name}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: () => loeschen(id) },
      ]
    );
  }

  const hg = dunkel ? '#000' : '#F2F2F7';
  const subtextFarbe = dunkel ? '#8E8E93' : '#6C6C70';

  return (
    <View style={[styles.container, { backgroundColor: hg }]}>
      {/* Filter-Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterLeiste}
        contentContainerStyle={styles.filterInhalt}
      >
        <TouchableOpacity
          style={[styles.chip, filterTypId === null && styles.chipAktiv]}
          onPress={() => setFilterTypId(null)}
        >
          <Text style={[styles.chipText, filterTypId === null && styles.chipTextAktiv]}>
            Alle
          </Text>
        </TouchableOpacity>
        {typen.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.chip,
              filterTypId === t.id && { backgroundColor: t.farbe },
            ]}
            onPress={() => setFilterTypId(filterTypId === t.id ? null : t.id)}
          >
            <Text style={[styles.chipText, filterTypId === t.id && styles.chipTextAktiv]}>
              {t.icon} {t.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {gefilterteEintraege.length === 0 && !laden ? (
        <LeerZustand
          emoji="📋"
          titel="Keine Einträge"
          beschreibung={
            filterTypId
              ? 'Für diesen Symptomtyp gibt es noch keine Einträge.'
              : 'Tippe auf „+ Symptom erfassen" in der Übersicht, um loszulegen.'
          }
        />
      ) : (
        <SectionList
          sections={sektionen}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={laden} onRefresh={neu} />}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sektionHeader, { color: subtextFarbe }]}>{title}</Text>
          )}
          renderItem={({ item }) => (
            <View>
              <EintragKarte
                eintrag={item}
                onPress={() => router.push(`/symptom-bearbeiten/${item.id}`)}
              />
              <TouchableOpacity
                style={styles.loeschenButton}
                onPress={() => handleLoeschen(item.id, item.symptomTypName)}
              >
                <Text style={styles.loeschenText}>🗑 Löschen</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/symptom-erfassen')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterLeiste: { maxHeight: 52, flexGrow: 0 },
  filterInhalt: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#E5E5EA',
  },
  chipAktiv: { backgroundColor: '#5B8DEF' },
  chipText: { fontSize: 13, color: '#000' },
  chipTextAktiv: { color: '#FFF', fontWeight: '600' },
  sektionHeader: {
    fontSize: 13, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4,
  },
  loeschenButton: {
    marginHorizontal: 16, marginTop: 2, marginBottom: 4,
    alignSelf: 'flex-end',
  },
  loeschenText: { fontSize: 13, color: '#FF3B30' },
  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#5B8DEF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#5B8DEF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#FFF', fontSize: 28, lineHeight: 32 },
});
