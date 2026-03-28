# Adding a content source (adapter pattern)

The app and database consume **`IngestRecord`** only. Raw HTML/JSON from a site is isolated in **`@ngb/ingest`** behind a **`SourceAdapter`**. Adding a library does **not** require touching Next.js.

## 1. Pieces you implement

| Piece | Location | Purpose |
|--------|-----------|---------|
| **Adapter** | `packages/ingest/src/adapters/<your-id>/` | `discoverRange` → `crawlOne` → `parseSnapshotBody` → `normalize` → `NormalizedKirtan` |
| **Registry** | `packages/ingest/src/adapters/registry.ts` | `RegisteredAdapter`: `createAdapter`, `resolveIngestIds`, `fallbackSourceUpsert` |
| **Config** | `config/sources/<your-id>.json` | Declarative `SourceUpsert` (slug, name, `type`, URLs, metadata) |
| **Mapper** | *(usually none)* | `mapNormalizedToIngestRecord` is **generic** via `buildIngestRecordFromNormalized` + `resolveIngestIds` |

## 2. `SourceAdapter` contract

See `packages/ingest/src/core/adapter-interface.ts`:

1. **`discoverRange`** — async iterable of `IngestQueueItem` (stable `sourceKey`, optional `sourceUrl`, adapter-owned `meta`).
2. **`crawlOne`** — Playwright/network I/O → `RawCrawlResult` (store raw `body` under `.ingest/<id>/snapshots/`).
3. **`parseSnapshotBody`** — parse + validate; throw on unusable payloads.
4. **`normalize`** — return `NormalizedKirtan` (Zod). Set `adapterId`, `sourceKey`, `checksumSha256`, `capturedAt`, etc.

## 3. Config file schema

`config/sources/<adapterId>.json` is validated by `SourceFileConfigSchema`:

- **`adapterId`** — must match registry key.
- **`enabled`** — if `false`, CLI refuses `discover`/`extract`/… for that id.
- **`source`** — maps to Prisma `Source` (slug, name, `type`: `MANUAL` | `CRAWLER` | `API` | `IMPORT`, `baseUrl`, `metadata`).
- **`rateLimitMsDefault`** — optional default throttle when `--delay-ms` is omitted.
- Adapter-specific blocks (e.g. **`mock.items`**) are allowed for discovery.

Environment:

- **`NGB_SOURCES_CONFIG_DIR`** — absolute path to a folder containing `<id>.json` files (defaults to walking upward from CWD to find `config/sources`).

## 4. CLI commands (root `package.json` shortcuts)

All commands delegate to **`pnpm --filter @ngb/tool-ingest start --`**:

| Script | Maps to |
|--------|---------|
| `pnpm discover:source -- <source> ...` | discover |
| `pnpm crawl:source -- <source> ...` | extract (alias **`crawl`**) |
| `pnpm parse:source -- <source> ...` | normalize (alias **`parse`**) |
| `pnpm sync:source -- <source> ...` | sync |
| `pnpm ingest:list-adapters` | print ids |
| `pnpm import:ingest -- <file.jsonl>` | `IngestRecord` JSONL → DB |

Examples:

```bash
pnpm ingest:list-adapters
pnpm discover:source -- mock-archive --from 1 --to 5
pnpm crawl:source -- mock-archive --delay-ms 0
pnpm parse:source -- mock-archive
pnpm sync:source -- mock-archive --dry-run
DATABASE_URL=… pnpm sync:source -- mock-archive
```

Full pipeline (no DB):

```bash
pnpm --filter @ngb/tool-ingest start -- pipeline anirdesh --from 1 --to 3
```

## 5. Normalized → DB row

- **`mapNormalizedToIngestRecord`** (`packages/ingest/src/sync/map-to-ingest.ts`) loads `config/sources/<adapterId>.json` (or registry fallback), resolves **slug + externalId** via **`resolveIngestIds`**, then **`buildIngestRecordFromNormalized`** builds texts/audios/metadata.
- **`upsertIngestRecord`** (`@ngb/db`) merges **`lastIngestedAt`** and runs **checksum guardrails** (see below).

## 6. Guardrails & provenance

- **`checksumSha256`** on `NormalizedKirtan` should hash a **canonical** subset of fields (stable ordering) for dedup.
- **`assertChecksumNotReusedForOtherSlug`** rejects upserts that would store the same checksum under a **different** public `slug` (usually a slug-strategy bug). Override only with **`NGB_INGEST_SKIP_CHECKSUM_GUARD=1`** in emergencies.
- Kirtan **`metadata`** carries **`sourceKey`**, **`sourceUrl`**, **`checksumSha256`**, **`adapterId`**, **`canonicalContentId`**, **`lastIngestedAt`** for audit trails.

## 7. Manual import (JSON/CSV pipelines)

- Produce **one JSON object per line** matching **`IngestRecordSchema`** (same as `tools/sync`).
- Run: `pnpm import:ingest -- path/to/records.jsonl`
- Future: admin UI upload can POST to an API that validates `IngestRecord` and calls `upsertIngestRecord` (reuse the same schema).

## 8. Reference adapters

| Id | Role |
|----|------|
| **`anirdesh`** | Production-style HTTP + `NormalizedKirtan` |
| **`mock-archive`** | Offline snapshots, no network; for CI and copy-paste examples |

## 9. Further reading

- Pipeline diagram: [INGEST.md](./INGEST.md)
- Scale & operations: [ARCHITECTURE-SCALE.md](./ARCHITECTURE-SCALE.md)
