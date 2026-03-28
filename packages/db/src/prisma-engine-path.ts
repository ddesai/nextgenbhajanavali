import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Ensures `PRISMA_QUERY_ENGINE_LIBRARY` points at the generated engine next to this
 * package’s compiled output. Required on Vercel: Prisma’s generated fallback uses
 * `process.cwd()/src/generated/prisma`, but cwd is the Next app, not `@ngb/db`.
 */
export function ensurePrismaQueryEngineLibraryEnv() {
  if (process.env.PRISMA_QUERY_ENGINE_LIBRARY) return;
  const here = path.dirname(fileURLToPath(import.meta.url));
  const genDir = path.join(here, "generated", "prisma");
  if (!existsSync(genDir)) return;
  const engineFile = readdirSync(genDir).find(
    (f) => f.startsWith("libquery_engine-") && f.endsWith(".node"),
  );
  if (engineFile)
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(genDir, engineFile);
}

ensurePrismaQueryEngineLibraryEnv();
