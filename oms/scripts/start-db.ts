/**
 * Start embedded PostgreSQL for development
 */

import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "fs";
import path from "path";

const DB_PORT = 5432;
const DB_USER = "user";
const DB_PASSWORD = "password";
const DB_NAME = "oms_db";

async function main() {
  console.log("\n🐘 Starting Embedded PostgreSQL...\n");

  const dataDir = path.join(process.cwd(), ".pg-data");
  const dataExists = existsSync(path.join(dataDir, "PG_VERSION"));

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
    persistent: true,
  });

  try {
    // Only initialize if data doesn't exist
    if (!dataExists) {
      console.log("Initializing new database...");
      await pg.initialise();
    } else {
      console.log("Using existing database data...");
    }

    // Start PostgreSQL
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
    console.log(`✓ DATABASE_URL: ${dbUrl}`);

    console.log("\n✅ PostgreSQL is running!");
    console.log("Press Ctrl+C to stop.\n");

    // Handle shutdown
    process.on("SIGINT", async () => {
      console.log("\n\n🛑 Stopping PostgreSQL...");
      await pg.stop();
      console.log("✓ PostgreSQL stopped\n");
      process.exit(0);
    });

    // Keep process alive
    await new Promise(() => {});

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
