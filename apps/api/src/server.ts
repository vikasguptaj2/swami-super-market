import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyMultipart from "@fastify/multipart";

import { catalogRoutes } from "./routes/catalog.js";
import { publicPromotionRoutes } from "./routes/promotions.js";
import { orderRoutes } from "./routes/orders.js";
import { adminAuthRoutes } from "./routes/admin-auth.js";
import { adminProductRoutes } from "./routes/admin-products.js";
import { adminOrderRoutes } from "./routes/admin-orders.js";
import { adminDeliveryZoneRoutes } from "./routes/admin-delivery-zones.js";
import { adminStoreSettingsRoutes } from "./routes/admin-store-settings.js";
import { adminUploadRoutes } from "./routes/admin-uploads.js";
import { adminPromotionRoutes } from "./routes/admin-promotions.js";
import { db, adminUsers, eq } from "@swami/database";

import { PostgresSessionStore } from "./services/session/store.js";

export async function buildServer() {
  // Validate mandatory SESSION_SECRET configuration across all environments
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret.trim().length < 32) {
    throw new Error(
      "FATAL CONFIGURATION ERROR: 'SESSION_SECRET' environment variable is required in all environments and must be at least 32 characters long."
    );
  }

  const app = Fastify({
    logger: true,
    trustProxy: true, // Accurately resolve client IP from X-Forwarded-For behind Nginx reverse proxy
  });

  // 1. Enable CORS with explicit allowed origins and credentials (Item 6)
  const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ];

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
  });

  // 2. Cookie & Session Plugins with persistent PostgreSQL session store
  await app.register(fastifyCookie);
  await app.register(fastifySession, {
    secret: sessionSecret,
    cookieName: "ssm_admin_session",
    store: new PostgresSessionStore(),
    cookie: {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    saveUninitialized: false,
  });

  // 3. Multipart Upload Plugin (Max 5MB per file)
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  // 4. Rate Limit Plugin (explicitly configured on sensitive routes like login)
  await app.register(fastifyRateLimit, {
    global: false,
  });

  // 5. Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "swami-super-market-api",
  }));

  // 6. Public API routes
  await app.register(catalogRoutes, { prefix: "/api/v1/catalog" });
  await app.register(publicPromotionRoutes, { prefix: "/api/v1/catalog/promotions" });
  await app.register(orderRoutes, { prefix: "/api/v1/orders" });

  // 7. Encapsulated Admin Tree under /api/v1/admin
  await app.register(
    async (adminScope) => {
      // A. Public Auth Routes (/api/v1/admin/auth/login, logout, me)
      await adminScope.register(adminAuthRoutes, { prefix: "/auth" });

      // B. Protected Admin Scope (Enforces authentication across all management routes)
      await adminScope.register(async (protectedScope) => {
        // ENFORCEMENT PREHANDLER HOOK: Runs before EVERY route in protectedScope
        protectedScope.addHook("preHandler", async (request, reply) => {
          const user =
            request.session?.get("adminUser") ||
            request.session?.adminUser;

          if (!user || !user.id) {
            return reply.status(401).send({
              success: false,
              error: "UNAUTHORIZED",
              message: "Admin authentication required. Please log in.",
            });
          }

          // Authoritative DB verification: Ensure admin account still exists and is ACTIVE
          const [admin] = await db
            .select({ id: adminUsers.id, isActive: adminUsers.isActive })
            .from(adminUsers)
            .where(eq(adminUsers.id, user.id))
            .limit(1);

          if (!admin || !admin.isActive) {
            // Invalidate session immediately
            if (request.session) {
              await new Promise<void>((resolve) => {
                request.session.destroy(() => resolve());
              });
            }
            reply.clearCookie("ssm_admin_session", { path: "/" });

            return reply.status(401).send({
              success: false,
              error: "ACCOUNT_DEACTIVATED",
              message: "Admin account is inactive or no longer exists.",
            });
          }
        });

        // Protected admin route plugins:
        await protectedScope.register(adminProductRoutes, { prefix: "/products" });
        await protectedScope.register(adminOrderRoutes, { prefix: "/orders" });
        await protectedScope.register(adminPromotionRoutes, { prefix: "/promotions" });
        await protectedScope.register(adminDeliveryZoneRoutes, {
          prefix: "/delivery-zones",
        });
        await protectedScope.register(adminStoreSettingsRoutes, {
          prefix: "/store-settings",
        });
        await protectedScope.register(adminUploadRoutes, {
          prefix: "/uploads",
        });
      });
    },
    { prefix: "/api/v1/admin" }
  );

  return app;
}
