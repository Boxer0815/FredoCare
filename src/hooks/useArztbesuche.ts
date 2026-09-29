import { useState, useEffect, useCallback } from 'react';
import {
  alleArztbesuche,
  arztbesuchAnlegen,
  arztbesuchAktualisieren,
  arztbesuchLoeschen,
} from '../db/database';
import type { Arztbesuch, NeuerArztbesuch } from '../types';

export function useArztbesuche() {
  const [besuche, setBesuche] = useState<Arztbesuch[]>([]);
  const [laden, setLaden] = useState(true);

  const laden_ = useCallback(async () => {
    setLaden(true);
    const data = await alleArztbesuche();
    setBesuche(data);
    setLaden(false);
  }, []);

  useEffect(() => { laden_(); }, [laden_]);

  const hinzufuegen = useCallback(async (b: NeuerArztbesuch) => {
    await arztbesuchAnlegen(b);
    await laden_();
  }, [laden_]);

  const aktualisieren = useCallback(async (id: string, b: NeuerArztbesuch) => {
    await arztbesuchAktualisieren(id, b);
    await laden_();
  }, [laden_]);

  const loeschen = useCallback(async (id: string) => {
    await arztbesuchLoeschen(id);
    await laden_();
  }, [laden_]);

  return { besuche, laden, hinzufuegen, aktualisieren, loeschen, neu: laden_ };
}
