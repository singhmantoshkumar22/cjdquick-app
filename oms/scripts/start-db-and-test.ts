/**
 * Start embedded PostgreSQL and run E2E tests
 */

import EmbeddedPostgres from "embedded-postgres";
import { execSync } from "child_process";
import path from "path";

const DB_PORT = 5432;
const DB_USER = "user";
const DB_PASSWORD = "password";
const DB_NAME = "oms_db";

async function main() {
  console.log("\n🐘 Starting Embedded PostgreSQL...\n");

  const pg = new EmbeddedPostgres({
    databaseDir: path.join(process.cwd(), ".pg-data"),
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
    persistent: true,
  });

  try {
    // Start PostgreSQL
    await pg.initialise();
    await pg.start();
    console.log(`✓ PostgreSQL started on port ${DB_PORT}`);

    // Create database
    try {
      await pg.createDatabase(DB_NAME);
      console.log(`✓ Database '${DB_NAME}' created`);
    } catch (e: unknown) {
      const error = e as Error;
      if (error.message?.includes("already exists")) {
        console.log(`✓ Database '${DB_NAME}' already exists`);
      } else {
        throw e;
      }
    }

    // Set DATABASE_URL
    const dbUrl = `postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}`;
    process.env.DATABASE_URL = dbUrl;
    console.log(`✓ DATABASE_URL set`);

    // Run Prisma db push (creates tables from schema)
    console.log("\n📦 Pushing Prisma schema to database...");
    execSync("npx prisma db push --skip-generate", {
      cwd: path.join(process.cwd(), "packages/database"),
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: "inherit",
    });
    console.log("✓ Schema pushed");

    // Run Prisma seed
    console.log("\n🌱 Seeding database...");
    execSync("npx prisma db seed", {
      cwd: path.join(process.cwd(), "packages/database"),
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: "inherit",
    });
    console.log("✓ Seeding complete");

    // Run comprehensive E2E test for all modules
    console.log("\n🧪 Running comprehensive E2E test for all modules...");
    execSync("npx tsx apps/web/scripts/test-all-modules-e2e.ts", {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: "inherit",
    });

    console.log("\n✅ All tests passed!\n");

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    // Keep PostgreSQL running for development
    console.log("\n🐘 PostgreSQL is running. Press Ctrl+C to stop.\n");

    // Handle shutdown
    process.on("SIGINT", async () => {
      console.log("\n\n🛑 Stopping PostgreSQL...");
      await pg.stop();
      console.log("✓ PostgreSQL stopped\n");
      process.exit(0);
    });

    // Keep process alive
    await new Promise(() => {});
  }
}

main();
