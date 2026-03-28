# Product foundation — Next Gen Bhajanavali

This document captures **product intent** and how it maps to the **monorepo**. It is the north star for MVP and scale-out: we optimize for a **lasting** catalog and reader, not a one-off demo.

## Purpose

A **mobile-first** devotional experience: a searchable library of **kirtans / bhajans** with **Gujarati** lyrics, **Gujulish / Latin transliteration**, **English** where available, and **audio** when linked. The experience should feel calm, legible, and respectful—easy to use with one hand, pleasant for extended reading or listening.

## Primary source (MVP)

**Anirdesh** — *Kirtan Muktavali* section — is the **first-class** crawler path:

- Adapter: `packages/ingest/src/adapters/anirdesh/`
- Declarative config: `config/sources/anirdesh.json`
- Runbook: [INGEST.md](./INGEST.md), [SOURCES.md](./SOURCES.md)

Additional sources ship as **new adapters + config**, not as forks of the reader or database layer.

## Product goals → implementation

| Goal | How the codebase supports it |
|------|------------------------------|
| **Very easy on mobile** | Responsive layouts, safe-area padding, touch-friendly targets, mini player that persists while browsing (`apps/web` audio + reader components). |
| **Elegant reading / listening** | Dedicated kirtan reader with typography tuned for Gujarati/Latin/English, optional audio panel, reduced-motion–aware behavior. |
| **Scalable multi-source** | `SourceAdapter` contract, registry, `NormalizedKirtan` → `IngestRecord`; UI consumes DB + schema only. |
| **Strong search** | PostgreSQL FTS + `pg_trgm`, dedicated search API and UI; strategy in [SEARCH.md](./SEARCH.md). |
| **Attribution & provenance** | `Source` rows, `sourceUrl` / `canonicalContentId`, metadata for license notes; surfaced on kirtan detail (e.g. source name in metadata). |
| **Crawler / parser / DB / UI separation** | Strict boundary: `apps/web` does **not** import `packages/ingest`. Ingest is CLI/worker-driven into `packages/db`. See [ARCHITECTURE-SCALE.md](./ARCHITECTURE-SCALE.md). |

## UX principles (devotional context)

1. **Clarity over novelty** — Typography, contrast, and hierarchy support long reading; avoid distracting motion or dense chrome.
2. **Languages are first-class** — Use correct `lang` attributes and fonts for Gujarati vs Latin vs English strings.
3. **Listening is optional** — Lyrics remain primary; audio enhances when present. Empty states explain missing audio or translation honestly.
4. **Trust** — Always show **where content came from** and avoid implying endorsement; honor upstream terms and copyright (see source `metadata` in config).

## Architectural non-negotiables

1. **Single writer path** for catalog mutation in production: **`upsertIngestRecord`** (and controlled admin/import paths), not ad hoc UI writes.
2. **Contracts before UI** — Shared shapes live in `@ngb/content-schema`; DB mapping in `@ngb/db`.
3. **Reproducible ingest** — Raw snapshots under `.ingest/<adapter>/snapshots/` so parsers can be fixed without re-crawling when possible.
4. **Compliance hooks** — Rate limits in config, adapter `enabled` flags, checksum guardrails for dedup and review (see ingest docs).

## Related documentation

| Doc | Topic |
|-----|--------|
| [UI-AND-WORKFLOWS.md](./UI-AND-WORKFLOWS.md) | End-user flows + ingest commands overview |
| [INGEST.md](./INGEST.md) | Crawler pipeline layers, Anirdesh details |
| [SOURCES.md](./SOURCES.md) | Adding an adapter |
| [SEARCH.md](./SEARCH.md) | Indexing and multilingual search |
| [ARCHITECTURE-SCALE.md](./ARCHITECTURE-SCALE.md) | Boundaries and growth path |

## Role expectations (for humans + agents)

When extending the product, **preserve** boundaries above. Prefer **adapter + config** for new corpora; extend **search** and **schema** deliberately when fields are genuinely shared across sources.
