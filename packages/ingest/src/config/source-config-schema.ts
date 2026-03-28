import { SourceUpsertSchema } from "@ngb/content-schema";
import { z } from "zod";

/** Declarative config per adapter in repo `config/sources/<adapterId>.json`. */
export const SourceFileConfigSchema = z.object({
  adapterId: z.string().min(1),
  enabled: z.boolean().default(true),
  source: SourceUpsertSchema.omit({ metadata: true }).extend({
    metadata: z.record(z.string(), z.unknown()).default({}),
  }),
  rateLimitMsDefault: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
  /** Mock adapter: configurable discovery items. */
  mock: z
    .object({
      items: z
        .array(
          z.object({
            key: z.string().min(1),
            ordinal: z.number().int(),
          }),
        )
        .optional(),
    })
    .strict()
    .optional(),
});

export type SourceFileConfig = z.infer<typeof SourceFileConfigSchema>;
