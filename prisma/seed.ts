import { PrismaClient } from "../src/generated/client";
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

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
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  // Create categories
  const classicRoses = await prisma.category.create({
    data: {
      name: "Classic Roses",
      slug: "classic-roses",
      image: "/featured-categories/classic-roses.png",
    },
  });

  const exoticBlooms = await prisma.category.create({
    data: {
      name: "Exotic Blooms",
      slug: "exotic-blooms",
      image: "/featured-categories/exotic-blooms.png",
    },
  });

  const seasonalWildflowers = await prisma.category.create({
    data: {
      name: "Seasonal Wildflowers",
      slug: "seasonal-wildflowers",
      image: "/featured-categories/seasonal-wildflowers.png",
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
