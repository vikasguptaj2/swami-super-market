import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5433/swami_super_market";

export const pool = new Pool({
  connectionString,
});

export const db = drizzle({ client: pool });

export type Database = typeof db;
