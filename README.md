# Next Gen Bhajanavali

Mobile-first devotional catalog for browsing and searching **bhajans / kirtans** with **Gujarati lyrics**, **Gujulish / transliteration**, **English** when available, and **audio** when linked. The repo is an **extensible MVP foundation**: strict separation of **ingest / DB / UI**, **Anirdesh** as the primary ingest source for launch, and production-minded defaults for SEO, accessibility, and graceful failures when the database or search extensions are missing.

**Product + architecture intent:** [docs/PRODUCT-FOUNDATION.md](docs/PRODUCT-FOUNDATION.md).

## Monorepo layout

| Path | Role |
|------|------|
| `apps/web` | Next.js 15 (App Router), Tailwind, server components, SEO routes |
| `packages/ui` | Shared UI primitives (shadcn-style) + Tailwind preset |
| `packages/db` | Prisma schema, client singleton, queries + search + ingest upsert |
| `packages/content-schema` | Zod contracts shared by web, tools, and ingest |
| `packages/ingest` | Source adapters, pipeline, normalize → `IngestRecord` |
| `tools/ingest` | CLI: discover / crawl / parse / sync / import |
| `tools/crawler`, `tools/parser-anirdesh`, `tools/sync` | Legacy / narrow utilities |

**Dependency direction:** `apps/web` → `packages/db` + `packages/ui` + `packages/content-schema`. Ingestion flows through `packages/content-schema` → `packages/ingest` / `tools/*` → `packages/db`. The UI never imports crawler code.

## Requirements

- **Node** 20+
- **pnpm** 9+ (`corepack enable && corepack prepare pnpm@9.15.4 --activate`)
- **PostgreSQL** 14+ (local Docker, Supabase, RDS, Neon, etc.)

## Quick start (local demo)

1. **Install**

   ```bash
   pnpm install
   ```

2. **Environment**

   Copy [`.env.example`](./.env.example) to:

   - `apps/web/.env.local`
   - `packages/db/.env`

   At minimum set **`DATABASE_URL`** and **`NEXT_PUBLIC_SITE_URL`** (use `http://localhost:3000` locally).

3. **Database schema**

   ```bash
   pnpm db:push
   ```

   For tracked migrations (recommended before production):

   ```bash
   pnpm db:migrate
   ```

4. **Seed sample kirtans**

   ```bash
   pnpm db:seed
   ```

5. **Build and run web**

   ```bash
   pnpm build
   pnpm turbo run dev --filter=web
   ```

   Open [http://localhost:3000](http://localhost:3000).

6. **Lint / typecheck (release check)**

   ```bash
   pnpm lint
   pnpm --filter web exec tsc --noEmit
   ```

## Developer commands (cheat sheet)

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Turborepo dev (web + deps) |
| `pnpm build` | Production build all packages |
| `pnpm lint` | Lint across workspaces (`eslint` in web; `tsc`/Prisma elsewhere) |
| `pnpm db:push` | Push Prisma schema (dev) |
| `pnpm db:migrate` | Create/apply migrations (`packages/db`) |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:studio` | Prisma Studio |
| `pnpm ingest:list-adapters` | List ingest adapter ids |
| `pnpm discover:source -- <id> …` | Discovery queue |
| `pnpm crawl:source -- <id> …` | Fetch / extract (alias: `crawl`) |
| `pnpm parse:source -- <id> …` | Normalize snapshots (alias: `parse`) |
| `pnpm sync:source -- <id> …` | Normalized JSONL → Postgres |
| `pnpm import:ingest -- <file.jsonl>` | Manual `IngestRecord` import |

Docs: [PRODUCT-FOUNDATION.md](docs/PRODUCT-FOUNDATION.md) · [DESIGN-REVIEW.md](docs/DESIGN-REVIEW.md) · [INGEST.md](docs/INGEST.md) · [SOURCES.md](docs/SOURCES.md) · [UI-AND-WORKFLOWS.md](docs/UI-AND-WORKFLOWS.md) · [SEARCH.md](docs/SEARCH.md) · [ARCHITECTURE-SCALE.md](docs/ARCHITECTURE-SCALE.md).

## Supabase / Postgres setup

1. Create a project in [Supabase](https://supabase.com) (or any Postgres host).
2. **Migrations / Prisma**: use the **direct** connection string (often port **5432**, `sslmode=require`) in `packages/db/.env` when running `pnpm db:migrate` or `prisma migrate deploy`.
3. **Serverless app (Vercel)**: prefer the **pooler** URL (often port **6543**, `pgbouncer=true`) as `DATABASE_URL` for the Next.js app to avoid exhausting connections.
4. Enable extensions required for search (**`pg_trgm`**) via SQL editor or migration — see [docs/SEARCH.md](docs/SEARCH.md).
5. Run migrations, then seed or ingest content.

## Deploying to Vercel

1. **Root directory**: monorepo root; **framework**: Next.js; set **project root** or use Turborepo remote cache as you prefer. Common pattern: Vercel project **Root Directory** = `apps/web` with install command `cd ../.. && pnpm install` and build `cd ../.. && pnpm turbo run build --filter=web` — or use a single Vercel project pointing at repo root with custom build command:

   ```bash
   pnpm install && pnpm turbo run build --filter=web
   ```

2. **Environment variables** in Vercel:

   - `DATABASE_URL` — pooled connection string for production.
   - `NEXT_PUBLIC_SITE_URL` — `https://your-domain.com` (no trailing slash). Drives **metadataBase**, **Open Graph**, **sitemap**, **robots host**.

3. **Build**: `pnpm build` (or filtered web build). Ensure Prisma client is generated (`@ngb/db` `postinstall` or build dependency).

4. **Migrations**: run `prisma migrate deploy` in CI or a Vercel **Deploy Hook** / release step using `packages/db`, **not** only `db push` in production unless intentional.

5. **Ingest**: run crawlers/sync on a worker, GitHub Action, or laptop — not on the serverless request path.

## SEO & sharing

- **Sitemap**: `/sitemap.xml` (static routes + browse categories + dynamic kirtans/collections when DB is available).
- **Robots**: `/robots.txt` allows crawlers and points to the sitemap.
- **Open Graph / Twitter**: Set on root `layout` and selected pages; set **`NEXT_PUBLIC_SITE_URL`** for correct absolute URLs.

## Accessibility (MVP bar)

- Skip link → `#main-content`, visible on focus.
- Landmark `<main>`, focus rings on interactive controls, `aria-live` on search results.
- Lyrics use `lang` where applicable (e.g. `gu`, `gu-Latn`, `en`).
- Reduced motion: smooth scrolling respects `prefers-reduced-motion` in global CSS.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| **Pages 500 / “Catalog unavailable”** | Check `DATABASE_URL` matches a running Postgres; run `pnpm db:push` and `pnpm db:seed`. |
| **Search error / empty search** | Apply search migration (`pg_trgm`, generated `searchVector`) per [docs/SEARCH.md](docs/SEARCH.md). |
| **Sitemap missing kirtans** | `DATABASE_URL` must be set at build/runtime for dynamic URLs; falls back to static routes only if DB queries fail. |
| **Wrong canonical / OG URLs** | Set `NEXT_PUBLIC_SITE_URL` to the production origin. |
| **`pnpm lint` fails in web** | Run from repo root after `pnpm install`; web uses `eslint.config.mjs` + `eslint-config-next`. |
| **Prisma migrate vs Supabase** | Use **direct** URL for migrate; **pooler** for the deployed app. |
| **Checksum ingest error** | Two slugs share same checksum; fix adapter slug logic or set `NGB_INGEST_SKIP_CHECKSUM_GUARD=1` only as a last resort (documented in ingest CLI). |

## License

Seed content is illustrative; replace with properly licensed material before production.
