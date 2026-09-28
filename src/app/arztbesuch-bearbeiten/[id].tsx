import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, useColorScheme, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useArztbesuche } from '../../hooks/useArztbesuche';
import type { Arztbesuch } from '../../types';

const FACHRICHTUNGEN = [
  'Allgemein', 'Neurologie', 'HNO', 'Kardiologie',
  'Orthopädie', 'Augenheilkunde', 'Dermatologie', 'Psychiatrie', 'Sonstige',
];

export default function ArztbesuchBearbeitenScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dunkel = useColorScheme() === 'dark';
  const { besuche, aktualisieren, loeschen } = useArztbesuche();

  const [besuch, setBesuch] = useState<Arztbesuch | null>(null);
  const [arztname, setArztname] = useState('');
  const [fachrichtung, setFachrichtung] = useState('Allgemein');
  const [datum, setDatum] = useState('');
  const [grund, setGrund] = useState('');
  const [befund, setBefund] = useState('');
  const [notiz, setNotiz] = useState('');
  const [optionalOffen, setOptionalOffen] = useState(false);

  useEffect(() => {
    const gefunden = besuche.find((b) => b.id === Number(id));
    if (gefunden) {
      setBesuch(gefunden);
      setArztname(gefunden.arztname);
      setFachrichtung(gefunden.fachrichtung);
      setDatum(gefunden.datum.slice(0, 10));
      setGrund(gefunden.grund ?? '');
      setBefund(gefunden.befund ?? '');
      setNotiz(gefunden.notiz ?? '');
      if (gefunden.grund || gefunden.befund || gefunden.notiz) setOptionalOffen(true);
    }
  }, [besuche, id]);

  const hg = dunkel ? '#000' : '#F2F2F7';
  const textFarbe = dunkel ? '#FFF' : '#000';
  const kartenHg = dunkel ? '#1C1C1E' : '#FFF';
  const eingabeHg = dunkel ? '#2C2C2E' : '#F2F2F7';

  if (!besuch) {
    return (
      <View style={[styles.container, { backgroundColor: hg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator />
      </View>
    );
  }

  async function speichern() {
    if (!arztname.trim()) return;
    await aktualisieren(Number(id), {
      arztname: arztname.trim(),
      fachrichtung,
      datum,
      grund: grund.trim() || null,
      befund: befund.trim() || null,
      notiz: notiz.trim() || null,
    });
    router.back();
  }

  function handleLoeschen() {
    Alert.alert(
      'Arztbesuch löschen',
      'Diesen Eintrag wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen', style: 'destructive',
          onPress: async () => { await loeschen(Number(id)); router.back(); },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: hg }]}
      contentContainerStyle={styles.inhalt}
      keyboardShouldPersistTaps="handled"
    >
      {/* Datum */}
      <Text style={[styles.label, { color: textFarbe }]}>Datum</Text>
      <View style={[styles.karte, { backgroundColor: kartenHg }]}>
        <TextInput
          style={[styles.eingabe, { backgroundColor: eingabeHg, color: textFarbe }]}
          value={datum}
          onChangeText={setDatum}
          placeholder="JJJJ-MM-TT"
          placeholderTextColor="#8E8E93"
          keyboardType="numbers-and-punctuation"
        />
        <TouchableOpacity onPress={() => setDatum(new Date().toISOString().slice(0, 10))}>
          <Text style={{ color: '#5B8DEF', fontSize: 13, marginTop: 6 }}>Heute verwenden</Text>
        </TouchableOpacity>
      </View>

      {/* Arztname */}
      <Text style={[styles.label, { color: textFarbe }]}>Arzt / Praxis</Text>
      <TextInput
        style={[styles.eingabeFreistehend, { backgroundColor: kartenHg, color: textFarbe }]}
        placeholder="z.B. Dr. Müller"
        placeholderTextColor="#8E8E93"
        value={arztname}
        onChangeText={setArztname}
      />

      {/* Fachrichtung */}
      <Text style={[styles.label, { color: textFarbe }]}>Fachrichtung</Text>
      <View style={styles.chipReihe}>
        {FACHRICHTUNGEN.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.chip,
              { backgroundColor: fachrichtung === f ? '#5B8DEF' : kartenHg },
            ]}
            onPress={() => setFachrichtung(f)}
          >
            <Text style={[styles.chipText, { color: fachrichtung === f ? '#FFF' : textFarbe }]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Optionale Felder */}
      <TouchableOpacity
        style={styles.optionalToggle}
        onPress={() => setOptionalOffen(!optionalOffen)}
      >
        <Text style={{ color: '#5B8DEF', fontSize: 15 }}>
          {optionalOffen ? '▾' : '▸'} Weitere Details (optional)
        </Text>
      </TouchableOpacity>

      {optionalOffen && (
        <View style={[styles.karte, { backgroundColor: kartenHg }]}>
          <Text style={[styles.subLabel, { color: textFarbe }]}>Grund des Besuchs</Text>
          <TextInput
            style={[styles.eingabe, { backgroundColor: eingabeHg, color: textFarbe }]}
            placeholder="z.B. Kopfschmerzen, Vorsorge"
            placeholderTextColor="#8E8E93"
            value={grund}
            onChangeText={setGrund}
          />
          <Text style={[styles.subLabel, { color: textFarbe }]}>Befund / Diagnose</Text>
          <TextInput
            style={[styles.eingabe, styles.eingabeMultiline, { backgroundColor: eingabeHg, color: textFarbe }]}
            placeholder="z.B. Spannungskopfschmerz, Medikament X verschrieben"
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={3}
            value={befund}
            onChangeText={setBefund}
          />
          <Text style={[styles.subLabel, { color: textFarbe }]}>Notiz</Text>
          <TextInput
            style={[styles.eingabe, styles.eingabeMultiline, { backgroundColor: eingabeHg, color: textFarbe }]}
            placeholder="Weitere Notizen..."
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={3}
            value={notiz}
            onChangeText={setNotiz}
          />
        </View>
      )}

      <TouchableOpacity style={styles.speichernButton} onPress={speichern}>
        <Text style={styles.speichernButtonText}>Änderungen speichern</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loeschenButton} onPress={handleLoeschen}>
        <Text style={styles.loeschenButtonText}>Arztbesuch löschen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inhalt: { padding: 16, gap: 8, paddingBottom: 40 },
  label: { fontSize: 17, fontWeight: '600', marginTop: 8 },
  subLabel: { fontSize: 14, fontWeight: '500', marginBottom: 6, marginTop: 12 },
  karte: {
    borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  eingabe: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
  },
  eingabeFreistehend: {
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  eingabeMultiline: { minHeight: 80, textAlignVertical: 'top' },
  chipReihe: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 3, elevation: 1,
  },
  chipText: { fontSize: 14, fontWeight: '500' },
  optionalToggle: { paddingVertical: 8 },
  speichernButton: {
    backgroundColor: '#5B8DEF', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  speichernButtonText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
  loeschenButton: {
    backgroundColor: '#FF3B30', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
  },
  loeschenButtonText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
});
