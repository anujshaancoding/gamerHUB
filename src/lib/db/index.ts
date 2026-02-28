import postgres from "postgres";

// Singleton connection pool
let sql: postgres.Sql | null = null;

export function getPool(): postgres.Sql {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    sql = postgres(connectionString, {
      max: 20,
      idle_timeout: 20,
      connect_timeout: 10,
      // Transform column names from snake_case to snake_case (keep as-is)
      transform: { undefined: null },
    });
  }
  return sql;
}

// For graceful shutdown
export async function closePool() {
  if (sql) {
    await sql.end();
    sql = null;
  }
}
