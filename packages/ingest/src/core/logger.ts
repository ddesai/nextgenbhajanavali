import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { LogLevel } from "./types.js";

export type Logger = (
  level: LogLevel,
  msg: string,
  extra?: Record<string, unknown>,
) => void;

export function createLogger(opts: {
  prefix: string;
  jsonlPath?: string;
  verbose?: boolean;
}): Logger {
  return (level, msg, extra) => {
    if (level === "debug" && !opts.verbose) return;
    const line = `[${new Date().toISOString()}] [${opts.prefix}] [${level.toUpperCase()}] ${msg}${
      extra ? ` ${JSON.stringify(extra)}` : ""
    }`;
    console.error(line);
    if (opts.jsonlPath) {
      void mkdir(dirname(opts.jsonlPath), { recursive: true }).then(() =>
        appendFile(
          opts.jsonlPath!,
          `${JSON.stringify({
            at: new Date().toISOString(),
            level,
            msg,
            ...extra,
          })}\n`,
          "utf8",
        ),
      );
    }
  };
}
