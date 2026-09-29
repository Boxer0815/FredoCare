import { useState, useEffect, useCallback } from 'react';
import {
  alleEintraege,
  alleSymptomTypen,
  eintragAnlegen,
  eintragAktualisieren,
  eintragLoeschen,
  symptomTypAnlegen,
  symptomTypLoeschen,
} from '../db/database';
import type { SymptomEintrag, SymptomTyp, NeuerSymptomEintrag } from '../types';

export function useEintraege() {
  const [eintraege, setEintraege] = useState<SymptomEintrag[]>([]);
  const [laden, setLaden] = useState(true);

  const laden_ = useCallback(async () => {
    setLaden(true);
    const data = await alleEintraege();
    setEintraege(data);
    setLaden(false);
  }, []);

  useEffect(() => { laden_(); }, [laden_]);

  const hinzufuegen = useCallback(async (e: NeuerSymptomEintrag) => {
    await eintragAnlegen(e);
    await laden_();
  }, [laden_]);

  const aktualisieren = useCallback(async (id: string, e: NeuerSymptomEintrag) => {
    await eintragAktualisieren(id, e);
    await laden_();
  }, [laden_]);

  const loeschen = useCallback(async (id: string) => {
    await eintragLoeschen(id);
    await laden_();
  }, [laden_]);

  return { eintraege, laden, aktualisieren, hinzufuegen, loeschen, neu: laden_ };
}

export function useSymptomTypen() {
  const [typen, setTypen] = useState<SymptomTyp[]>([]);
  const [laden, setLaden] = useState(true);

  const laden_ = useCallback(async () => {
    setLaden(true);
    const data = await alleSymptomTypen();
    setTypen(data);
    setLaden(false);
  }, []);

  useEffect(() => { laden_(); }, [laden_]);

  const anlegen = useCallback(async (name: string, icon: string, farbe: string) => {
    const typ = await symptomTypAnlegen(name, icon, farbe);
    await laden_();
    return typ;
  }, [laden_]);

  const loeschen = useCallback(async (id: string) => {
    await symptomTypLoeschen(id);
    await laden_();
  }, [laden_]);

  return { typen, laden, anlegen, loeschen, neu: laden_ };
}
