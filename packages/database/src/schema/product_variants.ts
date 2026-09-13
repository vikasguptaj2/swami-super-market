import {
  pgTable,
  serial,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { products } from "./products.js";

export const productVariants = pgTable(
  "product_variants",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    unit: varchar("unit", { length: 50 }).notNull(),
    sku: varchar("sku", { length: 100 }).unique(),
    mrp: numeric("mrp", { precision: 10, scale: 2 }).notNull(),
    sellingPrice: numeric("selling_price", { precision: 10, scale: 2 }).notNull(),
    currentStock: integer("current_stock").notNull().default(0),
    minStockAlert: integer("min_stock_alert").notNull().default(5),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("variants_product_id_idx").on(table.productId),
    index("variants_is_active_idx").on(table.isActive),
  ]
);

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
