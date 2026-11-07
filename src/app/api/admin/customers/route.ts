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
    const customers = await query<any[]>(`
      SELECT c.id, c.name, c.email, c.phone, c.alternatePhone, c.isActive, c.createdAt,
             COUNT(DISTINCT o.id) as orderCount,
             COALESCE(SUM(o.totalAmount), 0) as totalSpend
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customerId
      GROUP BY c.id
      ORDER BY c.createdAt DESC
    `);

    const formatted = customers.map((c) => ({
      id: c.id,
      name: c.name || "Customer",
      email: c.email || "-",
      phone: c.phone || "-",
      alternatePhone: c.alternatePhone || null,
      isActive: c.isActive === 1 || c.isActive === true,
      orderCount: Number(c.orderCount || 0),
      totalSpend: Number(c.totalSpend || 0),
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ customers: formatted });
  } catch (e: any) {
    console.error("Admin customers fetch error:", e);
    return NextResponse.json({ customers: [] });
  }
}
