/**
 * Statik veri yukleyen ekranlarin ortak durumu.
 *
 * Ana sayfa, kurulum ve kaynaklar ekranlari ayni uc durumu ayri ayri
 * kurmustu: yukleniyor, veri, hata + yeniden dene. Ucunde de ayni iptal
 * bayragi vardi, cunku bileşen sokulduktan sonra gelen bir yanit `setState`
 * cagirirsa React uyarir.
 *
 * `load` her render'da yeniden tanimlanabilir; hangi surumun calistigi
 * ref uzerinden okunur, boylece efekt kimlik degisiminden tetiklenmez.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncData<T> {
  data: T | null;
  failed: boolean;
  /** Bastan yukler. Hata ekranindaki "yeniden dene" icin. */
  reload: () => void;
}

export function useAsyncData<T>(load: () => Promise<T>): AsyncData<T> {
  const [state, setState] = useState<{ data: T | null; failed: boolean }>({
    data: null,
    failed: false,
  });
  const [attempt, setAttempt] = useState(0);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let cancelled = false;

    void loadRef.current().then(
      (data) => {
        if (!cancelled) setState({ data, failed: false });
      },
      () => {
        if (!cancelled) setState({ data: null, failed: true });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Hata ekrani aninda yukleniyor durumuna donsun; yanit beklenirken eski
  // hata mesaji ekranda kalmaz.
  const reload = useCallback(() => {
    setState({ data: null, failed: false });
    setAttempt((value) => value + 1);
  }, []);

  return { ...state, reload };
}
