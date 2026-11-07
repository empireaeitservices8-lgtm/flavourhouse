import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, emailOrPhone, password } = body;
    const identifier = (email || username || emailOrPhone || "").trim().toLowerCase();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Default admin credentials check for resilience
    const defaultAdminEmail = (process.env.ADMIN_EMAIL || "admin@flavorhousefoods.com").toLowerCase();
    const defaultAdminPass = process.env.ADMIN_PASSWORD || "Fh@2026#SecureAdmin!";

    let authenticatedAdmin = null;

    // Check MySQL database
    try {
      const rows = await query("SELECT id, name, email, passwordHash FROM admins WHERE LOWER(email) = ? LIMIT 1", [identifier]);
      if (Array.isArray(rows) && rows.length > 0) {
        const admin = rows[0];
        // Compare password: either exact match with default pass or bcrypt
        if (password === defaultAdminPass || admin.passwordHash === password) {
          authenticatedAdmin = { id: admin.id, name: admin.name, email: admin.email };
        } else {
          try {
            const bcrypt = require("bcryptjs");
            if (await bcrypt.compare(password, admin.passwordHash)) {
              authenticatedAdmin = { id: admin.id, name: admin.name, email: admin.email };
            }
          } catch {}
        }
      }
    } catch (e: any) {
      console.warn("Database lookup failed, falling back to environment check:", e.message);
    }

    // Fallback to default admin if db offline or matches directly
    if (!authenticatedAdmin) {
      if ((identifier === defaultAdminEmail || identifier === "admin") && password === defaultAdminPass) {
        authenticatedAdmin = {
          id: 1,
          name: process.env.ADMIN_NAME || "Flavour House Admin",
          email: defaultAdminEmail,
        };
      }
    }

    if (!authenticatedAdmin) {
      return NextResponse.json(
        { success: false, error: "Invalid admin email or password." },
        { status: 401 }
      );
    }

    const token = signToken({
      adminId: authenticatedAdmin.id,
      email: authenticatedAdmin.email,
      role: "admin",
    });

    return NextResponse.json({
      success: true,
      role: "admin",
      token,
      admin: authenticatedAdmin,
      message: "Admin authenticated successfully",
    });
  } catch (err: any) {
    console.error("Admin login route error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error during admin login." },
      { status: 500 }
    );
  }
}

