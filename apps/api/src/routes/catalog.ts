import { FastifyInstance } from "fastify";
import {
  db,
  categories,
  products,
  productVariants,
  deliveryZones,
  storeSettings,
  eq,
  and,
  desc,
  asc,
  sql,
  or,
  inArray,
} from "@swami/database";

export async function catalogRoutes(app: FastifyInstance) {
  // 1. List all active categories sorted by displayOrder
  app.get("/categories", async (request, reply) => {
    const list = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.displayOrder));

    return { success: true, data: list };
  });

  // 1.1 List all active delivery zones sorted by displayOrder
  app.get("/delivery-zones", async (request, reply) => {
    const list = await db
      .select()
      .from(deliveryZones)
      .where(eq(deliveryZones.isActive, true))
      .orderBy(asc(deliveryZones.displayOrder));

    return { success: true, data: list };
  });

  // 1.2 Get store settings (singleton)
  app.get("/store-settings", async (request, reply) => {
    const [settings] = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.id, 1))
      .limit(1);

    if (!settings) {
      return reply.status(404).send({
        success: false,
        message: "Store settings not configured yet",
      });
    }

    return { success: true, data: settings };
  });

  // 2. Get category by slug + products under it with variants
  app.get<{ Params: { slug: string } }>(
    "/categories/:slug",
    async (request, reply) => {
      const { slug } = request.params;

      const [category] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
        .limit(1);

      if (!category) {
        return reply.status(404).send({ success: false, message: "Category not found" });
      }

      const productList = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.categoryId, category.id),
            eq(products.status, "ACTIVE")
          )
        )
        .orderBy(desc(products.createdAt));

      const productIds = productList.map((p) => p.id);

      let variantsList: (typeof productVariants.$inferSelect)[] = [];
      if (productIds.length > 0) {
        variantsList = await db
          .select()
          .from(productVariants)
          .where(
            and(
              inArray(productVariants.productId, productIds),
              eq(productVariants.isActive, true)
            )
          )
          .orderBy(asc(productVariants.sellingPrice));
      }

      const variantsByProductId = new Map<number, typeof variantsList>();
      for (const v of variantsList) {
        if (!variantsByProductId.has(v.productId)) {
          variantsByProductId.set(v.productId, []);
        }
        variantsByProductId.get(v.productId)!.push(v);
      }

      const productsWithVariants = productList.map((p) => ({
        ...p,
        category,
        variants: variantsByProductId.get(p.id) || [],
      }));

      return {
        success: true,
        data: {
          category,
          products: productsWithVariants,
        },
      };
    }
  );

  // 3. Search products by name, hindiName, searchKeywords using pg_trgm + ILIKE
  app.get<{ Querystring: { q?: string; limit?: string } }>(
    "/products/search",
    async (request, reply) => {
      const q = (request.query.q || "").trim();
      const limit = Math.min(parseInt(request.query.limit || "30", 10), 50);

      if (!q) {
        return { success: true, data: [] };
      }

      const pattern = `%${q}%`;

      const similarityScore = sql<number>`(
        similarity(${products.name}, ${q}) * 2.0 +
        coalesce(similarity(${products.hindiName}, ${q}), 0) * 2.0 +
        coalesce(similarity(${products.searchKeywords}, ${q}), 0)
      )`;

      const matchedProducts = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.status, "ACTIVE"),
            or(
              sql`similarity(${products.name}, ${q}) > 0.15`,
              sql`similarity(${products.hindiName}, ${q}) > 0.15`,
              sql`similarity(${products.searchKeywords}, ${q}) > 0.1`,
              sql`${products.name} ILIKE ${pattern}`,
              sql`${products.hindiName} ILIKE ${pattern}`,
              sql`${products.searchKeywords} ILIKE ${pattern}`
            )
          )
        )
        .orderBy(desc(similarityScore), desc(products.createdAt))
        .limit(limit);

      const productIds = matchedProducts.map((p) => p.id);
      let variantsList: (typeof productVariants.$inferSelect)[] = [];
      if (productIds.length > 0) {
        variantsList = await db
          .select()
          .from(productVariants)
          .where(
            and(
              inArray(productVariants.productId, productIds),
              eq(productVariants.isActive, true)
            )
          )
          .orderBy(asc(productVariants.sellingPrice));
      }

      const variantsByProductId = new Map<number, typeof variantsList>();
      for (const v of variantsList) {
        if (!variantsByProductId.has(v.productId)) {
          variantsByProductId.set(v.productId, []);
        }
        variantsByProductId.get(v.productId)!.push(v);
      }

      const results = matchedProducts.map((p) => ({
        ...p,
        variants: variantsByProductId.get(p.id) || [],
      }));

      return { success: true, data: results };
    }
  );

  // 4. Get single product by id or slug with variants
  app.get<{ Params: { idOrSlug: string } }>(
    "/products/:idOrSlug",
    async (request, reply) => {
      const { idOrSlug } = request.params;
      const isNumeric = /^\d+$/.test(idOrSlug);

      const condition = isNumeric
        ? eq(products.id, parseInt(idOrSlug, 10))
        : eq(products.slug, idOrSlug);

      const [product] = await db
        .select()
        .from(products)
        .where(and(condition, eq(products.status, "ACTIVE")))
        .limit(1);

      if (!product) {
        return reply.status(404).send({ success: false, message: "Product not found" });
      }

      const variants = await db
        .select()
        .from(productVariants)
        .where(
          and(
            eq(productVariants.productId, product.id),
            eq(productVariants.isActive, true)
          )
        )
        .orderBy(asc(productVariants.sellingPrice));

      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, product.categoryId))
        .limit(1);

      return {
        success: true,
        data: {
          ...product,
          category,
          variants,
        },
      };
    }
  );

  // 5. Featured / Recent products across store
  app.get<{ Querystring: { limit?: string } }>("/products", async (request, reply) => {
    const limit = Math.min(parseInt(request.query.limit || "20", 10), 50);

    const productList = await db
      .select()
      .from(products)
      .where(eq(products.status, "ACTIVE"))
      .orderBy(desc(products.createdAt))
      .limit(limit);

    const productIds = productList.map((p) => p.id);
    let variantsList: (typeof productVariants.$inferSelect)[] = [];
    if (productIds.length > 0) {
      variantsList = await db
        .select()
        .from(productVariants)
        .where(
          and(
            inArray(productVariants.productId, productIds),
            eq(productVariants.isActive, true)
          )
        )
        .orderBy(asc(productVariants.sellingPrice));
    }

    const variantsByProductId = new Map<number, typeof variantsList>();
    for (const v of variantsList) {
      if (!variantsByProductId.has(v.productId)) {
        variantsByProductId.set(v.productId, []);
      }
      variantsByProductId.get(v.productId)!.push(v);
    }

    const results = productList.map((p) => ({
      ...p,
      variants: variantsByProductId.get(p.id) || [],
    }));

    return { success: true, data: results };
  });
}
