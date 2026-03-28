/**
 * Server-only helpers: avoid hitting Postgres when no DB URL is configured.
 */

import { resolveDatabaseUrl } from "@ngb/db";

export function isDatabaseConfigured(): boolean {
  return Boolean(resolveDatabaseUrl());
}

/** User-facing explanation (no stack traces). */
export const DATABASE_URL_MISSING_MESSAGE =
  "This deployment is not connected to PostgreSQL yet. Add a database connection string to environment variables, then redeploy.";

export function getDatabaseSetupHint(): string {
  if (process.env.VERCEL === "1") {
    return [
      "Vercel: Project → Settings → Environment Variables.",
      "Add DATABASE_URL, or use Vercel Postgres / Neon and link the integration (often exposes POSTGRES_URL — that works too).",
      "Use your full connection string; many hosts require ?sslmode=require at the end.",
      "Save for Production, redeploy, then run migrations (pg_trgm + searchVector per docs/SEARCH.md).",
    ].join(" ");
  }
  return [
    "Locally: set DATABASE_URL in .env or .env.local, then pnpm db:push && pnpm db:seed.",
    "Search needs migrations: docs/SEARCH.md.",
  ].join(" ");
}
