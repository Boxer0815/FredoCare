import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, useColorScheme, Platform, Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { useState } from 'react';
import { useEintraege, useSymptomTypen } from '../hooks/useSymptome';
import IntensitaetsBadge from '../components/IntensitaetsBadge';
import DatumZeitAuswahl from '../components/DatumZeitAuswahl';

export default function SymptomErfassenScreen() {
  const dunkel = useColorScheme() === 'dark';
  const { hinzufuegen } = useEintraege();
  const { typen, anlegen: typAnlegen } = useSymptomTypen();

  const [gewaehlterId, setGewaehlterId] = useState<number | null>(null);
  const [intensitaet, setIntensitaet] = useState(5);
  const [datum, setDatum] = useState(new Date());
  const [optionalOffen, setOptionalOffen] = useState(false);
  const [dauer, setDauer] = useState('');
  const [ausloser, setAusloser] = useState('');
  const [notiz, setNotiz] = useState('');

  // Eigenen Typ anlegen
  const [neuerTypName, setNeuerTypName] = useState('');
  const [neuerTypOffen, setNeuerTypOffen] = useState(false);
  const FARBEN = ['#5B8DEF', '#EF5B5B', '#5BEF8D', '#EFC75B', '#B05BEF', '#EF8F5B'];
  const ICONS = ['😴', '🤧', '🦷', '👂', '🦵', '❤️', '🫁', '🧠'];
  const [neuerTypFarbe, setNeuerTypFarbe] = useState(FARBEN[0]);
  const [neuerTypIcon, setNeuerTypIcon] = useState(ICONS[0]);

  const hg = dunkel ? '#000' : '#F2F2F7';
  const textFarbe = dunkel ? '#FFF' : '#000';
  const kartenHg = dunkel ? '#1C1C1E' : '#FFF';
  const eingabeHg = dunkel ? '#2C2C2E' : '#F2F2F7';

  async function speichern() {
    if (!gewaehlterId) {
      Alert.alert('Kein Symptom gewählt', 'Bitte wähle ein Symptom aus.');
      return;
    }
    await hinzufuegen({
      symptomTypId: gewaehlterId,
      datum: datum.toISOString(),
      intensitaet,
      dauer: dauer ? parseInt(dauer, 10) : null,
      ausloser: ausloser.trim() || null,
      notiz: notiz.trim() || null,
    });
    router.back();
  }

  async function neuerTypSpeichern() {
    if (!neuerTypName.trim()) return;
    const typ = await typAnlegen(neuerTypName.trim(), neuerTypIcon, neuerTypFarbe);
    setGewaehlterId(typ.id);
    setNeuerTypOffen(false);
    setNeuerTypName('');
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: hg }]}
      contentContainerStyle={styles.inhalt}
      keyboardShouldPersistTaps="handled"
    >
      {/* Symptomtyp wählen */}
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
            <Text style={[
              styles.typName,
              { color: gewaehlterId === t.id ? '#FFF' : textFarbe },
            ]}>
              {t.name}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.typChip, { backgroundColor: kartenHg, borderStyle: 'dashed', borderWidth: 1, borderColor: '#8E8E93' }]}
          onPress={() => setNeuerTypOffen(!neuerTypOffen)}
        >
          <Text style={styles.typIcon}>➕</Text>
          <Text style={[styles.typName, { color: textFarbe }]}>Eigenes</Text>
        </TouchableOpacity>
      </View>

      {/* Eigener Typ */}
      {neuerTypOffen && (
        <View style={[styles.karte, { backgroundColor: kartenHg }]}>
          <Text style={[styles.label, { color: textFarbe }]}>Neues Symptom</Text>
          <TextInput
            style={[styles.eingabe, { backgroundColor: eingabeHg, color: textFarbe }]}
            placeholder="Name"
            placeholderTextColor="#8E8E93"
            value={neuerTypName}
            onChangeText={setNeuerTypName}
          />
          <Text style={[styles.subLabel, { color: textFarbe }]}>Icon</Text>
          <View style={styles.iconReihe}>
            {ICONS.map((ic) => (
              <TouchableOpacity
                key={ic}
                style={[styles.iconChip, neuerTypIcon === ic && styles.iconChipAktiv]}
                onPress={() => setNeuerTypIcon(ic)}
              >
                <Text style={{ fontSize: 20 }}>{ic}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.subLabel, { color: textFarbe }]}>Farbe</Text>
          <View style={styles.iconReihe}>
            {FARBEN.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.farbChip, { backgroundColor: f }, neuerTypFarbe === f && styles.farbChipAktiv]}
                onPress={() => setNeuerTypFarbe(f)}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.speichernKlein} onPress={neuerTypSpeichern}>
            <Text style={styles.speichernKleinText}>Anlegen</Text>
          </TouchableOpacity>
        </View>
      )}

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

      {/* Datum/Zeit */}
      <Text style={[styles.label, { color: textFarbe }]}>Zeitpunkt</Text>
      <DatumZeitAuswahl wert={datum} onChange={setDatum} dunkel={dunkel} />

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
            placeholder="z.B. Stress, schlechter Schlaf"
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

      {/* Speichern */}
      <TouchableOpacity
        style={[styles.speichernButton, !gewaehlterId && styles.speichernButtonDisabled]}
        onPress={speichern}
        disabled={!gewaehlterId}
      >
        <Text style={styles.speichernButtonText}>Speichern</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inhalt: { padding: 16, gap: 8, paddingBottom: 40 },
  label: { fontSize: 17, fontWeight: '600', marginTop: 8, flexDirection: 'row', alignItems: 'center' },
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
  iconReihe: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  iconChip: {
    width: 40, height: 40, borderRadius: 8, justifyContent: 'center',
    alignItems: 'center', backgroundColor: '#E5E5EA',
  },
  iconChipAktiv: { backgroundColor: '#5B8DEF' },
  farbChip: { width: 32, height: 32, borderRadius: 16 },
  farbChipAktiv: { borderWidth: 3, borderColor: '#FFF' },
  speichernKlein: {
    backgroundColor: '#5B8DEF', borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 12,
  },
  speichernKleinText: { color: '#FFF', fontWeight: '600' },
  speichernButton: {
    backgroundColor: '#5B8DEF', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  speichernButtonDisabled: { backgroundColor: '#B0C8F8' },
  speichernButtonText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
});
