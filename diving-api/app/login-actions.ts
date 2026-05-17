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

  let user;
  try {
    user = await prisma.user.findUnique({
      where: {
        email: result.data.email,
      },
      select: {
        emailVerified: true,
        role: true,
        adminRole: true,
      },
    });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : undefined;

    if (code === "P1017" || code === "P1001") {
      console.error("[auth] Database connection error:", error);
      return {
        ok: false,
        error:
          "Cannot reach the database. Check DATABASE_URL in diving-api/.env and that Postgres is running.",
      };
    }

    throw error;
  }

  if (
    !user ||
    !user.emailVerified ||
    user.role !== "ADMIN" ||
    !user.adminRole
  ) {
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
