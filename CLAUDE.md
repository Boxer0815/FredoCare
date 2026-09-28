@AGENTS.md

## Ziel
FredoCare ist eine mobile Health-Tracker-App für iOS/Android. Nutzer erfassen Symptome (Schwindel, Migräne, Übelkeit etc.) mit wenigen Taps, sehen ihre Einträge nach Tagen gruppiert und behalten so den Überblick über ihre Gesundheit.

## Technik
- **Expo SDK 57**, React Native 0.86, TypeScript (strict)
- **Navigation:** Expo Router, Tab-Leiste unten (`src/app/(tabs)/`)
- **Datenbank:** expo-sqlite, lokal, kein Cloud-Backend
- **Bibliotheken:** nur Expo-Go-kompatible Pakete

## Ordnerstruktur
```
src/
  app/
    (tabs)/          ← Tab-Screens (index, symptome, arztbesuche, auswertung)
    symptom-erfassen.tsx   ← Modal: neues Symptom
    symptom-bearbeiten/[id].tsx  ← Stack: bearbeiten/löschen
    _layout.tsx      ← Root-Layout (DB-Init + Stack-Konfiguration)
  components/        ← Wiederverwendbare UI-Komponenten
  db/database.ts     ← Komplette SQLite-Zugriffsschicht (kein direkter DB-Zugriff in Screens!)
  hooks/useSymptome.ts ← Custom Hooks für Einträge und Typen
  types/index.ts     ← TypeScript-Interfaces
```

## Konventionen
- Kein direkter Datenbankzugriff in Screens — immer über `src/db/database.ts`
- Screens nutzen Custom Hooks aus `src/hooks/`
- Farben und Design: hell/dunkel via `useColorScheme()`, Akzentfarbe `#5B8DEF`
- Deutsche Variablennamen und UI-Texte
- Vor jedem Commit: `npx tsc --noEmit && npx expo lint`

## Projektstand
- **Phase 1 (Issue #1):** Symptom-Tracking — abgeschlossen
  - Tab-Navigation (Übersicht, Symptome, Arztbesuche, Auswertung)
  - SQLite-Datenbank mit Symptomtypen und Einträgen
  - Symptom erfassen (Modal), bearbeiten und löschen
  - Filter, Gruppierung nach Tag, Leer-Zustände
- **Phase 2 (Issue #2):** Arztbesuche — abgeschlossen
  - SQLite-Tabelle `arztbesuche` (Datum, Arzt, Fachrichtung, Grund, Befund, Notiz)
  - Hook `useArztbesuche`, CRUD in `database.ts`
  - Tab-Screen: Liste nach Monaten gruppiert
  - Modal `arztbesuch-erfassen`, Stack `arztbesuch-bearbeiten/[id]`
- **Phase 3:** Auswertungen/Diagramme — abgeschlossen
  - `react-native-svg` für Expo-Go-kompatible Charts
  - Eigene Chart-Komponenten: `BalkenChart`, `LinienChart`, `HorizontalBalken`
  - Auswertungs-Tab mit 5 Sektionen (Zeitraum 7/14/30 Tage wählbar):
    - Symptome pro Tag, Häufigste Symptome, Intensitäts-Verlauf, Wochentag-Muster, Arztbesuche pro Monat
- **EAS:** Projekt auf expo.dev verknüpft (`@maxboxer/fredo-care`), Updates via `CI=1 npx eas update --branch main`
