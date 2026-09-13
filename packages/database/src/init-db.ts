import pg from "pg";
const { Client } = pg;

async function init() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@127.0.0.1:5433/swami_super_market";

  const client = new Client({ connectionString });
  await client.connect();
  console.log("🔌 Connected to PostgreSQL. Enabling pg_trgm extension...");
  await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
  console.log("✅ pg_trgm extension enabled successfully.");
  await client.end();
}

init().catch((err) => {
  console.error("❌ Failed to enable pg_trgm extension:", err);
  process.exit(1);
});
