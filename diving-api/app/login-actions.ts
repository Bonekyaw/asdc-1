"use server";

import prisma from "@/lib/prisma";
import { emailFormSchema } from "./login-validation";

type VerifyAdminEmailResult =
  | {
      ok: true;
      email: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function verifyAdminEmailAction(
  formData: FormData,
): Promise<VerifyAdminEmailResult> {
  const result = emailFormSchema.safeParse({
    email: formData.get("email"),
  });

  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues[0]?.message || "Check the form and try again.",
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      email: result.data.email,
    },
    select: {
      emailVerified: true,
      role: true,
    },
  });

  if (!user || !user.emailVerified || user.role !== "ADMIN") {
    return {
      ok: false,
      error: "Use an authenticated admin email address.",
    };
  }

  return {
    ok: true,
    email: result.data.email,
  };
}
