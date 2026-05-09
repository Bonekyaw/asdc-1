import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Dashboard } from "./dashboard/dashboard";
import { LoginForm } from "./login-form";

type HomeProps = {
  searchParams?: Promise<{
    section?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const activeSection =
    params?.section === "admins" || params?.section === "players"
      ? params.section
      : "dashboard";
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.id) {
    return <LoginForm />;
  }

  const currentAdmin = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      name: true,
      email: true,
      role: true,
      adminRole: true,
    },
  });

  if (
    !currentAdmin ||
    currentAdmin.role !== "ADMIN" ||
    !currentAdmin.adminRole
  ) {
    return <LoginForm />;
  }

  const adminUsers = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      adminRole: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      adminRole: true,
      createdAt: true,
    },
    orderBy: [
      {
        adminRole: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  const playerUsers = await prisma.user.findMany({
    where: {
      role: "PLAYER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      currentScore: true,
      highestScore: true,
      currentLevel: true,
      createdAt: true,
      playerBanUntil: true,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  });
  const databaseNow = await prisma.$queryRaw<{ now: Date }[]>`
    SELECT NOW() AS now
  `;
  const nowMs = databaseNow[0]?.now.getTime() || 0;

  return (
    <Dashboard
      currentAdmin={currentAdmin}
      adminUsers={adminUsers}
      playerUsers={playerUsers}
      activeSection={activeSection}
      nowMs={nowMs}
    />
  );
}
