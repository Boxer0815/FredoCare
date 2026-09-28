import * as SQLite from 'expo-sqlite';
import type { SymptomTyp, SymptomEintrag, NeuerSymptomEintrag, Arztbesuch, NeuerArztbesuch } from '../types';

const DB_NAME = 'fredocare.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return db;
}

export async function initDb(): Promise<void> {
  const database = await getDb();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS symptom_typen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      farbe TEXT NOT NULL,
      ist_eigen INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS symptom_eintraege (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symptom_typ_id INTEGER NOT NULL REFERENCES symptom_typen(id),
      datum TEXT NOT NULL,
      intensitaet INTEGER NOT NULL,
      dauer INTEGER,
      ausloser TEXT,
      notiz TEXT
    );

    CREATE TABLE IF NOT EXISTS arztbesuche (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      datum TEXT NOT NULL,
      arztname TEXT NOT NULL,
      fachrichtung TEXT NOT NULL,
      grund TEXT,
      befund TEXT,
      notiz TEXT
    );
  `);

  const count = await database.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM symptom_typen WHERE ist_eigen = 0'
  );
  if (!count || count.c === 0) {
    await database.execAsync(`
      INSERT INTO symptom_typen (name, icon, farbe, ist_eigen) VALUES
        ('Schwindel',             '🌀', '#5B8DEF', 0),
        ('Migräne',               '🤯', '#EF5B5B', 0),
        ('Übelkeit',              '🤢', '#5BEF8D', 0),
        ('Eingeschränktes Sehen', '👁️', '#EFC75B', 0),
        ('Muskelschmerzen',       '💪', '#B05BEF', 0);
    `);
  }
}

// ── Symptom-Typen ────────────────────────────────────────────────────────────

export async function alleSymptomTypen(): Promise<SymptomTyp[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: number; name: string; icon: string; farbe: string; ist_eigen: number;
  }>('SELECT * FROM symptom_typen ORDER BY ist_eigen ASC, name ASC');
  return rows.map((r) => ({ ...r, istEigen: r.ist_eigen === 1 }));
}

export async function symptomTypAnlegen(
  name: string, icon: string, farbe: string
): Promise<SymptomTyp> {
  const database = await getDb();
  const result = await database.runAsync(
    'INSERT INTO symptom_typen (name, icon, farbe, ist_eigen) VALUES (?, ?, ?, 1)',
    name, icon, farbe
  );
  return { id: result.lastInsertRowId, name, icon, farbe, istEigen: true };
}

export async function symptomTypLoeschen(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM symptom_typen WHERE id = ? AND ist_eigen = 1', id);
}

// ── Symptom-Einträge ─────────────────────────────────────────────────────────

export async function alleEintraege(): Promise<SymptomEintrag[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: number; symptom_typ_id: number; datum: string; intensitaet: number;
    dauer: number | null; ausloser: string | null; notiz: string | null;
    name: string; icon: string; farbe: string;
  }>(`
    SELECT e.*, t.name, t.icon, t.farbe
    FROM symptom_eintraege e
    JOIN symptom_typen t ON t.id = e.symptom_typ_id
    ORDER BY e.datum DESC
  `);
  return rows.map((r) => ({
    id: r.id,
    symptomTypId: r.symptom_typ_id,
    symptomTypName: r.name,
    symptomTypIcon: r.icon,
    symptomTypFarbe: r.farbe,
    datum: r.datum,
    intensitaet: r.intensitaet,
    dauer: r.dauer,
    ausloser: r.ausloser,
    notiz: r.notiz,
  }));
}

export async function eintragAnlegen(e: NeuerSymptomEintrag): Promise<number> {
  const database = await getDb();
  const result = await database.runAsync(
    `INSERT INTO symptom_eintraege
       (symptom_typ_id, datum, intensitaet, dauer, ausloser, notiz)
     VALUES (?, ?, ?, ?, ?, ?)`,
    e.symptomTypId, e.datum, e.intensitaet,
    e.dauer ?? null, e.ausloser ?? null, e.notiz ?? null
  );
  return result.lastInsertRowId;
}

export async function eintragAktualisieren(id: number, e: Partial<NeuerSymptomEintrag>): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `UPDATE symptom_eintraege SET
       symptom_typ_id = COALESCE(?, symptom_typ_id),
       datum          = COALESCE(?, datum),
       intensitaet    = COALESCE(?, intensitaet),
       dauer          = ?,
       ausloser       = ?,
       notiz          = ?
     WHERE id = ?`,
    e.symptomTypId ?? null, e.datum ?? null, e.intensitaet ?? null,
    e.dauer ?? null, e.ausloser ?? null, e.notiz ?? null, id
  );
}

export async function eintragLoeschen(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM symptom_eintraege WHERE id = ?', id);
}

// ── Arztbesuche ──────────────────────────────────────────────────────────────

export async function alleArztbesuche(): Promise<Arztbesuch[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: number; datum: string; arztname: string; fachrichtung: string;
    grund: string | null; befund: string | null; notiz: string | null;
  }>('SELECT * FROM arztbesuche ORDER BY datum DESC');
  return rows.map((r) => ({
    id: r.id,
    datum: r.datum,
    arztname: r.arztname,
    fachrichtung: r.fachrichtung,
    grund: r.grund,
    befund: r.befund,
    notiz: r.notiz,
  }));
}

export async function arztbesuchAnlegen(b: NeuerArztbesuch): Promise<number> {
  const database = await getDb();
  const result = await database.runAsync(
    `INSERT INTO arztbesuche (datum, arztname, fachrichtung, grund, befund, notiz)
     VALUES (?, ?, ?, ?, ?, ?)`,
    b.datum, b.arztname, b.fachrichtung,
    b.grund ?? null, b.befund ?? null, b.notiz ?? null
  );
  return result.lastInsertRowId;
}

export async function arztbesuchAktualisieren(id: number, b: Partial<NeuerArztbesuch>): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `UPDATE arztbesuche SET
       datum        = COALESCE(?, datum),
       arztname     = COALESCE(?, arztname),
       fachrichtung = COALESCE(?, fachrichtung),
       grund        = ?,
       befund       = ?,
       notiz        = ?
     WHERE id = ?`,
    b.datum ?? null, b.arztname ?? null, b.fachrichtung ?? null,
    b.grund ?? null, b.befund ?? null, b.notiz ?? null, id
  );
}

export async function arztbesuchLoeschen(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM arztbesuche WHERE id = ?', id);
}
