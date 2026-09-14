import { FastifyInstance } from "fastify";
import { db, storeSettings, eq } from "@swami/database";
import { updateStoreSettingsSchema } from "@swami/shared";

export async function adminStoreSettingsRoutes(app: FastifyInstance) {
  // 1. GET / — get singleton store settings
  app.get("/", async (request, reply) => {
    const [settings] = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.id, 1))
      .limit(1);

    if (!settings) {
      return reply.status(404).send({
        success: false,
        message: "Store settings not found",
      });
    }

    return reply.send({ success: true, data: settings });
  });

  // 2. PUT / — update singleton store settings (upsert id = 1)
  app.put("/", async (request, reply) => {
    const parseResult = updateStoreSettingsSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: "Store settings validation failed",
        errors: parseResult.error.flatten(),
      });
    }

    const {
      address,
      hindiAddress,
      phoneNumber,
      whatsappNumber,
      googleMapsUrl,
      mapsEmbedUrl,
      openingHoursText,
      photos,
    } = parseResult.data;

    const [updated] = await db
      .insert(storeSettings)
      .values({
        id: 1,
        address,
        hindiAddress: hindiAddress || null,
        phoneNumber,
        whatsappNumber,
        googleMapsUrl: googleMapsUrl || null,
        mapsEmbedUrl: mapsEmbedUrl || null,
        openingHoursText: openingHoursText || null,
        photos: photos || [],
      })
      .onConflictDoUpdate({
        target: storeSettings.id,
        set: {
          address,
          hindiAddress: hindiAddress || null,
          phoneNumber,
          whatsappNumber,
          googleMapsUrl: googleMapsUrl || null,
          mapsEmbedUrl: mapsEmbedUrl || null,
          openingHoursText: openingHoursText || null,
          photos: photos || [],
          updatedAt: new Date(),
        },
      })
      .returning();

    return reply.send({
      success: true,
      message: "Store settings updated successfully",
      data: updated,
    });
  });
}
