import { z } from "zod";
import { PRODUCT_STATUSES } from "../constants/enums.js";

export const createVariantSchema = z.object({
  unit: z.string().min(1, "Unit is required"),
  sku: z.string().optional(),
  mrp: z.coerce.number().positive("MRP must be positive"),
  sellingPrice: z.coerce.number().positive("Selling price must be positive"),
  currentStock: z.coerce.number().int().nonnegative().default(0),
  minStockAlert: z.coerce.number().int().nonnegative().default(5),
  isActive: z.boolean().default(true),
});

export const updateVariantSchema = z.object({
  unit: z.string().min(1).optional(),
  sku: z.string().optional(),
  mrp: z.coerce.number().positive().optional(),
  sellingPrice: z.coerce.number().positive().optional(),
  currentStock: z.coerce.number().int().nonnegative().optional(),
  minStockAlert: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const createProductSchema = z.object({
  categoryId: z.coerce.number().int().positive("Category is required"),
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  hindiName: z.string().optional(),
  searchKeywords: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(PRODUCT_STATUSES).default("ACTIVE"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  variants: z.array(createVariantSchema).min(1, "At least one variant is required"),
});

export const updateProductSchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  hindiName: z.string().optional(),
  searchKeywords: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
