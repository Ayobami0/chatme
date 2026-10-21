import { z } from "zod";

export const phoneNumberSchema = z.object({
  phoneNumber: z.string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      "Phone number must be a valid international phone number",
    )
});

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{4}$/),
});

export const fullNameSchema = z.object({
  fullName: z.string()
    .min(3, "Full name must be at least 3 characters long"),
});
