import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { profilLaden, alleEintraege, alleArztbesuche } from '../db/database';
import type { Profil, SymptomEintrag, Arztbesuch } from '../types';
import { dauerMinuten } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDatum(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDatumZeit(iso: string): string {
  try {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function alter(geburtsdatum: string | null): string {
  if (!geburtsdatum) return '–';
  const heute = new Date();
  const geb = new Date(geburtsdatum);
  let a = heute.getFullYear() - geb.getFullYear();
  const m = heute.getMonth() - geb.getMonth();
  if (m < 0 || (m === 0 && heute.getDate() < geb.getDate())) a--;
  return `${a} Jahre`;
}

function bmi(profil: Profil): string {
  if (!profil.groesse || !profil.gewicht || profil.groesse <= 0) return '–';
  const wert = profil.gewicht / Math.pow(profil.groesse / 100, 2);
  const kategorie = wert < 18.5 ? 'Untergewicht'
    : wert < 25 ? 'Normalgewicht'
    : wert < 30 ? 'Übergewicht'
    : 'Adipositas';
  return `${wert.toFixed(1)} (${kategorie})`;
}

function dauerText(e: Pick<SymptomEintrag, 'datum' | 'endDate'>): string {
  const minuten = dauerMinuten(e);
  if (!minuten) return '–';
  if (minuten < 60) return `${minuten} Min.`;
  const h = Math.floor(minuten / 60);
  const m = minuten % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function intensitaetFarbe(wert: number): string {
  if (wert <= 3) return '#34C759';
  if (wert <= 6) return '#FF9500';
  return '#FF3B30';
}

function escHtml(s: string | null | undefined): string {
  if (!s) return '–';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── HTML-Generierung ──────────────────────────────────────────────────────────

function symptomZeilen(eintraege: SymptomEintrag[]): string {
  if (eintraege.length === 0) {
    return '<tr><td colspan="6" class="leer">Keine Einträge vorhanden</td></tr>';
  }
  return eintraege.map((e, i) => `
    <tr class="${i % 2 === 0 ? 'gerade' : 'ungerade'}">
      <td>${escHtml(formatDatumZeit(e.datum))}</td>
      <td>${escHtml(e.symptomTypName)}</td>
      <td><span class="badge" style="background:${intensitaetFarbe(e.intensitaet)}">${e.intensitaet}</span></td>
      <td>${dauerText(e)}</td>
      <td>${escHtml(e.ausloser)}</td>
      <td>${escHtml(e.notiz)}</td>
    </tr>`).join('');
}

function arztbesuchZeilen(besuche: Arztbesuch[]): string {
  if (besuche.length === 0) {
    return '<tr><td colspan="6" class="leer">Keine Arztbesuche vorhanden</td></tr>';
  }
  return besuche.map((b, i) => `
    <tr class="${i % 2 === 0 ? 'gerade' : 'ungerade'}">
      <td>${escHtml(formatDatum(b.datum))}</td>
      <td>${escHtml(b.arztname)}</td>
      <td>${escHtml(b.fachrichtung)}</td>
      <td>${escHtml(b.grund)}</td>
      <td>${escHtml(b.befund)}</td>
      <td>${escHtml(b.notiz)}</td>
    </tr>`).join('');
}

function bauHtml(profil: Profil, eintraege: SymptomEintrag[], besuche: Arztbesuch[]): string {
  const exportDatum = new Date().toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const name = [profil.vorname, profil.nachname].filter(Boolean).join(' ') || '–';

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FredoCare Gesundheitsbericht</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, Helvetica, Arial, sans-serif;
      font-size: 12px;
      color: #1a1a1a;
      padding: 32px 40px;
      line-height: 1.5;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid #5B8DEF;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .app-name { font-size: 22px; font-weight: 700; color: #5B8DEF; }
    .export-meta { font-size: 11px; color: #666; text-align: right; }
    h2 {
      font-size: 15px;
      font-weight: 700;
      color: #5B8DEF;
      margin: 28px 0 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #dde5fa;
    }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .info-table th {
      text-align: left;
      font-weight: 600;
      color: #555;
      width: 140px;
      padding: 5px 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .info-table td { padding: 5px 8px; }
    table.daten { width: 100%; border-collapse: collapse; page-break-inside: auto; }
    table.daten thead tr { background: #5B8DEF; color: white; }
    table.daten th {
      padding: 7px 8px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
    }
    table.daten td { padding: 6px 8px; vertical-align: top; }
    tr.gerade { background: #f8f9ff; }
    tr.ungerade { background: #ffffff; }
    .badge {
      display: inline-block;
      color: white;
      font-weight: 700;
      font-size: 11px;
      border-radius: 10px;
      padding: 2px 8px;
      min-width: 24px;
      text-align: center;
    }
    .leer { text-align: center; color: #999; padding: 16px; font-style: italic; }
    footer {
      margin-top: 40px;
      text-align: center;
      font-size: 10px;
      color: #aaa;
      border-top: 1px solid #eee;
      padding-top: 12px;
    }
  </style>
</head>
<body>
  <header>
    <div>
      <div class="app-name">FredoCare</div>
      <div style="font-size:12px;color:#666;margin-top:2px">Gesundheitsbericht</div>
    </div>
    <div class="export-meta">
      Exportiert am ${exportDatum}<br>
      ${eintraege.length} Symptomeinträge · ${besuche.length} Arztbesuche
    </div>
  </header>

  <h2>Persönliche Daten</h2>
  <table class="info-table">
    <tr><th>Name</th><td>${escHtml(name)}</td></tr>
    <tr><th>Geburtsdatum</th><td>${profil.geburtsdatum ? `${formatDatum(profil.geburtsdatum)} (${alter(profil.geburtsdatum)})` : '–'}</td></tr>
    <tr><th>Geschlecht</th><td>${escHtml(profil.geschlecht)}</td></tr>
    <tr><th>Größe</th><td>${profil.groesse ? `${profil.groesse} cm` : '–'}</td></tr>
    <tr><th>Gewicht</th><td>${profil.gewicht ? `${profil.gewicht} kg` : '–'}</td></tr>
    <tr><th>BMI</th><td>${bmi(profil)}</td></tr>
  </table>

  <h2>Symptomeinträge (${eintraege.length})</h2>
  <table class="daten">
    <thead>
      <tr>
        <th style="width:120px">Datum &amp; Zeit</th>
        <th style="width:100px">Symptom</th>
        <th style="width:60px">Intensität</th>
        <th style="width:70px">Dauer</th>
        <th style="width:120px">Auslöser</th>
        <th>Notiz</th>
      </tr>
    </thead>
    <tbody>
      ${symptomZeilen(eintraege)}
    </tbody>
  </table>

  <h2>Arztbesuche (${besuche.length})</h2>
  <table class="daten">
    <thead>
      <tr>
        <th style="width:80px">Datum</th>
        <th style="width:110px">Arzt</th>
        <th style="width:100px">Fachrichtung</th>
        <th style="width:110px">Grund</th>
        <th style="width:110px">Befund</th>
        <th>Notiz</th>
      </tr>
    </thead>
    <tbody>
      ${arztbesuchZeilen(besuche)}
    </tbody>
  </table>

  <footer>
    Erstellt mit FredoCare &mdash; Persönlicher Gesundheitstracker
  </footer>
</body>
</html>`;
}

// ── Arztbericht-HTML ──────────────────────────────────────────────────────────

function symptomZusammenfassung(eintraege: SymptomEintrag[]): string {
  const map = new Map<string, {
    name: string; icon: string; anzahl: number;
    sumInt: number; maxInt: number; tage: Set<string>;
  }>();
  for (const e of eintraege) {
    if (!map.has(e.symptomTypId)) {
      map.set(e.symptomTypId, { name: e.symptomTypName, icon: e.symptomTypIcon, anzahl: 0, sumInt: 0, maxInt: 0, tage: new Set() });
    }
    const s = map.get(e.symptomTypId)!;
    s.anzahl++;
    s.sumInt += e.intensitaet;
    s.maxInt = Math.max(s.maxInt, e.intensitaet);
    s.tage.add(e.datum.slice(0, 10));
  }
  if (map.size === 0) return '<tr><td colspan="5" class="leer">Keine Einträge vorhanden</td></tr>';
  return Array.from(map.values())
    .sort((a, b) => b.anzahl - a.anzahl)
    .map((s, i) => `
    <tr class="${i % 2 === 0 ? 'gerade' : 'ungerade'}">
      <td>${escHtml(s.icon)} ${escHtml(s.name)}</td>
      <td style="text-align:center">${s.anzahl}</td>
      <td style="text-align:center">${(s.sumInt / s.anzahl).toFixed(1)}</td>
      <td style="text-align:center"><span class="badge" style="background:${intensitaetFarbe(s.maxInt)}">${s.maxInt}</span></td>
      <td style="text-align:center">${s.tage.size}</td>
    </tr>`).join('');
}

function bauArztberichtHtml(profil: Profil, eintraege: SymptomEintrag[], von: Date, bis: Date): string {
  const exportDatum = new Date().toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const datumOpt: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  const zeitraumText = `${von.toLocaleDateString('de-DE', datumOpt)} – ${bis.toLocaleDateString('de-DE', datumOpt)}`;
  const name = [profil.vorname, profil.nachname].filter(Boolean).join(' ') || null;

  const profilZeilen = [
    name ? `<tr><th>Name</th><td>${escHtml(name)}</td></tr>` : '',
    profil.geburtsdatum ? `<tr><th>Geburtsdatum</th><td>${formatDatum(profil.geburtsdatum)} (${alter(profil.geburtsdatum)})</td></tr>` : '',
    profil.geschlecht ? `<tr><th>Geschlecht</th><td>${escHtml(profil.geschlecht)}</td></tr>` : '',
    profil.groesse ? `<tr><th>Größe</th><td>${profil.groesse} cm</td></tr>` : '',
    profil.gewicht ? `<tr><th>Gewicht</th><td>${profil.gewicht} kg</td></tr>` : '',
    (profil.groesse && profil.gewicht) ? `<tr><th>BMI</th><td>${bmi(profil)}</td></tr>` : '',
  ].filter(Boolean).join('');

  const sortiertEintraege = eintraege.slice().sort(
    (a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime()
  );

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>FredoCare – Bericht für Arztbesuch</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, Helvetica, Arial, sans-serif;
      font-size: 12px; color: #1a1a1a; padding: 32px 40px; line-height: 1.5;
    }
    @page {
      size: A4;
      margin: 20mm 15mm 25mm;
      @bottom-right {
        content: "Seite " counter(page) " von " counter(pages);
        font-size: 10px; color: #aaa;
      }
    }
    header {
      display: flex; justify-content: space-between; align-items: flex-end;
      border-bottom: 2px solid #5B8DEF; padding-bottom: 12px; margin-bottom: 24px;
    }
    .app-name { font-size: 22px; font-weight: 700; color: #5B8DEF; }
    .export-meta { font-size: 11px; color: #666; text-align: right; }
    h2 {
      font-size: 15px; font-weight: 700; color: #5B8DEF;
      margin: 28px 0 10px; padding-bottom: 4px; border-bottom: 1px solid #dde5fa;
    }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .info-table th {
      text-align: left; font-weight: 600; color: #555; width: 140px;
      padding: 5px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px;
    }
    .info-table td { padding: 5px 8px; }
    table.daten { width: 100%; border-collapse: collapse; page-break-inside: auto; }
    table.daten thead { display: table-header-group; }
    table.daten thead tr { background: #5B8DEF; color: white; }
    table.daten th { padding: 7px 8px; text-align: left; font-size: 11px; font-weight: 600; }
    table.daten td { padding: 6px 8px; vertical-align: top; }
    tr.gerade { background: #f8f9ff; }
    tr.ungerade { background: #ffffff; }
    .badge {
      display: inline-block; color: white; font-weight: 700; font-size: 11px;
      border-radius: 10px; padding: 2px 8px; min-width: 24px; text-align: center;
    }
    .leer { text-align: center; color: #999; padding: 16px; font-style: italic; }
    footer {
      margin-top: 40px; text-align: center; font-size: 10px; color: #aaa;
      border-top: 1px solid #eee; padding-top: 12px;
    }
  </style>
</head>
<body>
  <header>
    <div>
      <div class="app-name">FredoCare</div>
      <div style="font-size:13px;color:#444;margin-top:2px;font-weight:600">Bericht für Arztbesuch</div>
      <div style="font-size:11px;color:#888;margin-top:4px">Zeitraum: ${zeitraumText}</div>
    </div>
    <div class="export-meta">
      Exportiert am ${exportDatum}<br>
      ${eintraege.length} Symptomeinträge
    </div>
  </header>

  ${profilZeilen ? `
  <h2>Persönliche Daten</h2>
  <table class="info-table">${profilZeilen}</table>
  ` : ''}

  <h2>Zusammenfassung</h2>
  <table class="daten">
    <thead>
      <tr>
        <th>Symptom</th>
        <th style="width:70px;text-align:center">Anzahl</th>
        <th style="width:100px;text-align:center">Ø Intensität</th>
        <th style="width:110px;text-align:center">Max. Intensität</th>
        <th style="width:130px;text-align:center">Tage mit Symptom</th>
      </tr>
    </thead>
    <tbody>${symptomZusammenfassung(eintraege)}</tbody>
  </table>

  <h2>Symptomeinträge (${eintraege.length})</h2>
  <table class="daten">
    <thead>
      <tr>
        <th style="width:120px">Datum &amp; Zeit</th>
        <th style="width:100px">Symptom</th>
        <th style="width:60px">Intensität</th>
        <th style="width:70px">Dauer</th>
        <th style="width:120px">Auslöser</th>
        <th>Notiz</th>
      </tr>
    </thead>
    <tbody>${symptomZeilen(sortiertEintraege)}</tbody>
  </table>

  <footer>Erstellt mit FredoCare &mdash; Persönlicher Gesundheitstracker</footer>
</body>
</html>`;
}

// ── Öffentliche Funktionen ────────────────────────────────────────────────────

export async function arztberichtAlsPdfTeilen(
  eintraege: SymptomEintrag[],
  von: Date,
  bis: Date,
): Promise<void> {
  const verfuegbar = await Sharing.isAvailableAsync();
  if (!verfuegbar) {
    Alert.alert('Nicht verfügbar', 'Das Teilen ist auf diesem Gerät nicht möglich.');
    return;
  }
  const profil = await profilLaden();
  const html = bauArztberichtHtml(profil, eintraege, von, bis);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Arztbericht teilen',
  });
}

export async function gesundheitsdatenAlsPdfTeilen(): Promise<void> {
  const verfuegbar = await Sharing.isAvailableAsync();
  if (!verfuegbar) {
    Alert.alert('Nicht verfügbar', 'Das Teilen ist auf diesem Gerät nicht möglich.');
    return;
  }

  const [profil, eintraege, besuche] = await Promise.all([
    profilLaden(),
    alleEintraege(),
    alleArztbesuche(),
  ]);

  const html = bauHtml(profil, eintraege, besuche);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Gesundheitsbericht teilen',
  });
}
