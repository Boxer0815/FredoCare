import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  useColorScheme, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState, useMemo } from 'react';
import { useEintraege, useSymptomTypen } from '../../hooks/useSymptome';
import { useArztbesuche } from '../../hooks/useArztbesuche';
import BalkenChart from '../../components/charts/BalkenChart';
import LinienChart from '../../components/charts/LinienChart';
import HorizontalBalken from '../../components/charts/HorizontalBalken';
import type { SymptomEintrag } from '../../types';

type Zeitraum = 7 | 14 | 30;

const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function tagLabel(datum: Date): string {
  return `${datum.getDate()}.${datum.getMonth() + 1}`;
}

function monatsLabel(key: string): string {
  const [jahr, monat] = key.split('-');
  const d = new Date(Number(jahr), Number(monat) - 1, 1);
  return d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
}

function useAuswertungsDaten(eintraege: SymptomEintrag[], zeitraum: Zeitraum) {
  return useMemo(() => {
    const grenze = new Date();
    grenze.setDate(grenze.getDate() - zeitraum);
    const gefiltert = eintraege.filter((e) => new Date(e.datum) >= grenze);

    // 1. Symptome pro Tag
    const tageMap = new Map<string, number>();
    for (let i = zeitraum - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      tageMap.set(d.toDateString(), 0);
    }
    for (const e of gefiltert) {
      const key = new Date(e.datum).toDateString();
      tageMap.set(key, (tageMap.get(key) ?? 0) + 1);
    }
    const symptomeProTag = Array.from(tageMap.entries()).map(([k, v]) => ({
      label: tagLabel(new Date(k)),
      wert: v,
    }));
    // Bei 30 Tagen nur jeden 3. Tag labeln
    const symptomeProTagLabeled = symptomeProTag.map((d, i) => ({
      ...d,
      label: zeitraum === 30 ? (i % 5 === 0 ? d.label : '') : d.label,
    }));

    // 2. Häufigste Symptome
    const typMap = new Map<number, { name: string; icon: string; farbe: string; anzahl: number }>();
    for (const e of gefiltert) {
      if (!typMap.has(e.symptomTypId)) {
        typMap.set(e.symptomTypId, { name: e.symptomTypName, icon: e.symptomTypIcon, farbe: e.symptomTypFarbe, anzahl: 0 });
      }
      typMap.get(e.symptomTypId)!.anzahl++;
    }
    const haeufigsteSymptome = Array.from(typMap.values())
      .sort((a, b) => b.anzahl - a.anzahl)
      .slice(0, 6)
      .map((d) => ({ label: d.name, wert: d.anzahl, farbe: d.farbe, icon: d.icon }));

    // 3. Wochentag-Muster
    const wochentagMap = new Array(7).fill(0);
    for (const e of gefiltert) {
      wochentagMap[new Date(e.datum).getDay()]++;
    }
    const wochentagDaten = WOCHENTAGE.map((label, i) => ({ label, wert: wochentagMap[i] }));

    return { symptomeProTagLabeled, haeufigsteSymptome, wochentagDaten, gefiltertAnzahl: gefiltert.length };
  }, [eintraege, zeitraum]);
}

function useIntensitaetsVerlauf(eintraege: SymptomEintrag[], typId: number | null, zeitraum: Zeitraum) {
  return useMemo(() => {
    if (!typId) return [];
    const grenze = new Date();
    grenze.setDate(grenze.getDate() - zeitraum);
    return eintraege
      .filter((e) => e.symptomTypId === typId && new Date(e.datum) >= grenze)
      .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())
      .map((e) => ({
        label: tagLabel(new Date(e.datum)),
        wert: e.intensitaet,
      }));
  }, [eintraege, typId, zeitraum]);
}

function useArztbesuchePro(besuche: ReturnType<typeof useArztbesuche>['besuche']) {
  return useMemo(() => {
    const map = new Map<string, number>();
    for (const b of besuche) {
      const d = new Date(b.datum);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const sorted = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
    return sorted.map(([key, wert]) => ({ label: monatsLabel(key), wert }));
  }, [besuche]);
}

function KartenContainer({ titel, children, dunkel }: { titel: string; children: React.ReactNode; dunkel: boolean }) {
  const kinder = children;
  const kartenHg = dunkel ? '#1C1C1E' : '#FFF';
  const textFarbe = dunkel ? '#FFF' : '#000';
  return (
    <View style={[styles.karte, { backgroundColor: kartenHg }]}>
      <Text style={[styles.karteTitel, { color: textFarbe }]}>{titel}</Text>
      {kinder}
    </View>
  );
}

function LeerHinweis({ text, dunkel }: { text: string; dunkel: boolean }) {
  return (
    <Text style={{ color: dunkel ? '#555' : '#C7C7CC', fontSize: 14, textAlign: 'center', paddingVertical: 20 }}>
      {text}
    </Text>
  );
}

export default function AuswertungScreen() {
  const dunkel = useColorScheme() === 'dark';
  const { eintraege, laden: eintraegeLaden, neu: eintraegeNeu } = useEintraege();
  const { typen } = useSymptomTypen();
  const { besuche, laden: besucheLaden, neu: besucheNeu } = useArztbesuche();

  const [zeitraum, setZeitraum] = useState<Zeitraum>(7);
  const [gewaehlterTypId, setGewaehlterTypId] = useState<number | null>(null);

  const laden = eintraegeLaden || besucheLaden;

  useFocusEffect(useCallback(() => {
    eintraegeNeu();
    besucheNeu();
  }, [eintraegeNeu, besucheNeu]));

  const { symptomeProTagLabeled, haeufigsteSymptome, wochentagDaten, gefiltertAnzahl } =
    useAuswertungsDaten(eintraege, zeitraum);

  const intensitaetsVerlauf = useIntensitaetsVerlauf(eintraege, gewaehlterTypId, zeitraum);
  const arztbesucheProMonat = useArztbesuchePro(besuche);

  const hg = dunkel ? '#000' : '#F2F2F7';
  const textFarbe = dunkel ? '#FFF' : '#000';
  const subtextFarbe = dunkel ? '#8E8E93' : '#6C6C70';
  const chipHg = dunkel ? '#2C2C2E' : '#E5E5EA';

  // Aktiv-Typ für Intensitätschart: erster Typ mit Einträgen im Zeitraum
  const verfuegbareTypen = typen.filter((t) =>
    haeufigsteSymptome.some((h) => h.label === t.name)
  );
  const aktivTypId = gewaehlterTypId ?? (verfuegbareTypen[0]?.id ?? null);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: hg }]}
      contentContainerStyle={styles.inhalt}
      refreshControl={<RefreshControl refreshing={laden} onRefresh={() => { eintraegeNeu(); besucheNeu(); }} />}
    >
      {/* Zeitraum-Wähler */}
      <View style={styles.zeitraumReihe}>
        {([7, 14, 30] as Zeitraum[]).map((z) => (
          <TouchableOpacity
            key={z}
            style={[styles.zeitraumChip, { backgroundColor: zeitraum === z ? '#5B8DEF' : chipHg }]}
            onPress={() => setZeitraum(z)}
          >
            <Text style={[styles.zeitraumText, { color: zeitraum === z ? '#FFF' : textFarbe }]}>
              {z} Tage
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Zusammenfassung */}
      <View style={styles.statsReihe}>
        <View style={[styles.statKarte, { backgroundColor: dunkel ? '#1C1C1E' : '#FFF' }]}>
          <Text style={[styles.statZahl, { color: '#5B8DEF' }]}>{gefiltertAnzahl}</Text>
          <Text style={[styles.statLabel, { color: subtextFarbe }]}>Symptome</Text>
        </View>
        <View style={[styles.statKarte, { backgroundColor: dunkel ? '#1C1C1E' : '#FFF' }]}>
          <Text style={[styles.statZahl, { color: '#5B8DEF' }]}>{besuche.length}</Text>
          <Text style={[styles.statLabel, { color: subtextFarbe }]}>Arztbesuche</Text>
        </View>
      </View>

      {/* 1. Symptome pro Tag */}
      <KartenContainer titel="Symptome pro Tag" dunkel={dunkel}>
        {symptomeProTagLabeled.every((d) => d.wert === 0) ? (
          <LeerHinweis text="Keine Einträge im gewählten Zeitraum" dunkel={dunkel} />
        ) : (
          <BalkenChart daten={symptomeProTagLabeled} dunkel={dunkel} />
        )}
      </KartenContainer>

      {/* 2. Häufigste Symptome */}
      <KartenContainer titel="Häufigste Symptome" dunkel={dunkel}>
        {haeufigsteSymptome.length === 0 ? (
          <LeerHinweis text="Noch keine Einträge" dunkel={dunkel} />
        ) : (
          <HorizontalBalken daten={haeufigsteSymptome} dunkel={dunkel} />
        )}
      </KartenContainer>

      {/* 3. Intensitäts-Verlauf */}
      <KartenContainer titel="Intensitäts-Verlauf" dunkel={dunkel}>
        {verfuegbareTypen.length === 0 ? (
          <LeerHinweis text="Noch keine Einträge" dunkel={dunkel} />
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typScrollView}>
              <View style={styles.typReihe}>
                {verfuegbareTypen.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.typChip,
                      { backgroundColor: aktivTypId === t.id ? t.farbe : chipHg },
                    ]}
                    onPress={() => setGewaehlterTypId(t.id)}
                  >
                    <Text style={styles.typChipIcon}>{t.icon}</Text>
                    <Text style={[styles.typChipText, { color: aktivTypId === t.id ? '#FFF' : textFarbe }]}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            {intensitaetsVerlauf.length < 2 ? (
              <LeerHinweis text="Mindestens 2 Einträge für diesen Verlauf nötig" dunkel={dunkel} />
            ) : (
              <LinienChart
                daten={intensitaetsVerlauf}
                dunkel={dunkel}
                farbe={verfuegbareTypen.find((t) => t.id === aktivTypId)?.farbe ?? '#5B8DEF'}
              />
            )}
          </>
        )}
      </KartenContainer>

      {/* 4. Wochentag-Muster */}
      <KartenContainer titel="Wochentag-Muster" dunkel={dunkel}>
        {gefiltertAnzahl === 0 ? (
          <LeerHinweis text="Noch keine Einträge" dunkel={dunkel} />
        ) : (
          <>
            <BalkenChart daten={wochentagDaten} dunkel={dunkel} farbe="#B05BEF" />
            <Text style={[styles.hinweis, { color: subtextFarbe }]}>
              Anzahl Symptome je Wochentag im gewählten Zeitraum
            </Text>
          </>
        )}
      </KartenContainer>

      {/* 5. Arztbesuche pro Monat */}
      <KartenContainer titel="Arztbesuche pro Monat" dunkel={dunkel}>
        {arztbesucheProMonat.length === 0 ? (
          <LeerHinweis text="Noch keine Arztbesuche erfasst" dunkel={dunkel} />
        ) : (
          <BalkenChart daten={arztbesucheProMonat} dunkel={dunkel} farbe="#EF5B5B" />
        )}
      </KartenContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inhalt: { padding: 16, gap: 12, paddingBottom: 40 },
  zeitraumReihe: { flexDirection: 'row', gap: 8 },
  zeitraumChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  zeitraumText: { fontSize: 14, fontWeight: '600' },
  statsReihe: { flexDirection: 'row', gap: 12 },
  statKarte: {
    flex: 1, borderRadius: 12, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  statZahl: { fontSize: 32, fontWeight: '700' },
  statLabel: { fontSize: 13, marginTop: 2 },
  karte: {
    borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  karteTitel: { fontSize: 17, fontWeight: '700', marginBottom: 14 },
  typScrollView: { marginBottom: 10 },
  typReihe: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  typChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  typChipIcon: { fontSize: 14 },
  typChipText: { fontSize: 13, fontWeight: '500' },
  hinweis: { fontSize: 12, marginTop: 8, textAlign: 'center' },
});
