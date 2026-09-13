import Fastify from "fastify";
import cors from "@fastify/cors";
import { catalogRoutes } from "./routes/catalog.js";
import { adminProductRoutes } from "./routes/admin-products.js";
import { adminOrderRoutes } from "./routes/admin-orders.js";
import { orderRoutes } from "./routes/orders.js";

export async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  // Enable CORS
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "swami-super-market-api",
  }));

  // Register API routes
  await app.register(catalogRoutes, { prefix: "/api/v1/catalog" });
  await app.register(adminProductRoutes, { prefix: "/api/v1/admin/products" });
  await app.register(adminOrderRoutes, { prefix: "/api/v1/admin/orders" });
  await app.register(orderRoutes, { prefix: "/api/v1/orders" });

  return app;
}
