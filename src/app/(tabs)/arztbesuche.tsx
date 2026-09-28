import LeerZustand from '../../components/LeerZustand';
import { useColorScheme, View, StyleSheet } from 'react-native';

export default function ArztbesucheScreen() {
  const dunkel = useColorScheme() === 'dark';
  return (
    <View style={[styles.container, { backgroundColor: dunkel ? '#000' : '#F2F2F7' }]}>
      <LeerZustand
        emoji="🏥"
        titel="Arztbesuche"
        beschreibung="Diese Funktion kommt in Phase 2. Hier kannst du bald Arztbesuche und Berichte dokumentieren."
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
