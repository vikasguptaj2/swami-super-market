import { FastifyInstance } from "fastify";
import {
  db,
  promotions,
  promotionTargets,
  promotionComboComponents,
  productVariants,
  products,
  categories,
  eq,
  and,
  or,
  desc,
  ilike,
  inArray,
} from "@swami/database";
import {
  createPromotionSchema,
  updatePromotionSchema,
  updatePromotionStatusSchema,
  PromotionType,
  PromotionStatus,
} from "@swami/shared";

export async function adminPromotionRoutes(app: FastifyInstance) {
  // 1. GET / — list promotions with filters and search
  app.get("/", async (request, reply) => {
    const { status, type, search } = request.query as {
      status?: string;
      type?: string;
      search?: string;
    };

    const conditions = [];

    if (status && status !== "ALL") {
      conditions.push(eq(promotions.status, status as PromotionStatus));
    }

    if (type && type !== "ALL") {
      conditions.push(eq(promotions.type, type as PromotionType));
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(promotions.name, term),
          ilike(promotions.description, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const promoList = await db
      .select()
      .from(promotions)
      .where(whereClause)
      .orderBy(desc(promotions.priority), desc(promotions.createdAt));

    const now = new Date();
    const promoIds = promoList.map((p) => p.id);

    let allTargets: Array<{
      id: number;
      promotionId: number;
      targetType: string;
      targetId: number;
    }> = [];

    let allComboComponents: Array<{
      id: number;
      promotionId: number;
      productVariantId: number;
      quantity: number;
      variantUnit: string;
      sellingPrice: string;
      productName: string;
    }> = [];

    if (promoIds.length > 0) {
      allTargets = await db
        .select()
        .from(promotionTargets)
        .where(inArray(promotionTargets.promotionId, promoIds));

      allComboComponents = await db
        .select({
          id: promotionComboComponents.id,
          promotionId: promotionComboComponents.promotionId,
          productVariantId: promotionComboComponents.productVariantId,
          quantity: promotionComboComponents.quantity,
          variantUnit: productVariants.unit,
          sellingPrice: productVariants.sellingPrice,
          productName: products.name,
        })
        .from(promotionComboComponents)
        .innerJoin(
          productVariants,
          eq(promotionComboComponents.productVariantId, productVariants.id)
        )
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(inArray(promotionComboComponents.promotionId, promoIds));
    }

    const targetsByPromo = new Map<number, typeof allTargets>();
    for (const t of allTargets) {
      const list = targetsByPromo.get(t.promotionId) || [];
      list.push(t);
      targetsByPromo.set(t.promotionId, list);
    }

    const componentsByPromo = new Map<number, typeof allComboComponents>();
    for (const c of allComboComponents) {
      const list = componentsByPromo.get(c.promotionId) || [];
      list.push(c);
      componentsByPromo.set(c.promotionId, list);
    }

    const enrichedList = promoList.map((p) => {
      const isPastEnd = p.endDate ? new Date(p.endDate) < now : false;
      const derivedStatus =
        p.status === "ACTIVE" && isPastEnd ? "EXPIRED" : p.status;

      return {
        ...p,
        derivedStatus,
        isExpired: isPastEnd,
        targets: targetsByPromo.get(p.id) || [],
        comboComponents: componentsByPromo.get(p.id) || [],
      };
    });

    return reply.send({ success: true, data: enrichedList });
  });

  // 2. GET /:id — single promotion detail with populated target names
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const promoId = parseInt(id, 10);
    if (isNaN(promoId)) {
      return reply.status(400).send({ success: false, message: "Invalid ID" });
    }

    const [promo] = await db
      .select()
      .from(promotions)
      .where(eq(promotions.id, promoId));

    if (!promo) {
      return reply
        .status(404)
        .send({ success: false, message: "Promotion not found" });
    }

    const targets = await db
      .select()
      .from(promotionTargets)
      .where(eq(promotionTargets.promotionId, promo.id));

    const comboComponents = await db
      .select({
        id: promotionComboComponents.id,
        promotionId: promotionComboComponents.promotionId,
        productVariantId: promotionComboComponents.productVariantId,
        quantity: promotionComboComponents.quantity,
        variantUnit: productVariants.unit,
        sellingPrice: productVariants.sellingPrice,
        mrp: productVariants.mrp,
        productId: products.id,
        productName: products.name,
        hindiName: products.hindiName,
        imageUrl: products.imageUrl,
      })
      .from(promotionComboComponents)
      .innerJoin(
        productVariants,
        eq(promotionComboComponents.productVariantId, productVariants.id)
      )
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(promotionComboComponents.promotionId, promo.id));

    const isPastEnd = promo.endDate ? new Date(promo.endDate) < new Date() : false;
    const derivedStatus =
      promo.status === "ACTIVE" && isPastEnd ? "EXPIRED" : promo.status;

    return reply.send({
      success: true,
      data: {
        ...promo,
        derivedStatus,
        isExpired: isPastEnd,
        targets,
        comboComponents,
      },
    });
  });

  // 3. POST / — create promotion with targets and combo components
  app.post("/", async (request, reply) => {
    const parseResult = createPromotionSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: "Promotion validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const data = parseResult.data;

    // Concurrency / transaction safe creation
    const createdPromotion = await db.transaction(async (tx) => {
      const [newPromo] = await tx
        .insert(promotions)
        .values({
          name: data.name,
          description: data.description || null,
          type: data.type,
          status: data.status,
          discountType: data.discountType,
          discountValue:
            data.discountValue !== undefined && data.discountValue !== null
              ? data.discountValue.toFixed(2)
              : null,
          minOrderAmount:
            data.minOrderAmount !== undefined && data.minOrderAmount !== null
              ? data.minOrderAmount.toFixed(2)
              : null,
          minQuantity: data.minQuantity || 1,
          buyQuantity: data.buyQuantity || null,
          getQuantity: data.getQuantity || null,
          getYDiscountPercent:
            data.getYDiscountPercent !== undefined &&
            data.getYDiscountPercent !== null
              ? data.getYDiscountPercent.toFixed(2)
              : "100.00",
          comboPrice:
            data.comboPrice !== undefined && data.comboPrice !== null
              ? data.comboPrice.toFixed(2)
              : null,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          priority: data.priority || 0,
          usageLimit: data.usageLimit || null,
        })
        .returning();

      // Insert targets
      if (data.targets && data.targets.length > 0) {
        await tx.insert(promotionTargets).values(
          data.targets.map((t) => ({
            promotionId: newPromo.id,
            targetType: t.targetType,
            targetId: t.targetId,
          }))
        );
      }

      // Insert combo components
      if (data.type === "COMBO" && data.comboComponents && data.comboComponents.length > 0) {
        await tx.insert(promotionComboComponents).values(
          data.comboComponents.map((c) => ({
            promotionId: newPromo.id,
            productVariantId: c.productVariantId,
            quantity: c.quantity,
          }))
        );
      }

      return newPromo;
    });

    return reply.status(201).send({
      success: true,
      message: "Promotion created successfully",
      data: createdPromotion,
    });
  });

  // 4. PUT /:id — update promotion and replace targets/components
  app.put("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const promoId = parseInt(id, 10);
    if (isNaN(promoId)) {
      return reply.status(400).send({ success: false, message: "Invalid ID" });
    }

    const parseResult = updatePromotionSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: "Promotion validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const data = parseResult.data;

    const [existing] = await db
      .select()
      .from(promotions)
      .where(eq(promotions.id, promoId));

    if (!existing) {
      return reply
        .status(404)
        .send({ success: false, message: "Promotion not found" });
    }

    const updated = await db.transaction(async (tx) => {
      const [promo] = await tx
        .update(promotions)
        .set({
          name: data.name,
          description: data.description || null,
          type: data.type,
          status: data.status,
          discountType: data.discountType,
          discountValue:
            data.discountValue !== undefined && data.discountValue !== null
              ? data.discountValue.toFixed(2)
              : null,
          minOrderAmount:
            data.minOrderAmount !== undefined && data.minOrderAmount !== null
              ? data.minOrderAmount.toFixed(2)
              : null,
          minQuantity: data.minQuantity || 1,
          buyQuantity: data.buyQuantity || null,
          getQuantity: data.getQuantity || null,
          getYDiscountPercent:
            data.getYDiscountPercent !== undefined &&
            data.getYDiscountPercent !== null
              ? data.getYDiscountPercent.toFixed(2)
              : "100.00",
          comboPrice:
            data.comboPrice !== undefined && data.comboPrice !== null
              ? data.comboPrice.toFixed(2)
              : null,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          priority: data.priority || 0,
          usageLimit: data.usageLimit || null,
          updatedAt: new Date(),
        })
        .where(eq(promotions.id, promoId))
        .returning();

      // Replace targets
      await tx
        .delete(promotionTargets)
        .where(eq(promotionTargets.promotionId, promoId));

      if (data.targets && data.targets.length > 0) {
        await tx.insert(promotionTargets).values(
          data.targets.map((t) => ({
            promotionId: promoId,
            targetType: t.targetType,
            targetId: t.targetId,
          }))
        );
      }

      // Replace combo components
      await tx
        .delete(promotionComboComponents)
        .where(eq(promotionComboComponents.promotionId, promoId));

      if (data.type === "COMBO" && data.comboComponents && data.comboComponents.length > 0) {
        await tx.insert(promotionComboComponents).values(
          data.comboComponents.map((c) => ({
            promotionId: promoId,
            productVariantId: c.productVariantId,
            quantity: c.quantity,
          }))
        );
      }

      return promo;
    });

    return reply.send({
      success: true,
      message: "Promotion updated successfully",
      data: updated,
    });
  });

  // 5. PATCH /:id/status — quick status toggle
  app.patch("/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const promoId = parseInt(id, 10);
    if (isNaN(promoId)) {
      return reply.status(400).send({ success: false, message: "Invalid ID" });
    }

    const parseResult = updatePromotionStatusSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: "Status validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const { status } = parseResult.data;

    const [updated] = await db
      .update(promotions)
      .set({ status, updatedAt: new Date() })
      .where(eq(promotions.id, promoId))
      .returning();

    if (!updated) {
      return reply
        .status(404)
        .send({ success: false, message: "Promotion not found" });
    }

    return reply.send({
      success: true,
      message: `Promotion status updated to ${status}`,
      data: updated,
    });
  });
}
