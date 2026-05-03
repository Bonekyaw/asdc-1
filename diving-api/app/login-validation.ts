import { z } from "zod";

export const emailFormSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export const otpFormSchema = emailFormSchema.extend({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
});
