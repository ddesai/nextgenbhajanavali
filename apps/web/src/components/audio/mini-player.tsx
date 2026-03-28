"use client";

import Link from "next/link";
import { Button } from "@ngb/ui";
import { formatAudioTime, useAudio } from "./audio-context";

export function MiniPlayer() {
  const { nowPlaying, isPlaying, toggle, close, currentTime, duration, seek } =
    useAudio();

  if (!nowPlaying) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-card/95 px-3 pt-2 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md md:bottom-4 md:left-1/2 md:right-auto md:w-full md:max-w-lg md:-translate-x-1/2 md:rounded-2xl md:border md:px-4 md:pb-2 md:pt-3"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      role="region"
      aria-label="Audio player"
    >
      <div
        className="mx-auto max-w-3xl pb-2"
        onPointerDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <label htmlFor="mini-player-progress" className="sr-only">
          Playback position
        </label>
        <input
          id="mini-player-progress"
          type="range"
          min={0}
          max={duration > 0 ? duration : 100}
          step={0.25}
          value={duration > 0 ? currentTime : 0}
          disabled={duration <= 0}
          aria-valuetext={`${formatAudioTime(currentTime)} of ${formatAudioTime(duration)}`}
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="mb-1 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary disabled:opacity-50"
        />
        <div className="flex justify-between text-[0.65rem] tabular-nums text-muted-foreground">
          <span>{formatAudioTime(currentTime)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>

      <div className="mx-auto flex max-w-3xl items-center gap-3 pb-1">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="shrink-0 rounded-full"
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={toggle}
        >
          {isPlaying ? (
            <PauseIcon className="h-5 w-5" />
          ) : (
            <PlayIcon className="h-5 w-5" />
          )}
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            <Link
              href={`/kirtans/${nowPlaying.slug}`}
              className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {nowPlaying.title}
            </Link>
          </p>
          {nowPlaying.titleLatin ? (
            <p className="truncate text-xs text-muted-foreground" lang="gu-Latn">
              {nowPlaying.titleLatin}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground"
          aria-label="Close player"
          onClick={close}
        >
          <CloseIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
