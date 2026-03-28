# Search indexing and ranking (Next Gen Bhajanavali)

This project uses **Option A: PostgreSQL full-text search + `pg_trgm`**, co-located with Prisma so there is no separate search cluster to operate. Meilisearch (Option B) remains a good fit if you later need sub‑10 ms fuzzy UX at very large scale, tunable typo dictionaries per field, or cross-language analyzers out of the box; the HTTP `/api/search` contract is intentionally stable so a future Meili backend could swap in behind the same parameters.

## 1. Indexing strategy

| Layer | Role |
|--------|------|
| **Weighted `tsvector`** | `searchVector` is a **generated stored** column on `Kirtan`: weight **A** = `title` + `titleTransliterated`; weight **B** = `summary` + `searchDocument`. Devotional titles stay ahead of long lyric bodies. |
| **`searchDocument`** | Denormalized concatenation of all `KirtanText.content` rows (Gujarati, transliteration, English), rebuilt by a trigger whenever lyrics change. Keeps joins out of the hot query path. |
| **GIN on `searchVector`** | Lexical matching and `ts_rank_cd` for ranking. |
| **GIN (`gin_trgm_ops`) on `searchDocument` + title stack** | Trigram `%` / `similarity()` for **misspellings** and near-matches on transliterated Latin and long lyrics. |
| **`simple` text config** | Works across **Gujarati script** and Latin in one index; avoids English-only stemmers that mangle proper names and mantra spellings. |

**Exact phrase:** `websearch_to_tsquery('simple', $q)` understands double-quoted phrases (e.g. `"jay jay ram"`).

**Transliteration variants:** For Latin queries, we OR a second `websearch_to_tsquery` built from an **NFKD, de-accented** copy of the query so “Hare” and “Hāre”-style variants align more often. Further alias expansion (e.g. ś/s/ṣ folding tables) can be added in SQL or at ingest time into optional `searchAliases` JSON when you need stricter sampradāya conventions.

## 2. Schema / migration setup

1. Ensure `DATABASE_URL` points at PostgreSQL.
2. Run Prisma migrations (includes extension + column + triggers):

   ```bash
   cd packages/db
   DATABASE_URL=... npx prisma migrate deploy
   ```

3. `CREATE EXTENSION pg_trgm` may require a role with `CREATE` on the database (managed providers often allow it; if not, pre-enable the extension as superuser).

Prisma models only `searchDocument`; **`searchVector` exists only in SQL** (generated column) so `prisma db pull` will not round-trip it—keep the migration as the source of truth for that column.

## 3. Search API

| Endpoint | Purpose |
|-----------|---------|
| **`GET /api/search`** | JSON `{ hits, total, take, skip }` for apps and scripts. Query params mirror the web UI: `q`, `sort`, `audio`, `english`, ~~`chip`~~ `chip`, `author`, `category`, `raag`, `take`, `skip`. |
| **`GET /search`** | HTML UI with chips, facet fields, sort, and highlighted snippets. |

`runtime = nodejs` is enforced for the API route because Prisma uses the Node driver.

## 4. Server-side query logic

Implemented in `packages/db/src/search-engine.ts`:

- **Match:** `searchVector @@ tsquery` **OR** (for lenient recall) trigram `%` on lyric blob and title stack when `char_length(q) ≥ 3`.
- **Rank:** `ts_rank_cd(..., 32) * 12` plus a scaled trigram **similarity** term so fuzzy-only hits still surface when FTS is too strict.
- **Snippets:** `ts_headline` with custom delimiters U+E000 / U+E001 (parsed in the web `SearchSnippet` component).
- **Filters:** `EXISTS` subqueries for audio / English translation; JSON `metadata` fields for author, category, raag (substring `ILIKE` with escape).

`searchKirtansFiltered` / `searchKirtansWithTotal` in `queries.ts` apply sort defaults (e.g. **popular** when `chip=popular` and no query).

## 5. UI (`/search`)

- Quick chips (audio, English, Arti, …) append to the query string.
- **Refine** panel: author, category, raag, and **sort** (relevance, title, popular).
- Cards show **highlighted** lyric/summary snippets when `q` is non-empty.

## 6. Multilingual scaling (future)

- **Per-locale rows:** Add `locale` to search blobs or split generated vectors (`searchVectorGu`, `searchVectorLat`) if you need language-specific stemmers later.
- **`unaccent` extension:** Optional second generated column for Latin folding only, combined with `||` into the tsvector, if de-accenting should happen in SQL instead of the query twin.
- **Dedicated synonym table:** Map transliteration variants (e.g. `Krishna` / `Krsna`) at **index time** into `searchDocument` or a `search_synonym` join refreshed by triggers.
- **External engine:** Re-implement `searchKirtansAdvanced` against Meilisearch but keep `KirtanSearchHit` and `/api/search` stable.

## 7. Operations checklist

- After bulk ingest, `searchDocument` stays updated via triggers; for a repair after manual SQL, run `SELECT ngb_recompute_kirtan_search_document(id) FROM "Kirtan"`.
- Monitor index size and `pg_trgm.similarity_limit` / `word_similarity` thresholds in `search-engine.ts` if recall/precision needs tuning.
