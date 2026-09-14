import { FastifyInstance } from "fastify";
import {
  db,
  orders,
  orderItems,
  orderStatusHistory,
  productVariants,
  products,
  deliveryZones,
  promotions,
  promotionTargets,
  promotionComboComponents,
  eq,
  inArray,
} from "@swami/database";
import { createOrderSchema } from "@swami/shared";
import { sendOrderNotification } from "../services/whatsapp/index.js";
import {
  calculateCartPromotions,
  CartVariantItem,
} from "../services/promotions/index.js";

class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

export async function orderRoutes(app: FastifyInstance) {
  // 1. Create order — rate-limited to 10 orders per 10 minutes per client IP to prevent automated spam
  app.post(
    "/",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "10 minutes",
          hook: "preHandler",
          allowList: (req: any) => req.method === "OPTIONS",
          errorResponseBuilder: (req: any, context: any) => ({
            statusCode: 429,
            error: "RATE_LIMIT_EXCEEDED",
            message: `Too many orders placed from this network. Please wait ${context.after} before trying again.`,
          }),
        },
      },
    },
    async (request, reply) => {
    const parseResult = createOrderSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: "Order validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const {
      customerName,
      customerPhone,
      customerAddress,
      deliveryZoneId,
      paymentMethod,
      items,
    } = parseResult.data;

    const variantIds = items.map((i) => i.productVariantId);

    // 2. Fetch all requested variants and their parent products (including categoryId)
    const requestedVariants = await db
      .select({
        variantId: productVariants.id,
        unit: productVariants.unit,
        sellingPrice: productVariants.sellingPrice,
        mrp: productVariants.mrp,
        currentStock: productVariants.currentStock,
        isActive: productVariants.isActive,
        productId: products.id,
        productName: products.name,
        categoryId: products.categoryId,
        productStatus: products.status,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(inArray(productVariants.id, variantIds));

    const variantMap = new Map(requestedVariants.map((v) => [v.variantId, v]));

    // 3. Stock check & construct cart items for authoritative calculation
    const cartVariantItems: CartVariantItem[] = [];

    for (const item of items) {
      const variant = variantMap.get(item.productVariantId);

      if (!variant || !variant.isActive || variant.productStatus !== "ACTIVE") {
        return reply.status(400).send({
          success: false,
          message: `Item #${item.productVariantId} is no longer available.`,
        });
      }

      if (item.quantity > variant.currentStock) {
        return reply.status(400).send({
          success: false,
          message: `Insufficient stock for "${variant.productName} (${variant.unit})". Only ${variant.currentStock} left in store.`,
          variantId: item.productVariantId,
          availableStock: variant.currentStock,
        });
      }

      cartVariantItems.push({
        productVariantId: variant.variantId,
        productId: variant.productId,
        categoryId: variant.categoryId,
        sellingPrice: parseFloat(variant.sellingPrice),
        quantity: item.quantity,
        productName: variant.productName,
        variantUnit: variant.unit,
      });
    }

    // 4. Fetch active promotions, targets, and combo components
    const activePromos = await db
      .select()
      .from(promotions)
      .where(eq(promotions.status, "ACTIVE"));

    const promoIds = activePromos.map((p) => p.id);

    const allTargets =
      promoIds.length > 0
        ? await db
            .select()
            .from(promotionTargets)
            .where(inArray(promotionTargets.promotionId, promoIds))
        : [];

    const allComboComponents =
      promoIds.length > 0
        ? await db
            .select()
            .from(promotionComboComponents)
            .where(inArray(promotionComboComponents.promotionId, promoIds))
        : [];

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

    const fullPromos = activePromos.map((p) => ({
      ...p,
      targets: targetsByPromo.get(p.id) || [],
      comboComponents: componentsByPromo.get(p.id) || [],
    }));

    // 5. Authoritative promotion calculation
    const calcResult = calculateCartPromotions(
      cartVariantItems,
      fullPromos,
      new Date()
    );

    const grossSubtotal = calcResult.grossSubtotal;
    const totalDiscount = calcResult.totalDiscount;
    const netSubtotal = calcResult.netSubtotal;
    const cartGrossSubtotal = calcResult.cartGrossSubtotal;

    try {
      // 6. Atomic transaction: lookup zone, check min order / free delivery on cart merchandise subtotal, create order & items
      const { createdOrder, insertedItems } = await db.transaction(async (tx) => {
        // Step A: Server-side lookup of deliveryZoneId
        const [zone] = await tx
          .select()
          .from(deliveryZones)
          .where(eq(deliveryZones.id, deliveryZoneId));

        if (!zone || !zone.isActive) {
          throw new OrderValidationError(
            "Selected delivery area is unavailable. Please choose a valid delivery area."
          );
        }

        // Step B: Minimum-Order Check on customer requested merchandise subtotal (Phase 4 Preserved)
        // Does NOT use post-discount or inflated physical quantity to alter delivery eligibility
        const minOrder = parseFloat(zone.minOrderAmount || "0");
        if (cartGrossSubtotal < minOrder) {
          const shortfall = (minOrder - cartGrossSubtotal).toFixed(0);
          throw new OrderValidationError(
            `Minimum order for ${zone.name} is ₹${minOrder.toFixed(0)}, add ₹${shortfall} more to place order.`
          );
        }

        // Step C: Free Delivery Threshold Check on customer requested merchandise subtotal (Phase 4 Preserved)
        let deliveryChargeNum = parseFloat(zone.deliveryCharge || "0");
        if (
          zone.freeDeliveryAboveAmount !== null &&
          zone.freeDeliveryAboveAmount !== undefined
        ) {
          const freeThreshold = parseFloat(zone.freeDeliveryAboveAmount);
          if (cartGrossSubtotal >= freeThreshold) {
            deliveryChargeNum = 0.0;
          }
        }

        const totalAmountNum = netSubtotal + deliveryChargeNum;

        // Step D: Insert order with initial placeholder code
        const [newOrder] = await tx
          .insert(orders)
          .values({
            orderCode: `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            customerName,
            customerPhone,
            customerAddress,
            deliveryZoneId: zone.id,
            subtotal: grossSubtotal.toFixed(2),
            totalDiscount: totalDiscount.toFixed(2),
            deliveryCharge: deliveryChargeNum.toFixed(2),
            totalAmount: totalAmountNum.toFixed(2),
            appliedPromotionsSummary: calcResult.appliedPromotionsSummary,
            paymentMethod,
            paymentStatus: "PENDING",
            status: "PENDING_WHATSAPP",
          })
          .returning();

        // Atomic orderCode generated from the row's own serial ID
        const finalOrderCode = `SSM-${newOrder.id.toString().padStart(4, "0")}`;

        const [updatedOrder] = await tx
          .update(orders)
          .set({ orderCode: finalOrderCode })
          .where(eq(orders.id, newOrder.id))
          .returning();

        // Step E: Insert split snapshot order items
        const itemsToInsert = calcResult.splitAllocations.map((alloc) => ({
          orderId: updatedOrder.id,
          productVariantId: alloc.productVariantId,
          promotionId: alloc.promotionId,
          promotionTypeSnapshot: alloc.promotionTypeSnapshot,
          discountAmount: alloc.discountAmount.toFixed(2),
          productNameSnapshot: alloc.productName,
          variantUnitSnapshot: alloc.variantUnit,
          unitPriceSnapshot: alloc.sellingPrice.toFixed(2),
          quantity: alloc.quantity, // TOTAL PHYSICAL UNITS to fulfill
          paidQuantity: alloc.paidQuantity,
          freeQuantity: alloc.freeQuantity,
          lineTotal: alloc.lineTotal.toFixed(2),
        }));

        const inserted = await tx
          .insert(orderItems)
          .values(itemsToInsert)
          .returning();

        // Record first status history entry
        await tx.insert(orderStatusHistory).values({
          orderId: updatedOrder.id,
          status: "PENDING_WHATSAPP",
          note: `Order placed via website checkout (${zone.name})`,
        });

        return { createdOrder: updatedOrder, insertedItems: inserted };
      });

      // 7. Generate WhatsApp deep link with frozen order snapshot
      const whatsappPayload = {
        orderCode: createdOrder.orderCode,
        customerName: createdOrder.customerName,
        customerPhone: createdOrder.customerPhone,
        customerAddress: createdOrder.customerAddress,
        subtotal: createdOrder.subtotal,
        totalDiscount: createdOrder.totalDiscount,
        deliveryCharge: createdOrder.deliveryCharge,
        totalAmount: createdOrder.totalAmount,
        paymentMethod: createdOrder.paymentMethod,
        appliedPromotions: createdOrder.appliedPromotionsSummary,
        items: insertedItems.map((item) => ({
          productName: item.productNameSnapshot,
          variantUnit: item.variantUnitSnapshot,
          unitPrice: item.unitPriceSnapshot,
          quantity: item.quantity,
          paidQuantity: item.paidQuantity,
          freeQuantity: item.freeQuantity,
          promotionType: item.promotionTypeSnapshot,
          lineTotal: item.lineTotal,
        })),
      };

      let whatsappResult;
      try {
        whatsappResult = await sendOrderNotification(whatsappPayload);
      } catch (err: any) {
        request.log.error(err);
        whatsappResult = {
          whatsappUrl: "",
          whatsappMessage: "",
          error: err.message,
        };
      }

      return reply.status(201).send({
        success: true,
        data: {
          order: createdOrder,
          items: insertedItems,
          whatsappUrl: whatsappResult.whatsappUrl,
          whatsappMessage: whatsappResult.whatsappMessage,
        },
      });
    } catch (err: any) {
      if (err instanceof OrderValidationError) {
        return reply.status(400).send({
          success: false,
          message: err.message,
        });
      }
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        message: "Failed to place order. Please try again.",
      });
    }
  });

  // 2. Get order by orderCode (for public tracking)
  app.get<{ Params: { orderCode: string } }>(
    "/:orderCode",
    async (request, reply) => {
      const { orderCode } = request.params;

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.orderCode, orderCode))
        .limit(1);

      if (!order) {
        return reply
          .status(404)
          .send({ success: false, message: "Order not found" });
      }

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      const history = await db
        .select()
        .from(orderStatusHistory)
        .where(eq(orderStatusHistory.orderId, order.id));

      return {
        success: true,
        data: {
          order,
          items,
          history,
        },
      };
    }
  );
}
