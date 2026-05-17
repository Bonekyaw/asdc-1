import "dotenv/config";
import { randomUUID } from "node:crypto";
import prisma, { resolveRuntimeDatabaseUrl } from "../lib/prisma";

async function testDatabase() {
  console.log("🔍 Testing Prisma Postgres connection...\n");

  try {
    const runtimeUrl = resolveRuntimeDatabaseUrl();
    if (runtimeUrl) {
      console.log(`Using TCP host: ${new URL(runtimeUrl).hostname}\n`);
    } else {
      console.log("Using Prisma Accelerate (prisma+postgres DATABASE_URL)\n");
    }

    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Connected to database!");

    // Test 2: Create a test user
    console.log("\n📝 Creating a test user...");
    const now = new Date();
    const newUser = await prisma.user.upsert({
      where: {
        email: "demo@example.com",
      },
      update: {
        name: "Demo User",
      },
      create: {
        id: randomUUID(),
        email: "demo@example.com",
        emailVerified: true,
        name: "Demo User",
        createdAt: now,
        updatedAt: now,
      },
    });
    console.log("✅ Created user:", newUser);

    // Test 3: Fetch all users
    console.log("\n📋 Fetching all users...");
    const allUsers = await prisma.user.findMany();
    console.log(`✅ Found ${allUsers.length} user(s):`);
    allUsers.forEach((user) => {
      console.log(`   - ${user.name} (${user.email})`);
    });

    console.log("\n🎉 All tests passed! Your database is working perfectly.\n");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testDatabase();
