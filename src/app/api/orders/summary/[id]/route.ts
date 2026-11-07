import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: "Order ID or order number is required" }, { status: 400 });
    }

    let orderRows: any[] = [];
    if (!isNaN(Number(id))) {
      orderRows = await query<any[]>(
        `SELECT o.*, c.name as customerName, c.phone as customerPhone, c.email as customerEmail
         FROM orders o
         LEFT JOIN customers c ON o.customerId = c.id
         WHERE o.id = ? OR o.orderNumber = ?
         LIMIT 1`,
        [Number(id), id]
      );
    } else {
      orderRows = await query<any[]>(
        `SELECT o.*, c.name as customerName, c.phone as customerPhone, c.email as customerEmail
         FROM orders o
         LEFT JOIN customers c ON o.customerId = c.id
         WHERE o.orderNumber = ?
         LIMIT 1`,
        [id]
      );
    }

    if (!orderRows || orderRows.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const order = orderRows[0];

    // Fetch items
    const items = await query<any[]>(
      `SELECT id, orderId, productId, productNameSnapshot, productImageSnapshot, quantity, unitPrice, totalPrice
       FROM order_items
       WHERE orderId = ?`,
      [order.id]
    );

    let parsedAddress = order.deliveryAddress;
    if (typeof order.deliveryAddress === "string") {
      try {
        parsedAddress = JSON.parse(order.deliveryAddress);
      } catch (e) {
        parsedAddress = { raw: order.deliveryAddress };
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal || 0),
        deliveryCharge: Number(order.deliveryCharge || 0),
        discount: Number(order.discount || 0),
        totalAmount: Number(order.totalAmount || 0),
        createdAt: order.createdAt,
        deliveryAddress: parsedAddress,
        customerName: order.customerName || parsedAddress?.fullName || "Valued Customer",
        items: items.map((it) => ({
          id: it.id,
          productNameSnapshot: it.productNameSnapshot,
          productImageSnapshot: it.productImageSnapshot,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          totalPrice: Number(it.totalPrice),
        })),
      },
    });
  } catch (error: any) {
    console.error("Order summary error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load order summary" },
      { status: 500 }
    );
  }
}
