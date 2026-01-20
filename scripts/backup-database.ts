import fs from "node:fs"
import path from "node:path"
import { db } from "../src/lib/db"

interface BackupData {
  metadata: {
    timestamp: string
    exportedAt: Date
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

async function backupDatabase(): Promise<void> {
  const backupDir = path.join(process.cwd(), "backups")

  // Ensure backups directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const backupPath = path.join(backupDir, `backup-${timestamp}.json`)

  try {
    console.log("🔄 Starting database backup...")
    console.log(`📁 Backup destination: ${backupPath}\n`)

    // Export all tables in dependency order
    const [
      user,
      account,
      session,
      verification,
      product,
      collection,
      productCollection,
      inspiration,
      inspirationProduct,
      order,
      orderItem,
      address,
      metric,
    ] = await Promise.all([
      db.user.findMany(),
      db.account.findMany(),
      db.session.findMany(),
      db.verification.findMany(),
      db.product.findMany(),
      db.collection.findMany(),
      db.productCollection.findMany(),
      db.inspiration.findMany(),
      db.inspirationProduct.findMany(),
      db.order.findMany(),
      db.orderItem.findMany(),
      db.address.findMany(),
      db.metric.findMany(),
    ])

    const backup: BackupData = {
      metadata: {
        timestamp,
        exportedAt: new Date(),
        recordCounts: {
          user: user.length,
          account: account.length,
          session: session.length,
          verification: verification.length,
          product: product.length,
          collection: collection.length,
          productCollection: productCollection.length,
          inspiration: inspiration.length,
          inspirationProduct: inspirationProduct.length,
          order: order.length,
          orderItem: orderItem.length,
          address: address.length,
          metric: metric.length,
        },
      },
      tables: {
        user,
        account,
        session,
        verification,
        product,
        collection,
        productCollection,
        inspiration,
        inspirationProduct,
        order,
        orderItem,
        address,
        metric,
      },
    }

    // Write backup to file
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2))

    // Print summary
    console.log("✅ Backup completed successfully!\n")
    console.log("📊 Record counts:")
    Object.entries(backup.metadata.recordCounts).forEach(([table, count]) => {
      if (count > 0) {
        console.log(`   ${table}: ${count}`)
      }
    })
    console.log(`\n📄 Backup file: ${path.relative(process.cwd(), backupPath)}`)
  } catch (error) {
    console.error("❌ Backup failed:", error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

backupDatabase()
