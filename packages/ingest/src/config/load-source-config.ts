import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { SourceUpsertSchema } from "@ngb/content-schema";
import type { SourceFileConfig } from "./source-config-schema.js";
import { SourceFileConfigSchema } from "./source-config-schema.js";

function upwardFindConfigSourcesDir(start: string): string | null {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, "config", "sources");
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function getSourcesConfigDir(): string {
  const env = process.env.NGB_SOURCES_CONFIG_DIR;
  if (env?.trim()) return path.resolve(env.trim());
  const found = upwardFindConfigSourcesDir(process.cwd());
  if (found) return found;
  return path.resolve(process.cwd(), "config", "sources");
}

/** Load `config/sources/<adapterId>.json`. Missing file → null (caller may use embedded defaults). */
export function loadSourceConfigFile(adapterId: string): SourceFileConfig | null {
  const dir = getSourcesConfigDir();
  const p = path.join(dir, `${adapterId}.json`);
  if (!existsSync(p)) return null;
  const raw = readFileSync(p, "utf8");
  const data = JSON.parse(raw) as unknown;
  return SourceFileConfigSchema.parse(data);
}

/** Merge file config with runtime defaults; source upsert is always Zod-validated. */
export function resolveSourceUpsertFromConfig(cfg: SourceFileConfig) {
  return SourceUpsertSchema.parse({
    ...cfg.source,
    metadata: {
      ingestAdapter: cfg.adapterId,
      ...cfg.source.metadata,
    },
  });
}
