"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const managedAdminRoles = ["MANAGER", "EDITOR", "STAFF"] as const;

const createAdminSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  email: z.string().trim().toLowerCase().email("Use a valid email address."),
  adminRole: z.enum(managedAdminRoles),
});

const updateAdminSchema = createAdminSchema.extend({
  id: z.string().min(1),
});

const deleteAdminSchema = z.object({
  id: z.string().min(1),
});

async function requireSuperAdmin() {
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
      id: true,
      role: true,
      adminRole: true,
    },
  });

  if (user?.role !== "ADMIN" || user.adminRole !== "SUPER_ADMIN") {
    throw new Error("Only super admins can manage admin users.");
  }

  return user;
}

function readFormData(formData: FormData) {
  return {
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    adminRole: formData.get("adminRole"),
  };
}

export async function createAdminUserAction(formData: FormData) {
  await requireSuperAdmin();

  const result = createAdminSchema.safeParse(readFormData(formData));

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message || "Check the form.");
  }

  const now = new Date();

  await prisma.user.create({
    data: {
      id: randomUUID(),
      name: result.data.name,
      email: result.data.email,
      emailVerified: true,
      role: "ADMIN",
      adminRole: result.data.adminRole,
      createdAt: now,
      updatedAt: now,
    },
  });

  revalidatePath("/");
}

export async function updateAdminUserAction(formData: FormData) {
  await requireSuperAdmin();

  const result = updateAdminSchema.safeParse(readFormData(formData));

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message || "Check the form.");
  }

  const target = await prisma.user.findUnique({
    where: {
      id: result.data.id,
    },
    select: {
      adminRole: true,
      role: true,
    },
  });

  if (target?.role !== "ADMIN" || target.adminRole === "SUPER_ADMIN") {
    throw new Error("Only managed admin accounts can be updated here.");
  }

  await prisma.user.update({
    where: {
      id: result.data.id,
    },
    data: {
      name: result.data.name,
      email: result.data.email,
      adminRole: result.data.adminRole,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/");
}

export async function deleteAdminUserAction(formData: FormData) {
  const currentUser = await requireSuperAdmin();
  const result = deleteAdminSchema.safeParse({
    id: formData.get("id"),
  });

  if (!result.success) {
    throw new Error("Choose an admin to delete.");
  }

  if (result.data.id === currentUser.id) {
    throw new Error("You cannot delete your own account.");
  }

  const target = await prisma.user.findUnique({
    where: {
      id: result.data.id,
    },
    select: {
      adminRole: true,
      role: true,
    },
  });

  if (target?.role !== "ADMIN" || target.adminRole === "SUPER_ADMIN") {
    throw new Error("Only managed admin accounts can be deleted here.");
  }

  await prisma.user.delete({
    where: {
      id: result.data.id,
    },
  });

  revalidatePath("/");
}
