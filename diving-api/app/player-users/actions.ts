"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const banPlayerSchema = z.object({
  id: z.string().min(1),
  banDays: z.coerce.number().int().min(1).max(365),
});

const unbanPlayerSchema = z.object({
  id: z.string().min(1),
});

async function requirePlayerModerator() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    throw new Error("You must be signed in.");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
      adminRole: true,
    },
  });

  if (
    user?.role !== "ADMIN" ||
    !user.adminRole ||
    user.adminRole === "STAFF"
  ) {
    throw new Error("Only super admins, managers, and editors can ban players.");
  }
}

export async function banPlayerAction(formData: FormData) {
  await requirePlayerModerator();

  const result = banPlayerSchema.safeParse({
    id: formData.get("id"),
    banDays: formData.get("banDays"),
  });

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message || "Check the form.");
  }

  const target = await prisma.user.findUnique({
    where: {
      id: result.data.id,
    },
    select: {
      role: true,
    },
  });

  if (target?.role !== "PLAYER") {
    throw new Error("Only player accounts can be banned here.");
  }

  const playerBanUntil = new Date();
  playerBanUntil.setDate(playerBanUntil.getDate() + result.data.banDays);

  await prisma.user.update({
    where: {
      id: result.data.id,
    },
    data: {
      playerBanUntil,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/");
}

export async function unbanPlayerAction(formData: FormData) {
  await requirePlayerModerator();

  const result = unbanPlayerSchema.safeParse({
    id: formData.get("id"),
  });

  if (!result.success) {
    throw new Error("Choose a player to unban.");
  }

  const target = await prisma.user.findUnique({
    where: {
      id: result.data.id,
    },
    select: {
      role: true,
    },
  });

  if (target?.role !== "PLAYER") {
    throw new Error("Only player accounts can be unbanned here.");
  }

  await prisma.user.update({
    where: {
      id: result.data.id,
    },
    data: {
      playerBanUntil: null,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/");
}
