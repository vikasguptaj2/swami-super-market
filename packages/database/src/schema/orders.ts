import {
  pgTable,
  serial,
  varchar,
  text,
  numeric,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from "@swami/shared";

// Enums derived directly from shared constants to prevent any drift
export const orderStatusEnum = pgEnum("order_status", ORDER_STATUSES);
export const paymentMethodEnum = pgEnum("payment_method", PAYMENT_METHODS);
export const paymentStatusEnum = pgEnum("payment_status", PAYMENT_STATUSES);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderCode: varchar("order_code", { length: 50 }).notNull().unique(),
    customerName: varchar("customer_name", { length: 150 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
    customerAddress: text("customer_address").notNull(),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    deliveryCharge: numeric("delivery_charge", { precision: 10, scale: 2 })
      .notNull()
      .default("0.00"),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("PENDING"),
    status: orderStatusEnum("status").notNull().default("PENDING_WHATSAPP"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("orders_order_code_idx").on(table.orderCode),
    index("orders_customer_phone_idx").on(table.customerPhone),
    index("orders_status_idx").on(table.status),
  ]
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
