import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { db, adminUsers, eq, and } from "@swami/database";
import { adminLoginSchema } from "@swami/shared";

export async function adminAuthRoutes(fastify: FastifyInstance) {
  // POST /api/v1/admin/auth/login - rate limited to 20 attempts per 10 minutes per IP
  fastify.post(
    "/login",
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: "10 minutes",
          hook: "preHandler",
          allowList: (req: any) => req.method === "OPTIONS",
          errorResponseBuilder: (req: any, context: any) => ({
            statusCode: 429,
            error: "RATE_LIMIT_EXCEEDED",
            message: `Too many login attempts. Please wait ${context.after} before trying again.`,
          }),
        },
      },
    },
    async (request, reply) => {
      const parseResult = adminLoginSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Invalid login payload",
          details: parseResult.error.format(),
        });
      }

      const { email, password } = parseResult.data;

      // Find active administrator by email
      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(and(eq(adminUsers.email, email), eq(adminUsers.isActive, true)))
        .limit(1);

      if (!admin) {
        return reply.status(401).send({
          success: false,
          error: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        });
      }

      // Verify password with bcrypt
      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (!isMatch) {
        return reply.status(401).send({
          success: false,
          error: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        });
      }

      // Update lastLoginAt timestamp
      await db
        .update(adminUsers)
        .set({ lastLoginAt: new Date() })
        .where(eq(adminUsers.id, admin.id));

      // Save user info in authenticated session
      const sessionUser = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      };

      request.session.set("adminUser", sessionUser);

      return {
        success: true,
        data: sessionUser,
      };
    }
  );

  // POST /api/v1/admin/auth/logout - destroys session and clears cookie
  fastify.post("/logout", async (request, reply) => {
    if (request.session) {
      await new Promise<void>((resolve, reject) => {
        request.session.destroy((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    reply.clearCookie("ssm_admin_session", { path: "/" });

    return {
      success: true,
      message: "Logged out successfully",
    };
  });

  // GET /api/v1/admin/auth/me - returns current session admin or 401
  fastify.get("/me", async (request, reply) => {
    const user = request.session.get("adminUser") || request.session.adminUser;
    if (!user || !user.id) {
      return reply.status(401).send({
        success: false,
        error: "UNAUTHORIZED",
        message: "Not authenticated as administrator",
      });
    }

    // Verify admin account remains active
    const [admin] = await db
      .select({ id: adminUsers.id, isActive: adminUsers.isActive, email: adminUsers.email, name: adminUsers.name })
      .from(adminUsers)
      .where(eq(adminUsers.id, user.id))
      .limit(1);

    if (!admin || !admin.isActive) {
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

    return {
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    };
  });
}
