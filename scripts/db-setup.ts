// scripts/db-setup.ts
// Запуск: bun run scripts/db-setup.ts
// Делает миграцию (schema.sql) + сидит данные в cards.

import postgres from "postgres";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Bun автоматически подхватывает .env
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set (.env)");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: "require", max: 3 });

async function applySchema() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const schemaPath = resolve(__dirname, "../src/schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");
  console.log("▶ Applying schema...");
  await sql.unsafe(schemaSql);
  console.log("✅ Schema applied");
}

async function seed() {
  console.log("▶ Seeding data...");

  // Сид-данные: имя файла можно оставить null — тогда будет {uid}.jpeg
  const seeds: Array<{ uid: string; image?: string | null }> = [
    { uid: "04:A2:3B:1C", image: "04:A2:3B:1C.jpeg" },
    { uid: "12:34:56:78", image: "12:34:56:78.jpeg" },
    { uid: "AA:BB:CC:DD", image: null }, // будет подставлено {uid}.jpeg на этапе отправки
  ];

  // upsert по uid
  for (const s of seeds) {
    await sql/*sql*/`
      INSERT INTO cards (uid, image)
      VALUES (${s.uid}, ${s.image})
      ON CONFLICT (uid) DO UPDATE
        SET image = COALESCE(EXCLUDED.image, cards.image)
    `;
  }

  console.log("✅ Seed complete");
}

async function main() {
  try {
    await applySchema();
    await seed();
  } catch (e) {
    console.error("❌ DB setup failed:", e);
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main();
