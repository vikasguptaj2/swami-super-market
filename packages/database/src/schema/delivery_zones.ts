import {
  pgTable,
  serial,
  varchar,
  numeric,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const deliveryZones = pgTable(
  "delivery_zones",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    hindiName: varchar("hindi_name", { length: 150 }),
    minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0.00"),
    deliveryCharge: numeric("delivery_charge", { precision: 10, scale: 2 })
      .notNull()
      .default("0.00"),
    freeDeliveryAboveAmount: numeric("free_delivery_above_amount", {
      precision: 10,
      scale: 2,
    }),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("delivery_zones_is_active_idx").on(table.isActive),
    index("delivery_zones_display_order_idx").on(table.displayOrder),
  ]
);

export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type NewDeliveryZone = typeof deliveryZones.$inferInsert;
