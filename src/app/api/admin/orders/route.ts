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
    const orders = await query<any[]>(`
      SELECT o.*, c.name as customerName, c.email as customerEmail, c.phone as customerPhone,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.orderId = o.id) as itemCount
      FROM orders o
      LEFT JOIN customers c ON o.customerId = c.id
      ORDER BY o.createdAt DESC
    `);

    const formatted = orders.map((o) => {
      let parsedAddress = o.deliveryAddress;
      if (typeof o.deliveryAddress === "string") {
        try {
          parsedAddress = JSON.parse(o.deliveryAddress);
        } catch {
          parsedAddress = { raw: o.deliveryAddress };
        }
      }

      return {
        ...o,
        customerName: o.customerName || parsedAddress?.fullName || "Guest Customer",
        customerPhone: o.customerPhone || parsedAddress?.phone || "-",
        customerEmail: o.customerEmail || parsedAddress?.email || "-",
        deliveryAddress: parsedAddress,
        itemCount: Number(o.itemCount || 0),
        totalAmount: Number(o.totalAmount || 0),
      };
    });

    return NextResponse.json({ orders: formatted });
  } catch (e: any) {
    console.error("Admin orders error:", e);
    return NextResponse.json({ orders: [] });
  }
}
