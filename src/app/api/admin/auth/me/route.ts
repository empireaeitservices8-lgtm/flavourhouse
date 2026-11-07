import { NextResponse } from "next/server";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ ok: false, error: "No token provided" }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Invalid or expired token" }, { status: 401 });
  }

  try {
    const rows = await query("SELECT id, name, email FROM admins WHERE id = ? LIMIT 1", [decoded.adminId]);
    if (Array.isArray(rows) && rows.length > 0) {
      return NextResponse.json({
        ok: true,
        authenticated: true,
        admin: rows[0],
      });
    }
  } catch (e: any) {
    console.warn("DB lookup error in /me, returning decoded:", e.message);
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    admin: {
      id: decoded.adminId || 1,
      name: process.env.ADMIN_NAME || "Flavour House Admin",
      email: decoded.email || "admin@flavorhousefoods.com",
    },
  });
}

