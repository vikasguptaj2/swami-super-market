import {
  pgTable,
  serial,
  varchar,
  text,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(), // Singleton row: always id = 1
  address: text("address").notNull(),
  hindiAddress: text("hindi_address"),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }).notNull(), // Single source of truth
  googleMapsUrl: text("google_maps_url"),
  mapsEmbedUrl: text("maps_embed_url"),
  openingHoursText: text("opening_hours_text"),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type StoreSettings = typeof storeSettings.$inferSelect;
export type NewStoreSettings = typeof storeSettings.$inferInsert;
