#!/usr/bin/env node
import {
  createLogger,
  DEFAULT_USER_AGENT,
  defaultIngestPaths,
  disconnectPrisma,
  getSourceAdapter,
  listRegisteredAdapterIds,
  loadSourceConfigFile,
  runExtract,
  runImportIngestFile,
  runNormalize,
  runSyncNormalizedFile,
  writeDiscoveryQueue,
} from "@ngb/ingest";

function numArg(name: string, def: number) {
  const i = process.argv.indexOf(name);
  if (i === -1 || !process.argv[i + 1]) return def;
  return Number(process.argv[i + 1]);
}

function strArg(name: string, def: string) {
  const i = process.argv.indexOf(name);
  if (i === -1 || !process.argv[i + 1]) return def;
  return process.argv[i + 1]!;
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

async function main() {
  const [cmd] = process.argv.slice(2);
  if (!cmd || cmd === "--help" || cmd === "-h") {
    console.error(`Next Gen Bhajanavali — source ingest CLI

Usage:
  pnpm --filter @ngb/tool-ingest start -- <command> [args] [options]

Source-aware commands (replace <source> with adapter id, e.g. anirdesh, mock-archive):
  discover <source>      Write queue.jsonl (no full document fetch)
  crawl <source>          Alias of extract (HTTP via Playwright request API → snapshots)
  extract <source>        Polite HTTP fetch → snapshots (no browser window)
  parse <source>          Alias of normalize (snapshots → normalized.jsonl)
  normalize <source>      Snapshots → normalized.jsonl (Zod NormalizedKirtan)
  sync <source>           normalized.jsonl → Postgres (upsertIngestRecord)
  pipeline <source>      discover + extract + normalize (no DB sync)

Other commands:
  list-adapters           Print registered adapter ids
  import <file.jsonl>     Upsert IngestRecord lines (manual / admin / CSV export pipeline)

Options:
  --data-dir <path>       Default: .ingest
  --parts <1,2>           Comma-separated parts (anirdesh)
  --from <n>              Range start (default 1)
  --to <n>                Range end (default 20)
  --delay-ms <n>          Polite delay between requests (default 750)
  --limit <n>             Max items (extract only)
  --skip-unchanged        Resume: skip when raw body checksum unchanged
  --verbose
  --dry-run              sync / import: validate only

Config:
  config/sources/<source>.json   Declarative SourceUpsert + flags (repo root).

Environment:
  DATABASE_URL                    Required for sync / import
  NGB_SOURCES_CONFIG_DIR         Override config/sources directory
  NGB_INGEST_SKIP_CHECKSUM_GUARD Skip cross-slug checksum dedup check (dangerous)

Playwright:
  pnpm exec playwright install chromium
`);
    process.exit(cmd ? 0 : 1);
  }

  if (cmd === "list-adapters") {
    for (const id of listRegisteredAdapterIds()) console.log(id);
    return;
  }

  if (cmd === "import") {
    const pathArg = process.argv[3];
    if (!pathArg) {
      console.error("Usage: … import <records.jsonl>");
      process.exit(1);
    }
    const log = createLogger({
      prefix: "ingest:import",
      jsonlPath: strArg("--log-file", ".ingest/import-run.jsonl"),
      verbose: hasFlag("--verbose"),
    });
    try {
      await runImportIngestFile({
        path: pathArg,
        log,
        dryRun: hasFlag("--dry-run"),
      });
    } finally {
      await disconnectPrisma();
    }
    return;
  }

  const dataDir = strArg("--data-dir", ".ingest");
  const paths = defaultIngestPaths(dataDir);
  const adapterId = process.argv[3];
  if (!adapterId) {
    console.error("Missing source adapter id. Try: list-adapters");
    process.exit(1);
  }

  const fileCfg = loadSourceConfigFile(adapterId);
  if (fileCfg && fileCfg.enabled === false) {
    console.error(`Source "${adapterId}" is disabled in config/sources/${adapterId}.json`);
    process.exit(1);
  }

  const normalizedCmd =
    cmd === "crawl"
      ? "extract"
      : cmd === "parse"
        ? "normalize"
        : cmd;

  const adapter = getSourceAdapter(adapterId);
  const delayMs =
    fileCfg?.rateLimitMsDefault !== undefined
      ? fileCfg.rateLimitMsDefault
      : numArg("--delay-ms", 750);
  const userAgent = strArg("--user-agent", DEFAULT_USER_AGENT);
  const verbose = hasFlag("--verbose");
  const log = createLogger({
    prefix: `ingest:${adapterId}`,
    jsonlPath: paths.runLogFile(adapterId),
    verbose,
  });

  if (normalizedCmd === "discover") {
    const parts = strArg("--parts", "1")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    const from = numArg("--from", 1);
    const to = numArg("--to", 20);
    await writeDiscoveryQueue({
      adapter,
      paths,
      parts: parts.length ? parts : [1],
      from,
      to,
      log,
    });
    return;
  }

  if (normalizedCmd === "extract") {
    const queueFile = strArg("--queue", paths.queueFile(adapterId));
    await runExtract({
      adapter,
      paths,
      queueFile,
      minDelayMs: delayMs,
      userAgent,
      log,
      limit: hasFlag("--limit") ? numArg("--limit", 1) : undefined,
      skipUnchanged: hasFlag("--skip-unchanged"),
      maxConsecutiveErrors: numArg("--max-errors", 0) || undefined,
    });
    return;
  }

  if (normalizedCmd === "normalize") {
    await runNormalize({ adapter, paths, log });
    return;
  }

  if (normalizedCmd === "sync") {
    const file = strArg("--file", paths.normalizedFile(adapterId));
    try {
      await runSyncNormalizedFile({
        path: file,
        log,
        dryRun: hasFlag("--dry-run"),
      });
    } finally {
      await disconnectPrisma();
    }
    return;
  }

  if (normalizedCmd === "pipeline") {
    const parts = strArg("--parts", "1")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    const from = numArg("--from", 1);
    const to = numArg("--to", 20);
    await writeDiscoveryQueue({
      adapter,
      paths,
      parts: parts.length ? parts : [1],
      from,
      to,
      log,
    });
    await runExtract({
      adapter,
      paths,
      queueFile: paths.queueFile(adapterId),
      minDelayMs: delayMs,
      userAgent,
      log,
      limit: hasFlag("--limit") ? numArg("--limit", 1) : undefined,
      skipUnchanged: hasFlag("--skip-unchanged"),
      maxConsecutiveErrors: numArg("--max-errors", 0) || undefined,
    });
    await runNormalize({ adapter, paths, log });
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
