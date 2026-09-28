import { View, Text, StyleSheet, useColorScheme } from 'react-native';

interface Props {
  emoji: string;
  titel: string;
  beschreibung: string;
}

export default function LeerZustand({ emoji, titel, beschreibung }: Props) {
  const dunkel = useColorScheme() === 'dark';
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.titel, { color: dunkel ? '#FFF' : '#000' }]}>{titel}</Text>
      <Text style={[styles.beschreibung, { color: dunkel ? '#8E8E93' : '#6C6C70' }]}>
        {beschreibung}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 56, marginBottom: 16 },
  titel: { fontSize: 20, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  beschreibung: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
