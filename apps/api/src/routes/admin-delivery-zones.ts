import { FastifyInstance } from "fastify";
import {
  db,
  deliveryZones,
  eq,
  asc,
} from "@swami/database";
import {
  createDeliveryZoneSchema,
  updateDeliveryZoneSchema,
} from "@swami/shared";

export async function adminDeliveryZoneRoutes(app: FastifyInstance) {
  // 1. GET / — list all delivery zones (active & inactive)
  app.get("/", async (request, reply) => {
    const list = await db
      .select()
      .from(deliveryZones)
      .orderBy(asc(deliveryZones.displayOrder), asc(deliveryZones.id));

    return reply.send({ success: true, data: list });
  });

  // 2. POST / — create new delivery zone
  app.post("/", async (request, reply) => {
    const parseResult = createDeliveryZoneSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: "Delivery zone validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const {
      name,
      hindiName,
      minOrderAmount,
      deliveryCharge,
      freeDeliveryAboveAmount,
      isActive,
      displayOrder,
    } = parseResult.data;

    const [created] = await db
      .insert(deliveryZones)
      .values({
        name,
        hindiName: hindiName || null,
        minOrderAmount: minOrderAmount.toFixed(2),
        deliveryCharge: deliveryCharge.toFixed(2),
        freeDeliveryAboveAmount:
          freeDeliveryAboveAmount !== null && freeDeliveryAboveAmount !== undefined
            ? freeDeliveryAboveAmount.toFixed(2)
            : null,
        isActive: isActive !== undefined ? isActive : true,
        displayOrder: displayOrder || 0,
      })
      .returning();

    return reply.status(201).send({
      success: true,
      message: "Delivery zone created successfully",
      data: created,
    });
  });

  // 3. PUT /:id — update delivery zone (fields or toggle isActive, no hard delete)
  app.put("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const zoneId = parseInt(id, 10);
    if (isNaN(zoneId)) {
      return reply.status(400).send({ success: false, message: "Invalid zone ID" });
    }

    const parseResult = updateDeliveryZoneSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: "Delivery zone update validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const [existing] = await db
      .select()
      .from(deliveryZones)
      .where(eq(deliveryZones.id, zoneId));

    if (!existing) {
      return reply.status(404).send({ success: false, message: "Delivery zone not found" });
    }

    const updatePayload: Record<string, any> = {};
    const d = parseResult.data;

    if (d.name !== undefined) updatePayload.name = d.name;
    if (d.hindiName !== undefined) updatePayload.hindiName = d.hindiName;
    if (d.minOrderAmount !== undefined)
      updatePayload.minOrderAmount = d.minOrderAmount.toFixed(2);
    if (d.deliveryCharge !== undefined)
      updatePayload.deliveryCharge = d.deliveryCharge.toFixed(2);
    if (d.freeDeliveryAboveAmount !== undefined) {
      updatePayload.freeDeliveryAboveAmount =
        d.freeDeliveryAboveAmount !== null ? d.freeDeliveryAboveAmount.toFixed(2) : null;
    }
    if (d.isActive !== undefined) updatePayload.isActive = d.isActive;
    if (d.displayOrder !== undefined) updatePayload.displayOrder = d.displayOrder;
    updatePayload.updatedAt = new Date();

    const [updated] = await db
      .update(deliveryZones)
      .set(updatePayload)
      .where(eq(deliveryZones.id, zoneId))
      .returning();

    return reply.send({
      success: true,
      message: "Delivery zone updated successfully",
      data: updated,
    });
  });
}
