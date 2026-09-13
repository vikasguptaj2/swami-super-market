import {
  pgTable,
  serial,
  varchar,
  integer,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { orders } from "./orders.js";
import { productVariants } from "./product_variants.js";

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productVariantId: integer("product_variant_id").references(
      () => productVariants.id,
      { onDelete: "set null" }
    ),
    // Immutable snapshot fields at order time
    productNameSnapshot: varchar("product_name_snapshot", {
      length: 255,
    }).notNull(),
    variantUnitSnapshot: varchar("variant_unit_snapshot", {
      length: 50,
    }).notNull(),
    unitPriceSnapshot: numeric("unit_price_snapshot", {
      precision: 10,
      scale: 2,
    }).notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_variant_id_idx").on(table.productVariantId),
  ]
);

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
