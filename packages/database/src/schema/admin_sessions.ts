import {
  pgTable,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    data: text("data").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_admin_sessions_expires_at").on(table.expiresAt),
  ]
);

export type AdminSession = typeof adminSessions.$inferSelect;
export type NewAdminSession = typeof adminSessions.$inferInsert;
