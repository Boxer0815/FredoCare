import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface Props {
  wert: Date;
  onChange: (datum: Date) => void;
  dunkel: boolean;
  nurDatum?: boolean; // true = kein Uhrzeit-Picker (z.B. für Arztbesuche & Profil)
  maxDatum?: Date;
}

function formatDatum(d: Date): string {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatUhrzeit(d: Date): string {
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function DatumZeitAuswahl({ wert, onChange, dunkel, nurDatum = false, maxDatum }: Props) {
  const [kalenderOffen, setKalenderOffen] = useState(false);
  const [uhrzeitOffen, setUhrzeitOffen] = useState(false);

  const textFarbe = dunkel ? '#FFF' : '#000';
  const kartenHg = dunkel ? '#1C1C1E' : '#FFF';
  const chipHg = dunkel ? '#2C2C2E' : '#F2F2F7';

  function handleDatumChange(_: DateTimePickerEvent, selected?: Date) {
    if (!selected) return;
    // Uhrzeit aus aktuellem Wert beibehalten
    const neu = new Date(selected);
    neu.setHours(wert.getHours(), wert.getMinutes(), 0, 0);
    onChange(neu);
    setKalenderOffen(false);
    if (!nurDatum) setUhrzeitOffen(true);
  }

  function handleUhrzeitChange(_: DateTimePickerEvent, selected?: Date) {
    if (!selected) return;
    const neu = new Date(wert);
    neu.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    onChange(neu);
  }

  return (
    <View style={styles.container}>
      {/* Anzeige-Zeile */}
      <View style={styles.anzeigeZeile}>
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: kalenderOffen ? '#5B8DEF' : chipHg }]}
          onPress={() => { setKalenderOffen(!kalenderOffen); setUhrzeitOffen(false); }}
        >
          <Text style={styles.chipIcon}>📅</Text>
          <Text style={[styles.chipText, { color: kalenderOffen ? '#FFF' : textFarbe }]}>
            {formatDatum(wert)}
          </Text>
        </TouchableOpacity>

        {!nurDatum && (
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: uhrzeitOffen ? '#5B8DEF' : chipHg }]}
            onPress={() => { setUhrzeitOffen(!uhrzeitOffen); setKalenderOffen(false); }}
          >
            <Text style={styles.chipIcon}>🕐</Text>
            <Text style={[styles.chipText, { color: uhrzeitOffen ? '#FFF' : textFarbe }]}>
              {formatUhrzeit(wert)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Kalender */}
      {kalenderOffen && (
        <View style={[styles.pickerContainer, { backgroundColor: kartenHg }]}>
          <DateTimePicker
            value={wert}
            mode="date"
            display="inline"
            onChange={handleDatumChange}
            maximumDate={maxDatum ?? new Date()}
            locale="de-DE"
            themeVariant={dunkel ? 'dark' : 'light'}
            accentColor="#5B8DEF"
          />
        </View>
      )}

      {/* Uhrzeit-Spinner */}
      {!nurDatum && uhrzeitOffen && (
        <View style={[styles.pickerContainer, { backgroundColor: kartenHg }]}>
          <DateTimePicker
            value={wert}
            mode="time"
            display="spinner"
            onChange={handleUhrzeitChange}
            locale="de-DE"
            themeVariant={dunkel ? 'dark' : 'light'}
            is24Hour
          />
          <TouchableOpacity
            style={styles.fertigButton}
            onPress={() => setUhrzeitOffen(false)}
          >
            <Text style={styles.fertigText}>Fertig</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  anzeigeZeile: { flexDirection: 'row', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 1,
  },
  chipIcon: { fontSize: 16 },
  chipText: { fontSize: 15, fontWeight: '500' },
  pickerContainer: {
    borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  fertigButton: {
    alignItems: 'flex-end', paddingHorizontal: 20, paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA',
  },
  fertigText: { color: '#5B8DEF', fontSize: 16, fontWeight: '600' },
});
