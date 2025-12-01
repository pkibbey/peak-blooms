const fs = require("fs")
const path = require("path")
const { Pool } = require("pg")

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, "utf8")
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    let val = trimmed.slice(eq + 1)
    // remove surrounding quotes
    val = val.replace(/^"|"$/g, "")
    process.env[key] = val
  }
}

// Load environment from .env.local or .env if present
loadEnvFile(path.resolve(__dirname, "../../.env.local"))
loadEnvFile(path.resolve(__dirname, "../../.env"))

const MIGRATIONS = [
  path.resolve(__dirname, "../migrations/20251130100000_add_product_indexing/migration.sql"),
  path.resolve(__dirname, "../migrations/20251130101000_add_variant_indexing/migration.sql"),
]

async function run() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error("DATABASE_URL not found in environment (.env.local/.env). Aborting.")
    process.exit(1)
  }

  const pool = new Pool({ connectionString })
  const client = await pool.connect()

  try {
    for (const f of MIGRATIONS) {
      if (!fs.existsSync(f)) {
        console.warn("Skipping missing migration file", f)
        continue
      }

      console.log("Applying", f)
      const sql = fs.readFileSync(f, "utf8")

      // Split by semicolon and run statements sequentially to avoid implicit transactions.
      // Keep statements that are non-empty.
      const statements = sql
        .split(/;\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean)

      for (const stmt of statements) {
        try {
          console.log("> Executing statement (truncated):", stmt.slice(0, 120).replace(/\s+/g, " "))
          await client.query(stmt)
        } catch (err) {
          // Log error but continue with remaining statements (idempotence is expected)
          console.error("  Statement failed:", err.message)
        }
      }
    }

    console.log("Done.")
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((err) => {
  console.error("Unexpected error running migrations:", err)
  process.exit(1)
})
