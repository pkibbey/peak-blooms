import * as fs from "node:fs"
import * as path from "node:path"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { type Prisma, PrismaClient } from "../src/generated/client"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined")
}

console.log("Connecting to database...")
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Helper function to parse price strings from CSV
function parsePrice(priceString: string): number {
  if (!priceString || priceString.includes("N/A")) return 0
  if (priceString.includes("Market Price")) return 0

  // Remove "US$" prefix and "per stem" suffix, handle whitespace
  const cleaned = priceString.replace(/US\$|per stem/gi, "").trim()

  // Extract the first number (handles ranges like "$23.00-$26.00")
  const match = cleaned.match(/\d+\.?\d*/)
  if (match) {
    return parseFloat(match[0])
  }

  return 0
}

// Helper function to determine stem count from price string
function getStemCount(priceString: string): number {
  // If it contains "per stem", assume 1 stem per unit
  if (priceString.toLowerCase().includes("per stem")) {
    return 1
  }
  // Default to 10 stems per bunch
  return 10
}

// Helper function to read and parse CSV file
function readProductsFromCSV(): Array<{
  name: string
  price: number
  type: "FLOWER" | "FILLER"
  stemCount: number
}> {
  const csvPath = path.join(__dirname, "products.csv")
  const fileContent = fs.readFileSync(csvPath, "utf-8")
  const lines = fileContent.split("\n")

  const products: Array<{
    name: string
    price: number
    type: "FLOWER" | "FILLER"
    stemCount: number
  }> = []

  // Skip header row (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse CSV line (handle quoted fields with commas)
    const match = line.match(/"([^"]*)"|([^,]+)/g) || []
    if (match.length < 3) continue

    const name = (match[0] || "").replace(/"/g, "").trim()
    const priceStr = (match[1] || "").replace(/"/g, "").trim()
    const typeStr = (match[2] || "").replace(/"/g, "").trim()

    const price = parsePrice(priceStr)
    const stemCount = getStemCount(priceStr)
    const type = typeStr === "FILLER" ? "FILLER" : "FLOWER"

    if (name) {
      products.push({ name, price, type, stemCount })
    }
  }

  return products
}

async function main() {
  console.log("🌸 Seeding database with collections and products...")

  // Create test users for development/testing
  await prisma.user.upsert({
    create: {
      email: "phineas.kibbey@gmail.com",
      name: "Phineas",
      emailVerified: true,
      approved: true,
      role: "ADMIN",
      priceMultiplier: 1.0,
    },
    where: { email: "phineas.kibbey@gmail.com" },
    update: {
      name: "Phineas",
      emailVerified: true,
      approved: true,
      role: "ADMIN",
      priceMultiplier: 1.0,
    },
  })
  console.log("✅ Created admin user: phineas.kibbey@gmail.com")

  await prisma.user.upsert({
    create: {
      email: "pending@peakblooms.com",
      name: "Pending User",
      emailVerified: true,
      approved: false, // Pending approval
      role: "CUSTOMER",
      priceMultiplier: 1.0,
    },
    where: { email: "pending@peakblooms.com" },
    update: {
      name: "Pending User",
      emailVerified: true,
      approved: false,
      role: "CUSTOMER",
      priceMultiplier: 1.0,
    },
  })
  console.log("✅ Created pending user: pending@peakblooms.com")

  const approvedCustomer = await prisma.user.upsert({
    create: {
      email: "customer@peakblooms.com",
      name: "Approved Customer",
      emailVerified: true,
      approved: true,
      role: "CUSTOMER",
      priceMultiplier: 0.8, // 20% discount
    },
    where: { email: "customer@peakblooms.com" },
    update: {
      name: "Approved Customer",
      emailVerified: true,
      approved: true,
      role: "CUSTOMER",
      priceMultiplier: 0.8,
    },
  })
  console.log("✅ Created approved customer: customer@peakblooms.com (20% discount)")

  // Get the approved customer for orders
  await prisma.user.findUnique({
    where: { email: "customer@peakblooms.com" },
  })

  // Create collections
  const flowersCollection = await prisma.collection.upsert({
    create: {
      name: "Flowers",
      slug: "flowers",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/collections/flowers.png",
      description: "Beautiful fresh flowers for all occasions",
    },
    where: { slug: "flowers" },
    update: {
      name: "Flowers",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/collections/flowers.png",
      description: "Beautiful fresh flowers for all occasions",
      slug: "flowers",
    },
  })

  const fillersCollection = await prisma.collection.upsert({
    create: {
      name: "Fillers",
      slug: "fillers",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/collections/fillers.png",
      description: "Greenery and filler materials for arrangements",
    },
    where: { slug: "fillers" },
    update: {
      name: "Fillers",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/collections/fillers.png",
      description: "Greenery and filler materials for arrangements",
      slug: "fillers",
    },
  })

  const classicRoses = await prisma.collection.upsert({
    create: {
      name: "Classic Roses",
      slug: "classic-roses",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/collections/classic-roses.png",
      description:
        "Timeless elegance and beauty in every bloom. Our classic rose collection features the most beloved varieties, perfect for traditional arrangements and timeless celebrations.",
    },
    where: { slug: "classic-roses" },
    update: {
      name: "Classic Roses",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/collections/classic-roses.png",
      description:
        "Timeless elegance and beauty in every bloom. Our classic rose collection features the most beloved varieties, perfect for traditional arrangements and timeless celebrations.",
      slug: "classic-roses",
    },
  })

  const exoticBlooms = await prisma.collection.upsert({
    create: {
      name: "Exotic Blooms",
      slug: "exotic-blooms",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/collections/exotic-blooms.png",
      description:
        "Bold and vibrant arrangements that bring drama and sophistication to any space. Discover unique textures and rich colors from around the world.",
    },
    where: { slug: "exotic-blooms" },
    update: {
      name: "Exotic Blooms",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/collections/exotic-blooms.png",
      description:
        "Bold and vibrant arrangements that bring drama and sophistication to any space. Discover unique textures and rich colors from around the world.",
      slug: "exotic-blooms",
    },
  })

  const seasonalWildflowers = await prisma.collection.upsert({
    create: {
      name: "Seasonal Wildflowers",
      slug: "seasonal-wildflowers",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/collections/seasonal-wildflowers.png",
      description:
        "Nature's finest seasonal selections capturing the essence of each time of year. Fresh, vibrant, and sustainably sourced for maximum impact.",
    },
    where: { slug: "seasonal-wildflowers" },
    update: {
      name: "Seasonal Wildflowers",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/collections/seasonal-wildflowers.png",
      description:
        "Nature's finest seasonal selections capturing the essence of each time of year. Fresh, vibrant, and sustainably sourced for maximum impact.",
      slug: "seasonal-wildflowers",
    },
  })

  // Create or update products (upsert by slug). We will ensure variants exist later.
  await prisma.product.upsert({
    create: {
      name: "Green Fluffy",
      slug: "green-fluffy",
      description: "Lush and voluminous",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/products/green-fluffy.png",
      collectionId: exoticBlooms.id,
      // Multiple shades to better exercise UI swatches
      colors: ["#5BAE48", "#8FCC68", "#DFF6DF"],
      featured: true,
      // create block helps when the product doesn't exist yet
      variants: {
        create: [
          { price: 65.0, stemLength: 45, countPerBunch: 8 },
          { price: 75.0, stemLength: 55, countPerBunch: 8 },
          { price: 120.0, stemLength: 45, countPerBunch: 16 },
          { price: 450.0, stemLength: 45, countPerBunch: 100, isBoxlot: true },
        ],
      },
    },
    where: { slug: "green-fluffy" },
    update: {
      name: "Green Fluffy",
      description: "Lush and voluminous",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/products/green-fluffy.png",
      collectionId: exoticBlooms.id,
      colors: ["#5BAE48", "#8FCC68", "#DFF6DF"],
      featured: true,
    },
  })

  await prisma.product.upsert({
    create: {
      name: "Peach Flower",
      slug: "peach-flower",
      description: "Warm and inviting",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/products/peach-flower.png",
      collectionId: exoticBlooms.id,
      // Warm peach variations
      colors: ["#F7A582", "#FFBFA0", "#FFDCCA"],
      featured: true,
      variants: {
        create: [
          { price: 55.0, stemLength: 40, countPerBunch: 6 },
          { price: 65.0, stemLength: 50, countPerBunch: 6 },
        ],
      },
    },
    where: { slug: "peach-flower" },
    update: {
      name: "Peach Flower",
      description: "Warm and inviting",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/products/peach-flower.png",
      collectionId: exoticBlooms.id,
      colors: ["#F7A582", "#FFBFA0", "#FFDCCA"],
      featured: true,
    },
  })

  await prisma.product.upsert({
    create: {
      name: "Pink Rose",
      slug: "pink-rose",
      description: "Elegant and romantic",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/products/pink-rose.png",
      collectionId: classicRoses.id,
      // Pink rose tints
      colors: ["#FF9ECF", "#FF6BBA", "#FFD1E6"],
      featured: false,
      variants: {
        create: [
          { price: 75.0, stemLength: 50, countPerBunch: 5 },
          { price: 90.0, stemLength: 60, countPerBunch: 5 },
          { price: 140.0, stemLength: 50, countPerBunch: 10 },
          { price: 550.0, stemLength: 50, countPerBunch: 50, isBoxlot: true },
          { price: 1000.0, stemLength: 60, countPerBunch: 100, isBoxlot: true },
        ],
      },
    },
    where: { slug: "pink-rose" },
    update: {
      name: "Pink Rose",
      description: "Elegant and romantic",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/products/pink-rose.png",
      collectionId: classicRoses.id,
      colors: ["#FF9ECF", "#FF6BBA", "#FFD1E6"],
      featured: false,
    },
  })

  await prisma.product.upsert({
    create: {
      name: "Playa Blanca",
      slug: "playa-blanca",
      description: "Pristine white beauty",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/products/playa-blanca.png",
      collectionId: seasonalWildflowers.id,
      // Whites and near-whites for Playa Blanca
      colors: ["#FFFFFF", "#F3F4F6", "#EDEFF1"],
      featured: false,
      variants: {
        create: [
          { price: 45.0, stemLength: 35, countPerBunch: 10 },
          { price: 55.0, stemLength: 45, countPerBunch: 10 },
          { price: 380.0, stemLength: 45, countPerBunch: 100, isBoxlot: true },
        ],
      },
    },
    where: { slug: "playa-blanca" },
    update: {
      name: "Playa Blanca",
      description: "Pristine white beauty",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/products/playa-blanca.png",
      collectionId: seasonalWildflowers.id,
      colors: ["#FFFFFF", "#F3F4F6", "#EDEFF1"],
      featured: false,
    },
  })

  // Seed products from CSV file
  console.log("📦 Seeding products from CSV...")
  const csvProducts = readProductsFromCSV()
  let productsCreated = 0
  let productsSkipped = 0

  for (const csvProduct of csvProducts) {
    try {
      const slug = csvProduct.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

      // Determine which collection to use
      const collection = csvProduct.type === "FILLER" ? fillersCollection : flowersCollection

      // Create or update product with single variant
      await prisma.product.upsert({
        create: {
          name: csvProduct.name,
          slug: slug,
          collectionId: collection.id,
          productType: csvProduct.type,
          colors: [], // No colors specified from CSV, can be added manually later
          featured: false,
          variants: {
            create: [
              {
                price: csvProduct.price,
                countPerBunch: csvProduct.stemCount,
              },
            ],
          },
        },
        where: { slug: slug },
        update: {
          name: csvProduct.name,
          collectionId: collection.id,
          productType: csvProduct.type,
        },
      })

      productsCreated++
    } catch (error) {
      console.warn(`⚠️  Skipped product: ${csvProduct.name} (${(error as Error).message})`)
      productsSkipped++
    }
  }

  console.log(
    `✅ CSV seeding complete: ${productsCreated} products created/updated, ${productsSkipped} skipped`
  )

  console.log("✨ Creating inspirations...")

  // First create the inspirations without products
  const sunsetRomance = await prisma.inspiration.upsert({
    create: {
      name: "Sunset Romance",
      slug: "sunset-romance",
      subtitle: "Warm hues for evening celebrations",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/sunset-romance.png",
      excerpt:
        "A stunning combination of warm peach and amber tones that evoke the magical hour just before dusk. Perfect for evening receptions and intimate celebrations.",
      inspirationText:
        "This arrangement draws inspiration from the golden hour's fleeting beauty. I combined soft peach flowers with deeper amber accents to create depth and warmth. The voluminous textures balance the delicate blooms, making this set ideal for florists seeking to create memorable moments at sunset celebrations.",
    },
    where: { slug: "sunset-romance" },
    update: {
      name: "Sunset Romance",
      subtitle: "Warm hues for evening celebrations",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/sunset-romance.png",
      excerpt:
        "A stunning combination of warm peach and amber tones that evoke the magical hour just before dusk. Perfect for evening receptions and intimate celebrations.",
      inspirationText:
        "This arrangement draws inspiration from the golden hour's fleeting beauty. I combined soft peach flowers with deeper amber accents to create depth and warmth. The voluminous textures balance the delicate blooms, making this set ideal for florists seeking to create memorable moments at sunset celebrations.",
      slug: "sunset-romance",
    },
  })

  const romanticElegance = await prisma.inspiration.upsert({
    create: {
      name: "Romantic Elegance",
      slug: "romantic-elegance",
      subtitle: "Timeless pink and white arrangement",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/romantic-elegance.png",
      excerpt:
        "A classic combination that exudes sophistication and grace. The soft pink roses paired with lush greenery create an arrangement that transcends trends.",
      inspirationText:
        "Inspired by classic wedding aesthetics, I curated this set to appeal to traditionalists while maintaining modern elegance. The pink roses provide focal depth, while the abundant green creates visual balance. This set works beautifully for both intimate and grand celebrations, offering versatility for florists managing diverse client needs.",
    },
    where: { slug: "romantic-elegance" },
    update: {
      name: "Romantic Elegance",
      subtitle: "Timeless pink and white arrangement",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/romantic-elegance.png",
      excerpt:
        "A classic combination that exudes sophistication and grace. The soft pink roses paired with lush greenery create an arrangement that transcends trends.",
      inspirationText:
        "Inspired by classic wedding aesthetics, I curated this set to appeal to traditionalists while maintaining modern elegance. The pink roses provide focal depth, while the abundant green creates visual balance. This set works beautifully for both intimate and grand celebrations, offering versatility for florists managing diverse client needs.",
      slug: "romantic-elegance",
    },
  })

  const pureSerenity = await prisma.inspiration.upsert({
    create: {
      name: "Pure Serenity",
      slug: "pure-serenity",
      subtitle: "Pristine white and green sanctuary",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/pure-serenity.png",
      excerpt:
        "Simplicity meets sophistication in this minimalist arrangement. The pristine white blooms paired with lush greenery create a calming, elegant presence.",
      inspirationText:
        "This set embodies the belief that less is often more. The pure white flowers demand attention without noise, creating a serene focal point. Paired with generous green elements, it speaks to clients seeking understated luxury. Perfect for modern minimalist spaces and those who appreciate refined simplicity.",
    },
    where: { slug: "pure-serenity" },
    update: {
      name: "Pure Serenity",
      subtitle: "Pristine white and green sanctuary",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/pure-serenity.png",
      excerpt:
        "Simplicity meets sophistication in this minimalist arrangement. The pristine white blooms paired with lush greenery create a calming, elegant presence.",
      inspirationText:
        "This set embodies the belief that less is often more. The pure white flowers demand attention without noise, creating a serene focal point. Paired with generous green elements, it speaks to clients seeking understated luxury. Perfect for modern minimalist spaces and those who appreciate refined simplicity.",
      slug: "pure-serenity",
    },
  })

  const lushGarden = await prisma.inspiration.upsert({
    create: {
      name: "Lush Garden",
      slug: "lush-garden",
      subtitle: "Abundant greenery with vibrant accents",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/lush-garden.png",
      excerpt:
        "Nature's bounty meets artful arrangement. This set celebrates the beauty of layered textures and verdant tones for creating immersive botanical spaces.",
      inspirationText:
        "I created this set for designers seeking volume and texture-rich arrangements. The primary focus on lush greenery provides an excellent base for clients who prefer to add their own focal flowers, or stands beautifully on its own for those appreciating organic abundance. It's perfect for installations and large-scale projects.",
    },
    where: { slug: "lush-garden" },
    update: {
      name: "Lush Garden",
      subtitle: "Abundant greenery with vibrant accents",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/lush-garden.png",
      excerpt:
        "Nature's bounty meets artful arrangement. This set celebrates the beauty of layered textures and verdant tones for creating immersive botanical spaces.",
      inspirationText:
        "I created this set for designers seeking volume and texture-rich arrangements. The primary focus on lush greenery provides an excellent base for clients who prefer to add their own focal flowers, or stands beautifully on its own for those appreciating organic abundance. It's perfect for installations and large-scale projects.",
      slug: "lush-garden",
    },
  })

  // Fetch the products to get their IDs
  const peachFlower = await prisma.product.findUnique({
    where: { slug: "peach-flower" },
    include: { variants: true },
  })
  const greenFluffy = await prisma.product.findUnique({
    where: { slug: "green-fluffy" },
    include: { variants: true },
  })
  const pinkRose = await prisma.product.findUnique({
    where: { slug: "pink-rose" },
    include: { variants: true },
  })
  const playaBlanca = await prisma.product.findUnique({
    where: { slug: "playa-blanca" },
    include: { variants: true },
  })

  // Create the inspiration product associations with variants
  if (peachFlower && greenFluffy) {
    await prisma.inspirationProduct.createMany({
      data: [
        {
          inspirationId: sunsetRomance.id,
          productId: peachFlower.id,
          productVariantId: peachFlower.variants[0]?.id ?? null,
        },
        {
          inspirationId: sunsetRomance.id,
          productId: greenFluffy.id,
          productVariantId: greenFluffy.variants[0]?.id ?? null,
        },
      ],
      skipDuplicates: true,
    })
  }

  if (pinkRose && greenFluffy) {
    await prisma.inspirationProduct.createMany({
      data: [
        {
          inspirationId: romanticElegance.id,
          productId: pinkRose.id,
          productVariantId: pinkRose.variants[0]?.id ?? null,
        },
        {
          inspirationId: romanticElegance.id,
          productId: greenFluffy.id,
          productVariantId: greenFluffy.variants[0]?.id ?? null,
        },
      ],
      skipDuplicates: true,
    })
  }

  if (playaBlanca && greenFluffy) {
    await prisma.inspirationProduct.createMany({
      data: [
        {
          inspirationId: pureSerenity.id,
          productId: playaBlanca.id,
          productVariantId: playaBlanca.variants[0]?.id ?? null,
        },
        {
          inspirationId: pureSerenity.id,
          productId: greenFluffy.id,
          productVariantId: greenFluffy.variants[0]?.id ?? null,
        },
      ],
      skipDuplicates: true,
    })
  }

  if (greenFluffy && peachFlower) {
    await prisma.inspirationProduct.createMany({
      data: [
        {
          inspirationId: lushGarden.id,
          productId: greenFluffy.id,
          productVariantId: greenFluffy.variants[0]?.id ?? null,
        },
        {
          inspirationId: lushGarden.id,
          productId: peachFlower.id,
          productVariantId: peachFlower.variants[0]?.id ?? null,
        },
      ],
      skipDuplicates: true,
    })
  }

  console.log("✨ Creating hero banners...")

  // Upsert two hero banners so running the seed is idempotent
  await prisma.heroBanner.upsert({
    where: { slug: "main-hero" },
    update: {
      title: "Peak Blooms — Fresh flowers for every occasion",
      subtitle:
        "Beautiful, sustainably sourced flowers delivered to your door — designed by florists, loved by everyone.",
      ctaText: "Shop flowers",
      ctaLink: "/shop",
      backgroundType: "IMAGE",
      backgroundImage: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/heroes/welcome.png",
      slotPosition: 1,
      textPosition: "left",
    },
    create: {
      name: "Main Home Hero",
      slug: "main-hero",
      title: "Peak Blooms — Fresh flowers for every occasion",
      subtitle:
        "Beautiful, sustainably sourced flowers delivered to your door — designed by florists, loved by everyone.",
      ctaText: "Shop flowers",
      ctaLink: "/shop",
      backgroundType: "IMAGE",
      backgroundImage: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/heroes/welcome.png",
      slotPosition: 1,
      textPosition: "left",
    },
  })

  await prisma.heroBanner.upsert({
    where: { slug: "boxlot-hero" },
    update: {
      title: "Boxlot Deals — Bulk flowers for events & florists",
      subtitle:
        "Shop bulk boxlots for better value — perfect for large installs, weddings, and events.",
      ctaText: "Shop boxlots",
      ctaLink: "/shop?boxlotOnly=true",
      backgroundType: "IMAGE",
      backgroundImage: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/heroes/boxlots.png",
      slotPosition: 2,
      textPosition: "right",
    },
    create: {
      name: "Boxlot CTA",
      slug: "boxlot-hero",
      title: "Boxlot Deals — Bulk flowers for events & florists",
      subtitle:
        "Shop bulk boxlots for better value — perfect for large installs, weddings, and events.",
      ctaText: "Shop boxlots",
      ctaLink: "/shop?boxlotOnly=true",
      backgroundType: "IMAGE",
      backgroundImage: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/heroes/boxlots.png",
      slotPosition: 2,
      textPosition: "right",
    },
  })

  await prisma.heroBanner.upsert({
    where: { slug: "boxlot-hero-center" },
    update: {
      title: "Boxlot Deals — Bulk flowers for events & florists",
      subtitle:
        "Shop bulk boxlots for better value — perfect for large installs, weddings, and events.",
      ctaText: "Shop boxlots",
      ctaLink: "/shop?boxlotOnly=true",
      backgroundType: "IMAGE",
      backgroundImage: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/heroes/boxlot2.png",
      slotPosition: 3,
      textPosition: "center",
    },
    create: {
      name: "Boxlot hero center",
      slug: "boxlot-hero-center",
      title: "Boxlot Deals — Bulk flowers for events & florists",
      subtitle:
        "Shop bulk boxlots for better value — perfect for large installs, weddings, and events.",
      ctaText: "Shop boxlots",
      ctaLink: "/shop?boxlotOnly=true",
      backgroundType: "IMAGE",
      backgroundImage: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/heroes/boxlot2.png",
      slotPosition: 3,
      textPosition: "center",
    },
  })

  console.log("✅ Hero banners seeded/updated: main-hero, boxlot-hero, boxlot-hero-center")

  // Create sample orders for the approved customer
  if (approvedCustomer) {
    // Get some product variants for the orders
    const peachFlowerVariant = await prisma.productVariant.findFirst({
      where: {
        product: { slug: "peach-flower" },
      },
    })

    const pinkRoseVariant = await prisma.productVariant.findFirst({
      where: {
        product: { slug: "pink-rose" },
      },
    })

    const greenFluffyVariant = await prisma.productVariant.findFirst({
      where: {
        product: { slug: "green-fluffy" },
      },
    })

    // Create first order (completed order from 30 days ago)
    const order1Date = new Date()
    order1Date.setDate(order1Date.getDate() - 30)

    // Create shipping address for first order
    const shippingAddress1 = await prisma.address.create({
      data: {
        firstName: "Test",
        lastName: "Customer",
        street1: "123 Flower Lane",
        city: "Portland",
        state: "OR",
        zip: "97201",
        country: "USA",
        isDefault: true,
      },
    })

    const order1 = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-1`,
        userId: approvedCustomer.id,
        email: approvedCustomer.email,
        status: "DELIVERED",
        total: 242.0,
        createdAt: order1Date,
        shippingAddressId: shippingAddress1.id,
        items: {
          create: [
            peachFlowerVariant
              ? {
                  productId: peachFlowerVariant.productId,
                  productVariantId: peachFlowerVariant.id,
                  quantity: 2,
                  price: 55.0,
                }
              : undefined,
            greenFluffyVariant
              ? {
                  productId: greenFluffyVariant.productId,
                  productVariantId: greenFluffyVariant.id,
                  quantity: 1,
                  price: 110.0,
                }
              : undefined,
          ].filter(
            (item) => item !== undefined
          ) as unknown as Prisma.OrderItemCreateWithoutOrderInput[],
        },
      },
    })

    console.log(`✅ Created completed order from 30 days ago: ${order1.id}`)

    // Create second order (processing order from 5 days ago)
    const order2Date = new Date()
    order2Date.setDate(order2Date.getDate() - 5)

    // Create shipping address for second order
    const shippingAddress2 = await prisma.address.create({
      data: {
        firstName: "Test",
        lastName: "Customer",
        street1: "456 Rose Garden Ln",
        city: "Seattle",
        state: "WA",
        zip: "98101",
        country: "USA",
        isDefault: false,
      },
    })

    const order2 = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-2`,
        userId: approvedCustomer.id,
        email: approvedCustomer.email,
        status: "CONFIRMED",
        total: 374.0,
        createdAt: order2Date,
        shippingAddressId: shippingAddress2.id,
        items: {
          create: [
            pinkRoseVariant
              ? {
                  productId: pinkRoseVariant.productId,
                  productVariantId: pinkRoseVariant.id,
                  quantity: 1,
                  price: 75.0,
                }
              : undefined,
            greenFluffyVariant
              ? {
                  productId: greenFluffyVariant.productId,
                  productVariantId: greenFluffyVariant.id,
                  quantity: 2,
                  price: 130.0,
                }
              : undefined,
            peachFlowerVariant
              ? {
                  productId: peachFlowerVariant.productId,
                  productVariantId: peachFlowerVariant.id,
                  quantity: 1,
                  price: 55.0,
                }
              : undefined,
          ].filter(
            (item) => item !== undefined
          ) as unknown as Prisma.OrderItemCreateWithoutOrderInput[],
        },
      },
    })

    console.log(`✅ Created confirmed order from 5 days ago: ${order2.id}`)
  }

  console.log("✅ Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
