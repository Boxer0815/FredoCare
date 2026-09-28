export interface SymptomTyp {
  id: number;
  name: string;
  icon: string;
  farbe: string;
  istEigen: boolean; // 0 = vordefiniert, 1 = eigener
}

export interface SymptomEintrag {
  id: number;
  symptomTypId: number;
  symptomTypName: string;
  symptomTypIcon: string;
  symptomTypFarbe: string;
  datum: string; // ISO 8601
  intensitaet: number; // 1–10
  dauer?: number | null; // Minuten
  ausloser?: string | null;
  notiz?: string | null;
}

export type NeuerSymptomEintrag = Omit<SymptomEintrag, 'id' | 'symptomTypName' | 'symptomTypIcon' | 'symptomTypFarbe'>;

export interface Arztbesuch {
  id: number;
  datum: string; // ISO 8601
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
