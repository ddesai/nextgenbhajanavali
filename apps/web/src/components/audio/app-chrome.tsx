"use client";

import type { ReactNode } from "react";
import { AudioProvider } from "./audio-context";
import { MiniPlayer } from "./mini-player";

export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <AudioProvider>
      {children}
      <MiniPlayer />
    </AudioProvider>
  );
}
