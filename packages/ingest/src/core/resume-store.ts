import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";

const ResumeSchema = z.object({
  version: z.literal(1),
  adapterId: z.string(),
  entries: z.record(
    z.string(),
    z.object({
      lastChecksum: z.string(),
      lastSuccessAt: z.string(),
      lastHttpStatus: z.number().optional(),
    }),
  ),
});

export type ResumeStoreData = z.infer<typeof ResumeSchema>;

export class ResumeStore {
  private data: ResumeStoreData;

  private constructor(
    readonly path: string,
    data: ResumeStoreData,
  ) {
    this.data = data;
  }

  static async load(path: string, adapterId: string): Promise<ResumeStore> {
    try {
      const raw = await readFile(path, "utf8");
      const parsed = ResumeSchema.parse(JSON.parse(raw));
      if (parsed.adapterId !== adapterId)
        throw new Error(`Resume file adapter mismatch: ${parsed.adapterId}`);
      return new ResumeStore(path, parsed);
    } catch {
      return new ResumeStore(path, {
        version: 1,
        adapterId,
        entries: {},
      });
    }
  }

  get(sourceKey: string) {
    return this.data.entries[sourceKey];
  }

  shouldSkip(sourceKey: string, checksum: string, skipUnchanged: boolean) {
    if (!skipUnchanged) return false;
    const prev = this.data.entries[sourceKey];
    return prev?.lastChecksum === checksum;
  }

  markSuccess(
    sourceKey: string,
    checksum: string,
    httpStatus: number | undefined,
  ) {
    this.data.entries[sourceKey] = {
      lastChecksum: checksum,
      lastSuccessAt: new Date().toISOString(),
      lastHttpStatus: httpStatus,
    };
  }

  async persist() {
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, `${JSON.stringify(this.data, null, 2)}\n`, "utf8");
  }
}
