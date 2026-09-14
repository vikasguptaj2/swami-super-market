import { FastifyInstance } from "fastify";
import {
  db,
  orders,
  orderItems,
  orderStatusHistory,
  productVariants,
  inventoryMovements,
  promotions,
  eq,
  desc,
  and,
  or,
  ilike,
  sql,
} from "@swami/database";
import {
  updateOrderStatusSchema,
  VALID_ORDER_TRANSITIONS,
  OrderStatus,
} from "@swami/shared";

class StatusTransitionError extends Error {
  constructor(
    message: string,
    public readonly currentStatus: string,
    public readonly requestedStatus: string
  ) {
    super(message);
    this.name = "StatusTransitionError";
  }
}

class InsufficientStockError extends Error {
  constructor(
    public readonly shortItems: Array<{
      variantId: number;
      productName: string;
      unit: string;
      required: number;
      available: number;
    }>
  ) {
    super("Insufficient stock to confirm order");
    this.name = "InsufficientStockError";
  }
}

class PromotionUsageExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromotionUsageExceededError";
  }
}

export async function adminOrderRoutes(app: FastifyInstance) {
  // 1. GET /api/v1/admin/orders — list all orders with filter & search
  app.get("/", async (request, reply) => {
    const { status, search } = request.query as {
      status?: string;
      search?: string;
    };

    const conditions = [];

    if (status && status !== "ALL") {
      conditions.push(eq(orders.status, status as OrderStatus));
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(orders.orderCode, term),
          ilike(orders.customerPhone, term),
          ilike(orders.customerName, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderList = await db
      .select({
        id: orders.id,
        orderCode: orders.orderCode,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        customerAddress: orders.customerAddress,
        deliveryZoneId: orders.deliveryZoneId,
        subtotal: orders.subtotal,
        deliveryCharge: orders.deliveryCharge,
        totalAmount: orders.totalAmount,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        status: orders.status,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        itemCount: sql<number>`cast(count(${orderItems.id}) as int)`,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(whereClause)
      .groupBy(orders.id)
      .orderBy(desc(orders.createdAt));

    return reply.send({
      success: true,
      data: orderList,
    });
  });

  // 2. GET /api/v1/admin/orders/:id — full order detail with items and status history
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return reply
        .status(400)
        .send({ success: false, message: "Invalid order ID" });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      return reply
        .status(404)
        .send({ success: false, message: "Order not found" });
    }

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productVariantId: orderItems.productVariantId,
        promotionId: orderItems.promotionId,
        promotionTypeSnapshot: orderItems.promotionTypeSnapshot,
        discountAmount: orderItems.discountAmount,
        productNameSnapshot: orderItems.productNameSnapshot,
        variantUnitSnapshot: orderItems.variantUnitSnapshot,
        unitPriceSnapshot: orderItems.unitPriceSnapshot,
        quantity: orderItems.quantity,
        paidQuantity: orderItems.paidQuantity,
        freeQuantity: orderItems.freeQuantity,
        lineTotal: orderItems.lineTotal,
        currentVariantStock: productVariants.currentStock,
      })
      .from(orderItems)
      .leftJoin(
        productVariants,
        eq(orderItems.productVariantId, productVariants.id)
      )
      .where(eq(orderItems.orderId, order.id));

    const history = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(desc(orderStatusHistory.changedAt));

    return reply.send({
      success: true,
      data: {
        ...order,
        items,
        history,
      },
    });
  });

  // 3. PATCH /api/v1/admin/orders/:id/status — status transition state machine inside one transaction
  app.patch("/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return reply
        .status(400)
        .send({ success: false, message: "Invalid order ID" });
    }

    const parseResult = updateOrderStatusSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: "Status validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const { status: newStatus, note } = parseResult.data;

    try {
      const updatedOrder = await db.transaction(async (tx) => {
        // Step A: Fetch current order with row lock
        const [currentOrder] = await tx
          .select()
          .from(orders)
          .where(eq(orders.id, orderId))
          .for("update");

        if (!currentOrder) {
          throw new Error("ORDER_NOT_FOUND");
        }

        // Step B: Whitelist validation
        const allowedNext = VALID_ORDER_TRANSITIONS[currentOrder.status];
        if (!allowedNext || !allowedNext.includes(newStatus)) {
          throw new StatusTransitionError(
            `Cannot transition order from '${currentOrder.status}' to '${newStatus}'. Allowed next: [${allowedNext?.join(", ") || "None (terminal state)"}]`,
            currentOrder.status,
            newStatus
          );
        }

        // Step C: Handle CONFIRMED (atomic pre-check, usage limit lock, and physical stock deduction)
        if (newStatus === "CONFIRMED") {
          const items = await tx
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, currentOrder.id));

          // 1. Concurrency-safe promotion usage limit enforcement (DO NOT recalculate promotions!)
          const appliedPromoIds = [
            ...new Set(
              items
                .map((i) => i.promotionId)
                .filter((id): id is number => id !== null && id !== undefined)
            ),
          ];

          for (const promoId of appliedPromoIds) {
            const [promo] = await tx
              .select()
              .from(promotions)
              .where(eq(promotions.id, promoId))
              .for("update");

            if (promo && promo.usageLimit !== null && promo.timesUsed >= promo.usageLimit) {
              throw new PromotionUsageExceededError(
                `Cannot confirm order: Promotion "${promo.name}" has reached its usage limit (${promo.usageLimit}).`
              );
            }

            if (promo) {
              await tx
                .update(promotions)
                .set({ timesUsed: promo.timesUsed + 1, updatedAt: new Date() })
                .where(eq(promotions.id, promo.id));
            }
          }

          // 2. Aggregate physical quantities across split order-item rows by variant ID
          const physicalRequirements = new Map<
            number,
            {
              required: number;
              productName: string;
              unit: string;
            }
          >();

          for (const item of items) {
            if (!item.productVariantId) continue;
            const cur = physicalRequirements.get(item.productVariantId);
            if (cur) {
              cur.required += item.quantity;
            } else {
              physicalRequirements.set(item.productVariantId, {
                required: item.quantity,
                productName: item.productNameSnapshot,
                unit: item.variantUnitSnapshot,
              });
            }
          }

          const shortItems: Array<{
            variantId: number;
            productName: string;
            unit: string;
            required: number;
            available: number;
          }> = [];

          const variantStockMap = new Map<number, number>();

          // 3. Pre-check all variants with row lock FOR UPDATE
          for (const [variantId, req] of physicalRequirements.entries()) {
            const [variant] = await tx
              .select({
                id: productVariants.id,
                currentStock: productVariants.currentStock,
              })
              .from(productVariants)
              .where(eq(productVariants.id, variantId))
              .for("update");

            const available = variant?.currentStock ?? 0;
            if (!variant || available < req.required) {
              shortItems.push({
                variantId,
                productName: req.productName,
                unit: req.unit,
                required: req.required,
                available,
              });
            } else {
              variantStockMap.set(variantId, available);
            }
          }

          // If ANY physical item has insufficient stock, roll back the whole transaction
          if (shortItems.length > 0) {
            throw new InsufficientStockError(shortItems);
          }

          // 4. Deduct physical stock and insert inventory_movements
          for (const [variantId, req] of physicalRequirements.entries()) {
            const available = variantStockMap.get(variantId)!;

            await tx
              .update(productVariants)
              .set({
                currentStock: available - req.required,
                updatedAt: new Date(),
              })
              .where(eq(productVariants.id, variantId));

            await tx.insert(inventoryMovements).values({
              productVariantId: variantId,
              quantityChange: -req.required,
              reason: "ORDER_CONFIRMED",
              orderId: currentOrder.id,
              note: `Stock deducted on order confirmation (${currentOrder.orderCode})`,
            });
          }
        }

        // Step D: Handle CANCELLED (restore physical stock and decrement promotion usage if previously confirmed)
        if (newStatus === "CANCELLED") {
          if (
            currentOrder.status === "CONFIRMED" ||
            currentOrder.status === "PACKED"
          ) {
            const items = await tx
              .select()
              .from(orderItems)
              .where(eq(orderItems.orderId, currentOrder.id));

            // Aggregate physical quantities across split rows
            const physicalRequirements = new Map<number, number>();
            for (const item of items) {
              if (!item.productVariantId) continue;
              const cur = physicalRequirements.get(item.productVariantId) || 0;
              physicalRequirements.set(item.productVariantId, cur + item.quantity);
            }

            for (const [variantId, restoredQty] of physicalRequirements.entries()) {
              const [variant] = await tx
                .select({
                  id: productVariants.id,
                  currentStock: productVariants.currentStock,
                })
                .from(productVariants)
                .where(eq(productVariants.id, variantId))
                .for("update");

              if (variant) {
                const newStock = variant.currentStock + restoredQty;

                await tx
                  .update(productVariants)
                  .set({
                    currentStock: newStock,
                    updatedAt: new Date(),
                  })
                  .where(eq(productVariants.id, variantId));

                await tx.insert(inventoryMovements).values({
                  productVariantId: variantId,
                  quantityChange: restoredQty,
                  reason: "ORDER_CANCELLED",
                  orderId: currentOrder.id,
                  note: `Stock restored on order cancellation (${currentOrder.orderCode}, previous: ${currentOrder.status})`,
                });
              }
            }

            // Decrement timesUsed for any applied promotions
            const appliedPromoIds = [
              ...new Set(
                items
                  .map((i) => i.promotionId)
                  .filter((id): id is number => id !== null && id !== undefined)
              ),
            ];

            for (const promoId of appliedPromoIds) {
              await tx
                .update(promotions)
                .set({
                  timesUsed: sql`GREATEST(0, ${promotions.timesUsed} - 1)`,
                  updatedAt: new Date(),
                })
                .where(eq(promotions.id, promoId));
            }
          }
          // If cancelled from PENDING_WHATSAPP, stock and usage were never consumed.
        }

        // Step E: Handle DELIVERED payment status update
        let newPaymentStatus = currentOrder.paymentStatus;
        if (newStatus === "DELIVERED") {
          if (
            currentOrder.paymentMethod === "COD" ||
            currentOrder.paymentMethod === "UPI"
          ) {
            newPaymentStatus = "PAID";
          }
          // If ONLINE: leave paymentStatus untouched
        }

        // Step F: Update order status & payment status
        const [resultOrder] = await tx
          .update(orders)
          .set({
            status: newStatus,
            paymentStatus: newPaymentStatus,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, currentOrder.id))
          .returning();

        const adminUser =
          request.session?.get("adminUser") ||
          request.session?.adminUser;

        // Step G: Record in order_status_history
        await tx.insert(orderStatusHistory).values({
          orderId: currentOrder.id,
          status: newStatus,
          note: note?.trim() || null,
          changedByAdminId: adminUser?.id || null,
        });

        return resultOrder;
      });

      return reply.send({
        success: true,
        message: `Order status updated to ${newStatus}`,
        data: updatedOrder,
      });
    } catch (error: any) {
      if (error.message === "ORDER_NOT_FOUND") {
        return reply
          .status(404)
          .send({ success: false, message: "Order not found" });
      }
      if (error instanceof StatusTransitionError) {
        return reply.status(400).send({
          success: false,
          error: "INVALID_STATUS_TRANSITION",
          message: error.message,
          currentStatus: error.currentStatus,
          requestedStatus: error.requestedStatus,
        });
      }
      if (error instanceof InsufficientStockError) {
        return reply.status(409).send({
          success: false,
          error: "INSUFFICIENT_STOCK",
          message:
            "Cannot confirm order due to insufficient stock on one or more items.",
          shortItems: error.shortItems,
        });
      }
      if (error instanceof PromotionUsageExceededError) {
        return reply.status(409).send({
          success: false,
          error: "PROMOTION_USAGE_LIMIT_EXCEEDED",
          message: error.message,
        });
      }

      request.log.error(error);
      return reply.status(500).send({
        success: false,
        message: "Failed to update order status",
        error: error.message,
      });
    }
  });
}
