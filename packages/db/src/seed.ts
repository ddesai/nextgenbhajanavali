import {
  CollectionUpsertSchema,
  SourceUpsertSchema,
} from "@ngb/content-schema";
import { PrismaClient, type Prisma } from "@prisma/client";

function json(metadata: Record<string, unknown>): Prisma.InputJsonValue {
  return metadata as Prisma.InputJsonValue;
}

const prisma = new PrismaClient();

async function main() {
  const demoSource = SourceUpsertSchema.parse({
    slug: "demo-corpus",
    name: "Demo corpus",
    description: "Local development sample; replace with real ingestion.",
    type: "MANUAL",
  });

  const source = await prisma.source.upsert({
    where: { slug: demoSource.slug },
    create: { ...demoSource, metadata: json(demoSource.metadata) },
    update: {
      name: demoSource.name,
      description: demoSource.description,
      type: demoSource.type,
      metadata: json(demoSource.metadata),
    },
  });

  const k1Meta = {
    categoryEnglish: "Prarthana",
    categoryGujarati: "પ્રાર્થના",
    popularScore: 10,
    raagEnglish: "Bhairavi",
    author: "સદ્‍ગુરુ પ્રેમાનંદ સ્વામી",
    authorLatin: "Sadguru Premanand Swami",
  };

  const k1Slug = "shree-ram-jay-jay-ram";
  const k1 = await prisma.kirtan.upsert({
    where: { slug: k1Slug },
    create: {
      slug: k1Slug,
      title: "શ્રી રામ જય જય રામ",
      titleTransliterated: "Shrī Rām jay jay Rām",
      summary: "Call-and-response remembrance of Lord Ram.",
      externalId: "demo-001",
      sourceId: source.id,
      metadata: json(k1Meta),
    },
    update: {
      title: "શ્રી રામ જય જય રામ",
      titleTransliterated: "Shrī Rām jay jay Rām",
      summary: "Call-and-response remembrance of Lord Ram.",
      externalId: "demo-001",
      sourceId: source.id,
      metadata: json(k1Meta),
    },
  });

  await prisma.kirtanText.deleteMany({ where: { kirtanId: k1.id } });
  await prisma.kirtanText.createMany({
    data: [
      {
        kirtanId: k1.id,
        kind: "GUJARATI_LYRICS",
        content:
          "શ્રી રામ જય જય રામ\nજય જય રામ બોલો જય જય રામ\nશ્રી રામ જય જય રામ",
        locale: "gu",
        sortOrder: 0,
      },
      {
        kirtanId: k1.id,
        kind: "TRANSLITERATION",
        content:
          "Shrī Rām jay jay Rām\njay jay Rām bolo jay jay Rām\nShrī Rām jay jay Rām",
        locale: "gu-Latn",
        sortOrder: 1,
      },
      {
        kirtanId: k1.id,
        kind: "ENGLISH_TRANSLATION",
        content:
          "Glory to Lord Ram; sing His name with a glad heart.\n(illustrative translation for development)",
        locale: "en",
        sortOrder: 2,
      },
    ],
  });

  await prisma.kirtanAudio.deleteMany({ where: { kirtanId: k1.id } });
  await prisma.kirtanAudio.create({
    data: {
      kirtanId: k1.id,
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      title: "Demo audio (replace with licensed recording)",
      mimeType: "audio/mpeg",
      sortOrder: 0,
    },
  });

  const k2Meta = {
    categoryEnglish: "Dhun",
    categoryGujarati: "ધૂન",
    popularScore: 8,
  };

  const k2Slug = "hare-krishna-maha-mantra";
  const k2 = await prisma.kirtan.upsert({
    where: { slug: k2Slug },
    create: {
      slug: k2Slug,
      title: "હરે કૃષ્ણ મહામંત્ર",
      titleTransliterated: "Hare Kṛṣṇa mahāmantra",
      summary: "The great mantra for congregational chanting.",
      externalId: "demo-002",
      sourceId: source.id,
      metadata: json(k2Meta),
    },
    update: {
      title: "હરે કૃષ્ણ મહામંત્ર",
      titleTransliterated: "Hare Kṛṣṇa mahāmantra",
      summary: "The great mantra for congregational chanting.",
      externalId: "demo-002",
      sourceId: source.id,
      metadata: json(k2Meta),
    },
  });

  const k3Meta = {
    categoryEnglish: "Arti",
    categoryGujarati: "આરતી",
    popularScore: 12,
  };

  const k3Slug = "sandhya-arti-demo";
  const k3 = await prisma.kirtan.upsert({
    where: { slug: k3Slug },
    create: {
      slug: k3Slug,
      title: "શ્યામ સરનાર તમે ક્રુપા કરજ્યો",
      titleTransliterated: "Śyām sarnār tame kṛpā karajyo",
      summary: "Sandhyā āratī — demo entry for the Arti category.",
      externalId: "demo-003",
      sourceId: source.id,
      metadata: json(k3Meta),
    },
    update: {
      title: "શ્યામ સરનાર તમે ક્રુપા કરજ્યો",
      titleTransliterated: "Śyām sarnār tame kṛpā karajyo",
      summary: "Sandhyā āratī — demo entry for the Arti category.",
      externalId: "demo-003",
      sourceId: source.id,
      metadata: json(k3Meta),
    },
  });

  await prisma.kirtanText.deleteMany({ where: { kirtanId: k3.id } });
  await prisma.kirtanText.createMany({
    data: [
      {
        kirtanId: k3.id,
        kind: "GUJARATI_LYRICS",
        content:
          "શ્યામ સરનાર તમે ક્રુપા કરજ્યો,\nમારા ઘરે પધારજ્યો... આરતી\nબ્રહ્માનંદ જય જય કારું નિત્ય\nવાંદરાં વૃંદ હતું વિપિન.",
        locale: "gu",
        sortOrder: 0,
      },
      {
        kirtanId: k3.id,
        kind: "TRANSLITERATION",
        content:
          "Śyām sarnār tame kṛpā karajyo,\nmārā ghare padhārajyo... āratī\nBrahmānand jay jay kāru nitya\nvāndarām̐ vr̥nda hatu̐ vipina.",
        locale: "gu-Latn",
        sortOrder: 1,
      },
    ],
  });

  await prisma.kirtanText.deleteMany({ where: { kirtanId: k2.id } });
  await prisma.kirtanText.createMany({
    data: [
      {
        kirtanId: k2.id,
        kind: "GUJARATI_LYRICS",
        content: "હરે કૃષ્ણ હરે કૃષ્ણ\nકૃષ્ણ કૃષ્ણ હરે હરે",
        locale: "gu",
        sortOrder: 0,
      },
      {
        kirtanId: k2.id,
        kind: "TRANSLITERATION",
        content:
          "Hare Kṛṣṇa Hare Kṛṣṇa\nKṛṣṇa Kṛṣṇa Hare Hare",
        locale: "gu-Latn",
        sortOrder: 1,
      },
    ],
  });

  const col = CollectionUpsertSchema.parse({
    slug: "morning-bhajans",
    name: "Morning bhajans",
    description: "Starter set for local testing.",
  });

  const collection = await prisma.collection.upsert({
    where: { slug: col.slug },
    create: { ...col, metadata: json(col.metadata) },
    update: {
      name: col.name,
      description: col.description,
      metadata: json(col.metadata),
    },
  });

  await prisma.kirtanCollection.deleteMany({
    where: { collectionId: collection.id },
  });
  await prisma.kirtanCollection.createMany({
    data: [
      { kirtanId: k1.id, collectionId: collection.id, sortOrder: 0 },
      { kirtanId: k2.id, collectionId: collection.id, sortOrder: 1 },
      { kirtanId: k3.id, collectionId: collection.id, sortOrder: 2 },
    ],
  });

  const rel = await prisma.kirtanRelation.findFirst({
    where: {
      fromKirtanId: k1.id,
      toKirtanId: k2.id,
      relationType: "PAIR_DEMO",
    },
  });
  if (!rel) {
    await prisma.kirtanRelation.create({
      data: {
        fromKirtanId: k1.id,
        toKirtanId: k2.id,
        relationType: "PAIR_DEMO",
        metadata: { note: "Example graph edge for development" },
      },
    });
  }

  const rel2 = await prisma.kirtanRelation.findFirst({
    where: {
      fromKirtanId: k3.id,
      toKirtanId: k1.id,
      relationType: "PAIR_DEMO",
    },
  });
  if (!rel2) {
    await prisma.kirtanRelation.create({
      data: {
        fromKirtanId: k3.id,
        toKirtanId: k1.id,
        relationType: "PAIR_DEMO",
        metadata: { note: "Related arti ↔ prarthana demo" },
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
