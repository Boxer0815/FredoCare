export interface SymptomTyp {
  id: string;           // UUID
  code: string | null;  // stabiler Schlüssel für vordefinierte Typen (z. B. 'dizziness')
  name: string;
  icon: string;
  farbe: string;
  istEigen: boolean;
}

export interface SymptomEintrag {
  id: string;            // UUID
  symptomTypId: string;
  symptomTypName: string;
  symptomTypIcon: string;
  symptomTypFarbe: string;
  datum: string;         // = start_date, ISO 8601 UTC
  endDate: string | null; // ISO 8601 UTC; null = Endzeit unbekannt
  timezone: string;      // IANA-Zeitzone der Erfassung
  intensitaet: number;   // 1–10
  ausloser?: string | null;
  notiz?: string | null;
}

/** Berechnet die Dauer in Minuten aus start_date/end_date. */
export function dauerMinuten(e: Pick<SymptomEintrag, 'datum' | 'endDate'>): number | null {
  if (!e.endDate) return null;
  const diff = new Date(e.endDate).getTime() - new Date(e.datum).getTime();
  return diff > 0 ? Math.round(diff / 60000) : null;
}

/** Mappt Intensität 1–10 auf HealthKit-Schweregrade. */
export function healthKitSchweregrad(intensitaet: number): 'mild' | 'moderate' | 'severe' {
  if (intensitaet <= 3) return 'mild';
  if (intensitaet <= 7) return 'moderate';
  return 'severe';
}

export type NeuerSymptomEintrag = Omit<SymptomEintrag, 'id' | 'symptomTypName' | 'symptomTypIcon' | 'symptomTypFarbe'>;

export interface Arztbesuch {
  id: string;  // UUID
  datum: string;
  arztname: string;
  fachrichtung: string;
  grund?: string | null;
  befund?: string | null;
  notiz?: string | null;
}

export type NeuerArztbesuch = Omit<Arztbesuch, 'id'>;

export type Geschlecht = 'weiblich' | 'männlich' | 'divers' | 'keine Angabe';

export interface Profil {
  vorname: string;
  nachname: string;
  geburtsdatum: string | null; // ISO date YYYY-MM-DD
  geschlecht: Geschlecht | null;
  groesse: number | null; // cm
  gewicht: number | null; // kg
}

/** Anhang an einen Arztbesuch (Vorbereitung für spätere Datei-Funktion). */
export interface Anhang {
  id: string;            // UUID
  arztbesuchId: string;
  relativerPfad: string; // relativ zum App-Dokumentenordner
  mimeType: string;
  dateigroesse: number;  // Bytes
  originalname: string;
}
