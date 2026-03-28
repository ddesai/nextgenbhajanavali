#!/usr/bin/env node
/**
 * HTTP fetch layer for future sources. Keeps network I/O out of the parser and DB.
 * Implement per-site adapters here; emit raw artifacts (HTML/JSON) for parsers.
 */
import { z } from "zod";

const Args = z.object({
  url: z.string().url(),
  out: z.string().optional(),
});

async function main() {
  const urlArg = process.argv[2];
  if (!urlArg) {
    console.error(
      "Usage: pnpm --filter @ngb/tool-crawler start -- <url> [out-file]",
    );
    process.exit(1);
  }
  const outPath = process.argv[3];
  const { url } = Args.parse({ url: urlArg, out: outPath });

  const res = await fetch(url, {
    headers: { "user-agent": "NextGenBhajanavaliCrawler/0.1 (+dev)" },
  });
  if (!res.ok) {
    console.error(`HTTP ${res.status} for ${url}`);
    process.exit(1);
  }
  const body = await res.text();

  if (outPath) {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(outPath, body, "utf8");
    console.error(`Wrote ${body.length} chars to ${outPath}`);
  } else {
    process.stdout.write(body);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
