import { z } from "zod";

export const phoneNumberSchema = z.object({
  phoneNumber: z.string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      "Phone number must be a valid international phone number",
    )
});

export const DEFAULT_OTP_LENGTH = 4;

/** Validates an OTP of the length the server issued for the current challenge. */
export const createOtpSchema = (codeLength = DEFAULT_OTP_LENGTH) =>
  z.object({
    otp: z.string().regex(new RegExp(`^\\d{${codeLength}}$`)),
  });

export const fullNameSchema = z.object({
  fullName: z.string()
    .min(3, "Full name must be at least 3 characters long"),
});
