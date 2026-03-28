import type { IngestQueueItem } from "@ngb/content-schema";
import type { RateLimiter } from "./rate-limit.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type IngestPaths = {
  root: string;
  queueFile: (adapterId: string) => string;
  snapshotDir: (adapterId: string) => string;
  normalizedFile: (adapterId: string) => string;
  resumeFile: (adapterId: string) => string;
  errorsFile: (adapterId: string) => string;
  runLogFile: (adapterId: string) => string;
};

export function defaultIngestPaths(root: string): IngestPaths {
  return {
    root,
    queueFile: (adapterId) => `${root}/${adapterId}/queue.jsonl`,
    snapshotDir: (adapterId) => `${root}/${adapterId}/snapshots`,
    normalizedFile: (adapterId) => `${root}/${adapterId}/normalized.jsonl`,
    resumeFile: (adapterId) => `${root}/${adapterId}/resume.json`,
    errorsFile: (adapterId) => `${root}/${adapterId}/errors.jsonl`,
    runLogFile: (adapterId) => `${root}/${adapterId}/run.jsonl`,
  };
}

export type CrawlContext = {
  paths: IngestPaths;
  adapterId: string;
  limiter: RateLimiter;
  userAgent: string;
  log: (level: LogLevel, msg: string, extra?: Record<string, unknown>) => void;
};

export type RawCrawlResult = {
  queueItem: IngestQueueItem;
  url: string;
  httpStatus: number;
  body: string;
  contentType: string;
  fetchedAt: string;
};

export type SourceAdapterMeta = {
  id: string;
  displayName: string;
};
