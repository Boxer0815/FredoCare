# FredoCare

Symptom-Tracker für iOS und Android — erfasse Symptome mit wenigen Taps und behalte den Überblick.

## App starten (Expo Go)

1. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

2. **Dev-Server starten**
   ```bash
   npx expo start
   ```

3. **Expo Go App** auf dem iPhone/Android öffnen und den QR-Code scannen.

> Expo Go muss auf dem Gerät installiert sein: [expo.dev/go](https://expo.dev/go)

## Entwicklung

```bash
npx tsc --noEmit       # TypeScript-Prüfung
npx expo lint          # ESLint
npx expo-doctor        # Dependency-Check
```

## Projektstruktur

```
src/
  app/(tabs)/          Navigation: Übersicht, Symptome, Arztbesuche, Auswertung
  app/symptom-erfassen.tsx   Neues Symptom erfassen (Modal)
  app/symptom-bearbeiten/    Eintrag bearbeiten/löschen
  db/database.ts       SQLite-Datenbankschicht
  hooks/               Custom React Hooks
  components/          Wiederverwendbare UI-Komponenten
  types/               TypeScript-Interfaces
```

## Features (Phase 1)

- Symptome erfassen: Typ wählen, Intensität per Slider, optionale Details
- Symptome verwalten: Liste gruppiert nach Tag, Filter, Bearbeiten, Löschen
- Eigene Symptomtypen anlegen
- Übersicht: Heutige Einträge + Statistik der letzten 7 Tage
- Hell- und Dunkelmodus automatisch nach Systemeinstellung
- Daten lokal gespeichert (expo-sqlite), kein Cloud-Backend
