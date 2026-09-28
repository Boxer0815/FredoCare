import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, useColorScheme, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useProfil } from '../hooks/useProfil';
import DatumZeitAuswahl from '../components/DatumZeitAuswahl';
import { gesundheitsdatenAlsPdfTeilen } from '../utils/pdfExport';
import type { Geschlecht } from '../types';

const GESCHLECHTER: Geschlecht[] = ['weiblich', 'männlich', 'divers', 'keine Angabe'];

function alter(geburtsdatum: string | null): number | null {
  if (!geburtsdatum) return null;
  const heute = new Date();
  const geb = new Date(geburtsdatum);
  let a = heute.getFullYear() - geb.getFullYear();
  const m = heute.getMonth() - geb.getMonth();
  if (m < 0 || (m === 0 && heute.getDate() < geb.getDate())) a--;
  return a;
}

function bmi(groesse: number | null, gewicht: number | null): string | null {
  if (!groesse || !gewicht || groesse <= 0) return null;
  const wert = gewicht / Math.pow(groesse / 100, 2);
  return wert.toFixed(1);
}

function bmiKategorie(wert: string | null): string {
  if (!wert) return '';
  const n = parseFloat(wert);
  if (n < 18.5) return 'Untergewicht';
  if (n < 25) return 'Normalgewicht';
  if (n < 30) return 'Übergewicht';
  return 'Adipositas';
}

export default function ProfilScreen() {
  const dunkel = useColorScheme() === 'dark';
  const { profil, laden, speichern } = useProfil();

  const [vorname, setVorname] = useState('');
  const [nachname, setNachname] = useState('');
  const [geburtsdatum, setGeburtsdatum] = useState<Date | null>(null);
  const [geschlecht, setGeschlecht] = useState<Geschlecht | null>(null);
  const [groesse, setGroesse] = useState('');
  const [gewicht, setGewicht] = useState('');
  const [exportLaeuft, setExportLaeuft] = useState(false);

  useEffect(() => {
    if (!laden) {
      setVorname(profil.vorname);
      setNachname(profil.nachname);
      setGeburtsdatum(profil.geburtsdatum ? new Date(profil.geburtsdatum) : null);
      setGeschlecht(profil.geschlecht);
      setGroesse(profil.groesse ? String(profil.groesse) : '');
      setGewicht(profil.gewicht ? String(profil.gewicht) : '');
    }
  }, [laden, profil]);

  const hg = dunkel ? '#000' : '#F2F2F7';
  const textFarbe = dunkel ? '#FFF' : '#000';
  const subtextFarbe = dunkel ? '#8E8E93' : '#6C6C70';
  const kartenHg = dunkel ? '#1C1C1E' : '#FFF';
  const eingabeHg = dunkel ? '#2C2C2E' : '#F2F2F7';
  const chipHg = dunkel ? '#2C2C2E' : '#F2F2F7';

  const groesseNum = groesse ? parseInt(groesse, 10) : null;
  const gewichtNum = gewicht ? parseFloat(gewicht.replace(',', '.')) : null;
  const alterWert = alter(geburtsdatum ? geburtsdatum.toISOString().slice(0, 10) : null);
  const bmiWert = bmi(groesseNum, gewichtNum);

  function validieren(): string | null {
    if (groesseNum !== null && (groesseNum < 50 || groesseNum > 250)) return 'Bitte eine plausible Größe eingeben (50–250 cm).';
    if (gewichtNum !== null && (gewichtNum < 2 || gewichtNum > 500)) return 'Bitte ein plausibles Gewicht eingeben (2–500 kg).';
    if (alterWert !== null && (alterWert < 0 || alterWert > 130)) return 'Bitte ein plausibles Geburtsdatum eingeben.';
    return null;
  }

  async function handleExport() {
    setExportLaeuft(true);
    try {
      await gesundheitsdatenAlsPdfTeilen();
    } catch {
      Alert.alert('Export fehlgeschlagen', 'Das PDF konnte nicht erstellt werden.');
    } finally {
      setExportLaeuft(false);
    }
  }

  async function handleSpeichern() {
    const fehler = validieren();
    if (fehler) { Alert.alert('Ungültige Eingabe', fehler); return; }
    await speichern({
      vorname: vorname.trim(),
      nachname: nachname.trim(),
      geburtsdatum: geburtsdatum ? geburtsdatum.toISOString().slice(0, 10) : null,
      geschlecht,
      groesse: groesseNum,
      gewicht: gewichtNum,
    });
    router.back();
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: hg }]}
      contentContainerStyle={styles.inhalt}
      keyboardShouldPersistTaps="handled"
    >
      {/* Name */}
      <Text style={[styles.label, { color: textFarbe }]}>Name</Text>
      <View style={[styles.karte, { backgroundColor: kartenHg }]}>
        <TextInput
          style={[styles.eingabe, { backgroundColor: eingabeHg, color: textFarbe }]}
          placeholder="Vorname"
          placeholderTextColor="#8E8E93"
          value={vorname}
          onChangeText={setVorname}
        />
        <TextInput
          style={[styles.eingabe, { backgroundColor: eingabeHg, color: textFarbe, marginTop: 8 }]}
          placeholder="Nachname"
          placeholderTextColor="#8E8E93"
          value={nachname}
          onChangeText={setNachname}
        />
      </View>

      {/* Geburtsdatum */}
      <Text style={[styles.label, { color: textFarbe }]}>Geburtsdatum</Text>
      <DatumZeitAuswahl
        wert={geburtsdatum ?? new Date(new Date().getFullYear() - 30, 0, 1)}
        onChange={(d) => setGeburtsdatum(d)}
        dunkel={dunkel}
        nurDatum
        maxDatum={new Date()}
      />
      {geburtsdatum && (
        <View style={styles.berechnungZeile}>
          <Text style={[styles.berechnungText, { color: subtextFarbe }]}>
            Alter: <Text style={{ color: textFarbe, fontWeight: '600' }}>{alterWert} Jahre</Text>
          </Text>
          <TouchableOpacity onPress={() => setGeburtsdatum(null)}>
            <Text style={{ color: '#FF3B30', fontSize: 13 }}>Entfernen</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Geschlecht */}
      <Text style={[styles.label, { color: textFarbe }]}>Geschlecht</Text>
      <View style={styles.chipReihe}>
        {GESCHLECHTER.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.chip, { backgroundColor: geschlecht === g ? '#5B8DEF' : chipHg }]}
            onPress={() => setGeschlecht(geschlecht === g ? null : g)}
          >
            <Text style={[styles.chipText, { color: geschlecht === g ? '#FFF' : textFarbe }]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Größe & Gewicht */}
      <Text style={[styles.label, { color: textFarbe }]}>Körpermaße</Text>
      <View style={[styles.karte, { backgroundColor: kartenHg }]}>
        <View style={styles.massReihe}>
          <View style={styles.massEingabe}>
            <Text style={[styles.subLabel, { color: subtextFarbe }]}>Größe (cm)</Text>
            <TextInput
              style={[styles.eingabe, { backgroundColor: eingabeHg, color: textFarbe }]}
              placeholder="z.B. 170"
              placeholderTextColor="#8E8E93"
              keyboardType="number-pad"
              value={groesse}
              onChangeText={setGroesse}
            />
          </View>
          <View style={styles.massEingabe}>
            <Text style={[styles.subLabel, { color: subtextFarbe }]}>Gewicht (kg)</Text>
            <TextInput
              style={[styles.eingabe, { backgroundColor: eingabeHg, color: textFarbe }]}
              placeholder="z.B. 70"
              placeholderTextColor="#8E8E93"
              keyboardType="decimal-pad"
              value={gewicht}
              onChangeText={setGewicht}
            />
          </View>
        </View>
        {bmiWert && (
          <View style={[styles.bmiContainer, { backgroundColor: eingabeHg }]}>
            <Text style={[styles.bmiLabel, { color: subtextFarbe }]}>BMI</Text>
            <Text style={[styles.bmiWert, { color: '#5B8DEF' }]}>{bmiWert}</Text>
            <Text style={[styles.bmiKat, { color: subtextFarbe }]}>{bmiKategorie(bmiWert)}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.speichernButton} onPress={handleSpeichern}>
        <Text style={styles.speichernButtonText}>Profil speichern</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.exportButton, exportLaeuft && styles.exportButtonDisabled]}
        onPress={handleExport}
        disabled={exportLaeuft}
      >
        {exportLaeuft ? (
          <ActivityIndicator color="#5B8DEF" size="small" />
        ) : (
          <Text style={styles.exportButtonText}>PDF exportieren &amp; teilen</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inhalt: { padding: 16, gap: 8, paddingBottom: 40 },
  label: { fontSize: 17, fontWeight: '600', marginTop: 8 },
  subLabel: { fontSize: 13, marginBottom: 6 },
  karte: {
    borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  eingabe: {
    borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8, fontSize: 15,
  },
  chipReihe: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  chipText: { fontSize: 14, fontWeight: '500' },
  massReihe: { flexDirection: 'row', gap: 12 },
  massEingabe: { flex: 1 },
  bmiContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 10, padding: 12, marginTop: 12,
  },
  bmiLabel: { fontSize: 13, fontWeight: '600', flex: 0 },
  bmiWert: { fontSize: 22, fontWeight: '700' },
  bmiKat: { fontSize: 13 },
  berechnungZeile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 },
  berechnungText: { fontSize: 14 },
  speichernButton: {
    backgroundColor: '#5B8DEF', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  speichernButtonText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
  exportButton: {
    borderWidth: 2, borderColor: '#5B8DEF', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 8,
  },
  exportButtonDisabled: { opacity: 0.5 },
  exportButtonText: { color: '#5B8DEF', fontSize: 17, fontWeight: '600' },
});
