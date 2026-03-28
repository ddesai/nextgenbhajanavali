# Ingest architecture — long-term scale

For **product goals**, mobile/UX intent, and Anirdesh as MVP source, see [PRODUCT-FOUNDATION.md](./PRODUCT-FOUNDATION.md).

## Design intent

- **Website stability**: `apps/web` depends on `@ngb/content-schema` + `@ngb/db` only. No imports from crawler code.
- **Horizontal content growth**: New sources are **adapter modules + config files**, not rewrites of the reader UI.
- **Reproducibility**: Raw snapshots under `.ingest/<adapter>/snapshots/` let you re-parse after fixing normalizers without re-hitting origins.

## Suggested scaling path

1. **Single writer** — Keep **`upsertIngestRecord`** as the only production write path for catalog rows (CLI, job workers, future admin API).
2. **Job queue** — Replace long synchronous CLIs with workers that dequeue `IngestQueueItem` rows from Postgres/Redis/SQS; adapters remain the same; only the orchestration moves.
3. **Object storage** — Promote snapshot blobs from local disk to S3/GCS; store pointer + checksum in a `ingest_artifact` table when you exceed single-node disk.
4. **Multi-region read** — The web app is stateless; scale reads with replicated Postgres + connection pooling (e.g. PgBouncer).
5. **Search** — Already separated (PostgreSQL FTS in-repo). At very large corpus sizes, add a dedicated search replica or Meilisearch **without** changing `IngestRecord` (see [SEARCH.md](./SEARCH.md)).

## Operational guardrails

- **Rate limits**: Encode defaults in `config/sources/*.json` (`rateLimitMsDefault`); override per run with `--delay-ms`.
- **Checksum policy**: Cross-slug checksum conflicts block ingest by default; forces explicit review of slug strategies.
- **Adapter `enabled: false`**: Stops accidental crawls against deprecated sources.

## Compliance & provenance

- Store **license/attribution** notes in `Source.metadata` and surface in the Info tab where appropriate.
- **`sourceUrl`** + **`canonicalContentId`** support deep linking and takedown requests.

## Monorepo boundaries

```
packages/content-schema   ← contracts (NormalizedKirtan, IngestRecord)
packages/db               ← Prisma + upsert + search
packages/ingest           ← adapters, pipeline, map → IngestRecord
tools/ingest              ← CLI entrypoint
config/sources            ← declarative per-source settings
apps/web                  ← no ingest imports
```

This boundary keeps **legal/operational complexity** in ops packages and **product UX** in the web app.
