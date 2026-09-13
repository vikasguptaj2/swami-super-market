import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_METHODS } from "../constants/enums.js";

export const createOrderItemSchema = z.object({
  productVariantId: z.coerce.number().int().positive("Invalid variant ID"),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
});

export const createOrderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Customer name must be at least 2 characters"),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  customerAddress: z
    .string()
    .trim()
    .min(5, "Please enter your complete address (Village/Mohalla, Usasa or nearby)"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  items: z
    .array(createOrderItemSchema)
    .min(1, "Order must contain at least one item"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
