"use client";

import { useCallback, useState } from "react";
import { Button } from "@ngb/ui";
import { useKirtanReader } from "./kirtan-reader-context";

type Props = {
  /** Plain text to copy for the active lyrics tab */
  copyText: string;
  shareTitle: string;
  shareUrl: string;
  canSplitView: boolean;
};

export function KirtanDetailToolbar({
  copyText,
  shareTitle,
  shareUrl,
  canSplitView,
}: Props) {
  const { lyricsScale, incScale, decScale, layoutMode, setLayoutMode } =
    useKirtanReader();
  const [status, setStatus] = useState("");

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setStatus("Copied to clipboard");
      setTimeout(() => setStatus(""), 2500);
    } catch {
      setStatus("Could not copy");
      setTimeout(() => setStatus(""), 2500);
    }
  }, [copyText]);

  const onShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url: shareUrl });
        setStatus("");
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setStatus("Link copied");
        setTimeout(() => setStatus(""), 2500);
      }
    } catch {
      /* user cancelled share */
    }
  }, [shareTitle, shareUrl]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          aria-label="Copy lyrics from the open tab"
          disabled={!copyText.trim()}
          onClick={() => void onCopy()}
        >
          Copy text
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          aria-label="Share this kirtan"
          onClick={() => void onShare()}
        >
          Share
        </Button>
        <span
          role="status"
          aria-live="polite"
          className="sr-only"
        >
          {status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground max-sm:w-full">
          Text size
        </span>
        <div className="inline-flex rounded-full border border-border/80 bg-muted/40 p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-2.5 text-xs"
            aria-label="Smaller lyrics text"
            disabled={lyricsScale <= 0}
            onClick={decScale}
          >
            A−
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-2.5 text-xs"
            aria-label="Larger lyrics text"
            disabled={lyricsScale >= 4}
            onClick={incScale}
          >
            A+
          </Button>
        </div>

        {canSplitView ? (
          <div className="hidden items-center gap-2 lg:flex">
            <span className="text-xs text-muted-foreground">Layout</span>
            <div className="inline-flex rounded-full border border-border/80 bg-muted/40 p-0.5">
              <Button
                type="button"
                variant={layoutMode === "tabs" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                aria-pressed={layoutMode === "tabs"}
                onClick={() => setLayoutMode("tabs")}
              >
                Tabs
              </Button>
              <Button
                type="button"
                variant={layoutMode === "split" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                aria-pressed={layoutMode === "split"}
                onClick={() => setLayoutMode("split")}
              >
                Side by side
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
