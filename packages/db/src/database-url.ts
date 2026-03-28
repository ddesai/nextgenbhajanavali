/** Env keys Vercel / Prisma / adapters may use for the same Postgres connection. */
const URL_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "PRISMA_DATABASE_URL",
] as const;

export function resolveDatabaseUrl(): string | undefined {
  for (const key of URL_KEYS) {
    const v = process.env[key]?.trim();
    if (v && !v.startsWith("placeholder:")) return v;
  }
  return undefined;
}
