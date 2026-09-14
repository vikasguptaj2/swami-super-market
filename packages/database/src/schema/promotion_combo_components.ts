import {
  pgTable,
  serial,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { promotions } from "./promotions.js";
import { productVariants } from "./product_variants.js";

export const promotionComboComponents = pgTable(
  "promotion_combo_components",
  {
    id: serial("id").primaryKey(),
    promotionId: integer("promotion_id")
      .notNull()
      .references(() => promotions.id, { onDelete: "cascade" }),
    productVariantId: integer("product_variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("combo_components_promo_idx").on(table.promotionId),
    index("combo_components_variant_idx").on(table.productVariantId),
  ]
);

export type PromotionComboComponent = typeof promotionComboComponents.$inferSelect;
export type NewPromotionComboComponent = typeof promotionComboComponents.$inferInsert;
