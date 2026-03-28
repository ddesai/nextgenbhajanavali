import type { NormalizedKirtan } from "@ngb/content-schema";
import type { IngestRecord } from "@ngb/content-schema";
import {
  getAdapterRegistryEntry,
  resolveSourceUpsertForAdapter,
} from "../adapters/registry.js";
import { buildIngestRecordFromNormalized } from "./build-ingest-record.js";

/**
 * Map normalized rows → DB `IngestRecord` using the adapter registry + `config/sources/*.json`.
 * Adding a source: register in `adapters/registry.ts`, add config file, implement `SourceAdapter`.
 */
export function mapNormalizedToIngestRecord(n: NormalizedKirtan): IngestRecord {
  const entry = getAdapterRegistryEntry(n.adapterId);
  const source = resolveSourceUpsertForAdapter(n.adapterId);
  const { slug, externalId } = entry.resolveIngestIds(n);
  return buildIngestRecordFromNormalized(n, source, slug, externalId);
}
