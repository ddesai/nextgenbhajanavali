# UI and ingestion workflows (MVP demo)

## Reading & listening (web app)

1. **Local**: `pnpm install` → configure `.env` (see root `.env.example`) → `pnpm db:push` → `pnpm db:seed` → `pnpm turbo run dev --filter=web`.
2. **Primary routes**: `/` (home), `/search`, `/browse`, `/kirtans`, `/kirtans/[slug]` (detail + audio + tabs), `/collections`, `/about`.
3. **Mobile**: Sticky mini-player when audio is active; touch targets on primary actions are at least ~44px where noted.
4. **Failure modes**: Home and search show **CatalogError** if the DB is unreachable (no white screen). Route-level **`error.tsx`** offers retry; **`global-error.tsx`** covers root layout failures.

## Adding content (ingest)

| Goal | Command |
|------|---------|
| List adapters | `pnpm ingest:list-adapters` |
| Discover queue | `pnpm discover:source -- <id> --from 1 --to 10` |
| Crawl (fetch) | `pnpm crawl:source -- <id> --delay-ms 750` |
| Parse / normalize | `pnpm parse:source -- <id>` |
| Sync to DB | `DATABASE_URL=… pnpm sync:source -- <id>` |
| Import `IngestRecord` JSONL | `pnpm import:ingest -- path/to/records.jsonl` |

Details: [INGEST.md](./INGEST.md), [SOURCES.md](./SOURCES.md), [SEARCH.md](./SEARCH.md) (for DB extensions used by search).

## SEO surface

- **`/sitemap.xml`**: Static routes + browse category URLs + kirtans/collections when `DATABASE_URL` works.
- **`/robots.txt`**: Allows indexing; references sitemap and `host` when `NEXT_PUBLIC_SITE_URL` is set.
- **Metadata**: `metadataBase`, `openGraph`, `twitter` card fields on layout; per-page titles and canonicals where defined.

## Performance notes

- **Fonts**: `next/font` with `display: swap`; Inter preloaded, display/Gujarati lazy.
- **Next**: `compress`, `poweredByHeader: false`, `optimizePackageImports` for `@ngb/ui`.
- **Search API**: `Cache-Control: private, no-store` (user-specific query strings).
