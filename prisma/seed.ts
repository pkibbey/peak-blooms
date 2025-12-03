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

// Helper function to determine quantity per bunch from price string
function getQuantity(priceString: string): number {
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
  quantity: number
  description: string
  colors: string[]
  image?: string
}> {
  // Get the CSV path using process.cwd() since __dirname may be unreliable with tsx
  const csvPath = path.join(process.cwd(), "prisma", "products.csv")
  console.log(`Reading CSV from: ${csvPath}`)
  const fileContent = fs.readFileSync(csvPath, "utf-8")
  const lines = fileContent.split("\n")

  const products: Array<{
    name: string
    price: number
    type: "FLOWER" | "FILLER"
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
    const type = typeStr === "FILLER" ? "FILLER" : "FLOWER"
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

  // Create a newsletter subscriber user for testing flows that use the NEWSLETTER_SUBSCRIBER role
  await prisma.user.upsert({
    create: {
      email: "newsletter@peakblooms.com",
      name: "Newsletter Subscriber",
      emailVerified: true,
      approved: true,
      role: "NEWSLETTER_SUBSCRIBER",
      priceMultiplier: 1.0,
    },
    where: { email: "newsletter@peakblooms.com" },
    update: {
      name: "Newsletter Subscriber",
      emailVerified: true,
      approved: true,
      role: "NEWSLETTER_SUBSCRIBER",
      priceMultiplier: 1.0,
    },
  })
  console.log("✅ Created newsletter subscriber: newsletter@peakblooms.com")

  // Create a pending newsletter subscriber user
  await prisma.user.upsert({
    create: {
      email: "pending-newsletter@peakblooms.com",
      name: "Pending Newsletter Subscriber",
      emailVerified: true,
      approved: false,
      role: "NEWSLETTER_SUBSCRIBER",
      priceMultiplier: 1.0,
    },
    where: { email: "pending-newsletter@peakblooms.com" },
    update: {
      name: "Pending Newsletter Subscriber",
      emailVerified: true,
      approved: false,
      role: "NEWSLETTER_SUBSCRIBER",
      priceMultiplier: 1.0,
    },
  })
  console.log("✅ Created pending newsletter subscriber: pending-newsletter@peakblooms.com")

  // Create collections (used for shop filtering)
  await prisma.collection.upsert({
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

  await prisma.collection.upsert({
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

      // Create or update product with single variant
      const csvProductRecord = await prisma.product.upsert({
        create: {
          name: csvProduct.name,
          slug: slug,
          description: csvProduct.description,
          productType: csvProduct.type,
          colors: csvProduct.colors, // Color IDs from CSV
          image: csvProduct.image || null, // Image from CSV (or null if not set)
          featured: false,
          variants: {
            create: [
              {
                price: csvProduct.price,
                quantityPerBunch: csvProduct.quantity,
              },
            ],
          },
        },
        where: { slug: slug },
        update: {
          name: csvProduct.name,
          description: csvProduct.description,
          productType: csvProduct.type,
          colors: csvProduct.colors, // Update colors from CSV
          image: csvProduct.image || null, // Update image from CSV
        },
      })

      // Update variant for CSV product
      await prisma.productVariant.upsert({
        where: {
          id:
            (
              await prisma.productVariant.findFirst({
                where: {
                  productId: csvProductRecord.id,
                  price: csvProduct.price,
                },
              })
            )?.id || "new",
        },
        create: {
          productId: csvProductRecord.id,
          price: csvProduct.price,
          quantityPerBunch: csvProduct.quantity,
        },
        update: {
          quantityPerBunch: csvProduct.quantity,
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

  // Add CSV products to their appropriate collections (Flowers or Fillers)
  console.log("🏷️  Adding products to collections...")
  const flowersCollection = await prisma.collection.findUnique({
    where: { slug: "flowers" },
  })
  const fillersCollection = await prisma.collection.findUnique({
    where: { slug: "fillers" },
  })

  let collectionAssociations = 0
  for (const csvProduct of csvProducts) {
    try {
      const slug = csvProduct.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

      const product = await prisma.product.findUnique({
        where: { slug: slug },
      })

      if (!product) continue

      // Determine which collection based on product type
      const collectionId =
        csvProduct.type === "FILLER" ? fillersCollection?.id : flowersCollection?.id

      if (!collectionId) continue

      // Create association if it doesn't exist
      await prisma.productCollection.upsert({
        where: {
          productId_collectionId: {
            productId: product.id,
            collectionId: collectionId,
          },
        },
        create: {
          productId: product.id,
          collectionId: collectionId,
        },
        update: {}, // No update needed, just ensure it exists
      })

      collectionAssociations++
    } catch (error) {
      console.warn(`⚠️  Failed to add ${csvProduct.name} to collection: ${(error as Error).message}`)
    }
  }

  console.log(`✅ Added ${collectionAssociations} products to collections`)

  // Mark a handful of notable products as featured so the storefront has examples
  // of featured products for UI/marketing sections.
  const featuredSlugs = [
    "peonies",
    "sunflower",
    "hydrangea",
    "calla-lily",
    "ranunculus-butterfly",
    "gerbera",
  ]

  const featuredResult = await prisma.product.updateMany({
    where: { slug: { in: featuredSlugs } },
    data: { featured: true },
  })

  console.log(
    `⭐ Marked ${featuredResult.count ?? 0} products as featured: ${featuredSlugs.join(", ")}`
  )

  // First create the inspirations without products
  await prisma.inspiration.upsert({
    create: {
      name: "Sunset Romance",
      slug: "sunset-romance",
      subtitle: "Warm hues for evening celebrations",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/sunset-romance.png",
      excerpt:
        "A stunning combination of warm peach and amber tones that evoke the magical hour just before dusk. Perfect for evening receptions and intimate celebrations.",
      inspirationText:
        "This arrangement captures the ephemeral beauty of the golden hour—that magical moment when the sun dips toward the horizon and paints the sky in warm, glowing tones. I designed this set for those special occasions where romance and warmth matter most.\n\nThe soft peach flowers serve as the heart of this arrangement, their delicate petals providing a tender focal point. I paired them with generous layers of lush green foliage to create visual depth and movement. This combination works beautifully for intimate evening receptions, anniversary celebrations, and anyone seeking to evoke feelings of warmth and connection.\n\nWhat makes this set special is its versatility—it's equally stunning in a trailing cascade arrangement for a bride, or in a modern hand-tied bouquet for a special dinner. The warm tones photograph beautifully in natural light, making it a favorite choice for event coordinators and wedding planners who understand that the right color palette can transform a moment into a memory.",
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
        "This arrangement captures the ephemeral beauty of the golden hour—that magical moment when the sun dips toward the horizon and paints the sky in warm, glowing tones. I designed this set for those special occasions where romance and warmth matter most.\n\nThe soft peach flowers serve as the heart of this arrangement, their delicate petals providing a tender focal point. I paired them with generous layers of lush green foliage to create visual depth and movement. This combination works beautifully for intimate evening receptions, anniversary celebrations, and anyone seeking to evoke feelings of warmth and connection.\n\nWhat makes this set special is its versatility—it's equally stunning in a trailing cascade arrangement for a bride, or in a modern hand-tied bouquet for a special dinner. The warm tones photograph beautifully in natural light, making it a favorite choice for event coordinators and wedding planners who understand that the right color palette can transform a moment into a memory.",
      slug: "sunset-romance",
    },
  })

  await prisma.inspiration.upsert({
    create: {
      name: "Romantic Elegance",
      slug: "romantic-elegance",
      subtitle: "Timeless pink and white arrangement",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/romantic-elegance.png",
      excerpt:
        "A classic combination that exudes sophistication and grace. The soft pink roses paired with lush greenery create an arrangement that transcends trends.",
      inspirationText:
        "Pink has been the color of romance for centuries, and for good reason. There's something universally understood about what soft, blushing pink communicates—love, grace, and timeless beauty. This set celebrates that tradition while remaining entirely modern.\n\nI chose pink roses as the focal flowers because they possess an incredible range of tonal variation from champagne to deep mauve, giving florists the flexibility to create arrangements that feel fresh and contemporary. The generous green foliage creates visual balance without overwhelming the delicate pink tones, allowing the roses to command attention.\n\nThis is the set I recommend for couples who are planning weddings, anniversaries, or romantic gestures that need to feel effortless and elegant. It works beautifully in hand-tied bouquets, tall vase arrangements, and installation work. Many of my pro florist clients tell me they reach for this set repeatedly because it's foolproof—it looks beautiful in any quantity, at any scale, and in any design style from romantic to modern minimalist.",
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
        "Pink has been the color of romance for centuries, and for good reason. There's something universally understood about what soft, blushing pink communicates—love, grace, and timeless beauty. This set celebrates that tradition while remaining entirely modern.\n\nI chose pink roses as the focal flowers because they possess an incredible range of tonal variation from champagne to deep mauve, giving florists the flexibility to create arrangements that feel fresh and contemporary. The generous green foliage creates visual balance without overwhelming the delicate pink tones, allowing the roses to command attention.\n\nThis is the set I recommend for couples who are planning weddings, anniversaries, or romantic gestures that need to feel effortless and elegant. It works beautifully in hand-tied bouquets, tall vase arrangements, and installation work. Many of my pro florist clients tell me they reach for this set repeatedly because it's foolproof—it looks beautiful in any quantity, at any scale, and in any design style from romantic to modern minimalist.",
      slug: "romantic-elegance",
    },
  })

  await prisma.inspiration.upsert({
    create: {
      name: "Pure Serenity",
      slug: "pure-serenity",
      subtitle: "Pristine white and green sanctuary",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/pure-serenity.png",
      excerpt:
        "Simplicity meets sophistication in this minimalist arrangement. The pristine white blooms paired with lush greenery create a calming, elegant presence.",
      inspirationText:
        "There's profound elegance in simplicity. In a world of endless options and visual noise, white flowers offer something increasingly rare—calm, clarity, and understated luxury. This set was created for everyone who believes that less is more.\n\nPlaya Blanca white flowers form the pure, uncluttered heart of this arrangement. Their pristine petals almost glow against the rich green foliage, creating a sophisticated contrast that feels both modern and timeless. There's a reason white arrangements appear at the most exclusive events—they communicate refinement and intention.\n\nThis set appeals to contemporary designers creating Instagram-worthy installations, modern couples planning minimalist weddings, and anyone working in spaces with clean architecture and neutral palettes. The white blooms won't compete with your interior design—they'll elevate it. I've seen this set used in corporate lobbies, high-end retail spaces, and intimate home celebrations where the focus needs to remain on the moment, not the arrangement itself.",
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
        "There's profound elegance in simplicity. In a world of endless options and visual noise, white flowers offer something increasingly rare—calm, clarity, and understated luxury. This set was created for everyone who believes that less is more.\n\nPlaya Blanca white flowers form the pure, uncluttered heart of this arrangement. Their pristine petals almost glow against the rich green foliage, creating a sophisticated contrast that feels both modern and timeless. There's a reason white arrangements appear at the most exclusive events—they communicate refinement and intention.\n\nThis set appeals to contemporary designers creating Instagram-worthy installations, modern couples planning minimalist weddings, and anyone working in spaces with clean architecture and neutral palettes. The white blooms won't compete with your interior design—they'll elevate it. I've seen this set used in corporate lobbies, high-end retail spaces, and intimate home celebrations where the focus needs to remain on the moment, not the arrangement itself.",
      slug: "pure-serenity",
    },
  })

  await prisma.inspiration.upsert({
    create: {
      name: "Lush Garden",
      slug: "lush-garden",
      subtitle: "Abundant greenery with vibrant accents",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/lush-garden.png",
      excerpt:
        "Nature's bounty meets artful arrangement. This set celebrates the beauty of layered textures and verdant tones for creating immersive botanical spaces.",
      inspirationText:
        "Sometimes the most beautiful arrangements aren't about one stunning focal flower—they're about texture, depth, and the quiet beauty of foliage done right. This set celebrates greenery as the star, not the supporting player.\n\nGreen is having a moment in design, and for good reason. It's calming, it's sophisticated, and it works in virtually every space. I developed this set for designers and florists who understand that lush, layered greenery can create an installation that feels like stepping into a secret garden.\n\nThis is my go-to recommendation for large-scale corporate events, hotel installations, and anyone creating a living, breathing backdrop. The abundant green foliage serves as a perfect base for clients who want to add their own focal flowers, or it stands beautifully on its own for those who appreciate organic abundance. Event designers love this set because it's forgiving—scale it up for drama, scale it down for intimacy, and it always looks intentional and professional.",
    },
    where: { slug: "lush-garden" },
    update: {
      name: "Lush Garden",
      subtitle: "Abundant greenery with vibrant accents",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/lush-garden.png",
      excerpt:
        "Nature's bounty meets artful arrangement. This set celebrates the beauty of layered textures and verdant tones for creating immersive botanical spaces.",
      inspirationText:
        "Sometimes the most beautiful arrangements aren't about one stunning focal flower—they're about texture, depth, and the quiet beauty of foliage done right. This set celebrates greenery as the star, not the supporting player.\n\nGreen is having a moment in design, and for good reason. It's calming, it's sophisticated, and it works in virtually every space. I developed this set for designers and florists who understand that lush, layered greenery can create an installation that feels like stepping into a secret garden.\n\nThis is my go-to recommendation for large-scale corporate events, hotel installations, and anyone creating a living, breathing backdrop. The abundant green foliage serves as a perfect base for clients who want to add their own focal flowers, or it stands beautifully on its own for those who appreciate organic abundance. Event designers love this set because it's forgiving—scale it up for drama, scale it down for intimacy, and it always looks intentional and professional.",
      slug: "lush-garden",
    },
  })

  await prisma.inspiration.upsert({
    create: {
      name: "Blush Bride",
      slug: "blush-bride",
      subtitle: "Soft, romantic wedding palette",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/blush-bride.png",
      excerpt:
        "Gentle peachy-pink tones create a modern, romantic aesthetic perfect for weddings and celebrations that radiate warmth and tenderness.",
      inspirationText:
        "The blush-to-peach color gradient is the wedding palette of the moment, and I created this set for brides and planners who want that soft, romantic energy without feeling overdone. These are the colors of sunrise, of garden roses at their peak, of natural beauty rather than artificial perfection.\n\nThis combination works beautifully because the peachy and blush tones sit in that perfect zone between traditional and contemporary—it appeals to classic brides while feeling fresh and current. The soft hues photograph extraordinarily well in warm, golden hour light, which is exactly when most wedding ceremonies and receptions take place.\n\nI recommend this set for bridal bouquets, ceremony installations, and reception centerpieces. Wedding planners tell me this palette makes everything feel elevated and intentional without requiring elaborate design work—the colors do the heavy lifting. It's also forgiving for mixed-tone arrangements, which means your florist team can move quickly while maintaining visual cohesion.",
    },
    where: { slug: "blush-bride" },
    update: {
      name: "Blush Bride",
      subtitle: "Soft, romantic wedding palette",
      image: "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/blush-bride.png",
      excerpt:
        "Gentle peachy-pink tones create a modern, romantic aesthetic perfect for weddings and celebrations that radiate warmth and tenderness.",
      inspirationText:
        "The blush-to-peach color gradient is the wedding palette of the moment, and I created this set for brides and planners who want that soft, romantic energy without feeling overdone. These are the colors of sunrise, of garden roses at their peak, of natural beauty rather than artificial perfection.\n\nThis combination works beautifully because the peachy and blush tones sit in that perfect zone between traditional and contemporary—it appeals to classic brides while feeling fresh and current. The soft hues photograph extraordinarily well in warm, golden hour light, which is exactly when most wedding ceremonies and receptions take place.\n\nI recommend this set for bridal bouquets, ceremony installations, and reception centerpieces. Wedding planners tell me this palette makes everything feel elevated and intentional without requiring elaborate design work—the colors do the heavy lifting. It's also forgiving for mixed-tone arrangements, which means your florist team can move quickly while maintaining visual cohesion.",
      slug: "blush-bride",
    },
  })

  await prisma.inspiration.upsert({
    create: {
      name: "Verdant Oasis",
      slug: "verdant-oasis",
      subtitle: "Tropical-inspired green sanctuary",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/verdant-oasis.png",
      excerpt:
        "Rich, layered greenery creates a lush tropical feeling perfect for creating immersive botanical experiences and dramatic installations.",
      inspirationText:
        "Green floristry is where creativity meets sustainability, and this set celebrates the incredible range of textures and tones that foliage offers. When designed thoughtfully, an all-green arrangement can feel more luxurious than any colorful alternative—it's the work of a confident designer.\n\nThe 'Verdant Oasis' set was created for florists and designers who understand that green isn't neutral—it's powerful. Different shades of green create visual depth, movement, and sophistication. This is the palette for creating jungle walls, botanical installations, and any project where you want clients to feel transported.\n\nI particularly love this set for corporate events, hotel renovations, and restaurant installations where the greenery needs to complement rather than compete. It also works beautifully as a base for mixed-flower arrangements where you're adding specialty blooms. Many of my most celebrated installations have started with this foundational green palette—it's the canvas that allows everything else to shine.",
    },
    where: { slug: "verdant-oasis" },
    update: {
      name: "Verdant Oasis",
      subtitle: "Tropical-inspired green sanctuary",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/verdant-oasis.png",
      excerpt:
        "Rich, layered greenery creates a lush tropical feeling perfect for creating immersive botanical experiences and dramatic installations.",
      inspirationText:
        "Green floristry is where creativity meets sustainability, and this set celebrates the incredible range of textures and tones that foliage offers. When designed thoughtfully, an all-green arrangement can feel more luxurious than any colorful alternative—it's the work of a confident designer.\n\nThe 'Verdant Oasis' set was created for florists and designers who understand that green isn't neutral—it's powerful. Different shades of green create visual depth, movement, and sophistication. This is the palette for creating jungle walls, botanical installations, and any project where you want clients to feel transported.\n\nI particularly love this set for corporate events, hotel renovations, and restaurant installations where the greenery needs to complement rather than compete. It also works beautifully as a base for mixed-flower arrangements where you're adding specialty blooms. Many of my most celebrated installations have started with this foundational green palette—it's the canvas that allows everything else to shine.",
      slug: "verdant-oasis",
    },
  })

  await prisma.inspiration.upsert({
    create: {
      name: "Classic Bouquet",
      slug: "classic-bouquet",
      subtitle: "Timeless pink roses and greenery",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/classic-bouquet.png",
      excerpt:
        "The bouquet that never goes out of style. Pink roses have graced celebrations for generations—this set honors that tradition while staying utterly contemporary.",
      inspirationText:
        "Some arrangements become iconic because they simply work. Pink roses with lush green foliage is the foundation of countless beautiful moments—proposals, anniversaries, apologies, celebrations. There's wisdom in classics.\n\nWhat makes this set special isn't innovation—it's execution. I've carefully selected pink rose varieties that offer color variation and natural beauty, paired with generous greenery that supports without overshadowing. This is the set that works equally well as a surprise bouquet from the grocery store or as the focal point of a $5,000 wedding installation.\n\nFor florists, this is your workhorse set. It requires minimal training to execute beautifully, it's cost-effective, and your customers will recognize and love it immediately. For event professionals, this palette is your safety net—you literally cannot go wrong. I've used versions of this combination in some of my most acclaimed events because I know it will always read beautifully, always feel intentional, and always make people smile when they see it.",
    },
    where: { slug: "classic-bouquet" },
    update: {
      name: "Classic Bouquet",
      subtitle: "Timeless pink roses and greenery",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/classic-bouquet.png",
      excerpt:
        "The bouquet that never goes out of style. Pink roses have graced celebrations for generations—this set honors that tradition while staying utterly contemporary.",
      inspirationText:
        "Some arrangements become iconic because they simply work. Pink roses with lush green foliage is the foundation of countless beautiful moments—proposals, anniversaries, apologies, celebrations. There's wisdom in classics.\n\nWhat makes this set special isn't innovation—it's execution. I've carefully selected pink rose varieties that offer color variation and natural beauty, paired with generous greenery that supports without overshadowing. This is the set that works equally well as a surprise bouquet from the grocery store or as the focal point of a $5,000 wedding installation.\n\nFor florists, this is your workhorse set. It requires minimal training to execute beautifully, it's cost-effective, and your customers will recognize and love it immediately. For event professionals, this palette is your safety net—you literally cannot go wrong. I've used versions of this combination in some of my most acclaimed events because I know it will always read beautifully, always feel intentional, and always make people smile when they see it.",
      slug: "classic-bouquet",
    },
  })

  await prisma.inspiration.upsert({
    create: {
      name: "Modern Minimal",
      slug: "modern-minimal",
      subtitle: "Contemporary white and green design",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/modern-minimal.png",
      excerpt:
        "Clean lines, intentional design. This palette is for spaces and moments that demand sophistication through restraint.",
      inspirationText:
        "Minimalism in design isn't about doing less—it's about intentionality. Every element serves a purpose. This set was created for designers and individuals who understand that a carefully chosen arrangement can be more powerful than an explosion of color.\n\nWhite flowers against rich green foliage creates a striking visual contrast that feels both modern and timeless. There's a reason high-end interior designers and luxury brands reach for this palette—it reads as refined, expensive, and intentional. White flowers aren't common in nature in the same abundance as colored flowers, which gives arrangements a curated, exclusive feeling.\n\nUse this set for minimalist weddings, high-end hospitality installations, and any space where architecture and design matter more than florals. It pairs beautifully with contemporary interiors, scandinavian aesthetics, and modern luxury. This is the set that makes people pause and look twice—not because of busy colors, but because of the quiet confidence of the design.",
    },
    where: { slug: "modern-minimal" },
    update: {
      name: "Modern Minimal",
      subtitle: "Contemporary white and green design",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/modern-minimal.png",
      excerpt:
        "Clean lines, intentional design. This palette is for spaces and moments that demand sophistication through restraint.",
      inspirationText:
        "Minimalism in design isn't about doing less—it's about intentionality. Every element serves a purpose. This set was created for designers and individuals who understand that a carefully chosen arrangement can be more powerful than an explosion of color.\n\nWhite flowers against rich green foliage creates a striking visual contrast that feels both modern and timeless. There's a reason high-end interior designers and luxury brands reach for this palette—it reads as refined, expensive, and intentional. White flowers aren't common in nature in the same abundance as colored flowers, which gives arrangements a curated, exclusive feeling.\n\nUse this set for minimalist weddings, high-end hospitality installations, and any space where architecture and design matter more than florals. It pairs beautifully with contemporary interiors, scandinavian aesthetics, and modern luxury. This is the set that makes people pause and look twice—not because of busy colors, but because of the quiet confidence of the design.",
      slug: "modern-minimal",
    },
  })

  await prisma.inspiration.upsert({
    create: {
      name: "Warm Celebratory",
      slug: "warm-celebratory",
      subtitle: "Joyful peach and green combination",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/warm-celebratory.png",
      excerpt:
        "Celebration colors that feel welcoming and genuine. This palette radiates warmth and joy without demanding attention.",
      inspirationText:
        "Not all celebrations require drama—some require warmth. Peach is the color of happiness without the intensity of bright orange, of celebration without the formality of red, of joy that feels accessible and genuine.\n\nI created this set for anyone planning gatherings where people matter more than perfection. Birthday parties where the focus is on laughter. Anniversary celebrations that need to feel both special and relaxed. Baby showers and baby announcements that feel joyful rather than trendy. The warm peachy tones naturally complement skin tones and natural light, making them perfect for events where photography and people interaction matter more than design drama.\n\nWhat I love about this palette is its approachability. Unlike some of the more sophisticated color combinations, warm peach and green says 'welcome, relax, celebrate.' For event planners managing multiple celebrations, this is the set that works for the casual engagement party, the backyard anniversary, the family gathering. It's the set that makes grandmothers smile and young people take great photos. It's the definition of reliably beautiful.",
    },
    where: { slug: "warm-celebratory" },
    update: {
      name: "Warm Celebratory",
      subtitle: "Joyful peach and green combination",
      image:
        "https://zvbfsgiej9tfgqre.public.blob.vercel-storage.com/inspiration/warm-celebratory.png",
      excerpt:
        "Celebration colors that feel welcoming and genuine. This palette radiates warmth and joy without demanding attention.",
      inspirationText:
        "Not all celebrations require drama—some require warmth. Peach is the color of happiness without the intensity of bright orange, of celebration without the formality of red, of joy that feels accessible and genuine.\n\nI created this set for anyone planning gatherings where people matter more than perfection. Birthday parties where the focus is on laughter. Anniversary celebrations that need to feel both special and relaxed. Baby showers and baby announcements that feel joyful rather than trendy. The warm peachy tones naturally complement skin tones and natural light, making them perfect for events where photography and people interaction matter more than design drama.\n\nWhat I love about this palette is its approachability. Unlike some of the more sophisticated color combinations, warm peach and green says 'welcome, relax, celebrate.' For event planners managing multiple celebrations, this is the set that works for the casual engagement party, the backyard anniversary, the family gathering. It's the set that makes grandmothers smile and young people take great photos. It's the definition of reliably beautiful.",
      slug: "warm-celebratory",
    },
  })

  // Create the inspiration product associations with variants
  console.log("🎨 Adding products to inspirations...")

  // Helper function to add a product to an inspiration
  async function addProductToInspiration(
    inspirationSlug: string,
    productSlug: string,
    quantity: number = 1
  ) {
    try {
      const inspiration = await prisma.inspiration.findUnique({
        where: { slug: inspirationSlug },
      })
      const product = await prisma.product.findUnique({
        where: { slug: productSlug },
      })

      if (!inspiration || !product) return

      // Get first variant of the product
      const variant = await prisma.productVariant.findFirst({
        where: { productId: product.id },
      })

      if (!variant) return

      // Upsert to avoid duplicates
      await prisma.inspirationProduct.upsert({
        where: {
          inspirationId_productId: {
            inspirationId: inspiration.id,
            productId: product.id,
          },
        },
        create: {
          inspirationId: inspiration.id,
          productId: product.id,
          productVariantId: variant.id,
          quantity: quantity,
        },
        update: {
          quantity: quantity,
        },
      })
    } catch (error) {
      console.warn(
        `⚠️  Failed to add ${productSlug} to ${inspirationSlug}: ${(error as Error).message}`
      )
    }
  }

  // Add products to Sunset Romance (peach, orange, warm colors)
  await addProductToInspiration("sunset-romance", "alstromeria", 3)
  await addProductToInspiration("sunset-romance", "cosmos", 2)
  await addProductToInspiration("sunset-romance", "bird-of-paradise", 2)
  await addProductToInspiration("sunset-romance", "cremone-fall-color", 2)

  // Add products to Romantic Elegance (pink and rose)
  await addProductToInspiration("romantic-elegance", "50-cm-ecuadorian", 3)
  await addProductToInspiration("romantic-elegance", "60-cm-ecuadorian", 2)
  await addProductToInspiration("romantic-elegance", "carnation", 2)

  // Add products to Pure Serenity (white blooms)
  await addProductToInspiration("pure-serenity", "calla-lily", 3)
  await addProductToInspiration("pure-serenity", "anemone", 2)

  // Add products to Lush Garden (greenery and texture)
  await addProductToInspiration("lush-garden", "astrantia", 3)
  await addProductToInspiration("lush-garden", "cremone", 2)

  // Add products to Blush Bride (peachy-pink wedding palette)
  await addProductToInspiration("blush-bride", "alstromeria", 2)
  await addProductToInspiration("blush-bride", "carnation-mini", 3)
  await addProductToInspiration("blush-bride", "dahlia", 2)

  // Add products to Verdant Oasis (tropical greenery)
  await addProductToInspiration("verdant-oasis", "delphinium", 2)
  await addProductToInspiration("verdant-oasis", "cremone", 3)

  // Add products to Classic Bouquet (pink roses with greenery)
  await addProductToInspiration("classic-bouquet", "50-cm-ecuadorian", 5)
  await addProductToInspiration("classic-bouquet", "carnation", 3)

  // Add products to Modern Minimal (white and clean)
  await addProductToInspiration("modern-minimal", "calla-lily", 4)
  await addProductToInspiration("modern-minimal", "anemone", 2)

  // Add products to Warm Celebratory (peach and festive)
  await addProductToInspiration("warm-celebratory", "cosmos", 3)
  await addProductToInspiration("warm-celebratory", "aster-serenade", 2)
  await addProductToInspiration("warm-celebratory", "carnation-mini", 2)

  console.log("✅ Added products to inspirations")

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
