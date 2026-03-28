# Swaminarayan ingest: crawler architecture

This document describes the **source-adapter** framework for pulling kirtans into Next Gen Bhajanavali without coupling crawlers to the Next.js UI.

## Layered architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Discovery (range / manifest / index) → queue.jsonl              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ Crawl (Playwright `request` API, polite delays) → raw snapshots │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ Parse (per adapter: JSON schema / Cheerio for HTML)             │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ Normalize → NormalizedKirtan (Zod)                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ Map → IngestRecord → upsertIngestRecord (@ngb/db)               │
└─────────────────────────────────────────────────────────────────┘
```

- **Discovery** emits `IngestQueueItem` rows (no requirement to persist full documents).
- **Crawl** persists **raw** bodies under `.ingest/<adapter>/snapshots/` for debugging and reproducibility.
- **Parse + normalize** are pure per adapter; cross-source contracts live in `@ngb/content-schema`.
- **Sync** uses the same Prisma upsert path as `tools/sync`, shared via `upsertIngestRecord`.

## Source adapter interface

Implemented in `packages/ingest/src/core/adapter-interface.ts`:

| Phase | Responsibility |
|--------|------------------|
| `discoverRange` | Async iterable of `IngestQueueItem` (keys + URLs). |
| `crawlOne` | Playwright network I/O, return `RawCrawlResult` with `body` string. |
| `parseSnapshotBody` | Deserialize + validate (throw on unusable payloads). |
| `normalize` | Produce `NormalizedKirtan` (Zod). |

Register new sources in `packages/ingest/src/adapters/registry.ts` and add `config/sources/<id>.json`.

**Developer guide:** [SOURCES.md](./SOURCES.md) · **Scale notes:** [ARCHITECTURE-SCALE.md](./ARCHITECTURE-SCALE.md)

List registered ids: `pnpm ingest:list-adapters`.

## Anirdesh adapter (`anirdesh`)

- **Endpoint**: `POST https://www.anirdesh.com/kirtan/getkirtan.php` with `part` & `no` (same contract the site’s SPA uses).
- **Crawl**: Playwright `BrowserContext.request` (headless Chromium) with configurable `--delay-ms` between calls.
- **Parse**: `@ngb/content-schema` `AnirdeshKirtanApiSchema` (+ error responses).
- **Normalize**: fills `NormalizedKirtan` from `gujarati` / `english` / optional `translation_en` passthrough, raag fields, audio URL resolution, etc.
- **Cheerio** (`textFromHtml`) strips `html_gu` / `html_en` when plain fields are empty.

**Polite use**: keep default delay ≥ 750ms; do not raise concurrency without permission from the site operator. Verify copyright and `robots.txt` / terms before large crawls.

## Normalized JSON (`NormalizedKirtan`)

Schema: `NormalizedKirtanSchema` in `@ngb/content-schema`.

Notable fields:

| Field | Meaning |
|--------|---------|
| `sourceUrl` | Canonical viewer URL |
| `sourceKey` | Stable adapter key, e.g. `anirdesh:1:42` |
| `part` / `number` | Anirdesh volume & sequence |
| `titleGujarati` | `title_gu` |
| `titleLatin` | `title_en` (diacritic transliteration) |
| `author` / `authorLatin` | `writer_gu` / `writer_en` |
| `categoryGujarati` / `categoryEnglish` | Categories |
| `raagGujarati` / `raagEnglish` | When present |
| `gujaratiLyrics` | Plain Gujarati lines |
| `transliteration` | Latin transliteration (`english` on API) |
| `englishTranslation` | When future fields or `translation_en` exist |
| `audioUrl` | Absolute URL when audio exists |
| `videoUrls[]` | Optional |
| `availability.*` | Derived booleans (lyrics / transliteration / translation / audio / video) |
| `checksumSha256` | Canonical payload hash for dedup |
| `canonicalContentId` | Anirdesh `kid` |

## Deduplication & resume

- **Checksums**: `sha256` of a canonical subset of API fields (see `anirdeshToNormalized`).
- **Resume file**: `.ingest/anirdesh/resume.json` stores `sourceKey → lastChecksum` for successful fetches.
- **CLI**: `--skip-unchanged` skips re-downloading identical raw bodies.

## Logging & errors

- Structured stderr lines with ISO timestamps.
- JSONL audit log: `.ingest/<adapter>/run.jsonl`
- Errors: `.ingest/<adapter>/errors.jsonl`

## Commands (crawl → parse → sync)

Prerequisite (one time):

```bash
pnpm install
pnpm exec playwright install chromium
pnpm turbo run build --filter=@ngb/content-schema --filter=@ngb/db --filter=@ngb/ingest
```

Set `DATABASE_URL` in the environment for `sync`.

### 1. Discovery (local, no HTTP)

Writes `.ingest/anirdesh/queue.jsonl`:

```bash
pnpm ingest discover anirdesh --data-dir .ingest --parts 1,2 --from 1 --to 30
```

### 2. Extract (Playwright → snapshots)

```bash
pnpm ingest extract anirdesh --data-dir .ingest --delay-ms 750 --skip-unchanged
# optional: --limit 100  --max-errors 5
```

### 3. Normalize (snapshots → normalized JSONL)

```bash
pnpm ingest normalize anirdesh --data-dir .ingest
```

Output: `.ingest/anirdesh/normalized.jsonl`

### 4. Sync (Postgres)

```bash
DATABASE_URL="postgresql://..." pnpm ingest sync anirdesh --data-dir .ingest
# optional: --file .ingest/anirdesh/normalized.jsonl --dry-run
```

### One-shot pipeline (without sync)

```bash
pnpm ingest pipeline anirdesh --data-dir .ingest --parts 1 --from 1 --to 10 --delay-ms 750
```

## Adding a future adapter

1. Add Zod types for raw + normalized fields in `@ngb/content-schema` if shared.
2. Implement `SourceAdapter` under `packages/ingest/src/adapters/<id>/`.
3. Register in `adapters/registry.ts`.
4. Extend `mapNormalizedToIngestRecord` when DB mapping differs materially.
