import { sql, eq } from "drizzle-orm";
import { db, pool } from "./client.js";
import { categories } from "./schema/categories.js";
import { products } from "./schema/products.js";
import { productVariants } from "./schema/product_variants.js";
import { deliveryZones } from "./schema/delivery_zones.js";
import { storeSettings } from "./schema/store_settings.js";
import { promotions } from "./schema/promotions.js";
import { promotionTargets } from "./schema/promotion_targets.js";
import { promotionComboComponents } from "./schema/promotion_combo_components.js";
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

  // 3. Seed sample products with variants
  console.log("🛒 Seeding / updating initial products & variants with verified images...");
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
      imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
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
      imageUrl: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&auto=format&fit=crop&q=80",
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
      imageUrl: "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=600&auto=format&fit=crop&q=80",
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
      imageUrl: "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80",
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
      imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
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
      imageUrl: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&auto=format&fit=crop&q=80",
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
      imageUrl: "https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=600&auto=format&fit=crop&q=80",
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
      imageUrl: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=600&auto=format&fit=crop&q=80",
      variants: [
        { unit: "1 kg", mrp: "155.00", sellingPrice: "138.00", currentStock: 35 },
        { unit: "2 kg", mrp: "305.00", sellingPrice: "275.00", currentStock: 20 },
      ],
    },
  ];

  for (const prod of sampleProducts) {
    const categoryId = catMap.get(prod.categorySlug);
    if (!categoryId) continue;

    const [upsertedProduct] = await db
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
      .onConflictDoUpdate({
        target: products.slug,
        set: {
          imageUrl: prod.imageUrl,
          images: [prod.imageUrl],
          description: prod.description,
          searchKeywords: prod.searchKeywords,
          hindiName: prod.hindiName,
        },
      })
      .returning();

    for (const variant of prod.variants) {
      const existingVariants = await db
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(eq(productVariants.productId, upsertedProduct.id))
        .limit(1);

      if (existingVariants.length === 0) {
        await db.insert(productVariants).values({
          productId: upsertedProduct.id,
          unit: variant.unit,
          mrp: variant.mrp,
          sellingPrice: variant.sellingPrice,
          currentStock: variant.currentStock,
          minStockAlert: 5,
          isActive: true,
        });
      }
    }
  }
  console.log("✅ Sample products & variants verified and updated with accurate photos");

  // 4. Seed default delivery zones if none exist
  const existingZones = await db.select({ id: deliveryZones.id }).from(deliveryZones).limit(1);
  if (existingZones.length === 0) {
    console.log("🚚 Seeding default delivery zones...");
    const sampleZones = [
      {
        name: "Usasa & Nearby Villages",
        hindiName: "उसासा एवं नजदीकी गाँव",
        minOrderAmount: "0.00",
        deliveryCharge: "0.00",
        freeDeliveryAboveAmount: null,
        isActive: true,
        displayOrder: 1,
      },
      {
        name: "Ballia Town (Up to 5 km)",
        hindiName: "बलिया शहर (5 किमी तक)",
        minOrderAmount: "200.00",
        deliveryCharge: "30.00",
        freeDeliveryAboveAmount: "500.00",
        isActive: true,
        displayOrder: 2,
      },
      {
        name: "Outer Rural Villages (5-10 km)",
        hindiName: "आसपास के ग्रामीण इलाके (5-10 किमी)",
        minOrderAmount: "400.00",
        deliveryCharge: "50.00",
        freeDeliveryAboveAmount: "800.00",
        isActive: true,
        displayOrder: 3,
      },
    ];

    for (const zone of sampleZones) {
      await db.insert(deliveryZones).values(zone);
    }
    console.log("✅ Default delivery zones seeded");
  }

  // 5. Seed singleton store_settings record (id: 1)
  console.log("🏪 Seeding store settings (id: 1)...");
  await db
    .insert(storeSettings)
    .values({
      id: 1,
      address: "Usasa Bazar, Near Primary School, Ballia, Uttar Pradesh - 277001",
      hindiAddress: "उसासा बाज़ार, प्राथमिक विद्यालय के पास, बलिया, उत्तर प्रदेश - 277001",
      phoneNumber: "918853070705",
      whatsappNumber: "918853070705",
      googleMapsUrl: "https://maps.google.com/?q=Usasa+Ballia+Uttar+Pradesh",
      mapsEmbedUrl: null,
      openingHoursText: "Mon - Sun: 7:00 AM - 9:30 PM (All 7 Days Open)",
      photos: [
        "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
      ],
    })
    .onConflictDoUpdate({
      target: storeSettings.id,
      set: {
        address: "Usasa Bazar, Near Primary School, Ballia, Uttar Pradesh - 277001",
        hindiAddress: "उसासा बाज़ार, प्राथमिक विद्यालय के पास, बलिया, उत्तर प्रदेश - 277001",
        phoneNumber: "918853070705",
        whatsappNumber: "918853070705",
        googleMapsUrl: "https://maps.google.com/?q=Usasa+Ballia+Uttar+Pradesh",
        openingHoursText: "Mon - Sun: 7:00 AM - 9:30 PM (All 7 Days Open)",
      },
    });
  console.log("✅ Store settings seeded (id: 1)");

  // 6. Seed sample promotions
  console.log("🏷️ Seeding sample promotions...");

  // Fetch relevant products and variants to link
  const tataTea = await db
    .select()
    .from(products)
    .where(eq(products.slug, "tata-tea-gold"))
    .limit(1);

  const attaVariants = await db
    .select()
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(products.slug, "aashirvaad-shudh-chakki-atta"));

  const parleG = await db
    .select()
    .from(products)
    .where(eq(products.slug, "parle-g-original-glucose-biscuits"))
    .limit(1);

  const oilVariants = await db
    .select()
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(products.slug, "fortune-kachi-ghani-mustard-oil"));

  const saltVariants = await db
    .select()
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(products.slug, "tata-salt-iodised"));

  // Promo 1: Tata Tea 10% Off
  if (tataTea[0]) {
    const [existingPromo] = await db
      .select()
      .from(promotions)
      .where(eq(promotions.name, "Tata Tea Gold 10% Discount"))
      .limit(1);

    let promoId = existingPromo?.id;
    if (!promoId) {
      const [newPromo] = await db
        .insert(promotions)
        .values({
          name: "Tata Tea Gold 10% Discount",
          description: "Get 10% instant discount on rich aromatic Tata Tea Gold packs.",
          type: "SIMPLE_DISCOUNT",
          status: "ACTIVE",
          discountType: "PERCENTAGE",
          discountValue: "10.00",
          priority: 5,
        })
        .returning();
      promoId = newPromo.id;

      await db.insert(promotionTargets).values({
        promotionId: promoId,
        targetType: "PRODUCT",
        targetId: tataTea[0].id,
      });
    }
  }

  // Promo 2: Parle-G Buy 1 Get 1 Free
  if (parleG[0]) {
    const [existingPromo] = await db
      .select()
      .from(promotions)
      .where(eq(promotions.name, "Parle-G Buy 1 Get 1 Free"))
      .limit(1);

    if (!existingPromo) {
      const [newPromo] = await db
        .insert(promotions)
        .values({
          name: "Parle-G Buy 1 Get 1 Free",
          description: "Buy 1 packet of Parle-G Biscuits and get 1 free!",
          type: "BUY_X_GET_Y",
          status: "ACTIVE",
          discountType: "FREE",
          buyQuantity: 1,
          getQuantity: 1,
          getYDiscountPercent: "100.00",
          priority: 8,
        })
        .returning();

      await db.insert(promotionTargets).values({
        promotionId: newPromo.id,
        targetType: "PRODUCT",
        targetId: parleG[0].id,
      });
    }
  }

  // Promo 3: Daily Grocery Trio Combo (Atta 5kg + Fortune Oil 1L + Tata Salt 1kg = ₹390)
  // Atta 5kg (235) + Oil 1L Pouch (142) + Salt 1kg (26) = ₹403 normal. Combo price ₹390 -> ₹13 savings!
  const atta5kg = attaVariants.find((v) => v.product_variants.unit === "5 kg")?.product_variants;
  const oil1L = oilVariants.find((v) => v.product_variants.unit === "1 L Pouch")?.product_variants;
  const salt1kg = saltVariants[0]?.product_variants;

  if (atta5kg && oil1L && salt1kg) {
    const [existingCombo] = await db
      .select()
      .from(promotions)
      .where(eq(promotions.name, "Daily Grocery Essentials Trio Combo"))
      .limit(1);

    if (!existingCombo) {
      const [newCombo] = await db
        .insert(promotions)
        .values({
          name: "Daily Grocery Essentials Trio Combo",
          description: "Aashirvaad Atta 5kg + Fortune Mustard Oil 1L + Tata Salt 1kg at just ₹390!",
          type: "COMBO",
          status: "ACTIVE",
          discountType: "COMBO_PRICE",
          comboPrice: "390.00",
          priority: 10,
        })
        .returning();

      await db.insert(promotionComboComponents).values([
        {
          promotionId: newCombo.id,
          productVariantId: atta5kg.id,
          quantity: 1,
        },
        {
          promotionId: newCombo.id,
          productVariantId: oil1L.id,
          quantity: 1,
        },
        {
          promotionId: newCombo.id,
          productVariantId: salt1kg.id,
          quantity: 1,
        },
      ]);
    }
  }

  console.log("✅ Sample promotions seeded");

  console.log("🎉 Seed finished successfully!");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  pool.end();
  process.exit(1);
});
