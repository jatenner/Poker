import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from repo root
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log("Connected to database");

    // Ensure migrations tracking table exists
    await client.query(`
      create table if not exists _migrations (
        id serial primary key,
        name text unique not null,
        applied_at timestamptz default now()
      );
    `);

    // Read migration files
    const migrationsDir = path.join(__dirname, "migrations");

    // When running via tsx, __dirname points to the source dir
    // Check if migrations dir exists, otherwise try relative to cwd
    const resolvedDir = fs.existsSync(migrationsDir)
      ? migrationsDir
      : path.join(process.cwd(), "src", "migrations");

    const files = fs
      .readdirSync(resolvedDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No migration files found");
      return;
    }

    // Get already-applied migrations
    const { rows: applied } = await client.query(
      "select name from _migrations"
    );
    const appliedSet = new Set(applied.map((r: { name: string }) => r.name));

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`Skipping already applied: ${file}`);
        continue;
      }

      const filePath = path.join(resolvedDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(`Applying migration: ${file}`);

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("insert into _migrations (name) values ($1)", [
          file,
        ]);
        await client.query("COMMIT");
        console.log(`Applied: ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`Failed to apply ${file}:`, err);
        throw err;
      }
    }

    console.log("All migrations applied successfully");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
