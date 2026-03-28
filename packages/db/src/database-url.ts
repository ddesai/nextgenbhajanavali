/**
 * Env keys for the same Neon/Vercel Postgres connection.
 * Vercel Storage often exposes prefixed names, e.g. `projectname_DATABASE_URL`.
 */
const PRIMARY_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "PRISMA_DATABASE_URL",
] as const;

const URL_SUFFIXES = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
] as const;

function pickPostgresUrl(raw: string | undefined): string | undefined {
  const v = raw?.trim();
  if (!v || v.startsWith("placeholder:")) return undefined;
  if (v.startsWith("postgresql://") || v.startsWith("postgres://")) return v;
  return undefined;
}

export function resolveDatabaseUrl(): string | undefined {
  for (const key of PRIMARY_KEYS) {
    const u = pickPostgresUrl(process.env[key]);
    if (u) return u;
  }
  for (const envKey of Object.keys(process.env)) {
    for (const suffix of URL_SUFFIXES) {
      if (envKey.endsWith(`_${suffix}`)) {
        const u = pickPostgresUrl(process.env[envKey]);
        if (u) return u;
      }
    }
  }
  return undefined;
}
