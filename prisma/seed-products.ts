import * as fs from "node:fs"
import * as path from "node:path"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { MetricType, PrismaClient, type Prisma as PrismaNamespace } from "../src/generated/client"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined")
}

console.log("Connecting to database...")
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Helper function to capture metrics directly to database
async function captureMetric(type: MetricType, name: string, duration: number): Promise<void> {
  // Skip metrics if they are not enabled
  if (process.env.ENABLE_METRICS !== "true") return

  try {
    // Write metric directly to database
    await prisma.metric.create({
      data: {
        type,
        name,
        duration,
      },
    })
  } catch (_error) {
    // Silently fail - don't block seed script if metrics can't be saved
  }
}

// Helper function to parse price strings from CSV
function parsePrice(priceString: string): number | null {
  if (!priceString || priceString.includes("N/A")) return null
  if (priceString.includes("Market Price")) return null

  // Remove "US$" prefix and "per stem" suffix, handle whitespace
  const cleaned = priceString.replace(/US\$|per stem/gi, "").trim()

  // Extract the first number (handles ranges like "$23.00-$26.00")
  const match = cleaned.match(/\d+\.?\d*/)
  if (match) {
    return parseFloat(match[0])
  }

  return 0
}

// Helper function to determine quantity per bunch from price string
function getQuantity(priceString: string): number {
  // If it contains "per stem", assume 1 stem per unit
  if (priceString.toLowerCase().includes("per stem")) {
    return 1
  }
  // Default to 10 stems per bunch
  return 10
}

// Helper function to map category to product type
function categoryToProductType(
  category: string
): "FLOWER" | "FILLER" | "ROSE" | "PLANT" | "SUCCULENT" | "BRANCH" {
  const lower = category.toLowerCase()
  if (lower.includes("rose")) return "ROSE"
  if (lower.includes("filler") || lower.includes("green")) return "FILLER"
  if (lower.includes("plant")) return "PLANT"
  if (lower.includes("succulent")) return "SUCCULENT"
  if (lower.includes("branch")) return "BRANCH"
  return "FLOWER"
}

// Helper function to read and parse price-list.csv format
function readProductsFromPriceList(): Array<{
  name: string
  price: number | null
  type: "FLOWER" | "FILLER" | "ROSE" | "PLANT" | "SUCCULENT" | "BRANCH"
  quantity: number
  description: string
  colors: string[]
  image?: string
}> {
  const csvPath = path.join(process.cwd(), "prisma", "price-list.csv")
  console.log(`Reading price-list from: ${csvPath}`)
  let fileContent: string
  try {
    fileContent = fs.readFileSync(csvPath, "utf-8")
  } catch (err) {
    console.error(`❌ Failed to read price-list CSV: ${(err as Error).message}`)
    throw err
  }
  const lines = fileContent.split("\n")

  const products: Array<{
    name: string
    price: number | null
    type: "FLOWER" | "FILLER" | "ROSE" | "PLANT" | "SUCCULENT" | "BRANCH"
    quantity: number
    description: string
    colors: string[]
    image?: string
  }> = []

  // Skip header row (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse CSV line (handle quoted fields with commas)
    const match = line.match(/"([^"]*)"|([^,]+)/g) || []
    if (match.length < 3) continue

    const category = (match[0] || "").replace(/"/g, "").trim()
    const name = (match[1] || "").replace(/"/g, "").trim()
    const priceStr = (match[2] || "").replace(/"/g, "").trim()

    const price = parsePrice(priceStr)
    const quantity = getQuantity(priceStr)
    const type = categoryToProductType(category)
    // Colors not available in price-list, default to empty array
    const colors: string[] = []

    if (name && category) {
      products.push({
        name,
        price,
        type,
        quantity,
        description: "", // No description in price-list
        colors,
        image: undefined,
      })
    }
  }

  console.log(`✅ Parsed ${products.length} products from price-list (${lines.length} lines)`)
  if (products.length === 0) {
    console.warn(
      "⚠️  No products were parsed from price-list - check the file format and header row."
    )
  }

  return products
}

// Helper function to read and parse CSV file (legacy price-list.csv format)
function readProductsFromCSV(): Array<{
  name: string
  price: number | null
  type: "FLOWER" | "FILLER" | "ROSE" | "PLANT" | "SUCCULENT" | "BRANCH"
  quantity: number
  description: string
  colors: string[]
  image?: string
}> {
  // Get the CSV path using process.cwd() since __dirname may be unreliable with tsx
  const csvPath = path.join(process.cwd(), "prisma", "price-list.csv")
  console.log(`Reading CSV from: ${csvPath}`)
  let fileContent: string
  try {
    fileContent = fs.readFileSync(csvPath, "utf-8")
  } catch (err) {
    console.error(`❌ Failed to read CSV: ${(err as Error).message}`)
    throw err
  }
  const lines = fileContent.split("\n")

  const products: Array<{
    name: string
    price: number | null
    type: "FLOWER" | "FILLER" | "ROSE" | "PLANT" | "SUCCULENT" | "BRANCH"
    quantity: number
    description: string
    colors: string[]
    image?: string
  }> = []

  // Skip header row (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse CSV line (handle quoted fields with commas)
    const match = line.match(/"([^"]*)"|([^,]+)/g) || []
    if (match.length < 4) continue

    const name = (match[0] || "").replace(/"/g, "").trim()
    const priceStr = (match[1] || "").replace(/"/g, "").trim()
    const typeStr = (match[2] || "").replace(/"/g, "").trim()
    const description = (match[3] || "").replace(/"/g, "").trim()
    const colorsStr = (match[4] || "").replace(/"/g, "").trim()
    const imageStr = (match[5] || "").replace(/"/g, "").trim()

    const price = parsePrice(priceStr)
    const quantity = getQuantity(priceStr)
    const type = typeStr === "FILLER" ? "FILLER" : typeStr === "ROSE" ? "ROSE" : "FLOWER"
    // Parse pipe-separated color IDs from CSV (e.g., "pink|rose|greenery")
    const colors = colorsStr
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean)

    if (name) {
      products.push({
        name,
        price,
        type,
        quantity,
        description,
        colors,
        image: imageStr || undefined,
      })
    }
  }

  console.log(`✅ Parsed ${products.length} products from CSV (${lines.length} lines)`)
  if (products.length === 0) {
    console.warn("⚠️  No products were parsed from the CSV - check the file format and header row.")
  }

  return products
}

async function seedProducts() {
  console.log("🌸 Seeding products and product collections...")

  // Wrap product seeding in a transaction with reasonable timeout
  return await prisma.$transaction(
    async (tx) => {
      // Create collections first (used for product associations)
      const collections = [
        {
          name: "Flowers",
          slug: "flowers",
          image: "/collection-images/flowers.png",
          description: "Beautiful fresh flowers for all occasions",
        },
        {
          name: "Classic Roses",
          slug: "classic-roses",
          image: "/collection-images/classic-roses.png",
          description: "Timeless and elegant roses in various colors",
        },
        {
          name: "Exotic Blooms",
          slug: "exotic-blooms",
          image: "/collection-images/exotic-blooms.png",
          description: "Unique and rare flowers from around the world",
        },
        {
          name: "Fillers",
          slug: "fillers",
          image: "/collection-images/fillers.png",
          description: "Greenery and filler materials for arrangements",
        },
        {
          name: "Seasonal Wildflowers",
          slug: "seasonal-wildflowers",
          image: "/collection-images/seasonal-wildflowers.png",
          description: "Fresh seasonal wildflowers with natural charm",
        },
      ]

      // Batch upsert collections within transaction
      const start_collections = performance.now()
      for (const collection of collections) {
        await tx.collection.upsert({
          create: collection,
          where: { slug: collection.slug },
          update: collection,
        })
      }
      await captureMetric(
        MetricType.SEED,
        "batch create collections",
        performance.now() - start_collections
      )
      console.log(`✅ Created/updated ${collections.length} collections`)

      // Seed products from price-list.csv file (or fallback to price-list.csv)
      console.log("📦 Seeding products from price-list...")
      const start_readCSV = performance.now()

      // Try to read price-list.csv first, fall back to price-list.csv if not found
      let csvProducts: Array<{
        name: string
        price: number | null
        type: "FLOWER" | "FILLER" | "ROSE" | "PLANT" | "SUCCULENT" | "BRANCH"
        quantity: number
        description: string
        colors: string[]
        image?: string
      }> = []

      const priceListPath = path.join(process.cwd(), "prisma", "price-list.csv")
      const productsPath = path.join(process.cwd(), "prisma", "price-list.csv")

      if (fs.existsSync(priceListPath)) {
        console.log("✅ Using price-list.csv")
        csvProducts = readProductsFromPriceList()
      } else if (fs.existsSync(productsPath)) {
        console.log("✅ Using price-list.csv (price-list.csv not found)")
        csvProducts = readProductsFromCSV()
      } else {
        throw new Error("Neither price-list.csv nor price-list.csv found in prisma directory")
      }

      await captureMetric(MetricType.SEED, "read products CSV", performance.now() - start_readCSV)
      console.log(`📦 Found ${csvProducts.length} CSV products - starting bulk upsert...`)

      // Process products in batches with optimized queries
      let productsCreated = 0
      let productsSkipped = 0

      // Separate rose and non-rose products for different variant handling
      const roseProducts = csvProducts.filter((p) => p.type === "ROSE")
      const nonRoseProducts = csvProducts.filter((p) => p.type !== "ROSE")

      // Upsert non-rose products (with single variant per product)
      const start_upsertNonRoseProducts = performance.now()
      const nonRoseUpsertResults: Array<{
        product: PrismaNamespace.ProductModel
        csvProduct: (typeof csvProducts)[0]
      }> = []

      for (const csvProduct of nonRoseProducts) {
        try {
          const slug = csvProduct.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")

          const product = await tx.product.upsert({
            create: {
              name: csvProduct.name,
              slug: slug,
              description: csvProduct.description,
              productType: csvProduct.type,
              colors: csvProduct.colors,
              image: csvProduct.image || null,
              price: csvProduct.price,
              featured: false,
            },
            where: { slug: slug },
            update: {
              name: csvProduct.name,
              description: csvProduct.description,
              productType: csvProduct.type,
              colors: csvProduct.colors,
              image: csvProduct.image || null,
              price: csvProduct.price,
            },
          })
          nonRoseUpsertResults.push({ product, csvProduct })
          productsCreated++
        } catch (error) {
          console.warn(`⚠️  Skipped product: ${csvProduct.name} (${(error as Error).message})`)
          productsSkipped++
        }
      }
      await captureMetric(
        MetricType.SEED,
        "upsert non-rose products",
        performance.now() - start_upsertNonRoseProducts
      )

      // Upsert rose products
      const start_upsertRoseProducts = performance.now()
      const roseUpsertResults: Array<{
        product: PrismaNamespace.ProductModel
        csvProduct: (typeof csvProducts)[0]
      }> = []

      for (const csvProduct of roseProducts) {
        try {
          const slug = csvProduct.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")

          const product = await tx.product.upsert({
            create: {
              name: csvProduct.name,
              slug: slug,
              description: csvProduct.description,
              productType: csvProduct.type,
              colors: csvProduct.colors,
              image: csvProduct.image || null,
              price: csvProduct.price,
              featured: false,
            },
            where: { slug: slug },
            update: {
              name: csvProduct.name,
              description: csvProduct.description,
              productType: csvProduct.type,
              colors: csvProduct.colors,
              image: csvProduct.image || null,
              price: csvProduct.price,
            },
          })
          roseUpsertResults.push({ product, csvProduct })
          productsCreated++
        } catch (error) {
          console.warn(`⚠️  Skipped product: ${csvProduct.name} (${(error as Error).message})`)
          productsSkipped++
        }
      }
      await captureMetric(
        MetricType.SEED,
        "upsert rose products",
        performance.now() - start_upsertRoseProducts
      )

      console.log(
        `✅ CSV seeding complete: ${productsCreated} products created/updated, ${productsSkipped} skipped`
      )

      // Add CSV products to their appropriate collections (Flowers or Fillers)
      console.log("🏷️  Adding products to collections...")
      const start_collections_lookup = performance.now()

      // Fetch all needed collections in parallel
      const [flowersCollection, fillersCollection] = await Promise.all([
        tx.collection.findUnique({ where: { slug: "flowers" } }),
        tx.collection.findUnique({ where: { slug: "fillers" } }),
      ])
      await captureMetric(
        MetricType.SEED,
        "batch fetch collections",
        performance.now() - start_collections_lookup
      )

      if (flowersCollection && fillersCollection) {
        // Fetch all products in one query instead of one-by-one
        const start_productLookup = performance.now()
        const allProducts = await tx.product.findMany({
          where: {
            slug: {
              in: csvProducts.map((p) =>
                p.name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "")
              ),
            },
          },
          select: { id: true, slug: true },
        })
        await captureMetric(
          MetricType.SEED,
          "batch fetch products for collections",
          performance.now() - start_productLookup
        )

        // Create a map of slug -> product for O(1) lookup
        const slugToProduct = new Map(allProducts.map((p) => [p.slug, p]))

        // Build association data in memory
        const start_buildAssociations = performance.now()
        const associationData: Array<{
          productId: string
          collectionId: string
        }> = []

        for (const csvProduct of csvProducts) {
          const slug = csvProduct.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
          const product = slugToProduct.get(slug)

          if (!product) continue

          const collectionId =
            csvProduct.type === "FILLER" ? fillersCollection.id : flowersCollection.id
          associationData.push({
            productId: product.id,
            collectionId: collectionId,
          })
        }
        await captureMetric(
          MetricType.SEED,
          "build collection associations",
          performance.now() - start_buildAssociations
        )

        // Batch upsert all associations
        const start_upsertAssociations = performance.now()
        for (const data of associationData) {
          try {
            await tx.productCollection.upsert({
              where: {
                productId_collectionId: {
                  productId: data.productId,
                  collectionId: data.collectionId,
                },
              },
              create: data,
              update: {},
            })
          } catch (error) {
            console.warn(`⚠️  Failed to add product to collection: ${(error as Error).message}`)
          }
        }
        await captureMetric(
          MetricType.SEED,
          "batch upsert product collections",
          performance.now() - start_upsertAssociations
        )

        console.log(`✅ Added ${associationData.length} products to collections`)
      }

      // Mark a handful of notable products as featured
      const featuredSlugs = ["peonies", "sunflower", "hydrangea", "ranunculus-butterfly"]

      const start_updateFeaturedProducts = performance.now()
      const featuredResult = await tx.product.updateMany({
        where: { slug: { in: featuredSlugs } },
        data: { featured: true },
      })
      await captureMetric(
        MetricType.SEED,
        "update featured products",
        performance.now() - start_updateFeaturedProducts
      )

      console.log(
        `⭐ Marked ${featuredResult.count ?? 0} products as featured: ${featuredSlugs.join(", ")}`
      )

      // Mark featured collections: Flowers, Fillers, and Exotic Blooms
      const featuredCollectionSlugs = ["flowers", "fillers", "exotic-blooms"]
      const start_updateFeaturedCollections = performance.now()
      const featuredCollectionsResult = await tx.collection.updateMany({
        where: { slug: { in: featuredCollectionSlugs } },
        data: { featured: true },
      })
      await captureMetric(
        MetricType.SEED,
        "update featured collections",
        performance.now() - start_updateFeaturedCollections
      )

      console.log(
        `⭐ Marked ${featuredCollectionsResult.count ?? 0} collections as featured: ${featuredCollectionSlugs.join(", ")}`
      )

      // Add some products to Exotic Blooms collection
      const exoticBlooms = await tx.collection.findUnique({
        where: { slug: "exotic-blooms" },
      })

      if (exoticBlooms) {
        // Add a selection of products to Exotic Blooms
        const exoticBloomsProductSlugs = [
          "peonies",
          "sunflower",
          "hydrangea",
          "ranunculus-butterfly",
          "orchid",
          "protea",
        ]

        const start_fetchExoticProducts = performance.now()
        // Fetch all exotic bloom products in one query
        const exoticProducts = await tx.product.findMany({
          where: { slug: { in: exoticBloomsProductSlugs } },
          select: { id: true },
        })
        await captureMetric(
          MetricType.SEED,
          "fetch exotic-blooms products",
          performance.now() - start_fetchExoticProducts
        )

        // Batch upsert all exotic bloom associations
        const start_exoticUpserts = performance.now()
        for (const product of exoticProducts) {
          try {
            await tx.productCollection.upsert({
              where: {
                productId_collectionId: {
                  productId: product.id,
                  collectionId: exoticBlooms.id,
                },
              },
              create: {
                productId: product.id,
                collectionId: exoticBlooms.id,
              },
              update: {},
            })
          } catch (error) {
            console.warn(`⚠️  Failed to add product to Exotic Blooms: ${(error as Error).message}`)
          }
        }
        await captureMetric(
          MetricType.SEED,
          "batch upsert exotic-blooms associations",
          performance.now() - start_exoticUpserts
        )

        console.log(`✅ Added ${exoticProducts.length} products to Exotic Blooms collection`)
      }

      console.log("✅ Product seeding completed!")
    },
    {
      // Timeout for product seeding (2 minutes should be plenty)
      timeout: 120000,
    }
  )
}

seedProducts()
  .catch((e) => {
    console.error("❌ Product seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
