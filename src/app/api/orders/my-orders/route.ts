import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBearerToken, verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);
    const decoded = token ? verifyToken(token) : null;
    const customerId = decoded?.customerId || decoded?.id;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to view your orders." },
        { status: 401 }
      );
    }

    const orders = await query<any[]>(
      `SELECT * FROM orders WHERE customerId = ? ORDER BY createdAt DESC`,
      [customerId]
    );

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const orderIds = orders.map((o) => o.id);
    const items = await query<any[]>(
      `SELECT * FROM order_items WHERE orderId IN (${orderIds.map(() => "?").join(",")})`,
      orderIds
    );

    const itemsByOrder: Record<number, any[]> = {};
    for (const item of items) {
      if (!itemsByOrder[item.orderId]) {
        itemsByOrder[item.orderId] = [];
      }
      itemsByOrder[item.orderId].push({
        id: item.id,
        productNameSnapshot: item.productNameSnapshot,
        productImageSnapshot: item.productImageSnapshot,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      });
    }

    const formattedOrders = orders.map((o) => {
      let parsedAddress = o.deliveryAddress;
      if (typeof o.deliveryAddress === "string") {
        try {
          parsedAddress = JSON.parse(o.deliveryAddress);
        } catch {
          parsedAddress = { raw: o.deliveryAddress };
        }
      }

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        subtotal: Number(o.subtotal || 0),
        deliveryCharge: Number(o.deliveryCharge || 0),
        discount: Number(o.discount || 0),
        totalAmount: Number(o.totalAmount || 0),
        deliveryAddress: parsedAddress,
        createdAt: o.createdAt,
        items: itemsByOrder[o.id] || [],
      };
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error: any) {
    console.error("Get customer orders error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load orders." },
      { status: 500 }
    );
  }
}
