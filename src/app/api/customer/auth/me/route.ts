import { NextResponse } from "next/server";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "customer") {
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
  }

  try {
    const rows = await query(`SELECT id, name, email, phone, createdAt FROM customers WHERE id = ? LIMIT 1`, [decoded.customerId]);
    if (Array.isArray(rows) && rows.length > 0) {
      return NextResponse.json({
        success: true,
        customer: rows[0],
      });
    }
  } catch (error: any) {
    console.error("Customer /me error:", error);
  }

  return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
}

