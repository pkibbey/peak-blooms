/**
 * Data migration script to move existing single product images to the new ProductImage table.
 * Run with: npm run db:seed
 *
 * This script:
 * 1. Finds all products with a non-null image field
 * 2. Creates ProductImage records for each with order=0
 * 3. Keeps the image field for backwards compatibility
 */

import { db } from "@/lib/db"

async function migrateProductImages() {
  console.log("Starting product image migration...")

  try {
    // Find all products with images
    const productsWithImages = await db.product.findMany({
      where: {
        image: {
          not: null,
        },
      },
      select: {
        id: true,
        image: true,
        slug: true,
      },
    })

    console.log(`Found ${productsWithImages.length} products with images`)

    // For each product with an image, create a ProductImage record if it doesn't exist
    let created = 0
    let skipped = 0

    for (const product of productsWithImages) {
      if (!product.image) continue

      // Check if ProductImage already exists for this image
      const existingImage = await db.productImage.findFirst({
        where: {
          productId: product.id,
          url: product.image,
        },
      })

      if (existingImage) {
        console.log(`  ✓ ProductImage already exists for ${product.slug}`)
        skipped++
      } else {
        // Create ProductImage record
        await db.productImage.create({
          data: {
            productId: product.id,
            url: product.image,
            order: 0,
          },
        })
        console.log(`  ✓ Migrated image for ${product.slug}`)
        created++
      }
    }

    console.log(`\nMigration complete!`)
    console.log(`  Created: ${created}`)
    console.log(`  Skipped: ${skipped}`)
  } catch (error) {
    console.error("Migration failed:", error)
    throw error
  }
}

// Run migration
migrateProductImages()
  .then(() => {
    console.log("Migration finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Migration error:", error)
    process.exit(1)
  })
