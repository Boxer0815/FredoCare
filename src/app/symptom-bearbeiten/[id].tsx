import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, useColorScheme, Platform, Alert, ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useEintraege, useSymptomTypen } from '../../hooks/useSymptome';
import IntensitaetsBadge from '../../components/IntensitaetsBadge';
import type { SymptomEintrag } from '../../types';

export default function SymptomBearbeitenScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dunkel = useColorScheme() === 'dark';
  const { eintraege, aktualisieren, loeschen } = useEintraege();
  const { typen } = useSymptomTypen();

  const [eintrag, setEintrag] = useState<SymptomEintrag | null>(null);
  const [gewaehlterId, setGewaehlterId] = useState<number | null>(null);
  const [intensitaet, setIntensitaet] = useState(5);
  const [datum, setDatum] = useState('');
  const [dauer, setDauer] = useState('');
  const [ausloser, setAusloser] = useState('');
  const [notiz, setNotiz] = useState('');
  const [optionalOffen, setOptionalOffen] = useState(false);

  useEffect(() => {
    const gefunden = eintraege.find((e) => e.id === Number(id));
    if (gefunden) {
      setEintrag(gefunden);
      setGewaehlterId(gefunden.symptomTypId);
      setIntensitaet(gefunden.intensitaet);
      setDatum(gefunden.datum);
      setDauer(gefunden.dauer ? String(gefunden.dauer) : '');
      setAusloser(gefunden.ausloser ?? '');
      setNotiz(gefunden.notiz ?? '');
      if (gefunden.dauer || gefunden.ausloser || gefunden.notiz) setOptionalOffen(true);
    }
  }, [eintraege, id]);

  const hg = dunkel ? '#000' : '#F2F2F7';
  const textFarbe = dunkel ? '#FFF' : '#000';
  const kartenHg = dunkel ? '#1C1C1E' : '#FFF';
  const eingabeHg = dunkel ? '#2C2C2E' : '#F2F2F7';

  if (!eintrag) {
    return (
      <View style={[styles.container, { backgroundColor: hg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator />
      </View>
    );
  }

  async function speichern() {
    if (!gewaehlterId) return;
    await aktualisieren(Number(id), {
      symptomTypId: gewaehlterId,
      datum,
      intensitaet,
      dauer: dauer ? parseInt(dauer, 10) : null,
      ausloser: ausloser.trim() || null,
      notiz: notiz.trim() || null,
    });
    router.back();
  }

  function handleLoeschen() {
    Alert.alert(
      'Eintrag löschen',
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
      {/* Symptomtyp */}
      <Text style={[styles.label, { color: textFarbe }]}>Symptom</Text>
      <View style={styles.typenGrid}>
        {typen.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.typChip,
              { backgroundColor: gewaehlterId === t.id ? t.farbe : kartenHg },
            ]}
            onPress={() => setGewaehlterId(t.id)}
          >
            <Text style={styles.typIcon}>{t.icon}</Text>
            <Text style={[styles.typName, { color: gewaehlterId === t.id ? '#FFF' : textFarbe }]}>
              {t.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Intensität */}
      <Text style={[styles.label, { color: textFarbe }]}>
        Intensität <IntensitaetsBadge wert={intensitaet} />
      </Text>
      <View style={[styles.karte, { backgroundColor: kartenHg }]}>
        <Slider
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={intensitaet}
          onValueChange={setIntensitaet}
          minimumTrackTintColor="#5B8DEF"
          maximumTrackTintColor="#E5E5EA"
          thumbTintColor="#5B8DEF"
        />
        <View style={styles.sliderLabels}>
          <Text style={{ color: '#34C759', fontSize: 12 }}>Schwach (1)</Text>
          <Text style={{ color: '#FF3B30', fontSize: 12 }}>Stark (10)</Text>
        </View>
      </View>

      {/* Datum */}
      <Text style={[styles.label, { color: textFarbe }]}>Zeitpunkt</Text>
      <View style={[styles.karte, { backgroundColor: kartenHg }]}>
        <TextInput
          style={[styles.eingabe, { backgroundColor: eingabeHg, color: textFarbe }]}
          value={datum}
          onChangeText={setDatum}
          placeholder="ISO-Datum"
          placeholderTextColor="#8E8E93"
        />
        <TouchableOpacity onPress={() => setDatum(new Date().toISOString())}>
          <Text style={{ color: '#5B8DEF', fontSize: 13, marginTop: 6 }}>Jetzt verwenden</Text>
        </TouchableOpacity>
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
          <Text style={[styles.subLabel, { color: textFarbe }]}>Dauer (Minuten)</Text>
          <TextInput
            style={[styles.eingabe, { backgroundColor: eingabeHg, color: textFarbe }]}
            keyboardType="number-pad"
            placeholder="z.B. 30"
            placeholderTextColor="#8E8E93"
            value={dauer}
            onChangeText={setDauer}
          />
          <Text style={[styles.subLabel, { color: textFarbe }]}>Auslöser</Text>
          <TextInput
            style={[styles.eingabe, { backgroundColor: eingabeHg, color: textFarbe }]}
            placeholder="z.B. Stress"
            placeholderTextColor="#8E8E93"
            value={ausloser}
            onChangeText={setAusloser}
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
        <Text style={styles.loeschenButtonText}>Eintrag löschen</Text>
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
  typenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 1,
  },
  typIcon: { fontSize: 18 },
  typName: { fontSize: 14, fontWeight: '500' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  optionalToggle: { paddingVertical: 8 },
  eingabe: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
  },
  eingabeMultiline: { minHeight: 80, textAlignVertical: 'top' },
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
