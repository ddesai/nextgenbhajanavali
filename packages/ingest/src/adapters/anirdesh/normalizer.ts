import type { IngestQueueItem, NormalizedKirtan } from "@ngb/content-schema";
import { NormalizedKirtanSchema } from "@ngb/content-schema";
import type { AnirdeshKirtanApi } from "@ngb/content-schema";
import { sha256Hex } from "../../core/checksum.js";
import { textFromHtml } from "../../core/html.js";
import { ANIRDESH_ADAPTER_ID, ANIRDESH_BASE } from "./config.js";

function resolveMediaUrl(u: string | undefined): string | undefined {
  if (!u?.trim()) return undefined;
  const s = u.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("//")) return `https:${s}`;
  if (s.startsWith("/")) return `https://www.anirdesh.com${s}`;
  return `${ANIRDESH_BASE}/${s.replace(/^\//, "")}`;
}

function padNo(n: number, w: number) {
  return String(n).padStart(w, "0");
}

function ingestSlug(part: number, no: number) {
  return `anirdesh-p${part}-n${padNo(no, 4)}`;
}

function sourceKey(part: number, no: number) {
  return `${ANIRDESH_ADAPTER_ID}:${part}:${no}`;
}

function canonicalChecksumPayload(data: AnirdeshKirtanApi) {
  return JSON.stringify({
    kid: data.kid,
    part: data.part,
    no: data.no,
    title_gu: data.title_gu,
    gujarati: data.gujarati,
    english: data.english,
    category_gu: data.category_gu,
    is_audio: data.is_audio,
    audio_url: data.audio_url ?? null,
    translation_en: (data as { translation_en?: string }).translation_en ?? null,
  });
}

export function anirdeshQueueItem(part: number, no: number): IngestQueueItem {
  return {
    adapterId: ANIRDESH_ADAPTER_ID,
    sourceKey: sourceKey(part, no),
    sourceUrl: `${ANIRDESH_BASE}/index.php?lang=EN&part=${part}&no=${no}`,
    part,
    no,
  };
}

export function anirdeshToNormalized(
  data: AnirdeshKirtanApi,
  ctx: { fetchedAt: string; queueItem: IngestQueueItem },
): NormalizedKirtan {
  const part = data.part;
  const no = data.no;
  const url =
    ctx.queueItem.sourceUrl ??
    `${ANIRDESH_BASE}/index.php?lang=EN&part=${part}&no=${no}`;

  let gu = (data.gujarati ?? "").trim();
  if (!gu && data.html_gu)
    gu = textFromHtml(data.html_gu).replace(/\r\n/g, "\n").trim();

  let tr = (data.english ?? "").trim();
  if (!tr && data.html_en)
    tr = textFromHtml(data.html_en).replace(/\r\n/g, "\n").trim();

  const ext = data as {
    translation_en?: string;
    english_translation?: string;
  };
  const translation =
    (ext.translation_en ?? ext.english_translation ?? "").trim() || undefined;

  const hasAudioFlag =
    Number(data.is_audio) === 1 ||
    (!!data.audio_url && String(data.audio_url).length > 0);
  const audioUrl = resolveMediaUrl(
    hasAudioFlag ? (data.audio_url ? String(data.audio_url) : undefined) : undefined,
  );
  const hasAudio = hasAudioFlag && !!audioUrl;

  const videoUrls =
    Array.isArray(data.videos) && data.videos.length > 0
      ? data.videos
          .map((v) => resolveMediaUrl(String(v)))
          .filter((x): x is string => !!x)
      : undefined;

  const titleLatin = (data.title_en ?? "").trim() || undefined;
  const author = (data.writer_gu ?? "").trim() || undefined;
  const authorLatin = (data.writer_en ?? "").trim() || undefined;

  const normalizedDraft = {
    adapterId: ANIRDESH_ADAPTER_ID,
    sourceUrl: url,
    sourceKey: ctx.queueItem.sourceKey,
    checksumSha256: sha256Hex(canonicalChecksumPayload(data)),
    part,
    number: no,
    titleGujarati: data.title_gu,
    titleLatin,
    author,
    authorLatin,
    categoryGujarati: data.category_gu || undefined,
    categoryEnglish: data.category_en || undefined,
    raagGujarati: data.raags_gu || undefined,
    raagEnglish: data.raags_en || undefined,
    gujaratiLyrics: gu || undefined,
    transliteration: tr || undefined,
    englishTranslation: translation,
    audioUrl,
    videoUrls,
    availability: {
      hasGujaratiLyrics: !!gu,
      hasTransliteration: !!tr,
      hasEnglishTranslation: !!translation,
      hasAudio,
      hasVideo: !!videoUrls?.length,
    },
    canonicalContentId: data.kid,
    capturedAt: ctx.fetchedAt,
    extras: {
      anirdeshId: data.id,
      family: data.family,
      hindi: data.hindi,
      prev_no: data.prev_no,
      next_no: data.next_no,
    },
  };

  return NormalizedKirtanSchema.parse(normalizedDraft);
}

export function resolveAnirdeshIngestIds(n: NormalizedKirtan): {
  slug: string;
  externalId: string;
} {
  if (n.adapterId !== ANIRDESH_ADAPTER_ID)
    throw new Error(`Expected ${ANIRDESH_ADAPTER_ID}, got ${n.adapterId}`);
  const part = n.part ?? 0;
  const no = n.number ?? 0;
  if (!part || !no) throw new Error("anirdesh normalized record missing part/number");
  return { slug: ingestSlug(part, no), externalId: `${part}:${no}` };
}
