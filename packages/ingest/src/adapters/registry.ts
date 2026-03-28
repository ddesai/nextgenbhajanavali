import type { NormalizedKirtan, SourceUpsert } from "@ngb/content-schema";
import { SourceUpsertSchema } from "@ngb/content-schema";
import type { SourceAdapter } from "../core/adapter-interface.js";
import {
  loadSourceConfigFile,
  resolveSourceUpsertFromConfig,
} from "../config/load-source-config.js";
import { ANIRDESH_ADAPTER_ID, ANIRDESH_BASE, ANIRDESH_SOURCE_SLUG } from "./anirdesh/config.js";
import { createAnirdeshAdapter } from "./anirdesh/index.js";
import { resolveAnirdeshIngestIds } from "./anirdesh/normalizer.js";
import {
  createMockArchiveAdapter,
  DEFAULT_MOCK_ITEMS,
  MOCK_ARCHIVE_ADAPTER_ID,
} from "./mock-archive/index.js";
import { resolveMockArchiveIngestIds } from "./mock-archive/normalizer.js";

export type IngestIdResolution = { slug: string; externalId: string };

export type RegisteredAdapter = {
  id: string;
  createAdapter: () => SourceAdapter;
  resolveIngestIds: (n: NormalizedKirtan) => IngestIdResolution;
  /** When `config/sources/<id>.json` is absent */
  fallbackSourceUpsert: () => SourceUpsert;
};

const REGISTRY: Record<string, RegisteredAdapter> = {
  [ANIRDESH_ADAPTER_ID]: {
    id: ANIRDESH_ADAPTER_ID,
    createAdapter: () => createAnirdeshAdapter(),
    resolveIngestIds: resolveAnirdeshIngestIds,
    fallbackSourceUpsert: () =>
      SourceUpsertSchema.parse({
        slug: ANIRDESH_SOURCE_SLUG,
        name: "Anirdesh Kirtan Muktavali",
        description:
          "Imported from anirdesh.com kirtan corpus (Swaminarayan tradition). Respect site terms and copyrights.",
        baseUrl: ANIRDESH_BASE,
        type: "CRAWLER",
        metadata: {
          ingestAdapter: ANIRDESH_ADAPTER_ID,
          licenseNote:
            "Verify redistribution rights with Anirdesh.com before publishing recorded media.",
        },
      }),
  },
  [MOCK_ARCHIVE_ADAPTER_ID]: {
    id: MOCK_ARCHIVE_ADAPTER_ID,
    createAdapter: () => {
      const file = loadSourceConfigFile(MOCK_ARCHIVE_ADAPTER_ID);
      const items =
        file?.mock?.items && file.mock.items.length > 0
          ? file.mock.items
          : DEFAULT_MOCK_ITEMS;
      return createMockArchiveAdapter(items);
    },
    resolveIngestIds: resolveMockArchiveIngestIds,
    fallbackSourceUpsert: () =>
      SourceUpsertSchema.parse({
        slug: "mock-archive",
        name: "Mock archive (development)",
        description: "Offline adapter for tests and docs.",
        baseUrl: "https://example.invalid/mock-archive",
        type: "IMPORT",
        metadata: { ingestAdapter: MOCK_ARCHIVE_ADAPTER_ID },
      }),
  },
};

export function listRegisteredAdapterIds(): string[] {
  return Object.keys(REGISTRY).sort();
}

export function getAdapterRegistryEntry(adapterId: string): RegisteredAdapter {
  const e = REGISTRY[adapterId];
  if (!e) {
    const known = listRegisteredAdapterIds().join(", ");
    throw new Error(`Unknown source adapter "${adapterId}". Known: ${known}`);
  }
  return e;
}

export function getSourceAdapter(adapterId: string): SourceAdapter {
  return getAdapterRegistryEntry(adapterId).createAdapter();
}

/** Merge file config (if present) with registry fallback for `SourceUpsert`. */
export function resolveSourceUpsertForAdapter(adapterId: string): SourceUpsert {
  const file = loadSourceConfigFile(adapterId);
  if (file) return resolveSourceUpsertFromConfig(file);
  return getAdapterRegistryEntry(adapterId).fallbackSourceUpsert();
}
