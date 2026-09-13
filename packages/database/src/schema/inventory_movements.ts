import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { INVENTORY_MOVEMENT_REASONS } from "@swami/shared";
import { productVariants } from "./product_variants.js";
import { orders } from "./orders.js";

export const inventoryMovementReasonEnum = pgEnum(
  "inventory_movement_reason",
  INVENTORY_MOVEMENT_REASONS
);

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: serial("id").primaryKey(),
    productVariantId: integer("product_variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantityChange: integer("quantity_change").notNull(), // Negative for deductions, positive for restocks
    reason: inventoryMovementReasonEnum("reason").notNull(),
    orderId: integer("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inventory_movements_variant_id_idx").on(table.productVariantId),
    index("inventory_movements_order_id_idx").on(table.orderId),
    index("inventory_movements_created_at_idx").on(table.createdAt),
  ]
);

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type NewInventoryMovement = typeof inventoryMovements.$inferInsert;
