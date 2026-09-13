import { sql } from "drizzle-orm";
import { db, pool } from "./client.js";
import { categories } from "./schema/categories.js";
import { products } from "./schema/products.js";
import { productVariants } from "./schema/product_variants.js";
import { FIXED_CATEGORIES } from "@swami/shared";

async function seed() {
  console.log("🌱 Starting database seed...");

  // 1. Enable pg_trgm extension
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
  console.log("✅ pg_trgm extension verified");

  // 2. Seed 10 fixed categories
  console.log("📁 Seeding 10 fixed categories...");
  for (const cat of FIXED_CATEGORIES) {
    await db
      .insert(categories)
      .values({
        name: cat.name,
        slug: cat.slug,
        hindiName: cat.hindiName,
        displayOrder: cat.displayOrder,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: categories.slug,
        set: {
          name: cat.name,
          hindiName: cat.hindiName,
          displayOrder: cat.displayOrder,
        },
      });
  }
  console.log("✅ 10 categories seeded");

  // 3. Seed sample products with variants if none exist
  const existingProducts = await db.select({ id: products.id }).from(products).limit(1);
  if (existingProducts.length === 0) {
    console.log("🛒 Seeding initial products & variants...");
    const allCategories = await db.select().from(categories);
    const catMap = new Map(allCategories.map((c) => [c.slug, c.id]));

    const sampleProducts = [
      {
        categorySlug: "rice-flour-pulses",
        name: "Aashirvaad Shudh Chakki Atta",
        slug: "aashirvaad-shudh-chakki-atta",
        hindiName: "आशीर्वाद शुद्ध चक्की आटा",
        searchKeywords: "aata atta wheat flour aashirwad chakki",
        description: "100% pure whole wheat flour processed with traditional stone-ground chakki technology.",
        status: "ACTIVE" as const,
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
        variants: [
          { unit: "5 kg", mrp: "260.00", sellingPrice: "235.00", currentStock: 40 },
          { unit: "10 kg", mrp: "490.00", sellingPrice: "445.00", currentStock: 25 },
        ],
      },
      {
        categorySlug: "rice-flour-pulses",
        name: "India Gate Basmati Rice Feast",
        slug: "india-gate-basmati-rice-feast",
        hindiName: "इंडिया गेट बासमती चावल",
        searchKeywords: "chawal rice basmati feast india gate biryani",
        description: "Aromatic long grain basmati rice ideal for everyday feast and pulao.",
        status: "ACTIVE" as const,
        imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
        variants: [
          { unit: "1 kg", mrp: "140.00", sellingPrice: "115.00", currentStock: 30 },
          { unit: "5 kg", mrp: "650.00", sellingPrice: "560.00", currentStock: 15 },
        ],
      },
      {
        categorySlug: "oil-spices-masalas",
        name: "Fortune Kachi Ghani Pure Mustard Oil",
        slug: "fortune-kachi-ghani-mustard-oil",
        hindiName: "फॉर्च्यून कच्ची घानी सरसों का तेल",
        searchKeywords: "tel sarso oil mustard kachi ghani fortune",
        description: "Naturally pungent traditional cold pressed mustard oil for rich aroma and authentic flavor.",
        status: "ACTIVE" as const,
        imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
        variants: [
          { unit: "1 L Pouch", mrp: "165.00", sellingPrice: "142.00", currentStock: 50 },
          { unit: "1 L Bottle", mrp: "175.00", sellingPrice: "152.00", currentStock: 35 },
          { unit: "5 L Can", mrp: "850.00", sellingPrice: "740.00", currentStock: 10 },
        ],
      },
      {
        categorySlug: "oil-spices-masalas",
        name: "Tata Salt Vacuum Evaporated Iodised",
        slug: "tata-salt-iodised",
        hindiName: "टाटा नमक आयोडाइज्ड",
        searchKeywords: "namak salt tata iodised iodized",
        description: "Desh ka namak - vacuum evaporated iodized salt for everyday cooking.",
        status: "ACTIVE" as const,
        imageUrl: "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&auto=format&fit=crop&q=80",
        variants: [
          { unit: "1 kg", mrp: "28.00", sellingPrice: "26.00", currentStock: 100 },
        ],
      },
      {
        categorySlug: "beverages-cold-drinks",
        name: "Tata Tea Premium Desh Ki Chai",
        slug: "tata-tea-premium",
        hindiName: "टाटा टी प्रीमियम चाय पत्ती",
        searchKeywords: "chai tea patti tata premium desh ki chai",
        description: "Unique blend of big tea leaves for aroma and small tea grains for strength.",
        status: "ACTIVE" as const,
        imageUrl: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80",
        variants: [
          { unit: "250 g", mrp: "140.00", sellingPrice: "125.00", currentStock: 45 },
          { unit: "500 g", mrp: "270.00", sellingPrice: "240.00", currentStock: 30 },
          { unit: "1 kg", mrp: "520.00", sellingPrice: "460.00", currentStock: 20 },
        ],
      },
      {
        categorySlug: "biscuits-snacks",
        name: "Parle-G Original Glucose Biscuits",
        slug: "parle-g-biscuits",
        hindiName: "पारले-जी ग्लूकोज बिस्कुट",
        searchKeywords: "biscuit biskut parle g glucose chai snacks",
        description: "The world's largest selling biscuit, filled with the goodness of milk and wheat.",
        status: "ACTIVE" as const,
        imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80",
        variants: [
          { unit: "250 g Pack", mrp: "25.00", sellingPrice: "24.00", currentStock: 80 },
          { unit: "800 g Family Pack", mrp: "80.00", sellingPrice: "72.00", currentStock: 40 },
        ],
      },
      {
        categorySlug: "daily-essentials",
        name: "Madhur Pure & Hygienic Sugar",
        slug: "madhur-sugar",
        hindiName: "मधुर शुद्ध चीनी",
        searchKeywords: "chini cheeni sugar madhur shudh",
        description: "100% sulphur-free refined pure crystal sugar.",
        status: "ACTIVE" as const,
        imageUrl: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=600&auto=format&fit=crop&q=80",
        variants: [
          { unit: "1 kg", mrp: "55.00", sellingPrice: "48.00", currentStock: 60 },
          { unit: "5 kg", mrp: "270.00", sellingPrice: "235.00", currentStock: 25 },
        ],
      },
      {
        categorySlug: "home-cleaning-products",
        name: "Surf Excel Quick Wash Detergent Powder",
        slug: "surf-excel-quick-wash-powder",
        hindiName: "सर्फ एक्सेल डिटर्जेंट पाउडर",
        searchKeywords: "surf excel powder kapda dhone wala detergent surf",
        description: "Removes tough stains easily in the wash.",
        status: "ACTIVE" as const,
        imageUrl: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80",
        variants: [
          { unit: "1 kg", mrp: "155.00", sellingPrice: "138.00", currentStock: 35 },
          { unit: "2 kg", mrp: "305.00", sellingPrice: "275.00", currentStock: 20 },
        ],
      },
    ];

    for (const prod of sampleProducts) {
      const categoryId = catMap.get(prod.categorySlug);
      if (!categoryId) continue;

      const [insertedProduct] = await db
        .insert(products)
        .values({
          categoryId,
          name: prod.name,
          slug: prod.slug,
          hindiName: prod.hindiName,
          searchKeywords: prod.searchKeywords,
          description: prod.description,
          status: prod.status,
          imageUrl: prod.imageUrl,
          images: [prod.imageUrl],
        })
        .returning();

      for (const variant of prod.variants) {
        await db.insert(productVariants).values({
          productId: insertedProduct.id,
          unit: variant.unit,
          mrp: variant.mrp,
          sellingPrice: variant.sellingPrice,
          currentStock: variant.currentStock,
          minStockAlert: 5,
          isActive: true,
        });
      }
    }
    console.log("✅ Sample products & variants seeded");
  }

  console.log("🎉 Seed finished successfully!");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  pool.end();
  process.exit(1);
});
