import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import {
  PROMOTION_TYPES,
  PROMOTION_STATUSES,
  DISCOUNT_TYPES,
  PROMOTION_TARGET_TYPES,
} from "@swami/shared";

export const promotionTypeEnum = pgEnum("promotion_type", PROMOTION_TYPES);
export const promotionStatusEnum = pgEnum("promotion_status", PROMOTION_STATUSES);
export const discountTypeEnum = pgEnum("discount_type", DISCOUNT_TYPES);
export const promotionTargetTypeEnum = pgEnum(
  "promotion_target_type",
  PROMOTION_TARGET_TYPES
);

export const promotions = pgTable(
  "promotions",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: promotionTypeEnum("type").notNull(),
    status: promotionStatusEnum("status").notNull().default("DRAFT"),
    discountType: discountTypeEnum("discount_type").notNull(),
    discountValue: numeric("discount_value", { precision: 10, scale: 2 }),
    minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }),
    minQuantity: integer("min_quantity").default(1),
    buyQuantity: integer("buy_quantity"),
    getQuantity: integer("get_quantity"),
    getYDiscountPercent: numeric("get_y_discount_percent", {
      precision: 5,
      scale: 2,
    }).default("100.00"),
    comboPrice: numeric("combo_price", { precision: 10, scale: 2 }),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    priority: integer("priority").notNull().default(0),
    usageLimit: integer("usage_limit"),
    timesUsed: integer("times_used").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("promotions_status_idx").on(table.status),
    index("promotions_type_idx").on(table.type),
    index("promotions_priority_idx").on(table.priority),
    index("promotions_dates_idx").on(table.startDate, table.endDate),
  ]
);

export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;
