"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const SCALE_STORAGE = "ngb-kirtan-lyrics-scale";
const LAYOUT_STORAGE = "ngb-kirtan-reader-layout";

export type LyricsScale = 0 | 1 | 2 | 3 | 4;

/** Maps to Tailwind-style steps applied in LyricsBody. */
export const LYRICS_SCALE_CLASSES: Record<LyricsScale, string> = {
  0: "text-base leading-[1.75] md:text-lg md:leading-[1.8]",
  1: "text-lg leading-[1.8] md:text-xl md:leading-[1.85]",
  2: "text-xl leading-[1.85] md:text-2xl md:leading-[1.9]",
  3: "text-2xl leading-[1.9] md:text-3xl md:leading-[1.95]",
  4: "text-3xl leading-[1.95] md:text-[1.75rem] md:leading-[2]",
};

export type ReaderLayoutMode = "tabs" | "split";

type Ctx = {
  lyricsScale: LyricsScale;
  setLyricsScale: (v: LyricsScale) => void;
  incScale: () => void;
  decScale: () => void;
  layoutMode: ReaderLayoutMode;
  setLayoutMode: (v: ReaderLayoutMode) => void;
};

const KirtanReaderContext = createContext<Ctx | null>(null);

export function KirtanReaderProvider({ children }: { children: React.ReactNode }) {
  const [lyricsScale, setLyricsScaleState] = useState<LyricsScale>(2);
  const [layoutMode, setLayoutModeState] = useState<ReaderLayoutMode>("tabs");

  useEffect(() => {
    try {
      const s = localStorage.getItem(SCALE_STORAGE);
      if (s !== null) {
        const n = parseInt(s, 10);
        if (n >= 0 && n <= 4) setLyricsScaleState(n as LyricsScale);
      }
      const l = localStorage.getItem(LAYOUT_STORAGE);
      if (l === "split" || l === "tabs") setLayoutModeState(l);
    } catch {
      /* ignore */
    }
  }, []);

  const setLyricsScale = useCallback((v: LyricsScale) => {
    setLyricsScaleState(v);
    try {
      localStorage.setItem(SCALE_STORAGE, String(v));
    } catch {
      /* ignore */
    }
  }, []);

  const incScale = useCallback(() => {
    setLyricsScaleState((c) => {
      const n = Math.min(4, c + 1) as LyricsScale;
      try {
        localStorage.setItem(SCALE_STORAGE, String(n));
      } catch {
        /* ignore */
      }
      return n;
    });
  }, []);

  const decScale = useCallback(() => {
    setLyricsScaleState((c) => {
      const n = Math.max(0, c - 1) as LyricsScale;
      try {
        localStorage.setItem(SCALE_STORAGE, String(n));
      } catch {
        /* ignore */
      }
      return n;
    });
  }, []);

  const setLayoutMode = useCallback((v: ReaderLayoutMode) => {
    setLayoutModeState(v);
    try {
      localStorage.setItem(LAYOUT_STORAGE, v);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      lyricsScale,
      setLyricsScale,
      incScale,
      decScale,
      layoutMode,
      setLayoutMode,
    }),
    [lyricsScale, setLyricsScale, incScale, decScale, layoutMode, setLayoutMode],
  );

  return (
    <KirtanReaderContext.Provider value={value}>
      {children}
    </KirtanReaderContext.Provider>
  );
}

export function useKirtanReader() {
  const ctx = useContext(KirtanReaderContext);
  if (!ctx) {
    throw new Error("useKirtanReader must be used within KirtanReaderProvider");
  }
  return ctx;
}
