import { FastifyInstance } from "fastify";
import "@fastify/multipart";
import { uploadImageBuffer, isCloudinaryConfigured } from "../services/cloudinary/index.js";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

export async function adminUploadRoutes(fastify: FastifyInstance) {
  // POST /api/v1/admin/uploads/image
  fastify.post("/image", async (request, reply) => {
    if (!isCloudinaryConfigured()) {
      return reply.status(503).send({
        success: false,
        error: "CLOUDINARY_NOT_CONFIGURED",
        message:
          "Cloudinary credentials are not configured on the server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.",
      });
    }

    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({
          success: false,
          error: "FILE_MISSING",
          message: "No image file provided in multipart form upload",
        });
      }

      if (!ALLOWED_MIME_TYPES.includes(data.mimetype.toLowerCase())) {
        return reply.status(400).send({
          success: false,
          error: "INVALID_MIME_TYPE",
          message: `Unsupported file type: ${data.mimetype}. Allowed types: JPG, PNG, WebP, AVIF, GIF.`,
        });
      }

      const buffer = await data.toBuffer();

      if (buffer.length === 0) {
        return reply.status(400).send({
          success: false,
          error: "EMPTY_FILE",
          message: "Uploaded file is empty",
        });
      }

      const secureUrl = await uploadImageBuffer(buffer);

      return {
        success: true,
        data: {
          url: secureUrl,
          filename: data.filename,
          mimetype: data.mimetype,
          size: buffer.length,
        },
      };
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        error: "UPLOAD_FAILED",
        message: err.message || "Failed to upload image to Cloudinary",
      });
    }
  });
}
