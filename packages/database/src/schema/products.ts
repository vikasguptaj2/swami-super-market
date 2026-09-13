import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { categories } from "./categories.js";

export const productStatusEnum = pgEnum("product_status", [
  "ACTIVE",
  "DRAFT",
  "ARCHIVED",
]);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    hindiName: varchar("hindi_name", { length: 255 }),
    searchKeywords: text("search_keywords"),
    description: text("description"),
    status: productStatusEnum("status").notNull().default("ACTIVE"),
    imageUrl: text("image_url"),
    images: jsonb("images").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("products_category_id_idx").on(table.categoryId),
    index("products_status_idx").on(table.status),
    index("products_name_trgm_idx").using("gin", sql`${table.name} gin_trgm_ops`),
    index("products_hindi_name_trgm_idx").using(
      "gin",
      sql`${table.hindiName} gin_trgm_ops`
    ),
    index("products_search_keywords_trgm_idx").using(
      "gin",
      sql`${table.searchKeywords} gin_trgm_ops`
    ),
  ]
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
