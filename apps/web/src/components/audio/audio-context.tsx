"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type NowPlaying = {
  slug: string;
  title: string;
  url: string;
  titleLatin?: string | null;
};

type AudioContextValue = {
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  /** Seconds */
  currentTime: number;
  /** Seconds (0 if unknown) */
  duration: number;
  play: (track: NowPlaying) => void;
  toggle: () => void;
  close: () => void;
  seek: (seconds: number) => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

export function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor(seconds / 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback((track: NowPlaying) => {
    setNowPlaying(track);
    setIsPlaying(true);
  }, []);

  const toggle = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const close = useCallback(() => {
    setIsPlaying(false);
    setNowPlaying(null);
    setCurrentTime(0);
    setDuration(0);
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    const el = audioRef.current;
    if (!el || !nowPlaying) return;
    const cap =
      el.duration && Number.isFinite(el.duration) ? el.duration : Infinity;
    const t = Math.max(0, Math.min(seconds, cap));
    el.currentTime = t;
    setCurrentTime(t);
  }, [nowPlaying]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !nowPlaying) return;

    if (el.src !== nowPlaying.url) {
      el.src = nowPlaying.url;
      el.load();
      setCurrentTime(0);
      setDuration(0);
    }

    if (isPlaying) void el.play().catch(() => setIsPlaying(false));
    else el.pause();
  }, [nowPlaying, isPlaying]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTime = () => setCurrentTime(el.currentTime);
    const onMeta = () => setDuration(el.duration && Number.isFinite(el.duration) ? el.duration : 0);
    const onDur = () => setDuration(el.duration && Number.isFinite(el.duration) ? el.duration : 0);
    const onEnded = () => setIsPlaying(false);

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onDur);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onDur);
      el.removeEventListener("ended", onEnded);
    };
  }, [nowPlaying?.url]);

  const value = useMemo(
    () => ({
      nowPlaying,
      isPlaying,
      currentTime,
      duration,
      play,
      toggle,
      close,
      seek,
    }),
    [
      nowPlaying,
      isPlaying,
      currentTime,
      duration,
      play,
      toggle,
      close,
      seek,
    ],
  );

  return (
    <AudioContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        className="hidden"
        preload="metadata"
        playsInline
      />
    </AudioContext.Provider>
  );
}
