import postgres from "postgres";

const g = globalThis as unknown as {
  __ngb_postgres?: ReturnType<typeof postgres>;
};

function createSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  return postgres(url, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 15,
  });
}

/** Postgres.js client — no native Prisma engine; works on Vercel Node. */
export const sql: ReturnType<typeof postgres> =
  g.__ngb_postgres ?? (g.__ngb_postgres = createSql());

export async function disconnectDb() {
  if (g.__ngb_postgres) {
    await g.__ngb_postgres.end({ timeout: 5 });
    delete g.__ngb_postgres;
  }
}
