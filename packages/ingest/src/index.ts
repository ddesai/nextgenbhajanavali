export type { SourceAdapter } from "./core/adapter-interface.js";
export { sha256Hex } from "./core/checksum.js";
export { defaultIngestPaths } from "./core/types.js";
export type { CrawlContext, IngestPaths } from "./core/types.js";
export { createLogger } from "./core/logger.js";
export type { Logger } from "./core/logger.js";
export { writeDiscoveryQueue } from "./pipeline/write-queue.js";
export { runExtract } from "./pipeline/run-extract.js";
export { runNormalize } from "./pipeline/run-normalize.js";
export {
  runSyncNormalizedFile,
  disconnectDbPool as disconnectPrisma,
} from "./sync/run-sync-file.js";
export { runImportIngestFile } from "./sync/run-import-ingest.js";
export { mapNormalizedToIngestRecord } from "./sync/map-to-ingest.js";
export { buildIngestRecordFromNormalized } from "./sync/build-ingest-record.js";
export {
  getSourceAdapter,
  getAdapterRegistryEntry,
  listRegisteredAdapterIds,
  resolveSourceUpsertForAdapter,
} from "./adapters/registry.js";
export type { RegisteredAdapter, IngestIdResolution } from "./adapters/registry.js";
export {
  loadSourceConfigFile,
  getSourcesConfigDir,
  resolveSourceUpsertFromConfig,
} from "./config/load-source-config.js";
export type { SourceFileConfig } from "./config/source-config-schema.js";
export { SourceFileConfigSchema } from "./config/source-config-schema.js";
export * as anirdesh from "./adapters/anirdesh/index.js";
export * as mockArchive from "./adapters/mock-archive/index.js";
export { DEFAULT_USER_AGENT } from "./adapters/anirdesh/config.js";
