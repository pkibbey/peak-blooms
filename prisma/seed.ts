import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { PrismaClient } from "../src/generated/client"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined")
}

console.log("Connecting to database...")
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌸 Seeding database with collections and products...")

  // Clear existing data (optional, remove if you want to preserve existing data)
  await prisma.orderItem.deleteMany({})
  await prisma.cartItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.shoppingCart.deleteMany({})
  await prisma.productVariant.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.collection.deleteMany({})
  await prisma.inspiration.deleteMany({})

  // Create collections
  const classicRoses = await prisma.collection.create({
    data: {
      name: "Classic Roses",
      slug: "classic-roses",
      image: "/categories/classic-roses.png",
      description:
        "Timeless elegance and beauty in every bloom. Our classic rose collection features the most beloved varieties, perfect for traditional arrangements and timeless celebrations.",
    },
  })

  const exoticBlooms = await prisma.collection.create({
    data: {
      name: "Exotic Blooms",
      slug: "exotic-blooms",
      image: "/categories/exotic-blooms.png",
      description:
        "Bold and vibrant arrangements that bring drama and sophistication to any space. Discover unique textures and rich colors from around the world.",
    },
  })

  const seasonalWildflowers = await prisma.collection.create({
    data: {
      name: "Seasonal Wildflowers",
      slug: "seasonal-wildflowers",
      image: "/categories/seasonal-wildflowers.png",
      description:
        "Nature's finest seasonal selections capturing the essence of each time of year. Fresh, vibrant, and sustainably sourced for maximum impact.",
    },
  })

  // Create products
  await prisma.product.create({
    data: {
      name: "Green Fluffy",
      slug: "green-fluffy",
      description: "Lush and voluminous",
      image: "/products/green-fluffy.jpg",
      collectionId: exoticBlooms.id,
      featured: true,
      variants: {
        create: [
          { price: 65.0, stemLength: 45, countPerBunch: 8 },
          { price: 75.0, stemLength: 55, countPerBunch: 8 },
          { price: 120.0, stemLength: 45, countPerBunch: 16 },
        ],
      },
    },
  })

  await prisma.product.create({
    data: {
      name: "Peach Flower",
      slug: "peach-flower",
      description: "Warm and inviting",
      image: "/products/peach-flower.jpg",
      collectionId: exoticBlooms.id,
      featured: true,
      variants: {
        create: [
          { price: 55.0, stemLength: 40, countPerBunch: 6 },
          { price: 65.0, stemLength: 50, countPerBunch: 6 },
        ],
      },
    },
  })

  await prisma.product.create({
    data: {
      name: "Pink Rose",
      slug: "pink-rose",
      description: "Elegant and romantic",
      image: "/products/pink-rose.jpg",
      collectionId: classicRoses.id,
      featured: false,
      variants: {
        create: [
          { price: 75.0, stemLength: 50, countPerBunch: 5 },
          { price: 90.0, stemLength: 60, countPerBunch: 5 },
          { price: 140.0, stemLength: 50, countPerBunch: 10 },
        ],
      },
    },
  })

  await prisma.product.create({
    data: {
      name: "Playa Blanca",
      slug: "playa-blanca",
      description: "Pristine white beauty",
      image: "/products/playa-blanca.jpg",
      collectionId: seasonalWildflowers.id,
      featured: false,
      variants: {
        create: [
          { price: 45.0, stemLength: 35, countPerBunch: 10 },
          { price: 55.0, stemLength: 45, countPerBunch: 10 },
        ],
      },
    },
  })

  console.log("✨ Creating inspirations...")

  // First create the inspirations without products
  const sunsetRomance = await prisma.inspiration.create({
    data: {
      name: "Sunset Romance",
      slug: "sunset-romance",
      subtitle: "Warm hues for evening celebrations",
      image: "/inspiration/sunset-romance.png",
      excerpt:
        "A stunning combination of warm peach and amber tones that evoke the magical hour just before dusk. Perfect for evening receptions and intimate celebrations.",
      inspirationText:
        "This arrangement draws inspiration from the golden hour's fleeting beauty. I combined soft peach flowers with deeper amber accents to create depth and warmth. The voluminous textures balance the delicate blooms, making this set ideal for florists seeking to create memorable moments at sunset celebrations.",
    },
  })

  const romanticElegance = await prisma.inspiration.create({
    data: {
      name: "Romantic Elegance",
      slug: "romantic-elegance",
      subtitle: "Timeless pink and white arrangement",
      image: "/inspiration/romantic-elegance.png",
      excerpt:
        "A classic combination that exudes sophistication and grace. The soft pink roses paired with lush greenery create an arrangement that transcends trends.",
      inspirationText:
        "Inspired by classic wedding aesthetics, I curated this set to appeal to traditionalists while maintaining modern elegance. The pink roses provide focal depth, while the abundant green creates visual balance. This set works beautifully for both intimate and grand celebrations, offering versatility for florists managing diverse client needs.",
    },
  })

  const pureSerenity = await prisma.inspiration.create({
    data: {
      name: "Pure Serenity",
      slug: "pure-serenity",
      subtitle: "Pristine white and green sanctuary",
      image: "/inspiration/pure-serenity.png",
      excerpt:
        "Simplicity meets sophistication in this minimalist arrangement. The pristine white blooms paired with lush greenery create a calming, elegant presence.",
      inspirationText:
        "This set embodies the belief that less is often more. The pure white flowers demand attention without noise, creating a serene focal point. Paired with generous green elements, it speaks to clients seeking understated luxury. Perfect for modern minimalist spaces and those who appreciate refined simplicity.",
    },
  })

  const lushGarden = await prisma.inspiration.create({
    data: {
      name: "Lush Garden",
      slug: "lush-garden",
      subtitle: "Abundant greenery with vibrant accents",
      image: "/inspiration/lush-garden.png",
      excerpt:
        "Nature's bounty meets artful arrangement. This set celebrates the beauty of layered textures and verdant tones for creating immersive botanical spaces.",
      inspirationText:
        "I created this set for designers seeking volume and texture-rich arrangements. The primary focus on lush greenery provides an excellent base for clients who prefer to add their own focal flowers, or stands beautifully on its own for those appreciating organic abundance. It's perfect for installations and large-scale projects.",
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
    })
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
