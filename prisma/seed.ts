import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import {
  MetricType,
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

// Helper function to post metrics to the API
async function captureMetric(type: MetricType, name: string, duration: number): Promise<void> {
  // Skip metrics if they are not enabled
  if (process.env.ENABLE_METRICS !== "true") return

  try {
    // Use localhost:3000 for local development
    const response = await fetch("http://localhost:3000/api/admin/metrics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, name, duration }),
    })

    if (!response.ok) {
      console.warn(`⚠️  Failed to post metric "${name}": ${response.status} ${response.statusText}`)
    }
  } catch (_error) {
    // Silently fail - don't block seed script if metrics API is unavailable
  }
}

async function main() {
  console.log("🌸 Seeding database with users, inspirations, and orders...")

  // Wrap entire seed in a transaction for atomicity with reasonable timeout
  // Non-product operations execute quickly (~1-2 seconds)
  return await prisma.$transaction(
    async (tx) => {
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
          email: "peakbloomssd@gmail.com",
          name: "Peak Blooms Admin",
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

      // Batch upsert users using individual upserts within transaction
      const start_users = performance.now()
      for (const user of testUsers) {
        const createdUser = await tx.user.upsert({
          create: user,
          where: { email: user.email },
          update: user,
        })
        if (user.email === "customer@peakblooms.com") {
          approvedCustomer = createdUser
        }
      }
      await captureMetric(MetricType.SEED, "batch create users", performance.now() - start_users)
      console.log(`✅ Created/updated ${testUsers.length} test users`)

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
        const start_upsertInspiration = performance.now()
        await tx.inspiration.upsert({
          create: inspiration,
          where: { slug: inspiration.slug },
          update: inspiration,
        })
        await captureMetric(
          MetricType.SEED,
          `upsert inspiration`,
          performance.now() - start_upsertInspiration
        )
      }
      console.log(`✅ Created/updated ${inspirations.length} inspirations`)

      // Create the inspiration product associations with variants
      console.log("🎨 Adding products to inspirations...")

      // Define inspiration-product associations upfront for batching
      const inspirationProductAssociations: Array<{
        inspirationSlug: string
        productSlug: string
        quantity: number
      }> = [
        // Add products to Sunset Romance (peach, orange, warm colors)
        { inspirationSlug: "sunset-romance", productSlug: "alstromeria", quantity: 3 },
        { inspirationSlug: "sunset-romance", productSlug: "cosmos", quantity: 2 },
        { inspirationSlug: "sunset-romance", productSlug: "bird-of-paradise", quantity: 2 },
        { inspirationSlug: "sunset-romance", productSlug: "cremone-fall-color", quantity: 2 },

        // Add products to Romantic Elegance (pink and rose)
        { inspirationSlug: "romantic-elegance", productSlug: "50-cm-ecuadorian", quantity: 3 },
        { inspirationSlug: "romantic-elegance", productSlug: "60-cm-ecuadorian", quantity: 2 },
        { inspirationSlug: "romantic-elegance", productSlug: "carnation", quantity: 2 },

        // Add products to Pure Serenity (white blooms)
        { inspirationSlug: "pure-serenity", productSlug: "calla-lily", quantity: 3 },
        { inspirationSlug: "pure-serenity", productSlug: "anemone", quantity: 2 },

        // Add products to Lush Garden (greenery and texture)
        { inspirationSlug: "lush-garden", productSlug: "astrantia", quantity: 3 },
        { inspirationSlug: "lush-garden", productSlug: "cremone", quantity: 2 },

        // Add products to Blush Bride (peachy-pink wedding palette)
        { inspirationSlug: "blush-bride", productSlug: "alstromeria", quantity: 2 },
        { inspirationSlug: "blush-bride", productSlug: "carnation-mini", quantity: 3 },
        { inspirationSlug: "blush-bride", productSlug: "dahlia", quantity: 2 },

        // Add products to Verdant Oasis (tropical greenery)
        { inspirationSlug: "verdant-oasis", productSlug: "delphinium", quantity: 2 },
        { inspirationSlug: "verdant-oasis", productSlug: "cremone", quantity: 3 },

        // Add products to Classic Bouquet (pink roses with greenery)
        { inspirationSlug: "classic-bouquet", productSlug: "50-cm-ecuadorian", quantity: 5 },
        { inspirationSlug: "classic-bouquet", productSlug: "carnation", quantity: 3 },

        // Add products to Modern Minimal (white and clean)
        { inspirationSlug: "modern-minimal", productSlug: "calla-lily", quantity: 4 },
        { inspirationSlug: "modern-minimal", productSlug: "anemone", quantity: 2 },

        // Add products to Warm Celebratory (peach and festive)
        { inspirationSlug: "warm-celebratory", productSlug: "cosmos", quantity: 3 },
        { inspirationSlug: "warm-celebratory", productSlug: "aster-serenade", quantity: 2 },
        { inspirationSlug: "warm-celebratory", productSlug: "carnation-mini", quantity: 2 },
      ]

      // Batch fetch all needed inspirations and products
      const start_fetchInspirationData = performance.now()
      const allInspirations = await tx.inspiration.findMany({
        where: {
          slug: {
            in: Array.from(new Set(inspirationProductAssociations.map((a) => a.inspirationSlug))),
          },
        },
        select: { id: true, slug: true },
      })
      const allProductsForInspiration = await tx.product.findMany({
        where: {
          slug: {
            in: Array.from(new Set(inspirationProductAssociations.map((a) => a.productSlug))),
          },
        },
        select: { id: true, slug: true },
      })

      // Also fetch the first variant for each product (grouped by productId)
      const productVariants = await tx.productVariant.findMany({
        where: { productId: { in: allProductsForInspiration.map((p) => p.id) } },
        select: { id: true, productId: true },
        distinct: ["productId"],
        take: allProductsForInspiration.length,
      })

      await captureMetric(
        MetricType.SEED,
        "batch fetch inspiration and product data",
        performance.now() - start_fetchInspirationData
      )

      // Create maps for O(1) lookups
      const inspirationMap = new Map(allInspirations.map((i) => [i.slug, i.id]))
      const productMap = new Map(allProductsForInspiration.map((p) => [p.slug, p.id]))
      const variantByProductId = new Map(productVariants.map((v) => [v.productId, v.id]))

      // Batch upsert all inspiration-product associations
      const start_upsertInspirationProducts = performance.now()
      for (const assoc of inspirationProductAssociations) {
        try {
          const inspirationId = inspirationMap.get(assoc.inspirationSlug)
          const productId = productMap.get(assoc.productSlug)
          const variantId = productId ? variantByProductId.get(productId) : undefined

          if (!inspirationId || !productId || !variantId) continue

          await tx.inspirationProduct.upsert({
            where: {
              inspirationId_productId: {
                inspirationId: inspirationId,
                productId: productId,
              },
            },
            create: {
              inspirationId: inspirationId,
              productId: productId,
              productVariantId: variantId,
              quantity: assoc.quantity,
            },
            update: {
              quantity: assoc.quantity,
            },
          })
        } catch (error) {
          console.warn(
            `⚠️  Failed to add ${assoc.productSlug} to ${assoc.inspirationSlug}: ${(error as Error).message}`
          )
        }
      }
      await captureMetric(
        MetricType.SEED,
        "batch upsert inspiration products",
        performance.now() - start_upsertInspirationProducts
      )

      console.log("✅ Added products to inspirations")

      // Create sample orders for the approved customer
      // Reset existing orders first so seeding is idempotent and deterministic
      if (approvedCustomer) {
        const start_resetOrders = performance.now()
        // Delete all orders (order items will be cascaded)
        await tx.order.deleteMany({})
        await captureMetric(MetricType.SEED, "reset orders", performance.now() - start_resetOrders)

        // Get the first 3 available product variants to use in sample orders
        const start_findVariants = performance.now()
        const firstThreeVariants = await tx.productVariant.findMany({
          take: 3,
        })
        await captureMetric(
          MetricType.SEED,
          "find first 3 product variants",
          performance.now() - start_findVariants
        )

        const [variantA, variantB, variantC] = firstThreeVariants

        // Create both shipping addresses in parallel
        const start_createAddresses = performance.now()
        const [shippingAddress1, shippingAddress2] = await Promise.all([
          tx.address.create({
            data: {
              firstName: "Test",
              lastName: "Customer",
              company: "Test Florist",
              street1: "123 Flower Lane",
              city: "Portland",
              state: "OR",
              zip: "97201",
              country: "USA",
              isDefault: true,
            },
          }),
          tx.address.create({
            data: {
              firstName: "Test",
              lastName: "Customer",
              company: "Local Flowers",
              street1: "456 Rose Garden Ln",
              city: "Seattle",
              state: "WA",
              zip: "98101",
              country: "USA",
              isDefault: false,
            },
          }),
        ])
        await captureMetric(
          MetricType.SEED,
          "create shipping addresses",
          performance.now() - start_createAddresses
        )

        // Create first order (completed order from 30 days ago)
        const order1Date = new Date()
        order1Date.setDate(order1Date.getDate() - 30)

        const order1Total =
          (variantA ? variantA.price * 2 : 0) + (variantB ? variantB.price * 1 : 0)

        const order1 = await tx.order.create({
          data: {
            orderNumber: `ORD-${Date.now()}-1`,
            userId: approvedCustomer.id,
            email: approvedCustomer.email,
            status: "DELIVERED",
            total: order1Total,
            createdAt: order1Date,
            shippingAddressId: shippingAddress1.id,
            items: {
              create: [
                variantA
                  ? {
                      productId: variantA.productId,
                      productVariantId: variantA.id,
                      quantity: 2,
                      price: variantA.price,
                    }
                  : undefined,
                variantB
                  ? {
                      productId: variantB.productId,
                      productVariantId: variantB.id,
                      quantity: 1,
                      price: variantB.price,
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

        const order2Total =
          (variantA ? variantA.price * 1 : 0) +
          (variantB ? variantB.price * 2 : 0) +
          (variantC ? variantC.price * 1 : 0)

        const order2 = await tx.order.create({
          data: {
            orderNumber: `ORD-${Date.now()}-2`,
            userId: approvedCustomer.id,
            email: approvedCustomer.email,
            status: "CONFIRMED",
            total: order2Total,
            createdAt: order2Date,
            shippingAddressId: shippingAddress2.id,
            items: {
              create: [
                variantA
                  ? {
                      productId: variantA.productId,
                      productVariantId: variantA.id,
                      quantity: 1,
                      price: variantA.price,
                    }
                  : undefined,
                variantB
                  ? {
                      productId: variantB.productId,
                      productVariantId: variantB.id,
                      quantity: 2,
                      price: variantB.price,
                    }
                  : undefined,
                variantC
                  ? {
                      productId: variantC.productId,
                      productVariantId: variantC.id,
                      quantity: 1,
                      price: variantC.price,
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
    },
    {
      // Increase transaction timeout from default 5 seconds to 20 seconds
      // Non-product operations should complete in 1-2 seconds comfortably
      timeout: 20000,
    }
  )
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
