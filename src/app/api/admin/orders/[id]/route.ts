import { NextResponse } from "next/server";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getBearerToken(request);
  const decoded = token ? verifyToken(token) : null;
  if (!decoded || decoded.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const orders = await query<any[]>(
      `SELECT o.*, c.name as customerName, c.email as customerEmail, c.phone as customerPhone
       FROM orders o
       LEFT JOIN customers c ON o.customerId = c.id
       WHERE o.id = ? OR o.orderNumber = ?
       LIMIT 1`,
      [Number(id) || 0, id]
    );

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orders[0];

    // Fetch items
    const items = await query<any[]>(
      `SELECT * FROM order_items WHERE orderId = ?`,
      [order.id]
    );

    // Fetch history
    let history: any[] = [];
    try {
      history = await query<any[]>(
        `SELECT * FROM order_status_history WHERE orderId = ? ORDER BY changedAt ASC`,
        [order.id]
      );
    } catch (e) {}

    let parsedAddress = order.deliveryAddress;
    if (typeof order.deliveryAddress === "string") {
      try {
        parsedAddress = JSON.parse(order.deliveryAddress);
      } catch (e) {
        parsedAddress = { raw: order.deliveryAddress };
      }
    }

    return NextResponse.json({
      order: {
        ...order,
        deliveryAddress: parsedAddress,
        items,
        history,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getBearerToken(request);
  const decoded = token ? verifyToken(token) : null;
  if (!decoded || decoded.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await query("DELETE FROM order_items WHERE orderId = ?", [id]);
    try {
      await query("DELETE FROM order_status_history WHERE orderId = ?", [id]);
    } catch (e) {}
    await query("DELETE FROM orders WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
