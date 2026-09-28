import { View, Text, StyleSheet } from 'react-native';

const FARBEN = [
  '#34C759', '#34C759', '#34C759',       // 1-3 grün
  '#FF9F0A', '#FF9F0A', '#FF9F0A',       // 4-6 orange
  '#FF3B30', '#FF3B30', '#FF3B30', '#FF3B30', // 7-10 rot
];

export default function IntensitaetsBadge({ wert }: { wert: number }) {
  const farbe = FARBEN[Math.min(wert - 1, 9)];
  return (
    <View style={[styles.badge, { backgroundColor: farbe }]}>
      <Text style={styles.text}>{wert}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { color: '#FFF', fontSize: 12, fontWeight: '700' },
});
