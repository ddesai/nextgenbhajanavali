# Design review notes (tech lead)

Condensed findings from a full-repo pass. Items marked **done** were addressed in the same change batch where practical.

## Architecture

| Observation | Severity | Notes |
|-------------|----------|--------|
| **Web → DB → schema boundary** is clean; no ingest in UI. | Strong | Keep as a hard rule. |
| **Turborepo `dev` depends on `^build`** | Mild friction | First `dev` is slower; acceptable for correctness. Alternative: optional `dev:quick` without dep if teams want snappier loops. |
| **Prisma in monorepo root `node_modules`** | Env-specific | Next + Turbopack sometimes warns about `@prisma/client` resolution; monitor after upgrades. |

## Overengineering

- **Full Chromium for extract** — Adapters only needed HTTP `POST`/`GET`; a browser window added memory and CI cost. **→ HTTP-only `APIRequestContext` (done).**
- **Duplicate `parseSort` logic** in `/search` and `/api/search` — **→ single `parseSearchSortParam` in `@ngb/db`.**

## Underengineering

- **Search page lacked a primary query field** in the main refine panel (chips only toggled filters; deep links had `q` but mobile users needed an obvious box). **→ Query field + submit in refine bar.**
- **Anirdesh HTTP had no retry** on 429/5xx — **→ bounded retries with backoff in adapter.**
- **Prisma `externalId` vs schema `canonicalContentId`** — Same concept, different names; **→ documented in Prisma + Zod.**

## Simplifications (scalability-preserving)

- Prefer **Playwright `request` API** for JSON/REST fetches; reserve **browser** for adapters that need DOM/JS (future: add `meta.needsBrowser` and branch in extract if needed).
- Keep **one** sort-parser entry point for Web + API.

## Naming consistency

- **DB:** `Kirtan.externalId` = upstream stable id (e.g. Anirdesh `kid`).
- **Normalized ingest:** `canonicalContentId` — same semantics; mapper sets `externalId`.
- **API/UI detail:** `info.externalId` — matches DB field name for JSON consumers.

## Data model

- `searchDocument` is intentionally denormalized for FTS; regenerate via ingest/migration path when changing index strategy (see SEARCH.md).
- `metadata` JSON blobs remain escape hatches; prefer typed columns when a field is queried everywhere.

## Crawler / ingest

- Retries, rate limits, resume store, checksums: good baseline.
- **Extract** should not require a browser unless the adapter does.

## Mobile & search UX

- Larger touch targets on filter chips; primary search input with `enterKeyHint="search"`.
- Consider sticky refine bar later if content length grows.

## Follow-ups (not implemented here)

- Route-level `loading.tsx` on browse/collections for parity with search.
- Dedicated OG image asset.
- Optional `meta.crawlTransport: 'browser' | 'http'` when a source needs `page.goto`.
