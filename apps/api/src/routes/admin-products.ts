import { FastifyInstance } from "fastify";
import {
  db,
  products,
  productVariants,
  categories,
  eq,
  desc,
  inArray,
} from "@swami/database";
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
} from "@swami/shared";

export async function adminProductRoutes(app: FastifyInstance) {
  // 1. List all products (including DRAFT, ARCHIVED) with variants and category
  app.get("/", async (request, reply) => {
    const productList = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));

    const categoryList = await db.select().from(categories);
    const categoryMap = new Map(categoryList.map((c) => [c.id, c]));

    const productIds = productList.map((p) => p.id);
    let variantsList: (typeof productVariants.$inferSelect)[] = [];
    if (productIds.length > 0) {
      variantsList = await db
        .select()
        .from(productVariants)
        .where(inArray(productVariants.productId, productIds));
    }

    const variantsByProductId = new Map<number, typeof variantsList>();
    for (const v of variantsList) {
      if (!variantsByProductId.has(v.productId)) {
        variantsByProductId.set(v.productId, []);
      }
      variantsByProductId.get(v.productId)!.push(v);
    }

    const result = productList.map((p) => ({
      ...p,
      category: categoryMap.get(p.categoryId) || null,
      variants: variantsByProductId.get(p.id) || [],
    }));

    return { success: true, data: result };
  });

  // 2. Create product with initial variants
  app.post("/", async (request, reply) => {
    const parseResult = createProductSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const { variants: initialVariants, ...productData } = parseResult.data;

    const [newProduct] = await db
      .insert(products)
      .values({
        categoryId: productData.categoryId,
        name: productData.name,
        slug: productData.slug,
        hindiName: productData.hindiName || null,
        searchKeywords: productData.searchKeywords || null,
        description: productData.description || null,
        status: productData.status,
        imageUrl: productData.imageUrl || null,
        images: productData.imageUrl ? [productData.imageUrl] : [],
      })
      .returning();

    // Insert variants
    const insertedVariants = [];
    for (const v of initialVariants) {
      const [newVariant] = await db
        .insert(productVariants)
        .values({
          productId: newProduct.id,
          unit: v.unit,
          sku: v.sku || null,
          mrp: v.mrp.toFixed(2),
          sellingPrice: v.sellingPrice.toFixed(2),
          currentStock: v.currentStock,
          minStockAlert: v.minStockAlert,
          isActive: v.isActive,
        })
        .returning();
      insertedVariants.push(newVariant);
    }

    return reply.status(201).send({
      success: true,
      data: {
        ...newProduct,
        variants: insertedVariants,
      },
    });
  });

  // 3. Update product details (e.g. name, hindiName, status ACTIVE/ARCHIVED)
  app.put<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const productId = parseInt(request.params.id, 10);
    if (isNaN(productId)) {
      return reply.status(400).send({ success: false, message: "Invalid product ID" });
    }

    const parseResult = updateProductSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: "Validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const updateData: Record<string, any> = {};
    const d = parseResult.data;
    if (d.categoryId !== undefined) updateData.categoryId = d.categoryId;
    if (d.name !== undefined) updateData.name = d.name;
    if (d.slug !== undefined) updateData.slug = d.slug;
    if (d.hindiName !== undefined) updateData.hindiName = d.hindiName;
    if (d.searchKeywords !== undefined) updateData.searchKeywords = d.searchKeywords;
    if (d.description !== undefined) updateData.description = d.description;
    if (d.status !== undefined) updateData.status = d.status;
    if (d.imageUrl !== undefined) {
      updateData.imageUrl = d.imageUrl;
      if (d.imageUrl) updateData.images = [d.imageUrl];
    }

    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, productId))
      .returning();

    if (!updatedProduct) {
      return reply.status(404).send({ success: false, message: "Product not found" });
    }

    return { success: true, data: updatedProduct };
  });

  // 4. Update variant (e.g., price, stock, active status)
  app.put<{ Params: { productId: string; variantId: string } }>(
    "/:productId/variants/:variantId",
    async (request, reply) => {
      const productId = parseInt(request.params.productId, 10);
      const variantId = parseInt(request.params.variantId, 10);

      if (isNaN(productId) || isNaN(variantId)) {
        return reply.status(400).send({ success: false, message: "Invalid IDs" });
      }

      const parseResult = updateVariantSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: parseResult.error.flatten(),
        });
      }

      const updateData: Record<string, any> = {};
      const d = parseResult.data;
      if (d.unit !== undefined) updateData.unit = d.unit;
      if (d.sku !== undefined) updateData.sku = d.sku;
      if (d.mrp !== undefined) updateData.mrp = d.mrp.toFixed(2);
      if (d.sellingPrice !== undefined) updateData.sellingPrice = d.sellingPrice.toFixed(2);
      if (d.currentStock !== undefined) updateData.currentStock = d.currentStock;
      if (d.minStockAlert !== undefined) updateData.minStockAlert = d.minStockAlert;
      if (d.isActive !== undefined) updateData.isActive = d.isActive;

      const [updatedVariant] = await db
        .update(productVariants)
        .set(updateData)
        .where(eq(productVariants.id, variantId))
        .returning();

      if (!updatedVariant) {
        return reply.status(404).send({ success: false, message: "Variant not found" });
      }

      return { success: true, data: updatedVariant };
    }
  );

  // 5. Add a new variant to an existing product
  app.post<{ Params: { productId: string } }>(
    "/:productId/variants",
    async (request, reply) => {
      const productId = parseInt(request.params.productId, 10);
      if (isNaN(productId)) {
        return reply.status(400).send({ success: false, message: "Invalid product ID" });
      }

      const parseResult = createVariantSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          message: "Validation failed",
          errors: parseResult.error.flatten(),
        });
      }

      const v = parseResult.data;
      const [newVariant] = await db
        .insert(productVariants)
        .values({
          productId,
          unit: v.unit,
          sku: v.sku || null,
          mrp: v.mrp.toFixed(2),
          sellingPrice: v.sellingPrice.toFixed(2),
          currentStock: v.currentStock,
          minStockAlert: v.minStockAlert,
          isActive: v.isActive,
        })
        .returning();

      return reply.status(201).send({ success: true, data: newVariant });
    }
  );
}
