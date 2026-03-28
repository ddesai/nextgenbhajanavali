import {
  CollectionUpsertSchema,
  SourceUpsertSchema,
} from "@ngb/content-schema";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { disconnectDb, sql } from "./client.js";

const j = (v: object) => v as unknown as postgres.JSONValue;

async function main() {
  const demoSource = SourceUpsertSchema.parse({
    slug: "demo-corpus",
    name: "Demo corpus",
    description: "Local development sample; replace with real ingestion.",
    type: "MANUAL",
  });

  const sourceRows = await sql<{ id: string }[]>`
    INSERT INTO "Source" ("id", "slug", "name", "description", "baseUrl", "type", "metadata")
    VALUES (
      ${randomUUID()},
      ${demoSource.slug},
      ${demoSource.name},
      ${demoSource.description ?? null},
      ${demoSource.baseUrl ?? null},
      ${demoSource.type}::"SourceType",
      ${sql.json(j(demoSource.metadata as object))}
    )
    ON CONFLICT ("slug") DO UPDATE SET
      "name" = EXCLUDED."name",
      "description" = EXCLUDED."description",
      "type" = EXCLUDED."type",
      "metadata" = EXCLUDED."metadata",
      "updatedAt" = NOW()
    RETURNING id
  `;
  const source = sourceRows[0]!;

  const k1Meta = {
    categoryEnglish: "Prarthana",
    categoryGujarati: "પ્રાર્થના",
    popularScore: 10,
    raagEnglish: "Bhairavi",
    author: "સદ્‍ગુરુ પ્રેમાનંદ સ્વામી",
    authorLatin: "Sadguru Premanand Swami",
  };

  const k1Slug = "shree-ram-jay-jay-ram";
  const k1Rows = await sql<{ id: string }[]>`
    INSERT INTO "Kirtan" (
      "id", "sourceId", slug, title, "titleTransliterated", summary, "externalId", metadata, "searchDocument"
    )
    VALUES (
      ${randomUUID()},
      ${source.id},
      ${k1Slug},
      ${"શ્રી રામ જય જય રામ"},
      ${"Shrī Rām jay jay Rām"},
      ${"Call-and-response remembrance of Lord Ram."},
      ${"demo-001"},
      ${sql.json(j(k1Meta as object))},
      ''
    )
    ON CONFLICT ("slug") DO UPDATE SET
      title = EXCLUDED.title,
      "titleTransliterated" = EXCLUDED."titleTransliterated",
      summary = EXCLUDED.summary,
      "externalId" = EXCLUDED."externalId",
      "sourceId" = EXCLUDED."sourceId",
      metadata = EXCLUDED.metadata,
      "updatedAt" = NOW()
    RETURNING id
  `;
  const k1 = k1Rows[0]!;

  await sql`DELETE FROM "KirtanText" WHERE "kirtanId" = ${k1.id}`;
  await sql`DELETE FROM "KirtanAudio" WHERE "kirtanId" = ${k1.id}`;

  for (const t of [
    {
      kind: "GUJARATI_LYRICS" as const,
      content:
        "શ્રી રામ જય જય રામ\nજય જય રામ બોલો જય જય રામ\nશ્રી રામ જય જય રામ",
      locale: "gu",
      sortOrder: 0,
    },
    {
      kind: "TRANSLITERATION" as const,
      content:
        "Shrī Rām jay jay Rām\njay jay Rām bolo jay jay Rām\nShrī Rām jay jay Rām",
      locale: "gu-Latn",
      sortOrder: 1,
    },
    {
      kind: "ENGLISH_TRANSLATION" as const,
      content:
        "Glory to Lord Ram; sing His name with a glad heart.\n(illustrative translation for development)",
      locale: "en",
      sortOrder: 2,
    },
  ]) {
    await sql`
      INSERT INTO "KirtanText" ("id", "kirtanId", kind, content, locale, "sortOrder", metadata)
      VALUES (
       ${randomUUID()}, ${k1.id}, ${t.kind}::"KirtanTextKind", ${t.content},
       ${t.locale}, ${t.sortOrder}, ${sql.json(j({}))}
      )
    `;
  }

  await sql`
    INSERT INTO "KirtanAudio" ("id", "kirtanId", url, title, "mimeType", "sortOrder", metadata)
    VALUES (
      ${randomUUID()},
      ${k1.id},
      ${"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"},
      ${"Demo audio (replace with licensed recording)"},
      ${"audio/mpeg"},
      ${0},
      ${sql.json(j({}))}
    )
  `;

  const k2Meta = {
    categoryEnglish: "Dhun",
    categoryGujarati: "ધૂન",
    popularScore: 8,
  };

  const k2Slug = "hare-krishna-maha-mantra";
  const k2Rows = await sql<{ id: string }[]>`
    INSERT INTO "Kirtan" (
      "id", "sourceId", slug, title, "titleTransliterated", summary, "externalId", metadata, "searchDocument"
    )
    VALUES (
      ${randomUUID()},
      ${source.id},
      ${k2Slug},
      ${"હરે કૃષ્ણ મહામંત્ર"},
      ${"Hare Kṛṣṇa mahāmantra"},
      ${"The great mantra for congregational chanting."},
      ${"demo-002"},
      ${sql.json(j(k2Meta as object))},
      ''
    )
    ON CONFLICT ("slug") DO UPDATE SET
      title = EXCLUDED.title,
      "titleTransliterated" = EXCLUDED."titleTransliterated",
      summary = EXCLUDED.summary,
      "externalId" = EXCLUDED."externalId",
      "sourceId" = EXCLUDED."sourceId",
      metadata = EXCLUDED.metadata,
      "updatedAt" = NOW()
    RETURNING id
  `;
  const k2 = k2Rows[0]!;

  const k3Meta = {
    categoryEnglish: "Arti",
    categoryGujarati: "આરતી",
    popularScore: 12,
  };

  const k3Slug = "sandhya-arti-demo";
  const k3Rows = await sql<{ id: string }[]>`
    INSERT INTO "Kirtan" (
      "id", "sourceId", slug, title, "titleTransliterated", summary, "externalId", metadata, "searchDocument"
    )
    VALUES (
      ${randomUUID()},
      ${source.id},
      ${k3Slug},
      ${"શ્યામ સરનાર તમે ક્રુપા કરજ્યો"},
      ${"Śyām sarnār tame kṛpā karajyo"},
      ${"Sandhyā āratī — demo entry for the Arti category."},
      ${"demo-003"},
      ${sql.json(j(k3Meta as object))},
      ''
    )
    ON CONFLICT ("slug") DO UPDATE SET
      title = EXCLUDED.title,
      "titleTransliterated" = EXCLUDED."titleTransliterated",
      summary = EXCLUDED.summary,
      "externalId" = EXCLUDED."externalId",
      "sourceId" = EXCLUDED."sourceId",
      metadata = EXCLUDED.metadata,
      "updatedAt" = NOW()
    RETURNING id
  `;
  const k3 = k3Rows[0]!;

  await sql`DELETE FROM "KirtanText" WHERE "kirtanId" = ${k3.id}`;
  for (const t of [
    {
      kind: "GUJARATI_LYRICS" as const,
      content:
        "શ્યામ સરનાર તમે ક્રુપા કરજ્યો,\nમારા ઘરે પધારજ્યો... આરતી\nબ્રહ્માનંદ જય જય કારું નિત્ય\nવાંદરાં વૃંદ હતું વિપિન.",
      locale: "gu",
      sortOrder: 0,
    },
    {
      kind: "TRANSLITERATION" as const,
      content:
        "Śyām sarnār tame kṛpā karajyo,\nmārā ghare padhārajyo... āratī\nBrahmānand jay jay kāru nitya\nvāndarām̐ vr̥nda hatu̐ vipina.",
      locale: "gu-Latn",
      sortOrder: 1,
    },
  ]) {
    await sql`
      INSERT INTO "KirtanText" ("id", "kirtanId", kind, content, locale, "sortOrder", metadata)
      VALUES (
        ${randomUUID()}, ${k3.id}, ${t.kind}::"KirtanTextKind", ${t.content},
        ${t.locale}, ${t.sortOrder}, ${sql.json(j({}))}
      )
    `;
  }

  await sql`DELETE FROM "KirtanText" WHERE "kirtanId" = ${k2.id}`;
  for (const t of [
    {
      kind: "GUJARATI_LYRICS" as const,
      content: "હરે કૃષ્ણ હરે કૃષ્ણ\nકૃષ્ણ કૃષ્ણ હરે હરે",
      locale: "gu",
      sortOrder: 0,
    },
    {
      kind: "TRANSLITERATION" as const,
      content: "Hare Kṛṣṇa Hare Kṛṣṇa\nKṛṣṇa Kṛṣṇa Hare Hare",
      locale: "gu-Latn",
      sortOrder: 1,
    },
  ]) {
    await sql`
      INSERT INTO "KirtanText" ("id", "kirtanId", kind, content, locale, "sortOrder", metadata)
      VALUES (
        ${randomUUID()}, ${k2.id}, ${t.kind}::"KirtanTextKind", ${t.content},
        ${t.locale}, ${t.sortOrder}, ${sql.json(j({}))}
      )
    `;
  }

  const col = CollectionUpsertSchema.parse({
    slug: "morning-bhajans",
    name: "Morning bhajans",
    description: "Starter set for local testing.",
  });

  const collectionRows = await sql<{ id: string }[]>`
    INSERT INTO "Collection" ("id", slug, name, description, metadata, "sortOrder")
    VALUES (
      ${randomUUID()},
      ${col.slug},
      ${col.name},
      ${col.description ?? null},
      ${sql.json(j(col.metadata as object))},
      ${0}
    )
    ON CONFLICT ("slug") DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      metadata = EXCLUDED.metadata,
      "updatedAt" = NOW()
    RETURNING id
  `;
  const collection = collectionRows[0]!;

  await sql`DELETE FROM "KirtanCollection" WHERE "collectionId" = ${collection.id}`;
  await sql`
    INSERT INTO "KirtanCollection" ("kirtanId", "collectionId", "sortOrder")
    VALUES
      (${k1.id}, ${collection.id}, ${0}),
      (${k2.id}, ${collection.id}, ${1}),
      (${k3.id}, ${collection.id}, ${2})
  `;

  const relExists = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM "KirtanRelation"
    WHERE "fromKirtanId" = ${k1.id} AND "toKirtanId" = ${k2.id} AND "relationType" = ${"PAIR_DEMO"}
    LIMIT 1
  `;
  if (!relExists[0]) {
    await sql`
      INSERT INTO "KirtanRelation" ("id", "fromKirtanId", "toKirtanId", "relationType", metadata)
      VALUES (
        ${randomUUID()},
        ${k1.id},
        ${k2.id},
        ${"PAIR_DEMO"},
        ${sql.json(j({ note: "Example graph edge for development" }))}
      )
    `;
  }

  const rel2Exists = await sql<{ ok: boolean }[]>`
    SELECT true AS ok FROM "KirtanRelation"
    WHERE "fromKirtanId" = ${k3.id} AND "toKirtanId" = ${k1.id} AND "relationType" = ${"PAIR_DEMO"}
    LIMIT 1
  `;
  if (!rel2Exists[0]) {
    await sql`
      INSERT INTO "KirtanRelation" ("id", "fromKirtanId", "toKirtanId", "relationType", metadata)
      VALUES (
        ${randomUUID()},
        ${k3.id},
        ${k1.id},
        ${"PAIR_DEMO"},
        ${sql.json(j({ note: "Related arti <-> prarthana demo" }))}
      )
    `;
  }

  console.log("Seed complete.");
}

main()
  .then(() => disconnectDb())
  .catch(async (e) => {
    console.error(e);
    await disconnectDb();
    process.exit(1);
  });
