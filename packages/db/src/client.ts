import postgres from "postgres";
import { resolveDatabaseUrl } from "./database-url.js";

const g = globalThis as unknown as {
  __ngb_postgres?: ReturnType<typeof postgres>;
};

function createSql() {
  const url = resolveDatabaseUrl();
  if (!url) {
    throw new Error(
      "No database URL: set DATABASE_URL or POSTGRES_URL (Vercel Postgres / Neon / etc.).",
    );
  }
  return postgres(url, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 15,
  });
}

function getInstance(): ReturnType<typeof postgres> {
  if (!g.__ngb_postgres) g.__ngb_postgres = createSql();
  return g.__ngb_postgres;
}

/**
 * Lazy Postgres.js client — no connection (and no `DATABASE_URL` check) until first use.
 * Safe to import during Next.js build when env is unset.
 */
export const sql: ReturnType<typeof postgres> = new Proxy(
  function stub() {
    /* tagged-template target */
  } as unknown as ReturnType<typeof postgres>,
  {
    get(_target, prop) {
      const inst = getInstance();
      const v = Reflect.get(inst, prop, inst);
      return typeof v === "function" ? v.bind(getInstance()) : v;
    },
    apply(_target, _thisArg, argList) {
      const inst = getInstance();
      return Reflect.apply(
        inst as unknown as (...args: unknown[]) => unknown,
        inst,
        argList as unknown[],
      );
    },
  },
) as ReturnType<typeof postgres>;

export async function disconnectDb() {
  if (g.__ngb_postgres) {
    await g.__ngb_postgres.end({ timeout: 5 });
    delete g.__ngb_postgres;
  }
}
