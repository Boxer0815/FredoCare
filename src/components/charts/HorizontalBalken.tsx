import { View, Text, StyleSheet } from 'react-native';

interface Eintrag {
  label: string;
  wert: number;
  farbe?: string;
  icon?: string;
}

interface Props {
  daten: Eintrag[];
  dunkel: boolean;
  maxBreite?: number;
}

export default function HorizontalBalken({ daten, dunkel, maxBreite = 280 }: Props) {
  const maxWert = Math.max(...daten.map((d) => d.wert), 1);
  const textFarbe = dunkel ? '#FFF' : '#000';
  const subtextFarbe = dunkel ? '#8E8E93' : '#6C6C70';

  return (
    <View style={styles.container}>
      {daten.map((d, i) => (
        <View key={i} style={styles.zeile}>
          <View style={styles.labelZeile}>
            {d.icon ? <Text style={styles.icon}>{d.icon}</Text> : null}
            <Text style={[styles.label, { color: textFarbe }]} numberOfLines={1}>
              {d.label}
            </Text>
            <Text style={[styles.wert, { color: subtextFarbe }]}>{d.wert}×</Text>
          </View>
          <View style={[styles.balkHintergrund, { backgroundColor: dunkel ? '#2C2C2E' : '#E5E5EA' }]}>
            <View
              style={[
                styles.balk,
                {
                  width: (d.wert / maxWert) * maxBreite,
                  backgroundColor: d.farbe ?? '#5B8DEF',
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  zeile: { gap: 4 },
  labelZeile: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { fontSize: 16 },
  label: { flex: 1, fontSize: 14, fontWeight: '500' },
  wert: { fontSize: 13 },
  balkHintergrund: { height: 8, borderRadius: 4, overflow: 'hidden' },
  balk: { height: 8, borderRadius: 4 },
});
