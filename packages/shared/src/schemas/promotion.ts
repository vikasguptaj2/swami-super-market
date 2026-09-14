import { z } from "zod";
import {
  PROMOTION_TYPES,
  PROMOTION_STATUSES,
  DISCOUNT_TYPES,
  PROMOTION_TARGET_TYPES,
} from "../constants/enums.js";

export const promotionTargetSchema = z.object({
  targetType: z.enum(PROMOTION_TARGET_TYPES),
  targetId: z.coerce.number().int().positive("Invalid target ID"),
});

export const comboComponentSchema = z.object({
  productVariantId: z.coerce
    .number()
    .int()
    .positive("Invalid product variant ID"),
  quantity: z.coerce
    .number()
    .int()
    .positive("Quantity must be at least 1")
    .default(1),
});

export const createPromotionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Promotion name must be at least 2 characters")
      .max(255, "Promotion name cannot exceed 255 characters"),
    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional()
      .nullable(),
    type: z.enum(PROMOTION_TYPES),
    status: z.enum(PROMOTION_STATUSES).default("DRAFT"),
    discountType: z.enum(DISCOUNT_TYPES),
    discountValue: z.coerce.number().positive().optional().nullable(),
    minOrderAmount: z.coerce.number().nonnegative().optional().nullable(),
    minQuantity: z.coerce.number().int().positive().default(1).optional().nullable(),
    buyQuantity: z.coerce.number().int().positive().optional().nullable(),
    getQuantity: z.coerce.number().int().positive().optional().nullable(),
    getYDiscountPercent: z.coerce
      .number()
      .min(1, "Get Y discount percent must be at least 1%")
      .max(100, "Get Y discount percent cannot exceed 100%")
      .default(100)
      .optional()
      .nullable(),
    comboPrice: z.coerce.number().positive().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    priority: z.coerce.number().int().default(0),
    usageLimit: z.coerce.number().int().positive().optional().nullable(),
    targets: z.array(promotionTargetSchema).default([]),
    comboComponents: z.array(comboComponentSchema).default([]),
  })
  .superRefine((data, ctx) => {
    // 1. Simple discount validation
    if (data.type === "SIMPLE_DISCOUNT") {
      if (!data.targets || data.targets.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Simple discount promotion requires at least one target (Product, Variant, or Category).",
          path: ["targets"],
        });
      }
      if (data.discountType === "PERCENTAGE") {
        if (!data.discountValue || data.discountValue <= 0 || data.discountValue > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Percentage discount must be between 1 and 100.",
            path: ["discountValue"],
          });
        }
      } else if (data.discountType === "FIXED_AMOUNT") {
        if (!data.discountValue || data.discountValue <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Fixed amount discount must be greater than ₹0.",
            path: ["discountValue"],
          });
        }
      }
    }

    // 2. BOGO validation: Must target PRODUCT or VARIANT only (CATEGORY forbidden)
    if (data.type === "BUY_X_GET_Y") {
      if (!data.targets || data.targets.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "BOGO promotion requires at least one target Product or Variant.",
          path: ["targets"],
        });
      }
      if (data.targets?.some((t) => t.targetType === "CATEGORY")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "BOGO promotions cannot target a CATEGORY. Target must be PRODUCT or VARIANT only.",
          path: ["targets"],
        });
      }
      if (!data.buyQuantity || data.buyQuantity < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "BOGO promotion requires a valid Buy Quantity (at least 1).",
          path: ["buyQuantity"],
        });
      }
      if (!data.getQuantity || data.getQuantity < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "BOGO promotion requires a valid Get Quantity (at least 1).",
          path: ["getQuantity"],
        });
      }
    }

    // 3. COMBO validation: Must have comboPrice and at least 2 components
    if (data.type === "COMBO") {
      if (!data.comboPrice || data.comboPrice <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Combo promotion requires a positive combo bundle price.",
          path: ["comboPrice"],
        });
      }
      if (!data.comboComponents || data.comboComponents.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Combo promotion requires at least 2 component variants.",
          path: ["comboComponents"],
        });
      }
    }

    // 4. Date validation
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be greater than or equal to start date.",
          path: ["endDate"],
        });
      }
    }
  });

export const updatePromotionSchema = createPromotionSchema;

export const updatePromotionStatusSchema = z.object({
  status: z.enum(PROMOTION_STATUSES),
});

export type PromotionTargetInput = z.infer<typeof promotionTargetSchema>;
export type ComboComponentInput = z.infer<typeof comboComponentSchema>;
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;
export type UpdatePromotionStatusInput = z.infer<typeof updatePromotionStatusSchema>;
