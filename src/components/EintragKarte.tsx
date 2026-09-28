import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import type { SymptomEintrag } from '../types';
import IntensitaetsBadge from './IntensitaetsBadge';

interface Props {
  eintrag: SymptomEintrag;
  onPress: () => void;
}

function formatZeit(datum: string): string {
  return new Date(datum).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export default function EintragKarte({ eintrag, onPress }: Props) {
  const dunkel = useColorScheme() === 'dark';
  return (
    <TouchableOpacity
      style={[styles.karte, { backgroundColor: dunkel ? '#2C2C2E' : '#FFF' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.farbstreifen, { backgroundColor: eintrag.symptomTypFarbe }]} />
      <View style={styles.inhalt}>
        <View style={styles.zeile}>
          <Text style={styles.icon}>{eintrag.symptomTypIcon}</Text>
          <Text style={[styles.name, { color: dunkel ? '#FFF' : '#000' }]}>
            {eintrag.symptomTypName}
          </Text>
          <Text style={[styles.zeit, { color: dunkel ? '#8E8E93' : '#6C6C70' }]}>
            {formatZeit(eintrag.datum)}
          </Text>
          <IntensitaetsBadge wert={eintrag.intensitaet} />
        </View>
        {(eintrag.dauer || eintrag.ausloser || eintrag.notiz) ? (
          <View style={styles.details}>
            {eintrag.dauer ? (
              <Text style={[styles.detail, { color: dunkel ? '#8E8E93' : '#6C6C70' }]}>
                ⏱ {eintrag.dauer} Min.
              </Text>
            ) : null}
            {eintrag.ausloser ? (
              <Text style={[styles.detail, { color: dunkel ? '#8E8E93' : '#6C6C70' }]}>
                ⚡ {eintrag.ausloser}
              </Text>
            ) : null}
            {eintrag.notiz ? (
              <Text style={[styles.detail, { color: dunkel ? '#8E8E93' : '#6C6C70' }]} numberOfLines={1}>
                📝 {eintrag.notiz}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  karte: {
    flexDirection: 'row',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  farbstreifen: { width: 4 },
  inhalt: { flex: 1, padding: 12 },
  zeile: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 20 },
  name: { flex: 1, fontSize: 16, fontWeight: '500' },
  zeit: { fontSize: 13 },
  details: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  detail: { fontSize: 12 },
});
