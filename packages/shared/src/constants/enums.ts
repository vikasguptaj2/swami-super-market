export const PRODUCT_STATUSES = ["ACTIVE", "DRAFT", "ARCHIVED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ORDER_STATUSES = [
  "PENDING_WHATSAPP",
  "CONFIRMED",
  "PACKED",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["COD", "UPI", "ONLINE"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const INVENTORY_MOVEMENT_REASONS = [
  "ORDER_CONFIRMED",
  "ORDER_CANCELLED",
  "MANUAL_ADJUSTMENT",
] as const;
export type InventoryMovementReason =
  (typeof INVENTORY_MOVEMENT_REASONS)[number];

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_WHATSAPP: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const PROMOTION_TYPES = [
  "SIMPLE_DISCOUNT",
  "BUY_X_GET_Y",
  "COMBO",
] as const;
export type PromotionType = (typeof PROMOTION_TYPES)[number];

export const PROMOTION_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "EXPIRED",
  "ARCHIVED",
] as const;
export type PromotionStatus = (typeof PROMOTION_STATUSES)[number];

export const DISCOUNT_TYPES = [
  "PERCENTAGE",
  "FIXED_AMOUNT",
  "FREE",
  "COMBO_PRICE",
] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const PROMOTION_TARGET_TYPES = [
  "PRODUCT",
  "VARIANT",
  "CATEGORY",
] as const;
export type PromotionTargetType = (typeof PROMOTION_TARGET_TYPES)[number];
