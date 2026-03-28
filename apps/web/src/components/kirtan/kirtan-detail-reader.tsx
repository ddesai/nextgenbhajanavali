"use client";

import type { KirtanDetail } from "@ngb/content-schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ngb/ui";
import { useMemo, useState } from "react";
import { KirtanDetailToolbar } from "./kirtan-detail-toolbar";
import { LyricsBody, splitLyricsIntoStanzas } from "./lyrics-body";
import { useKirtanReader } from "./kirtan-reader-context";
import { KirtanVerseJump } from "./kirtan-verse-jump";

type Props = {
  detail: KirtanDetail;
  slug: string;
  shareUrl: string;
};

function joinLocale(gu?: string | null, en?: string | null) {
  const parts = [gu, en].filter(Boolean) as string[];
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

function infoAsPlain(detail: KirtanDetail): string {
  const lines: string[] = [];
  lines.push(`Source: ${detail.sourceName}`);
  const cat = joinLocale(detail.info?.categoryGujarati, detail.info?.categoryEnglish);
  if (cat) lines.push(`Category: ${cat}`);
  const raag = joinLocale(detail.info?.raagGujarati, detail.info?.raagEnglish);
  if (raag) lines.push(`Raag: ${raag}`);
  const author = joinLocale(detail.info?.author, detail.info?.authorLatin);
  if (author) lines.push(`Author: ${author}`);
  if (detail.summary) lines.push(`Summary: ${detail.summary}`);
  lines.push(`Audio: ${detail.hasAudio ? "yes" : "no"}`);
  lines.push(`English translation: ${detail.hasEnglish ? "yes" : "no"}`);
  return lines.join("\n");
}

export function KirtanDetailReader({ detail, slug, shareUrl }: Props) {
  const { lyricsScale, layoutMode } = useKirtanReader();
  const gu = detail.texts.find((t) => t.kind === "GUJARATI_LYRICS");
  const latin = detail.texts.find((t) => t.kind === "TRANSLITERATION");
  const en = detail.texts.find((t) => t.kind === "ENGLISH_TRANSLATION");

  const canSplit = !!(gu?.content && latin?.content);
  const defaultTab = gu?.content ? "gu" : latin?.content ? "latin" : en?.content ? "en" : "info";

  const [tab, setTab] = useState(defaultTab);
  const [splitLower, setSplitLower] = useState<"en" | "info">(
    en?.content ? "en" : "info",
  );

  const useSplit = layoutMode === "split" && canSplit;

  const copyText = useMemo(() => {
    if (useSplit) {
      if (splitLower === "info") return infoAsPlain(detail);
      if (splitLower === "en") return en?.content?.trim() ?? "";
      return [
        gu?.content ? `Gujarati:\n${gu.content}` : "",
        latin?.content ? `Gujulish:\n${latin.content}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
    }
    switch (tab) {
      case "gu":
        return gu?.content?.trim() ?? "";
      case "latin":
        return latin?.content?.trim() ?? "";
      case "en":
        return en?.content?.trim() ?? "";
      case "info":
        return infoAsPlain(detail);
      default:
        return "";
    }
  }, [useSplit, splitLower, tab, detail, gu, latin, en]);

  const verseOutline = useMemo(() => {
    if (useSplit) {
      const n = splitLyricsIntoStanzas(gu?.content ?? "").length;
      return n >= 3 ? { idPrefix: "gu" as const, count: n } : null;
    }
    if (tab === "info") return null;
    const map: Record<string, string | undefined> = {
      gu: gu?.content,
      latin: latin?.content,
      en: en?.content,
    };
    const key = tab;
    const content = map[key];
    const n = content ? splitLyricsIntoStanzas(content).length : 0;
    const idPrefix =
      key === "gu" ? "gu" : key === "latin" ? "latin" : key === "en" ? "en" : "lyrics";
    return n >= 3 ? { idPrefix, count: n } : null;
  }, [useSplit, tab, gu, latin, en]);

  return (
    <div className="space-y-5">
      <KirtanDetailToolbar
        copyText={copyText}
        shareTitle={detail.title}
        shareUrl={shareUrl}
        canSplitView={canSplit}
      />

      {verseOutline ? (
        <KirtanVerseJump
          slug={slug}
          stanzaCount={verseOutline.count}
          idPrefix={verseOutline.idPrefix}
        />
      ) : null}

      {useSplit ? (
        <div className="space-y-10">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-3">
              <h3 className="font-display text-sm font-medium uppercase tracking-wide text-primary/90">
                Gujarati
              </h3>
              <LyricsBody
                slug={slug}
                idPrefix="gu"
                content={gu?.content}
                lyricsScale={lyricsScale}
                lang="gu"
                fontClassName="font-gujarati"
                emptyLabel="No Gujarati lyrics in this entry."
              />
            </div>
            <div className="space-y-3 lg:border-l lg:border-border/40 lg:pl-10">
              <h3 className="font-display text-sm font-medium uppercase tracking-wide text-primary/90">
                Gujulish
              </h3>
              <LyricsBody
                slug={slug}
                idPrefix="latin"
                content={latin?.content}
                lyricsScale={lyricsScale}
                lang="gu-Latn"
                emptyLabel="No transliteration in this entry."
              />
            </div>
          </div>

          <Tabs
            value={splitLower}
            onValueChange={(v) => setSplitLower(v as "en" | "info")}
            className="w-full"
          >
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="en" disabled={!en?.content}>
                English
              </TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>
            <TabsContent
              value="en"
              forceMount
              className="mt-6 data-[state=inactive]:hidden"
            >
              <LyricsBody
                slug={slug}
                idPrefix="en"
                content={en?.content}
                lyricsScale={lyricsScale}
                lang="en"
                fontClassName="font-display"
                emptyLabel="No English translation in this catalog entry yet."
              />
            </TabsContent>
            <TabsContent
              value="info"
              forceMount
              className="mt-6 data-[state=inactive]:hidden"
            >
              <InfoPanel detail={detail} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="flex w-full flex-wrap sm:flex-nowrap">
            <TabsTrigger value="gu" disabled={!gu?.content}>
              Gujarati
            </TabsTrigger>
            <TabsTrigger value="latin" disabled={!latin?.content}>
              Gujulish
            </TabsTrigger>
            <TabsTrigger value="en" disabled={!en?.content}>
              English
            </TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="gu" forceMount className="data-[state=inactive]:hidden">
            <LyricsBody
              slug={slug}
              idPrefix="gu"
              content={gu?.content}
              lyricsScale={lyricsScale}
              lang="gu"
              fontClassName="font-gujarati"
              emptyLabel="No Gujarati lyrics available yet. Try another tab or a different kirtan."
            />
          </TabsContent>
          <TabsContent value="latin" forceMount className="data-[state=inactive]:hidden">
            <LyricsBody
              slug={slug}
              idPrefix="latin"
              content={latin?.content}
              lyricsScale={lyricsScale}
              lang="gu-Latn"
              emptyLabel="No Gujulish transliteration available yet."
            />
          </TabsContent>
          <TabsContent value="en" forceMount className="data-[state=inactive]:hidden">
            <LyricsBody
              slug={slug}
              idPrefix="en"
              content={en?.content}
              lyricsScale={lyricsScale}
              lang="en"
              fontClassName="font-display"
              emptyLabel="No English translation in this catalog entry yet—Gujarati or Gujulish may still be available."
            />
          </TabsContent>
          <TabsContent value="info" forceMount className="data-[state=inactive]:hidden">
            <InfoPanel detail={detail} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function InfoPanel({ detail }: { detail: KirtanDetail }) {
  return (
    <dl className="grid gap-5 text-sm">
      <InfoRow label="Source" value={detail.sourceName} />
      <InfoRow
        label="Category"
        value={joinLocale(detail.info?.categoryGujarati, detail.info?.categoryEnglish)}
      />
      <InfoRow
        label="Raag"
        value={joinLocale(detail.info?.raagGujarati, detail.info?.raagEnglish)}
      />
      <InfoRow
        label="Author"
        value={joinLocale(detail.info?.author, detail.info?.authorLatin)}
      />
      {detail.summary ? (
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Summary
          </dt>
          <dd className="mt-1 leading-relaxed text-foreground">{detail.summary}</dd>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2 border-t border-border/40 pt-4">
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {detail.hasAudio ? "Audio linked" : "No audio linked yet"}
        </span>
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {detail.hasEnglish ? "English text available" : "No English translation"}
        </span>
      </div>
    </dl>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-foreground">{value}</dd>
    </div>
  );
}
