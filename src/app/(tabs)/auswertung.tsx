import LeerZustand from '../../components/LeerZustand';
import { useColorScheme, View, StyleSheet } from 'react-native';

export default function AuswertungScreen() {
  const dunkel = useColorScheme() === 'dark';
  return (
    <View style={[styles.container, { backgroundColor: dunkel ? '#000' : '#F2F2F7' }]}>
      <LeerZustand
        emoji="📊"
        titel="Auswertung"
        beschreibung="Diese Funktion kommt in Phase 3. Hier siehst du bald Diagramme und Trends deiner Symptome."
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
