import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export type AdminLoginPayload = z.infer<typeof adminLoginSchema>;
