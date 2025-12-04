import * as fs from "node:fs"
import * as path from "node:path"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import {
  type HeroBackgroundType,
  type Prisma,
  PrismaClient,
  type Prisma as PrismaNamespace,
} from "../src/generated/client"

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

  console.log(`✅ Parsed ${products.length} products from CSV (${lines.length} lines)`)
  if (products.length === 0) {
    console.warn("⚠️  No products were parsed from the CSV — check the file format and header row.")
  }

  return products
}

async function main() {
  console.log("🌸 Seeding database with collections and products...")

  // Create test users for development/testing
  const testUsers = [
    {
      email: "phineas.kibbey@gmail.com",
      name: "Phineas",
      emailVerified: true,
      approved: true,
      role: "ADMIN" as const,
      priceMultiplier: 1.0,
    },
    {
      email: "pending@peakblooms.com",
      name: "Pending User",
      emailVerified: true,
      approved: false,
      role: "CUSTOMER" as const,
      priceMultiplier: 1.0,
    },
    {
      email: "customer@peakblooms.com",
      name: "Approved Customer",
      emailVerified: true,
      approved: true,
      role: "CUSTOMER" as const,
      priceMultiplier: 0.8,
    },
    {
      email: "newsletter@peakblooms.com",
      name: "Newsletter Subscriber",
      emailVerified: true,
      approved: true,
      role: "NEWSLETTER_SUBSCRIBER" as const,
      priceMultiplier: 1.0,
    },
    {
      email: "pending-newsletter@peakblooms.com",
      name: "Pending Newsletter Subscriber",
      emailVerified: true,
      approved: false,
      role: "NEWSLETTER_SUBSCRIBER" as const,
      priceMultiplier: 1.0,
    },
  ]

  let approvedCustomer: PrismaNamespace.UserModel | null = null

  for (const user of testUsers) {
    const createdUser = await prisma.user.upsert({
      create: user,
      where: { email: user.email },
      update: user,
    })

    if (user.email === "customer@peakblooms.com") {
      approvedCustomer = createdUser
    }
  }

  console.log(`✅ Created/updated ${testUsers.length} test users`)

  // Create collections (used for shop filtering)
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

  for (const collection of collections) {
    await prisma.collection.upsert({
      create: collection,
      where: { slug: collection.slug },
      update: collection,
    })
  }
  console.log(`✅ Created/updated ${collections.length} collections`)

  // Seed products from CSV file
  console.log("📦 Seeding products from CSV...")
  const csvProducts = readProductsFromCSV()
  console.log(`📦 Found ${csvProducts.length} CSV products — starting upsert...`)
  let productsCreated = 0
  let productsSkipped = 0

  for (let i = 0; i < csvProducts.length; i++) {
    const csvProduct = csvProducts[i]
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

    // Log progress every 5 items so long-running seeds show activity
    if ((i + 1) % 5 === 0 || i === csvProducts.length - 1) {
      console.log(
        `📊 Progress: ${i + 1}/${csvProducts.length} processed (${productsCreated} created, ${productsSkipped} skipped)`
      )
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
  for (let i = 0; i < csvProducts.length; i++) {
    const csvProduct = csvProducts[i]
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

    if ((i + 1) % 20 === 0 || i === csvProducts.length - 1) {
      console.log(
        `📊 Collections progress: ${i + 1}/${csvProducts.length} checked, ${collectionAssociations} associations created`
      )
    }
  }

  console.log(`✅ Added ${collectionAssociations} products to collections`)

  // Mark a handful of notable products as featured so the storefront has examples
  // of featured products for UI/marketing sections.
  const featuredSlugs = ["peonies", "sunflower", "hydrangea", "ranunculus-butterfly"]

  const featuredResult = await prisma.product.updateMany({
    where: { slug: { in: featuredSlugs } },
    data: { featured: true },
  })

  console.log(
    `⭐ Marked ${featuredResult.count ?? 0} products as featured: ${featuredSlugs.join(", ")}`
  )

  // Mark featured collections: Flowers, Fillers, and Exotic Blooms
  const featuredCollectionSlugs = ["flowers", "fillers", "exotic-blooms"]

  const featuredCollectionsResult = await prisma.collection.updateMany({
    where: { slug: { in: featuredCollectionSlugs } },
    data: { featured: true },
  })

  console.log(
    `⭐ Marked ${featuredCollectionsResult.count ?? 0} collections as featured: ${featuredCollectionSlugs.join(", ")}`
  )

  // Add some products to Exotic Blooms collection
  const exoticBlooms = await prisma.collection.findUnique({
    where: { slug: "exotic-blooms" },
  })

  if (exoticBlooms) {
    // Add a selection of products to Exotic Blooms
    const exoticBlomsProductSlugs = [
      "peonies",
      "sunflower",
      "hydrangea",
      "ranunculus-butterfly",
      "orchid",
      "protea",
    ]

    for (const productSlug of exoticBlomsProductSlugs) {
      try {
        const product = await prisma.product.findUnique({
          where: { slug: productSlug },
        })

        if (!product) continue

        await prisma.productCollection.upsert({
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
        console.warn(
          `⚠️  Failed to add ${productSlug} to Exotic Blooms: ${(error as Error).message}`
        )
      }
    }

    console.log(`✅ Added products to Exotic Blooms collection`)
  }

  // First create the inspirations without products
  const inspirations = [
    {
      name: "Sunset Romance",
      slug: "sunset-romance",
      subtitle: "Warm hues for evening celebrations",
      image: "/inspiration-images/sunset-romance.png",
      excerpt:
        "A stunning combination of warm peach and amber tones that evoke the magical hour just before dusk. Perfect for evening receptions and intimate celebrations.",
      inspirationText:
        "This arrangement captures the ephemeral beauty of the golden hour—that magical moment when the sun dips toward the horizon and paints the sky in warm, glowing tones. I designed this set for those special occasions where romance and warmth matter most.\n\nThe soft peach flowers serve as the heart of this arrangement, their delicate petals providing a tender focal point. I paired them with generous layers of lush green foliage to create visual depth and movement. This combination works beautifully for intimate evening receptions, anniversary celebrations, and anyone seeking to evoke feelings of warmth and connection.\n\nWhat makes this set special is its versatility—it's equally stunning in a trailing cascade arrangement for a bride, or in a modern hand-tied bouquet for a special dinner. The warm tones photograph beautifully in natural light, making it a favorite choice for event coordinators and wedding planners who understand that the right color palette can transform a moment into a memory.",
    },
    {
      name: "Romantic Elegance",
      slug: "romantic-elegance",
      subtitle: "Timeless pink and white arrangement",
      image: "/inspiration-images/romantic-elegance.png",
      excerpt:
        "A classic combination that exudes sophistication and grace. The soft pink roses paired with lush greenery create an arrangement that transcends trends.",
      inspirationText:
        "Pink has been the color of romance for centuries, and for good reason. There's something universally understood about what soft, blushing pink communicates—love, grace, and timeless beauty. This set celebrates that tradition while remaining entirely modern.\n\nI chose pink roses as the focal flowers because they possess an incredible range of tonal variation from champagne to deep mauve, giving florists the flexibility to create arrangements that feel fresh and contemporary. The generous green foliage creates visual balance without overwhelming the delicate pink tones, allowing the roses to command attention.\n\nThis is the set I recommend for couples who are planning weddings, anniversaries, or romantic gestures that need to feel effortless and elegant. It works beautifully in hand-tied bouquets, tall vase arrangements, and installation work. Many of my pro florist clients tell me they reach for this set repeatedly because it's foolproof—it looks beautiful in any quantity, at any scale, and in any design style from romantic to modern minimalist.",
    },
    {
      name: "Pure Serenity",
      slug: "pure-serenity",
      subtitle: "Pristine white and green sanctuary",
      image: "/inspiration-images/pure-serenity.png",
      excerpt:
        "Simplicity meets sophistication in this minimalist arrangement. The pristine white blooms paired with lush greenery create a calming, elegant presence.",
      inspirationText:
        "There's profound elegance in simplicity. In a world of endless options and visual noise, white flowers offer something increasingly rare—calm, clarity, and understated luxury. This set was created for everyone who believes that less is more.\n\nPlaya Blanca white flowers form the pure, uncluttered heart of this arrangement. Their pristine petals almost glow against the rich green foliage, creating a sophisticated contrast that feels both modern and timeless. There's a reason white arrangements appear at the most exclusive events—they communicate refinement and intention.\n\nThis set appeals to contemporary designers creating Instagram-worthy installations, modern couples planning minimalist weddings, and anyone working in spaces with clean architecture and neutral palettes. The white blooms won't compete with your interior design—they'll elevate it. I've seen this set used in corporate lobbies, high-end retail spaces, and intimate home celebrations where the focus needs to remain on the moment, not the arrangement itself.",
    },
    {
      name: "Lush Garden",
      slug: "lush-garden",
      subtitle: "Abundant greenery with vibrant accents",
      image: "/inspiration-images/lush-garden.png",
      excerpt:
        "Nature's bounty meets artful arrangement. This set celebrates the beauty of layered textures and verdant tones for creating immersive botanical spaces.",
      inspirationText:
        "Sometimes the most beautiful arrangements aren't about one stunning focal flower—they're about texture, depth, and the quiet beauty of foliage done right. This set celebrates greenery as the star, not the supporting player.\n\nGreen is having a moment in design, and for good reason. It's calming, it's sophisticated, and it works in virtually every space. I developed this set for designers and florists who understand that lush, layered greenery can create an installation that feels like stepping into a secret garden.\n\nThis is my go-to recommendation for large-scale corporate events, hotel installations, and anyone creating a living, breathing backdrop. The abundant green foliage serves as a perfect base for clients who want to add their own focal flowers, or it stands beautifully on its own for those who appreciate organic abundance. Event designers love this set because it's forgiving—scale it up for drama, scale it down for intimacy, and it always looks intentional and professional.",
    },
    {
      name: "Blush Bride",
      slug: "blush-bride",
      subtitle: "Soft, romantic wedding palette",
      image: "/inspiration-images/blush-bride.png",
      excerpt:
        "Gentle peachy-pink tones create a modern, romantic aesthetic perfect for weddings and celebrations that radiate warmth and tenderness.",
      inspirationText:
        "The blush-to-peach color gradient is the wedding palette of the moment, and I created this set for brides and planners who want that soft, romantic energy without feeling overdone. These are the colors of sunrise, of garden roses at their peak, of natural beauty rather than artificial perfection.\n\nThis combination works beautifully because the peachy and blush tones sit in that perfect zone between traditional and contemporary—it appeals to classic brides while feeling fresh and current. The soft hues photograph extraordinarily well in warm, golden hour light, which is exactly when most wedding ceremonies and receptions take place.\n\nI recommend this set for bridal bouquets, ceremony installations, and reception centerpieces. Wedding planners tell me this palette makes everything feel elevated and intentional without requiring elaborate design work—the colors do the heavy lifting. It's also forgiving for mixed-tone arrangements, which means your florist team can move quickly while maintaining visual cohesion.",
    },
    {
      name: "Verdant Oasis",
      slug: "verdant-oasis",
      subtitle: "Tropical-inspired green sanctuary",
      image: "/inspiration-images/verdant-oasis.png",
      excerpt:
        "Rich, layered greenery creates a lush tropical feeling perfect for creating immersive botanical experiences and dramatic installations.",
      inspirationText:
        "Green floristry is where creativity meets sustainability, and this set celebrates the incredible range of textures and tones that foliage offers. When designed thoughtfully, an all-green arrangement can feel more luxurious than any colorful alternative—it's the work of a confident designer.\n\nThe 'Verdant Oasis' set was created for florists and designers who understand that green isn't neutral—it's powerful. Different shades of green create visual depth, movement, and sophistication. This is the palette for creating jungle walls, botanical installations, and any project where you want clients to feel transported.\n\nI particularly love this set for corporate events, hotel renovations, and restaurant installations where the greenery needs to complement rather than compete. It also works beautifully as a base for mixed-flower arrangements where you're adding specialty blooms. Many of my most celebrated installations have started with this foundational green palette—it's the canvas that allows everything else to shine.",
    },
    {
      name: "Classic Bouquet",
      slug: "classic-bouquet",
      subtitle: "Timeless pink roses and greenery",
      image: "/inspiration-images/classic-bouquet.png",
      excerpt:
        "The bouquet that never goes out of style. Pink roses have graced celebrations for generations—this set honors that tradition while staying utterly contemporary.",
      inspirationText:
        "Some arrangements become iconic because they simply work. Pink roses with lush green foliage is the foundation of countless beautiful moments—proposals, anniversaries, apologies, celebrations. There's wisdom in classics.\n\nWhat makes this set special isn't innovation—it's execution. I've carefully selected pink rose varieties that offer color variation and natural beauty, paired with generous greenery that supports without overshadowing. This is the set that works equally well as a surprise bouquet from the grocery store or as the focal point of a $5,000 wedding installation.\n\nFor florists, this is your workhorse set. It requires minimal training to execute beautifully, it's cost-effective, and your customers will recognize and love it immediately. For event professionals, this palette is your safety net—you literally cannot go wrong. I've used versions of this combination in some of my most acclaimed events because I know it will always read beautifully, always feel intentional, and always make people smile when they see it.",
    },
    {
      name: "Modern Minimal",
      slug: "modern-minimal",
      subtitle: "Contemporary white and green design",
      image: "/inspiration-images/modern-minimal.png",
      excerpt:
        "Clean lines, intentional design. This palette is for spaces and moments that demand sophistication through restraint.",
      inspirationText:
        "Minimalism in design isn't about doing less—it's about intentionality. Every element serves a purpose. This set was created for designers and individuals who understand that a carefully chosen arrangement can be more powerful than an explosion of color.\n\nWhite flowers against rich green foliage creates a striking visual contrast that feels both modern and timeless. There's a reason high-end interior designers and luxury brands reach for this palette—it reads as refined, expensive, and intentional. White flowers aren't common in nature in the same abundance as colored flowers, which gives arrangements a curated, exclusive feeling.\n\nUse this set for minimalist weddings, high-end hospitality installations, and any space where architecture and design matter more than florals. It pairs beautifully with contemporary interiors, scandinavian aesthetics, and modern luxury. This is the set that makes people pause and look twice—not because of busy colors, but because of the quiet confidence of the design.",
    },
    {
      name: "Warm Celebratory",
      slug: "warm-celebratory",
      subtitle: "Joyful peach and green combination",
      image: "/inspiration-images/warm-celebratory.png",
      excerpt:
        "Celebration colors that feel welcoming and genuine. This palette radiates warmth and joy without demanding attention.",
      inspirationText:
        "Not all celebrations require drama—some require warmth. Peach is the color of happiness without the intensity of bright orange, of celebration without the formality of red, of joy that feels accessible and genuine.\n\nI created this set for anyone planning gatherings where people matter more than perfection. Birthday parties where the focus is on laughter. Anniversary celebrations that need to feel both special and relaxed. Baby showers and baby announcements that feel joyful rather than trendy. The warm peachy tones naturally complement skin tones and natural light, making them perfect for events where photography and people interaction matter more than design drama.\n\nWhat I love about this palette is its approachability. Unlike some of the more sophisticated color combinations, warm peach and green says 'welcome, relax, celebrate.' For event planners managing multiple celebrations, this is the set that works for the casual engagement party, the backyard anniversary, the family gathering. It's the set that makes grandmothers smile and young people take great photos. It's the definition of reliably beautiful.",
    },
  ]

  for (const inspiration of inspirations) {
    await prisma.inspiration.upsert({
      create: inspiration,
      where: { slug: inspiration.slug },
      update: inspiration,
    })
  }
  console.log(`✅ Created/updated ${inspirations.length} inspirations`)

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

  const heroBanners = [
    {
      name: "Main Home Hero",
      slug: "main-hero",
      title: "Premium Wholesale Flowers for Creative Professionals",
      subtitle:
        "Partner with Peak Blooms for the highest quality, freshest flowers. Competitive wholesale pricing, sustainable sourcing, and reliable local delivery—built for florists, retailers, and event planners.",
      ctaText: "Browse Catalog",
      ctaLink: "/shop",
      backgroundType: "IMAGE" as HeroBackgroundType,
      backgroundImage: "/hero-images/welcome.png",
      slotPosition: 1,
      textPosition: "left",
    },
    {
      name: "Boxlot CTA",
      slug: "boxlot-hero",
      title: "Bulk Solutions for Large-Scale Success",
      subtitle:
        "Access premium boxlots at wholesale pricing. Perfect for weddings, installations, and events—quality you trust, pricing that works, service that partners with your vision.",
      ctaText: "Explore Boxlots",
      ctaLink: "/shop?boxlotOnly=true",
      backgroundType: "IMAGE" as HeroBackgroundType,
      backgroundImage: "/hero-images/boxlots.png",
      slotPosition: 2,
      textPosition: "right",
    },
    {
      name: "Boxlot hero center",
      slug: "boxlot-hero-center",
      title: "Reliable, Efficient Wholesale Solutions",
      subtitle:
        "We're committed to exceptional service, sustainable sourcing, and timely delivery. Your success is our mission—connect the world through the beauty of flowers with Peak Blooms.",
      ctaText: "Start Shopping",
      ctaLink: "/shop?boxlotOnly=true",
      backgroundType: "IMAGE" as HeroBackgroundType,
      backgroundImage: "/hero-images/boxlot2.png",
      slotPosition: 3,
      textPosition: "center",
    },
  ]

  for (const banner of heroBanners) {
    await prisma.heroBanner.upsert({
      where: { slug: banner.slug },
      update: banner,
      create: banner,
    })
  }

  console.log(`✅ Hero banners seeded/updated: ${heroBanners.map((b) => b.slug).join(", ")}`)

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
