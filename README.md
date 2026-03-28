# Next Gen Bhajanavali

Mobile-first devotional catalog for browsing and searching **bhajans / kirtans** with **Gujarati lyrics**, **Gujlish / transliteration**, **English** when available, and **audio** when linked.

## Monorepo layout

| Path | Role |
|------|------|
| `apps/web` | Next.js 15 (App Router), Tailwind, server components, SEO routes |
| `packages/ui` | Shared UI primitives (shadcn-style) + Tailwind preset |
| `packages/db` | Prisma schema, client singleton, **read-model** query helpers |
| `packages/content-schema` | Zod contracts shared by web, tools, and ingest |
| `tools/crawler` | HTTP fetch / future per-site adapters (no DB) |
| `tools/parser-anirdesh` | Placeholder for source-specific parsing → `IngestRecord` lines |
| `tools/sync` | Batch upsert into Postgres (never imported by the UI) |

**Dependency direction (important):** `apps/web` → `packages/db` + `packages/ui` + `packages/content-schema`. Ingestion flows through `packages/content-schema` → `tools/sync` → `packages/db`. Parsers do not call React; the UI does not call crawlers.

## Dependency plan

| Layer | Stack |
|-------|--------|
| Web | Next.js 15+, React 19, App Router, `server-only` data boundary |
| Styling | Tailwind CSS 3, `@ngb/ui` (Radix Slot, CVA, `cn` helper), `@tailwindcss/typography` (lyrics prose) |
| Data | PostgreSQL, Prisma ORM, Zod at package boundaries |
| Monorepo | pnpm workspaces, Turborepo |
| DX | TypeScript 5.7+, tsx for scripts/seeds |

## Prisma model (summary)

- **`Source`** — provenance (`slug`, `name`, `type`, `metadata`). New catalogs or pipelines add rows here; the UI only needs stable `slug` + display fields.
- **`Kirtan`** — canonical item; **`slug` is globally unique** for clean URLs (`/kirtans/[slug]`). `externalId` + `sourceId` enforce dedup per upstream.
- **`KirtanText`** — rows per `KirtanTextKind` (`GUJARATI_LYRICS`, `TRANSLITERATION`, `ENGLISH_TRANSLATION`), ordered by `sortOrder`.
- **`KirtanAudio`** — optional media URLs, ordered, with optional `durationSec` / `mimeType`.
- **`Collection`** — curated sets; **`KirtanCollection`** is the ordered join table.
- **`KirtanRelation`** — graph edges (`relationType` string, e.g. same tune, alternate version) for “related” surfaces without overloading collections.

Full schema: `packages/db/prisma/schema.prisma`.

## Local setup

**Requirements:** Node 20+, pnpm 9+, PostgreSQL 16+ (Docker optional).

1. **Install**

   ```bash
   pnpm install
   ```

2. **Database** — copy `.env.example` to both:

   - `apps/web/.env.local`
   - `packages/db/.env`

   (Alternatively symlink one `.env` to both paths.)

   Start Postgres, e.g.:

   ```bash
   docker compose up -d postgres
   ```

3. **Migrate / push schema**

   ```bash
   pnpm db:push
   ```

   Or create tracked migrations in `packages/db` with:

   ```bash
   pnpm --filter @ngb/db exec prisma migrate dev
   ```

4. **Generate Prisma client & build packages**

   ```bash
   pnpm turbo run build --filter=@ngb/content-schema --filter=@ngb/db
   ```

5. **Seed demo data**

   ```bash
   pnpm db:seed
   ```

6. **Run the web app**

   ```bash
   pnpm turbo run dev --filter=web
   ```

   Open [http://localhost:3000](http://localhost:3000).

`turbo run dev` builds workspace dependencies first (`^build`), including Prisma client generation.

Data routes use **`dynamic = "force-dynamic"`** so `next build` does not require a live database. For heavy traffic, you can switch to time-based revalidation (`revalidate`) or tag-based `revalidateTag` once you have caching rules.

## Initial routes (SEO-friendly)

| Route | Purpose |
|-------|---------|
| `/` | Home + featured kirtans |
| `/kirtans` | Browse listing |
| `/kirtans/[slug]` | Detail: lyrics sections, `<audio>`, related graph |
| `/search?q=` | Server-driven search (title, transliteration, summary) |
| `/collections` | Collection index |
| `/collections/[slug]` | Ordered kirtans in a collection |
| `/sitemap.xml` | Dynamic sitemap |
| `/robots.txt` | Allows crawlers; points to sitemap |

## Ingestion (tools)

- **Crawler** — `pnpm --filter @ngb/tool-crawler start -- <url> [out.html]` saves or prints raw artifacts.
- **Parser** — extend `tools/parser-anirdesh` to map artifacts → **`IngestRecord`** (see `IngestRecordSchema` in `@ngb/content-schema`).
- **Sync** — `DATABASE_URL=... pnpm --filter @ngb/tool-sync start -- lines.jsonl` upserts sources, kirtans, texts, and audios (replaces texts/audios for that slug each run).

## Deployment notes

- **Database:** Use a managed PostgreSQL (Neon, RDS, Cloud SQL, etc.). Set `DATABASE_URL` with pooling if required (e.g. Neon’s pooled string for serverless).
- **App:** Deploy `apps/web` to Vercel, Railway, Fly.io, or any Node host. Set `DATABASE_URL` and **`NEXT_PUBLIC_SITE_URL`** to the canonical origin (metadata, sitemap, Open Graph).
- **Migrations:** Run `prisma migrate deploy` (from CI or release phase) against production; avoid `db push` in prod unless intentional.
- **Ingestion:** Run `tools/sync` on a schedule or CI with secrets; keep long-running crawlers off the web server.
- **Media:** Store assets in object storage (S3, R2, etc.) and persist HTTPS URLs in `KirtanAudio` — do not commit copyrighted audio.

## Accessibility & i18n-ish behavior

- Skip link, landmark `<main>`, focus rings on interactive elements.
- Lyrics blocks use `lang` (e.g. `gu`, `gu-Latn`, `en`) and a Gujarati-capable font for primary lyrics.
- Prefer semantic HTML (`<article>`, `<section>`, native `<audio controls>`).

## License

Content in seeds is illustrative; replace with properly licensed material before production use.
