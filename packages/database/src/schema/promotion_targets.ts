import {
  pgTable,
  serial,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { promotions, promotionTargetTypeEnum } from "./promotions.js";

export const promotionTargets = pgTable(
  "promotion_targets",
  {
    id: serial("id").primaryKey(),
    promotionId: integer("promotion_id")
      .notNull()
      .references(() => promotions.id, { onDelete: "cascade" }),
    targetType: promotionTargetTypeEnum("target_type").notNull(),
    targetId: integer("target_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("promotion_targets_promo_idx").on(table.promotionId),
    index("promotion_targets_lookup_idx").on(table.targetType, table.targetId),
  ]
);

export type PromotionTarget = typeof promotionTargets.$inferSelect;
export type NewPromotionTarget = typeof promotionTargets.$inferInsert;
