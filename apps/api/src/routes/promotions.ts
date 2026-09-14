import { FastifyInstance } from "fastify";
import {
  db,
  promotions,
  promotionTargets,
  promotionComboComponents,
  productVariants,
  products,
  eq,
  and,
  desc,
  inArray,
} from "@swami/database";
import { isPromotionEligible } from "../services/promotions/index.js";

export async function publicPromotionRoutes(app: FastifyInstance) {
  // GET /api/v1/catalog/promotions — list active, eligible promotions
  app.get("/", async (request, reply) => {
    const allActivePromos = await db
      .select()
      .from(promotions)
      .where(eq(promotions.status, "ACTIVE"))
      .orderBy(desc(promotions.priority), desc(promotions.createdAt));

    const now = new Date();
    const promoIds = allActivePromos.map((p) => p.id);

    if (promoIds.length === 0) {
      return reply.send({ success: true, data: [] });
    }

    // Fetch targets
    const allTargets = await db
      .select()
      .from(promotionTargets)
      .where(inArray(promotionTargets.promotionId, promoIds));

    // Fetch combo components with variant and product details
    const allComboComponents = await db
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
      .where(inArray(promotionComboComponents.promotionId, promoIds));

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

    const eligibleList = [];
    for (const p of allActivePromos) {
      const targets = targetsByPromo.get(p.id) || [];
      const comboComponents = componentsByPromo.get(p.id) || [];

      const fullPromo = {
        ...p,
        targets,
        comboComponents,
      };

      if (isPromotionEligible(fullPromo, now)) {
        eligibleList.push(fullPromo);
      }
    }

    return reply.send({
      success: true,
      data: eligibleList,
    });
  });

  // GET /api/v1/catalog/promotions/:id — get single active promotion
  app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const promoId = parseInt(request.params.id, 10);
    if (isNaN(promoId)) {
      return reply.status(400).send({ success: false, message: "Invalid ID" });
    }

    const [promo] = await db
      .select()
      .from(promotions)
      .where(and(eq(promotions.id, promoId), eq(promotions.status, "ACTIVE")));

    if (!promo) {
      return reply
        .status(404)
        .send({ success: false, message: "Promotion not found or inactive" });
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

    const fullPromo = {
      ...promo,
      targets,
      comboComponents,
    };

    if (!isPromotionEligible(fullPromo, new Date())) {
      return reply
        .status(404)
        .send({ success: false, message: "Promotion is expired or unavailable" });
    }

    return reply.send({ success: true, data: fullPromo });
  });
}
