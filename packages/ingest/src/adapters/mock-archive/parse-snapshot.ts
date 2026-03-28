import { z } from "zod";

/** Wire format stored in snapshot bodies for the mock adapter. */
export const MockArchiveSnapshotSchema = z.object({
  kind: z.literal("mock-archive-v1"),
  key: z.string().min(1),
  titleGujarati: z.string().min(1),
  titleLatin: z.string().optional(),
  gujaratiLyrics: z.string().optional(),
  transliteration: z.string().optional(),
  englishTranslation: z.string().optional(),
});

export type MockArchiveSnapshot = z.infer<typeof MockArchiveSnapshotSchema>;
