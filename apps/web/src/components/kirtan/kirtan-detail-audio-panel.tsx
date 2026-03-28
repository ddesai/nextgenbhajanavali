"use client";

import { Button } from "@ngb/ui";
import { formatAudioTime, useAudio } from "@/components/audio/audio-context";

type Props = {
  slug: string;
  title: string;
  titleLatin?: string | null;
  url: string;
  recordingLabel?: string | null;
};

export function KirtanDetailAudioPanel({
  slug,
  title,
  titleLatin,
  url,
  recordingLabel,
}: Props) {
  const {
    nowPlaying,
    isPlaying,
    play,
    toggle,
    currentTime,
    duration,
    seek,
  } = useAudio();

  const active = nowPlaying?.slug === slug && nowPlaying?.url === url;
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <section
      aria-labelledby="listen-heading"
      className="rounded-2xl border border-border/70 bg-gradient-to-b from-card to-muted/20 p-5 shadow-sm"
    >
      <h2 id="listen-heading" className="sr-only">
        Listen
      </h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-primary/90">
            Listen and read
          </p>
          <p className="font-medium text-foreground">
            {recordingLabel ?? "Recording"}
          </p>
          {titleLatin ? (
            <p className="truncate text-sm text-muted-foreground" lang="gu-Latn">
              {titleLatin}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          size="lg"
          variant={active && isPlaying ? "secondary" : "default"}
          className="shrink-0 rounded-full px-8"
          aria-pressed={active && isPlaying}
          onClick={() => {
            if (active) toggle();
            else play({ slug, title, url, titleLatin });
          }}
        >
          {active && isPlaying ? "Pause" : "Play"}
        </Button>
      </div>

      {active ? (
        <div className="mt-5 space-y-1">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
          <label htmlFor="detail-audio-scrub" className="sr-only">
            Seek audio
          </label>
          <input
            id="detail-audio-scrub"
            type="range"
            min={0}
            max={duration > 0 ? duration : 100}
            step={0.25}
            value={duration > 0 ? currentTime : 0}
            disabled={duration <= 0}
            aria-valuetext={`${formatAudioTime(currentTime)} of ${formatAudioTime(duration)}`}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary disabled:opacity-40"
          />
          <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
            <span>{formatAudioTime(currentTime)}</span>
            <span>{formatAudioTime(duration)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Playback continues in the bar below—you can open other pages without losing your place.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Press play to hear this track while you read. Use the mini player for quick pause and seek anytime.
        </p>
      )}
    </section>
  );
}
