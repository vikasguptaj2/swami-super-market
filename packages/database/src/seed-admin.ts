import bcrypt from "bcryptjs";
import { db, pool } from "./client.js";
import { adminUsers } from "./schema/admin_users.js";

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@swamisupermarket.com").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Store Manager";

  console.log(`🔐 Creating/updating admin user for: ${email}...`);

  const passwordHash = await bcrypt.hash(password, 10);

  const [admin] = await db
    .insert(adminUsers)
    .values({
      email,
      passwordHash,
      name,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: adminUsers.email,
      set: {
        passwordHash,
        name,
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning();

  console.log(`✅ Admin user configured successfully:`);
  console.log(`   ID:    ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Name:  ${admin.name}`);
  console.log(`   Role:  Active Administrator`);
  console.log(`👉 Login at /admin/login with email '${email}' and configured password.`);

  await pool.end();
}

seedAdmin().catch((err) => {
  console.error("❌ Failed to seed admin user:", err);
  process.exit(1);
});
