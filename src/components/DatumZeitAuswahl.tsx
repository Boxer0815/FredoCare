import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  wert: Date;
  onChange: (datum: Date) => void;
  dunkel: boolean;
  nurDatum?: boolean;
  maxDatum?: Date;
}

const MONATE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function tageImMonat(jahr: number, monat: number): number {
  return new Date(jahr, monat + 1, 0).getDate();
}

function formatDatum(d: Date): string {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatUhrzeit(d: Date): string {
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function Rad({ label, onMinus, onPlus, textFarbe }: {
  label: string; onMinus: () => void; onPlus: () => void; textFarbe: string;
}) {
  return (
    <View style={styles.rad}>
      <TouchableOpacity onPress={onPlus} style={styles.radBtn} hitSlop={8}>
        <Text style={styles.radPfeil}>▲</Text>
      </TouchableOpacity>
      <Text style={[styles.radLabel, { color: textFarbe }]}>{label}</Text>
      <TouchableOpacity onPress={onMinus} style={styles.radBtn} hitSlop={8}>
        <Text style={styles.radPfeil}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DatumZeitAuswahl({ wert, onChange, dunkel, nurDatum = false, maxDatum }: Props) {
  const [datumOffen, setDatumOffen] = useState(false);
  const [zeitOffen, setZeitOffen] = useState(false);

  const textFarbe = dunkel ? '#FFF' : '#000';
  const chipHg = dunkel ? '#2C2C2E' : '#F2F2F7';
  const kartenHg = dunkel ? '#1C1C1E' : '#FFF';

  const tag = wert.getDate();
  const monat = wert.getMonth();
  const jahr = wert.getFullYear();
  const stunde = wert.getHours();
  const minute = wert.getMinutes();

  function aendern(updater: (d: Date) => void) {
    const neu = new Date(wert);
    updater(neu);
    if (maxDatum && neu > maxDatum) return;
    onChange(neu);
  }

  function schrittTag(delta: number) {
    aendern((d) => {
      const max = tageImMonat(d.getFullYear(), d.getMonth());
      let t = d.getDate() + delta;
      if (t < 1) t = max;
      if (t > max) t = 1;
      d.setDate(t);
    });
  }

  function schrittMonat(delta: number) {
    aendern((d) => {
      let m = d.getMonth() + delta;
      if (m < 0) m = 11;
      if (m > 11) m = 0;
      d.setMonth(m);
      const max = tageImMonat(d.getFullYear(), d.getMonth());
      if (d.getDate() > max) d.setDate(max);
    });
  }

  function schrittJahr(delta: number) {
    aendern((d) => d.setFullYear(d.getFullYear() + delta));
  }

  function schrittStunde(delta: number) {
    aendern((d) => {
      let h = d.getHours() + delta;
      if (h < 0) h = 23;
      if (h > 23) h = 0;
      d.setHours(h);
    });
  }

  function schrittMinute(delta: number) {
    aendern((d) => {
      let m = d.getMinutes() + delta;
      if (m < 0) m = 55;
      if (m > 59) m = 0;
      d.setMinutes(m);
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.anzeigeZeile}>
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: datumOffen ? '#5B8DEF' : chipHg }]}
          onPress={() => { setDatumOffen(!datumOffen); setZeitOffen(false); }}
        >
          <Text style={styles.chipIcon}>📅</Text>
          <Text style={[styles.chipText, { color: datumOffen ? '#FFF' : textFarbe }]}>
            {formatDatum(wert)}
          </Text>
        </TouchableOpacity>

        {!nurDatum && (
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: zeitOffen ? '#5B8DEF' : chipHg }]}
            onPress={() => { setZeitOffen(!zeitOffen); setDatumOffen(false); }}
          >
            <Text style={styles.chipIcon}>🕐</Text>
            <Text style={[styles.chipText, { color: zeitOffen ? '#FFF' : textFarbe }]}>
              {formatUhrzeit(wert)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {datumOffen && (
        <View style={[styles.picker, { backgroundColor: kartenHg }]}>
          <Rad label={String(tag).padStart(2, '0')} onMinus={() => schrittTag(-1)} onPlus={() => schrittTag(1)} textFarbe={textFarbe} />
          <Rad label={MONATE[monat]} onMinus={() => schrittMonat(-1)} onPlus={() => schrittMonat(1)} textFarbe={textFarbe} />
          <Rad label={String(jahr)} onMinus={() => schrittJahr(-1)} onPlus={() => schrittJahr(1)} textFarbe={textFarbe} />
        </View>
      )}

      {!nurDatum && zeitOffen && (
        <View style={[styles.picker, { backgroundColor: kartenHg }]}>
          <Rad label={String(stunde).padStart(2, '0')} onMinus={() => schrittStunde(-1)} onPlus={() => schrittStunde(1)} textFarbe={textFarbe} />
          <Text style={[styles.doppelpunkt, { color: textFarbe }]}>:</Text>
          <Rad label={String(minute).padStart(2, '0')} onMinus={() => schrittMinute(-5)} onPlus={() => schrittMinute(5)} textFarbe={textFarbe} />
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
  picker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly',
    borderRadius: 14, padding: 16, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  rad: { alignItems: 'center', gap: 6, minWidth: 60 },
  radBtn: { padding: 4 },
  radPfeil: { fontSize: 18, color: '#5B8DEF' },
  radLabel: { fontSize: 20, fontWeight: '600', minWidth: 60, textAlign: 'center' },
  doppelpunkt: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
});
