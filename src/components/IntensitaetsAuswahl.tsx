import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const FARBEN = [
  '#34C759', '#34C759', '#34C759',
  '#FF9F0A', '#FF9F0A', '#FF9F0A',
  '#FF3B30', '#FF3B30', '#FF3B30', '#FF3B30',
];

interface Props {
  wert: number;
  onChange: (wert: number) => void;
}

export default function IntensitaetsAuswahl({ wert, onChange }: Props) {
  return (
    <View style={styles.reihe}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <TouchableOpacity
          key={n}
          style={[
            styles.chip,
            { backgroundColor: wert === n ? FARBEN[n - 1] : '#E5E5EA' },
          ]}
          onPress={() => onChange(n)}
          hitSlop={4}
        >
          <Text style={[styles.text, { color: wert === n ? '#FFF' : '#666' }]}>{n}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  reihe: { flexDirection: 'row', justifyContent: 'space-between' },
  chip: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  text: { fontSize: 13, fontWeight: '600' },
});
