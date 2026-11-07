const bcrypt = require("bcryptjs");
const prisma = require("./db");

/**
 * Initializes the initial developer admin account ONLY if no admin account exists in the database.
 * 
 * CRITICAL SECURITY GUARANTEE:
 * 1. If an admin account exists, this function does nothing.
 * 2. It will NEVER overwrite, reset, or restore credentials on server restart or redeployment.
 * 3. Once the admin changes their email or password in the admin panel, the developer-configured
 *    credentials permanently cease to exist, and only the database credentials are valid.
 */
async function initAdminAccount() {
  try {
    const adminCount = await prisma.admin.count();

    if (adminCount === 0) {
      const initialEmail = (process.env.ADMIN_EMAIL || "admin@flavorhouse.com").trim().toLowerCase();
      const initialPassword = process.env.ADMIN_PASSWORD || "flavourhouse@123";
      const initialName = process.env.ADMIN_NAME || "Flavour House Administrator";

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(initialPassword, salt);

      const created = await prisma.admin.create({
        data: {
          name: initialName,
          email: initialEmail,
          passwordHash: passwordHash,
        },
      });

      console.log(`🔐 Initial Developer Admin account securely seeded into MySQL: ${created.email}`);
    } else {
      console.log(`🛡️ Admin account verified in database (${adminCount} admin(s) present). Developer environment overrides disabled.`);
    }
  } catch (err) {
    console.error("⚠️ Error verifying initial admin account state:", err.message);
  }
}

module.exports = { initAdminAccount };

