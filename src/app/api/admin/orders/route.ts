import { NextResponse } from "next/server";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = getBearerToken(request);
  const decoded = token ? verifyToken(token) : null;
  if (!decoded || decoded.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await query(`
      SELECT o.*, c.name as customerName, c.email as customerEmail, c.phone as customerPhone
      FROM orders o
      LEFT JOIN customers c ON o.customerId = c.id
      ORDER BY o.createdAt DESC
    `);
    return NextResponse.json({ orders });
  } catch (e: any) {
    return NextResponse.json({ orders: [] });
  }
}

