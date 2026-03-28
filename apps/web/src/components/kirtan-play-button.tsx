"use client";

import { Button } from "@ngb/ui";
import { useAudio } from "./audio/audio-context";

type Props = {
  slug: string;
  title: string;
  titleLatin?: string | null;
  url: string;
  label?: string;
};

export function KirtanPlayButton({
  slug,
  title,
  titleLatin,
  url,
  label = "Play audio",
}: Props) {
  const { nowPlaying, isPlaying, play, toggle } = useAudio();
  const active = nowPlaying?.slug === slug && nowPlaying?.url === url;

  return (
    <Button
      type="button"
      size="lg"
      variant={active && isPlaying ? "secondary" : "default"}
      className="rounded-full px-6"
      aria-pressed={active && isPlaying}
      onClick={() => {
        if (active) toggle();
        else play({ slug, title, url, titleLatin });
      }}
    >
      {active && isPlaying ? "Pause" : label}
    </Button>
  );
}
