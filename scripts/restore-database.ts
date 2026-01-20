import fs from "node:fs"
import path from "node:path"
import { db } from "../src/lib/db"

interface BackupData {
  metadata: {
    timestamp: string
    exportedAt: string
    recordCounts: Record<string, number>
  }
  tables: {
    user: unknown[]
    account: unknown[]
    session: unknown[]
    verification: unknown[]
    product: unknown[]
    collection: unknown[]
    productCollection: unknown[]
    inspiration: unknown[]
    inspirationProduct: unknown[]
    order: unknown[]
    orderItem: unknown[]
    address: unknown[]
    metric: unknown[]
  }
}

async function restoreDatabase(backupFilePath: string): Promise<void> {
  const absolutePath = path.resolve(backupFilePath)

  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ Backup file not found: ${absolutePath}`)
    process.exit(1)
  }

  try {
    console.log("🔄 Starting database restore...")
    console.log(`📄 Backup file: ${path.relative(process.cwd(), absolutePath)}\n`)

    // Read backup file
    const backupContent = fs.readFileSync(absolutePath, "utf-8")
    const backup: BackupData = JSON.parse(backupContent)

    console.log("📊 Backup metadata:")
    console.log(`   Timestamp: ${backup.metadata.timestamp}`)
    console.log(`   Exported: ${backup.metadata.exportedAt}`)
    console.log(
      `   Total records: ${Object.values(backup.metadata.recordCounts).reduce((a, b) => a + b, 0)}\n`
    )

    // Confirm before wiping
    console.log("⚠️  WARNING: This will DELETE ALL existing data and restore from backup.")
    console.log("Press Ctrl+C to cancel. Proceeding in 3 seconds...\n")
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Delete all data in reverse dependency order
    console.log("🗑️  Clearing existing data...")
    await Promise.all([
      db.metric.deleteMany(),
      db.inspirationProduct.deleteMany(),
      db.inspiration.deleteMany(),
      db.orderItem.deleteMany(),
      db.order.deleteMany(),
      db.address.deleteMany(),
      db.productCollection.deleteMany(),
      db.product.deleteMany(),
      db.collection.deleteMany(),
      db.verification.deleteMany(),
      db.session.deleteMany(),
      db.account.deleteMany(),
      db.user.deleteMany(),
    ])
    console.log("✅ Database cleared\n")

    // Restore data in correct dependency order
    console.log("📥 Restoring data...")

    if (backup.tables.user.length > 0) {
      await db.user.createMany({ data: backup.tables.user as any })
      console.log(`   ✓ User: ${backup.tables.user.length} records`)
    }

    if (backup.tables.account.length > 0) {
      await db.account.createMany({ data: backup.tables.account as any })
      console.log(`   ✓ Account: ${backup.tables.account.length} records`)
    }

    if (backup.tables.session.length > 0) {
      await db.session.createMany({ data: backup.tables.session as any })
      console.log(`   ✓ Session: ${backup.tables.session.length} records`)
    }

    if (backup.tables.verification.length > 0) {
      await db.verification.createMany({ data: backup.tables.verification as any })
      console.log(`   ✓ Verification: ${backup.tables.verification.length} records`)
    }

    if (backup.tables.collection.length > 0) {
      await db.collection.createMany({ data: backup.tables.collection as any })
      console.log(`   ✓ Collection: ${backup.tables.collection.length} records`)
    }

    if (backup.tables.product.length > 0) {
      await db.product.createMany({ data: backup.tables.product as any })
      console.log(`   ✓ Product: ${backup.tables.product.length} records`)
    }

    if (backup.tables.productCollection.length > 0) {
      await db.productCollection.createMany({ data: backup.tables.productCollection as any })
      console.log(`   ✓ ProductCollection: ${backup.tables.productCollection.length} records`)
    }

    if (backup.tables.inspiration.length > 0) {
      await db.inspiration.createMany({ data: backup.tables.inspiration as any })
      console.log(`   ✓ Inspiration: ${backup.tables.inspiration.length} records`)
    }

    if (backup.tables.inspirationProduct.length > 0) {
      await db.inspirationProduct.createMany({ data: backup.tables.inspirationProduct as any })
      console.log(`   ✓ InspirationProduct: ${backup.tables.inspirationProduct.length} records`)
    }

    if (backup.tables.address.length > 0) {
      await db.address.createMany({ data: backup.tables.address as any })
      console.log(`   ✓ Address: ${backup.tables.address.length} records`)
    }

    if (backup.tables.order.length > 0) {
      await db.order.createMany({ data: backup.tables.order as any })
      console.log(`   ✓ Order: ${backup.tables.order.length} records`)
    }

    if (backup.tables.orderItem.length > 0) {
      await db.orderItem.createMany({ data: backup.tables.orderItem as any })
      console.log(`   ✓ OrderItem: ${backup.tables.orderItem.length} records`)
    }

    if (backup.tables.metric.length > 0) {
      await db.metric.createMany({ data: backup.tables.metric as any })
      console.log(`   ✓ Metric: ${backup.tables.metric.length} records`)
    }

    console.log("\n✅ Restore completed successfully!")
  } catch (error) {
    console.error("❌ Restore failed:", error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

const backupFile = process.argv[2]
if (!backupFile) {
  console.error("❌ Usage: npm run db:restore:prod <backup-file-path>")
  console.error("   Example: npm run db:restore:prod backups/backup-2026-01-19T14-30-45Z.json")
  process.exit(1)
}

restoreDatabase(backupFile)
