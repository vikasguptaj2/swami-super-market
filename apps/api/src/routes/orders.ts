import { FastifyInstance } from "fastify";
import {
  db,
  orders,
  orderItems,
  orderStatusHistory,
  productVariants,
  products,
  eq,
  inArray,
} from "@swami/database";
import { createOrderSchema } from "@swami/shared";
import { sendOrderNotification } from "../services/whatsapp/index.js";

export async function orderRoutes(app: FastifyInstance) {
  // 1. Create order
  app.post("/", async (request, reply) => {
    const parseResult = createOrderSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: "Order validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const { customerName, customerPhone, customerAddress, paymentMethod, items } =
      parseResult.data;

    const variantIds = items.map((i) => i.productVariantId);

    // 2. Fetch all requested variants and their parent products
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
        productStatus: products.status,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(inArray(productVariants.id, variantIds));

    const variantMap = new Map(requestedVariants.map((v) => [v.variantId, v]));

    // 3. Stock check & validation (Rule 3: stock is NOT deducted now)
    const orderItemSnapshots: {
      productVariantId: number;
      productName: string;
      variantUnit: string;
      unitPrice: string;
      quantity: number;
      lineTotal: string;
    }[] = [];

    let calculatedSubtotal = 0;

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

      const unitPriceNum = parseFloat(variant.sellingPrice);
      const lineTotalNum = unitPriceNum * item.quantity;
      calculatedSubtotal += lineTotalNum;

      orderItemSnapshots.push({
        productVariantId: variant.variantId,
        productName: variant.productName,
        variantUnit: variant.unit,
        unitPrice: unitPriceNum.toFixed(2),
        quantity: item.quantity,
        lineTotal: lineTotalNum.toFixed(2),
      });
    }

    const deliveryChargeNum = 0.0; // V1 free delivery in Usasa
    const totalAmountNum = calculatedSubtotal + deliveryChargeNum;

    // 4. Atomic transaction: create order, orderCode, order_items, order_status_history
    const { createdOrder, insertedItems } = await db.transaction(async (tx) => {
      // Insert order with initial placeholder code
      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderCode: `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          customerName,
          customerPhone,
          customerAddress,
          subtotal: calculatedSubtotal.toFixed(2),
          deliveryCharge: deliveryChargeNum.toFixed(2),
          totalAmount: totalAmountNum.toFixed(2),
          paymentMethod,
          paymentStatus: "PENDING",
          status: "PENDING_WHATSAPP",
        })
        .returning();

      // Atomic orderCode generated from the row's own serial ID (prevents race condition)
      const finalOrderCode = `SSM-${newOrder.id.toString().padStart(4, "0")}`;

      const [updatedOrder] = await tx
        .update(orders)
        .set({ orderCode: finalOrderCode })
        .where(eq(orders.id, newOrder.id))
        .returning();

      // Insert snapshot order items
      const itemsToInsert = orderItemSnapshots.map((snap) => ({
        orderId: updatedOrder.id,
        productVariantId: snap.productVariantId,
        productNameSnapshot: snap.productName,
        variantUnitSnapshot: snap.variantUnit,
        unitPriceSnapshot: snap.unitPrice,
        quantity: snap.quantity,
        lineTotal: snap.lineTotal,
      }));

      const inserted = await tx
        .insert(orderItems)
        .values(itemsToInsert)
        .returning();

      // Record first status history entry
      await tx.insert(orderStatusHistory).values({
        orderId: updatedOrder.id,
        status: "PENDING_WHATSAPP",
        note: "Order placed via website checkout",
      });

      return { createdOrder: updatedOrder, insertedItems: inserted };
    });

    // 5. Generate WhatsApp deep link
    const whatsappPayload = {
      orderCode: createdOrder.orderCode,
      customerName: createdOrder.customerName,
      customerPhone: createdOrder.customerPhone,
      customerAddress: createdOrder.customerAddress,
      subtotal: createdOrder.subtotal,
      deliveryCharge: createdOrder.deliveryCharge,
      totalAmount: createdOrder.totalAmount,
      paymentMethod: createdOrder.paymentMethod,
      items: insertedItems.map((item) => ({
        productName: item.productNameSnapshot,
        variantUnit: item.variantUnitSnapshot,
        unitPrice: item.unitPriceSnapshot,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
    };

    let whatsappResult;
    try {
      whatsappResult = sendOrderNotification(whatsappPayload);
    } catch (err: any) {
      request.log.error(err);
      // Even if WhatsApp formatting fails, return order data so customer is not stranded
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
