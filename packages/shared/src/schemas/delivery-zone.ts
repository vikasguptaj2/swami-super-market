import { z } from "zod";

export const createDeliveryZoneSchema = z.object({
  name: z.string().trim().min(2, "Zone name must be at least 2 characters").max(150),
  hindiName: z.string().trim().max(150).optional().nullable(),
  minOrderAmount: z.coerce.number().min(0, "Minimum order amount cannot be negative").default(0),
  deliveryCharge: z.coerce.number().min(0, "Delivery charge cannot be negative").default(0),
  freeDeliveryAboveAmount: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
});

export const updateDeliveryZoneSchema = createDeliveryZoneSchema.partial();

export type CreateDeliveryZoneInput = z.infer<typeof createDeliveryZoneSchema>;
export type UpdateDeliveryZoneInput = z.infer<typeof updateDeliveryZoneSchema>;
