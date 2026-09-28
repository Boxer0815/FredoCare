import { useState, useEffect, useCallback } from 'react';
import { profilLaden, profilSpeichern } from '../db/database';
import type { Profil } from '../types';

const leerProfil: Profil = {
  vorname: '', nachname: '', geburtsdatum: null,
  geschlecht: null, groesse: null, gewicht: null,
};

export function useProfil() {
  const [profil, setProfil] = useState<Profil>(leerProfil);
  const [laden, setLaden] = useState(true);

  const laden_ = useCallback(async () => {
    setLaden(true);
    const data = await profilLaden();
    setProfil(data);
    setLaden(false);
  }, []);

  useEffect(() => { laden_(); }, [laden_]);

  const speichern = useCallback(async (p: Profil) => {
    await profilSpeichern(p);
    setProfil(p);
  }, []);

  return { profil, laden, speichern, neu: laden_ };
}
