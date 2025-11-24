import { PrismaClient } from "../src/generated/client";
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

console.log("Connecting to database...");
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌸 Seeding database with categories and products...");

  // Clear existing data (optional, remove if you want to preserve existing data)
  await prisma.orderItem.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.shoppingCart.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.inspirationSet.deleteMany({});

  // Create categories
  const classicRoses = await prisma.category.create({
    data: {
      name: "Classic Roses",
      slug: "classic-roses",
      image: "/featured-categories/classic-roses.png",
      description: "Timeless elegance and beauty in every bloom. Our classic rose collection features the most beloved varieties, perfect for traditional arrangements and timeless celebrations.",
    },
  });

  const exoticBlooms = await prisma.category.create({
    data: {
      name: "Exotic Blooms",
      slug: "exotic-blooms",
      image: "/featured-categories/exotic-blooms.png",
      description: "Bold and vibrant arrangements that bring drama and sophistication to any space. Discover unique textures and rich colors from around the world.",
    },
  });

  const seasonalWildflowers = await prisma.category.create({
    data: {
      name: "Seasonal Wildflowers",
      slug: "seasonal-wildflowers",
      image: "/featured-categories/seasonal-wildflowers.png",
      description: "Nature's finest seasonal selections capturing the essence of each time of year. Fresh, vibrant, and sustainably sourced for maximum impact.",
    },
  });

  // Create products
  await prisma.product.create({
    data: {
      name: "Green Fluffy",
      slug: "green-fluffy",
      description: "Lush and voluminous",
      image: "/featured-products/green-fluffy.jpg",
      price: 65.0,
      stemLength: 45,
      countPerBunch: 8,
      categoryId: exoticBlooms.id,
      featured: true,
      variants: {
        create: [
          { price: 65.0, stemLength: 45, countPerBunch: 8 },
          { price: 75.0, stemLength: 55, countPerBunch: 8 },
          { price: 120.0, stemLength: 45, countPerBunch: 16 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Peach Flower",
      slug: "peach-flower",
      description: "Warm and inviting",
      image: "/featured-products/peach-flower.jpg",
      price: 55.0,
      stemLength: 40,
      countPerBunch: 6,
      categoryId: exoticBlooms.id,
      featured: true,
      variants: {
        create: [
          { price: 55.0, stemLength: 40, countPerBunch: 6 },
          { price: 65.0, stemLength: 50, countPerBunch: 6 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Pink Rose",
      slug: "pink-rose",
      description: "Elegant and romantic",
      image: "/featured-products/pink-rose.jpg",
      price: 75.0,
      stemLength: 50,
      countPerBunch: 5,
      categoryId: classicRoses.id,
      featured: false,
      variants: {
        create: [
          { price: 75.0, stemLength: 50, countPerBunch: 5 },
          { price: 90.0, stemLength: 60, countPerBunch: 5 },
          { price: 140.0, stemLength: 50, countPerBunch: 10 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Playa Blanca",
      slug: "playa-blanca",
      description: "Pristine white beauty",
      image: "/featured-products/playa-blanca.jpg",
      price: 45.0,
      stemLength: 35,
      countPerBunch: 10,
      categoryId: seasonalWildflowers.id,
      featured: false,
      variants: {
        create: [
          { price: 45.0, stemLength: 35, countPerBunch: 10 },
          { price: 55.0, stemLength: 45, countPerBunch: 10 },
        ],
      },
    },
  });

  console.log("✨ Creating inspiration sets...");

  await prisma.inspirationSet.create({
    data: {
      name: "Sunset Romance",
      slug: "sunset-romance",
      subtitle: "Warm hues for evening celebrations",
      image: "/featured-products/peach-flower.jpg",
      excerpt:
        "A stunning combination of warm peach and amber tones that evoke the magical hour just before dusk. Perfect for evening receptions and intimate celebrations.",
      inspirationText:
        "This arrangement draws inspiration from the golden hour's fleeting beauty. I combined soft peach flowers with deeper amber accents to create depth and warmth. The voluminous textures balance the delicate blooms, making this set ideal for florists seeking to create memorable moments at sunset celebrations.",
      products: {
        connect: [{ slug: "peach-flower" }, { slug: "green-fluffy" }],
      },
    },
  });

  await prisma.inspirationSet.create({
    data: {
      name: "Romantic Elegance",
      slug: "romantic-elegance",
      subtitle: "Timeless pink and white arrangement",
      image: "/featured-products/pink-rose.jpg",
      excerpt:
        "A classic combination that exudes sophistication and grace. The soft pink roses paired with lush greenery create an arrangement that transcends trends.",
      inspirationText:
        "Inspired by classic wedding aesthetics, I curated this set to appeal to traditionalists while maintaining modern elegance. The pink roses provide focal depth, while the abundant green creates visual balance. This set works beautifully for both intimate and grand celebrations, offering versatility for florists managing diverse client needs.",
      products: {
        connect: [{ slug: "pink-rose" }, { slug: "green-fluffy" }],
      },
    },
  });

  await prisma.inspirationSet.create({
    data: {
      name: "Pure Serenity",
      slug: "pure-serenity",
      subtitle: "Pristine white and green sanctuary",
      image: "/featured-products/playa-blanca.jpg",
      excerpt:
        "Simplicity meets sophistication in this minimalist arrangement. The pristine white blooms paired with lush greenery create a calming, elegant presence.",
      inspirationText:
        "This set embodies the belief that less is often more. The pure white flowers demand attention without noise, creating a serene focal point. Paired with generous green elements, it speaks to clients seeking understated luxury. Perfect for modern minimalist spaces and those who appreciate refined simplicity.",
      products: {
        connect: [{ slug: "playa-blanca" }, { slug: "green-fluffy" }],
      },
    },
  });

  await prisma.inspirationSet.create({
    data: {
      name: "Lush Garden",
      slug: "lush-garden",
      subtitle: "Abundant greenery with vibrant accents",
      image: "/featured-products/green-fluffy.jpg",
      excerpt:
        "Nature's bounty meets artful arrangement. This set celebrates the beauty of layered textures and verdant tones for creating immersive botanical spaces.",
      inspirationText:
        "I created this set for designers seeking volume and texture-rich arrangements. The primary focus on lush greenery provides an excellent base for clients who prefer to add their own focal flowers, or stands beautifully on its own for those appreciating organic abundance. It's perfect for installations and large-scale projects.",
      products: {
        connect: [{ slug: "green-fluffy" }, { slug: "peach-flower" }],
      },
    },
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
