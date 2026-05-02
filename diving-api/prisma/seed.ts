import "dotenv/config";
import { randomUUID } from "node:crypto";
import prisma from "../lib/prisma";

const adminEmail = "phonenai2014@gmail.com";

async function main() {
  const now = new Date();

  const admin = await prisma.user.upsert({
    where: {
      email: adminEmail,
    },
    update: {
      emailVerified: true,
      role: "ADMIN",
      updatedAt: now,
    },
    create: {
      id: randomUUID(),
      email: adminEmail,
      emailVerified: true,
      name: "Phonenai Admin",
      createdAt: now,
      updatedAt: now,
      role: "ADMIN",
    },
  });

  console.log(`Seeded admin user: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
