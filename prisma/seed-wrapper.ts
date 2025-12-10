/**
 * Seed wrapper script that runs both seed scripts in sequence.
 * This keeps the database seeding split into two separate transactions:
 * 1. seed-products.ts - Seeds collections, products, and variants (CPU/IO intensive)
 * 2. seed.ts - Seeds users, inspirations, and orders (fast operations)
 */

import { spawn } from "node:child_process"
import path from "node:path"

async function runSeedScript(scriptName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "prisma", scriptName)
    console.log(`\n🌱 Running ${scriptName}...`)

    const child = spawn("tsx", [scriptPath], {
      stdio: "inherit",
      shell: true,
    })

    child.on("error", (error) => {
      console.error(`❌ Error running ${scriptName}:`, error)
      reject(error)
    })

    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`${scriptName} exited with code ${code}`))
      } else {
        console.log(`✅ ${scriptName} completed successfully`)
        resolve()
      }
    })
  })
}

async function main() {
  try {
    console.log("🌸 Peak Blooms Database Seeding (Split Mode)")
    console.log(`=${"=".repeat(60)}`)

    // Run seed-products first (creates collections, products, variants)
    await runSeedScript("seed-products.ts")

    // Run seed second (creates users, inspirations, orders)
    await runSeedScript("seed.ts")

    console.log(`\n${"=".repeat(61)}`)
    console.log("✅ All seeds completed successfully!")
  } catch (error) {
    console.error(`\n${"=".repeat(61)}`)
    console.error("❌ Seeding failed:", error)
    process.exit(1)
  }
}

main()
