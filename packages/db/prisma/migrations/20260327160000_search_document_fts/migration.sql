-- PostgreSQL search: pg_trgm (fuzzy / misspellings on transliterated Latin) + weighted FTS over titles (A) and lyric bodies (B).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Denormalized bodies: all KirtanText.content joined (maintained by triggers).
ALTER TABLE "Kirtan" ADD COLUMN IF NOT EXISTS "searchDocument" TEXT NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION ngb_recompute_kirtan_search_document(p_id TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "Kirtan"
  SET "searchDocument" = COALESCE((
    SELECT string_agg(kt."content", ' ' ORDER BY kt."sortOrder", kt."kind")
    FROM "KirtanText" kt
    WHERE kt."kirtanId" = p_id
  ), '')
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION ngb_trg_kirttext_search_doc()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  kid TEXT;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    kid := OLD."kirtanId";
  ELSE
    kid := NEW."kirtanId";
  END IF;
  PERFORM ngb_recompute_kirtan_search_document(kid);
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ngb_kirttext_search_doc ON "KirtanText";
CREATE TRIGGER ngb_kirttext_search_doc
AFTER INSERT OR UPDATE OR DELETE ON "KirtanText"
FOR EACH ROW
EXECUTE FUNCTION ngb_trg_kirttext_search_doc();

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM "Kirtan" LOOP
    PERFORM ngb_recompute_kirtan_search_document(r.id);
  END LOOP;
END $$;

ALTER TABLE "Kirtan" ADD COLUMN IF NOT EXISTS "searchVector" tsvector
GENERATED ALWAYS AS (
  setweight(
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce("titleTransliterated", '')
    ),
    'A'
  )
  || setweight(
    to_tsvector(
      'simple',
      coalesce(summary, '') || ' ' || coalesce("searchDocument", '')
    ),
    'B'
  )
) STORED;

CREATE INDEX IF NOT EXISTS "Kirtan_searchVector_idx" ON "Kirtan" USING GIN ("searchVector");
CREATE INDEX IF NOT EXISTS "Kirtan_searchDocument_trgm_idx" ON "Kirtan" USING GIN ("searchDocument" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Kirtan_title_trgm_idx" ON "Kirtan" USING GIN ((
  coalesce(title, '') || ' ' || coalesce("titleTransliterated", '')
) gin_trgm_ops);
