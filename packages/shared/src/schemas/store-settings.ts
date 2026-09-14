import { z } from "zod";

export const updateStoreSettingsSchema = z.object({
  address: z.string().trim().min(5, "Address must be at least 5 characters"),
  hindiAddress: z.string().trim().optional().nullable(),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{7,20}$/, "Please enter a valid phone number"),
  whatsappNumber: z
    .string()
    .trim()
    .regex(
      /^[0-9]{10,15}$/,
      "Please enter a valid WhatsApp number with country code (e.g. 918853070705)"
    ),
  googleMapsUrl: z
    .string()
    .trim()
    .url("Invalid Google Maps URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  mapsEmbedUrl: z.string().trim().optional().nullable().or(z.literal("")),
  openingHoursText: z.string().trim().optional().nullable(),
  photos: z.array(z.string().trim()).default([]),
});

export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>;
