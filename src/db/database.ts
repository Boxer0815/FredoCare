import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import type {
  SymptomTyp, SymptomEintrag, NeuerSymptomEintrag,
  Arztbesuch, NeuerArztbesuch, Profil, Geschlecht,
} from '../types';

const DB_NAME = 'fredocare.db';
const SCHEMA_VERSION = 1;

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function jetzt(): string {
  return new Date().toISOString();
}

// ── Tabellen anlegen (neue Schemaversion) ─────────────────────────────────────

async function erstelleTabellen(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS symptom_typen (
      id         TEXT PRIMARY KEY,
      code       TEXT UNIQUE,
      name       TEXT NOT NULL,
      icon       TEXT NOT NULL,
      farbe      TEXT NOT NULL,
      ist_eigen  INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      device_id  TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS symptom_eintraege (
      id             TEXT PRIMARY KEY,
      symptom_typ_id TEXT NOT NULL REFERENCES symptom_typen(id),
      start_date     TEXT NOT NULL,
      end_date       TEXT,
      timezone       TEXT NOT NULL DEFAULT 'UTC',
      intensitaet    INTEGER NOT NULL,
      ausloser       TEXT,
      notiz          TEXT,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL,
      deleted_at     TEXT,
      device_id      TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS profil (
      id           TEXT PRIMARY KEY,
      vorname      TEXT NOT NULL DEFAULT '',
      nachname     TEXT NOT NULL DEFAULT '',
      geburtsdatum TEXT,
      geschlecht   TEXT,
      groesse      INTEGER,
      gewicht      REAL,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      device_id    TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS arztbesuche (
      id           TEXT PRIMARY KEY,
      datum        TEXT NOT NULL,
      arztname     TEXT NOT NULL,
      fachrichtung TEXT NOT NULL,
      grund        TEXT,
      befund       TEXT,
      notiz        TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      deleted_at   TEXT,
      device_id    TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS anhaenge (
      id             TEXT PRIMARY KEY,
      arztbesuch_id  TEXT NOT NULL REFERENCES arztbesuche(id),
      relativer_pfad TEXT NOT NULL,
      mime_type      TEXT NOT NULL,
      dateigroesse   INTEGER NOT NULL,
      originalname   TEXT NOT NULL,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL,
      deleted_at     TEXT,
      device_id      TEXT NOT NULL DEFAULT ''
    );
  `);
}

// Vordefinierte Symptomtypen mit stabilen Sync-Codes
const VORDEFINIERTE_TYPEN = [
  { code: 'dizziness',         name: 'Schwindel',             icon: '🌀', farbe: '#5B8DEF' },
  { code: 'migraine',          name: 'Migräne',               icon: '🤯', farbe: '#EF5B5B' },
  { code: 'nausea',            name: 'Übelkeit',              icon: '🤢', farbe: '#5BEF8D' },
  { code: 'visual_impairment', name: 'Eingeschränktes Sehen', icon: '👁️', farbe: '#EFC75B' },
  { code: 'muscle_pain',       name: 'Muskelschmerzen',       icon: '💪', farbe: '#B05BEF' },
] as const;

async function setzePredefinedTypen(
  database: SQLite.SQLiteDatabase, devId: string
): Promise<void> {
  const count = await database.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM symptom_typen WHERE ist_eigen = 0 AND deleted_at IS NULL'
  );
  if (count && count.c > 0) return;
  const ts = jetzt();
  for (const t of VORDEFINIERTE_TYPEN) {
    await database.runAsync(
      `INSERT OR IGNORE INTO symptom_typen
         (id, code, name, icon, farbe, ist_eigen, created_at, updated_at, device_id)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      Crypto.randomUUID(), t.code, t.name, t.icon, t.farbe, ts, ts, devId
    );
  }
}

// ── Migration von Schemaversion 0 (INTEGER PKs) zu Version 1 (UUID PKs) ──────

async function migriereZuV1(database: SQLite.SQLiteDatabase): Promise<void> {
  const ts = jetzt();

  // 1. Alte Daten lesen, bevor wir die Tabellen umbenennen
  const alteTypen = await database.getAllAsync<{
    id: number; name: string; icon: string; farbe: string; ist_eigen: number;
  }>('SELECT * FROM symptom_typen').catch(() => []);

  const alteEintraege = await database.getAllAsync<{
    id: number; symptom_typ_id: number; datum: string; intensitaet: number;
    dauer: number | null; ausloser: string | null; notiz: string | null;
  }>('SELECT * FROM symptom_eintraege').catch(() => []);

  const alteBesuche = await database.getAllAsync<{
    id: number; datum: string; arztname: string; fachrichtung: string;
    grund: string | null; befund: string | null; notiz: string | null;
  }>('SELECT * FROM arztbesuche').catch(() => []);

  const altesProfil = await database.getFirstAsync<{
    vorname: string; nachname: string; geburtsdatum: string | null;
    geschlecht: string | null; groesse: number | null; gewicht: number | null;
  }>('SELECT * FROM profil WHERE id = 1').catch(() => null);

  // 2. Alte Tabellen umbenennen
  await database.execAsync(`
    ALTER TABLE symptom_typen    RENAME TO symptom_typen_v0;
    ALTER TABLE symptom_eintraege RENAME TO symptom_eintraege_v0;
    ALTER TABLE profil            RENAME TO profil_v0;
    ALTER TABLE arztbesuche       RENAME TO arztbesuche_v0;
  `);

  // 3. Neue Tabellen erstellen
  await erstelleTabellen(database);

  // 4. Geräte-ID anlegen
  const devId = Crypto.randomUUID();
  await database.runAsync(
    "INSERT OR IGNORE INTO settings (key, value) VALUES ('device_id', ?)", devId
  );

  // 5. UUID-Mapping für Symptomtypen (alt int → neu UUID)
  const typIdMap = new Map<number, string>();
  for (const alt of alteTypen) {
    // Für vordefinierte Typen stabilen Code zuweisen
    const vordefiniert = alt.ist_eigen === 0
      ? VORDEFINIERTE_TYPEN.find((v) => v.name === alt.name)
      : null;
    const neueId = Crypto.randomUUID();
    typIdMap.set(alt.id, neueId);
    const code = vordefiniert?.code ?? null;
    await database.runAsync(
      `INSERT OR IGNORE INTO symptom_typen
         (id, code, name, icon, farbe, ist_eigen, created_at, updated_at, device_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      neueId, code, alt.name, alt.icon, alt.farbe, alt.ist_eigen, ts, ts, devId
    );
  }

  // 6. Symptomeinträge migrieren (dauer → end_date)
  for (const alt of alteEintraege) {
    const neueTypId = typIdMap.get(alt.symptom_typ_id);
    if (!neueTypId) continue; // Waise-Eintrag, überspringen
    const endDate = alt.dauer
      ? new Date(new Date(alt.datum).getTime() + alt.dauer * 60000).toISOString()
      : null;
    await database.runAsync(
      `INSERT OR IGNORE INTO symptom_eintraege
         (id, symptom_typ_id, start_date, end_date, timezone, intensitaet,
          ausloser, notiz, created_at, updated_at, device_id)
       VALUES (?, ?, ?, ?, 'UTC', ?, ?, ?, ?, ?, ?)`,
      Crypto.randomUUID(), neueTypId, alt.datum, endDate,
      alt.intensitaet, alt.ausloser, alt.notiz, ts, ts, devId
    );
  }

  // 7. Arztbesuche migrieren
  for (const alt of alteBesuche) {
    await database.runAsync(
      `INSERT OR IGNORE INTO arztbesuche
         (id, datum, arztname, fachrichtung, grund, befund, notiz, created_at, updated_at, device_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      Crypto.randomUUID(), alt.datum, alt.arztname, alt.fachrichtung,
      alt.grund, alt.befund, alt.notiz, ts, ts, devId
    );
  }

  // 8. Profil migrieren
  await database.runAsync(
    `INSERT OR IGNORE INTO profil
       (id, vorname, nachname, geburtsdatum, geschlecht, groesse, gewicht,
        created_at, updated_at, device_id)
     VALUES ('profil', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    altesProfil?.vorname ?? '', altesProfil?.nachname ?? '',
    altesProfil?.geburtsdatum ?? null, altesProfil?.geschlecht ?? null,
    altesProfil?.groesse ?? null, altesProfil?.gewicht ?? null,
    ts, ts, devId
  );

  // 9. Alte Tabellen löschen
  await database.execAsync(`
    DROP TABLE IF EXISTS symptom_typen_v0;
    DROP TABLE IF EXISTS symptom_eintraege_v0;
    DROP TABLE IF EXISTS profil_v0;
    DROP TABLE IF EXISTS arztbesuche_v0;
  `);
}

// ── Datenbankinitialisierung ──────────────────────────────────────────────────

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!initPromise) initPromise = initDb();
  await initPromise;
  return db!;
}

export async function initDb(): Promise<void> {
  if (!db) db = await SQLite.openDatabaseAsync(DB_NAME);
  const database = db;

  // Schemaversion prüfen
  const vRow = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = vRow?.user_version ?? 0;

  if (version < SCHEMA_VERSION) {
    // Erkennen: altes Schema (INTEGER PK) oder Neuinstallation?
    const idCol = await database.getFirstAsync<{ type: string }>(
      "SELECT type FROM pragma_table_info('symptom_typen') WHERE name = 'id'"
    );

    if (idCol?.type?.toUpperCase() === 'INTEGER') {
      // Upgrade: bestehende Daten migrieren
      await migriereZuV1(database);
    } else if (!idCol) {
      // Neuinstallation: Tabellen anlegen + Vordaten
      await erstelleTabellen(database);
      const devId = Crypto.randomUUID();
      await database.runAsync(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('device_id', ?)", devId
      );
      await setzePredefinedTypen(database, devId);
      // Leeres Profil anlegen
      const ts = jetzt();
      await database.runAsync(
        `INSERT OR IGNORE INTO profil
           (id, created_at, updated_at, device_id) VALUES ('profil', ?, ?, ?)`,
        ts, ts, devId
      );
    }
    // Bereits neues Schema (z. B. nach Migration) → nichts tun
    await database.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }

  // Vordefinierte Typen ergänzen (falls fehlend)
  const devRow = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'device_id'"
  );
  if (devRow) {
    await setzePredefinedTypen(database, devRow.value);
  }
}

// ── Geräte-ID ─────────────────────────────────────────────────────────────────

export async function geraeteId(): Promise<string> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'device_id'"
  );
  return row?.value ?? '';
}

// ── Symptom-Typen ─────────────────────────────────────────────────────────────

export async function alleSymptomTypen(): Promise<SymptomTyp[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string; code: string | null; name: string; icon: string;
    farbe: string; ist_eigen: number;
  }>(
    'SELECT id, code, name, icon, farbe, ist_eigen FROM symptom_typen WHERE deleted_at IS NULL ORDER BY ist_eigen ASC, name ASC'
  );
  return rows.map((r) => ({ ...r, code: r.code, istEigen: r.ist_eigen === 1 }));
}

export async function symptomTypAnlegen(
  name: string, icon: string, farbe: string
): Promise<SymptomTyp> {
  const database = await getDb();
  const devId = await geraeteId();
  const id = Crypto.randomUUID();
  const ts = jetzt();
  await database.runAsync(
    `INSERT INTO symptom_typen
       (id, code, name, icon, farbe, ist_eigen, created_at, updated_at, device_id)
     VALUES (?, NULL, ?, ?, ?, 1, ?, ?, ?)`,
    id, name, icon, farbe, ts, ts, devId
  );
  return { id, code: null, name, icon, farbe, istEigen: true };
}

export async function symptomTypLoeschen(id: string): Promise<void> {
  const database = await getDb();
  const devId = await geraeteId();
  const ts = jetzt();
  await database.runAsync(
    'UPDATE symptom_typen SET deleted_at = ?, updated_at = ?, device_id = ? WHERE id = ? AND ist_eigen = 1',
    ts, ts, devId, id
  );
}

// ── Symptom-Einträge ──────────────────────────────────────────────────────────

export async function alleEintraege(): Promise<SymptomEintrag[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string; symptom_typ_id: string; start_date: string; end_date: string | null;
    timezone: string; intensitaet: number;
    ausloser: string | null; notiz: string | null;
    name: string; icon: string; farbe: string;
  }>(`
    SELECT e.id, e.symptom_typ_id, e.start_date, e.end_date, e.timezone,
           e.intensitaet, e.ausloser, e.notiz,
           t.name, t.icon, t.farbe
    FROM symptom_eintraege e
    JOIN symptom_typen t ON t.id = e.symptom_typ_id
    WHERE e.deleted_at IS NULL
    ORDER BY e.start_date DESC
  `);
  return rows.map((r) => ({
    id: r.id,
    symptomTypId: r.symptom_typ_id,
    symptomTypName: r.name,
    symptomTypIcon: r.icon,
    symptomTypFarbe: r.farbe,
    datum: r.start_date,
    endDate: r.end_date,
    timezone: r.timezone,
    intensitaet: r.intensitaet,
    ausloser: r.ausloser,
    notiz: r.notiz,
  }));
}

export async function eintragAnlegen(e: NeuerSymptomEintrag): Promise<string> {
  const database = await getDb();
  const devId = await geraeteId();
  const id = Crypto.randomUUID();
  const ts = jetzt();
  await database.runAsync(
    `INSERT INTO symptom_eintraege
       (id, symptom_typ_id, start_date, end_date, timezone, intensitaet,
        ausloser, notiz, created_at, updated_at, device_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, e.symptomTypId, e.datum, e.endDate ?? null,
    e.timezone, e.intensitaet,
    e.ausloser ?? null, e.notiz ?? null, ts, ts, devId
  );
  return id;
}

export async function eintragAktualisieren(
  id: string, e: NeuerSymptomEintrag
): Promise<void> {
  const database = await getDb();
  const devId = await geraeteId();
  const ts = jetzt();
  await database.runAsync(
    `UPDATE symptom_eintraege SET
       symptom_typ_id = ?,
       start_date     = ?,
       end_date       = ?,
       timezone       = ?,
       intensitaet    = ?,
       ausloser       = ?,
       notiz          = ?,
       updated_at     = ?,
       device_id      = ?
     WHERE id = ? AND deleted_at IS NULL`,
    e.symptomTypId, e.datum,
    e.endDate ?? null, e.timezone, e.intensitaet,
    e.ausloser ?? null, e.notiz ?? null,
    ts, devId, id
  );
}

export async function eintragLoeschen(id: string): Promise<void> {
  const database = await getDb();
  const devId = await geraeteId();
  const ts = jetzt();
  await database.runAsync(
    'UPDATE symptom_eintraege SET deleted_at = ?, updated_at = ?, device_id = ? WHERE id = ?',
    ts, ts, devId, id
  );
}

// ── Arztbesuche ───────────────────────────────────────────────────────────────

export async function alleArztbesuche(): Promise<Arztbesuch[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string; datum: string; arztname: string; fachrichtung: string;
    grund: string | null; befund: string | null; notiz: string | null;
  }>('SELECT id, datum, arztname, fachrichtung, grund, befund, notiz FROM arztbesuche WHERE deleted_at IS NULL ORDER BY datum DESC');
  return rows.map((r) => ({ ...r }));
}

export async function arztbesuchAnlegen(b: NeuerArztbesuch): Promise<string> {
  const database = await getDb();
  const devId = await geraeteId();
  const id = Crypto.randomUUID();
  const ts = jetzt();
  await database.runAsync(
    `INSERT INTO arztbesuche
       (id, datum, arztname, fachrichtung, grund, befund, notiz, created_at, updated_at, device_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, b.datum, b.arztname, b.fachrichtung,
    b.grund ?? null, b.befund ?? null, b.notiz ?? null, ts, ts, devId
  );
  return id;
}

export async function arztbesuchAktualisieren(
  id: string, b: NeuerArztbesuch
): Promise<void> {
  const database = await getDb();
  const devId = await geraeteId();
  const ts = jetzt();
  await database.runAsync(
    `UPDATE arztbesuche SET
       datum        = ?,
       arztname     = ?,
       fachrichtung = ?,
       grund        = ?,
       befund       = ?,
       notiz        = ?,
       updated_at   = ?,
       device_id    = ?
     WHERE id = ? AND deleted_at IS NULL`,
    b.datum, b.arztname, b.fachrichtung,
    b.grund ?? null, b.befund ?? null, b.notiz ?? null,
    ts, devId, id
  );
}

export async function arztbesuchLoeschen(id: string): Promise<void> {
  const database = await getDb();
  const devId = await geraeteId();
  const ts = jetzt();
  // Zugehörige Anhänge ebenfalls als gelöscht markieren
  await database.runAsync(
    'UPDATE anhaenge SET deleted_at = ?, updated_at = ?, device_id = ? WHERE arztbesuch_id = ? AND deleted_at IS NULL',
    ts, ts, devId, id
  );
  await database.runAsync(
    'UPDATE arztbesuche SET deleted_at = ?, updated_at = ?, device_id = ? WHERE id = ?',
    ts, ts, devId, id
  );
}

// ── Profil ────────────────────────────────────────────────────────────────────

export async function profilLaden(): Promise<Profil> {
  const database = await getDb();
  const row = await database.getFirstAsync<{
    vorname: string; nachname: string; geburtsdatum: string | null;
    geschlecht: string | null; groesse: number | null; gewicht: number | null;
  }>('SELECT vorname, nachname, geburtsdatum, geschlecht, groesse, gewicht FROM profil WHERE id = \'profil\'');
  return {
    vorname: row?.vorname ?? '',
    nachname: row?.nachname ?? '',
    geburtsdatum: row?.geburtsdatum ?? null,
    geschlecht: (row?.geschlecht as Geschlecht | null) ?? null,
    groesse: row?.groesse ?? null,
    gewicht: row?.gewicht ?? null,
  };
}

export async function profilSpeichern(p: Profil): Promise<void> {
  const database = await getDb();
  const devId = await geraeteId();
  const ts = jetzt();
  await database.runAsync(
    `UPDATE profil SET
       vorname = ?, nachname = ?, geburtsdatum = ?, geschlecht = ?,
       groesse = ?, gewicht = ?, updated_at = ?, device_id = ?
     WHERE id = 'profil'`,
    p.vorname, p.nachname, p.geburtsdatum ?? null,
    p.geschlecht ?? null, p.groesse ?? null, p.gewicht ?? null, ts, devId
  );
}
