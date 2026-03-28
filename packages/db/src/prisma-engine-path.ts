import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Ensures `PRISMA_QUERY_ENGINE_LIBRARY` points at the generated engine next to this
 * package’s compiled output. Required on Vercel: Prisma’s generated fallback uses
 * `process.cwd()/src/generated/prisma`, but cwd is the Next app, not `@ngb/db`.
 */
function pickQueryEngineFile(candidates: string[]): string | undefined {
  if (candidates.length === 0) return undefined;
  const { platform, arch } = process;
  if (platform === "linux") {
    const rhel = candidates.find((f) => f.includes("rhel-openssl-3.0.x"));
    if (rhel) return rhel;
    const so = candidates.find((f) => f.endsWith(".so.node"));
    if (so) return so;
  }
  if (platform === "darwin") {
    if (arch === "arm64") {
      const m = candidates.find((f) => f.includes("darwin-arm64"));
      if (m) return m;
    }
    const d = candidates.find(
      (f) => f.includes("darwin") && f.endsWith(".dylib.node"),
    );
    if (d) return d;
  }
  if (platform === "win32") {
    const w = candidates.find((f) => f.includes("windows"));
    if (w) return w;
  }
  return candidates[0];
}

export function ensurePrismaQueryEngineLibraryEnv() {
  if (process.env.PRISMA_QUERY_ENGINE_LIBRARY) return;
  const here = path.dirname(fileURLToPath(import.meta.url));
  const genDir = path.join(here, "generated", "prisma");
  if (!existsSync(genDir)) return;
  const candidates = readdirSync(genDir).filter(
    (f) => f.startsWith("libquery_engine-") && f.endsWith(".node"),
  );
  const engineFile = pickQueryEngineFile(candidates);
  if (engineFile)
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(genDir, engineFile);
}

ensurePrismaQueryEngineLibraryEnv();
