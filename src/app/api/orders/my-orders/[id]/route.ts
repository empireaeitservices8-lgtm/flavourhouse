import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBearerToken, verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getBearerToken(request);
    const decoded = token ? verifyToken(token) : null;
    const customerId = decoded?.customerId || decoded?.id;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to view this order." },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Order ID is required." }, { status: 400 });
    }

    let orderRows: any[] = [];
    if (!isNaN(Number(id))) {
      orderRows = await query<any[]>(
        `SELECT o.*, c.name as customerName, c.email as customerEmail, c.phone as customerPhone
         FROM orders o
         LEFT JOIN customers c ON o.customerId = c.id
         WHERE (o.id = ? OR o.orderNumber = ?) AND o.customerId = ?
         LIMIT 1`,
        [Number(id), id, customerId]
      );
    } else {
      orderRows = await query<any[]>(
        `SELECT o.*, c.name as customerName, c.email as customerEmail, c.phone as customerPhone
         FROM orders o
         LEFT JOIN customers c ON o.customerId = c.id
         WHERE o.orderNumber = ? AND o.customerId = ?
         LIMIT 1`,
        [id, customerId]
      );
    }

    if (!orderRows || orderRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order not found or you do not have permission to view this order." },
        { status: 404 }
      );
    }

    const order = orderRows[0];

    // Fetch items
    const items = await query<any[]>(
      `SELECT id, orderId, productId, productNameSnapshot, productImageSnapshot, quantity, unitPrice, totalPrice
       FROM order_items
       WHERE orderId = ?`,
      [order.id]
    );

    // Fetch status history
    let statusHistory: any[] = [];
    try {
      statusHistory = await query<any[]>(
        `SELECT id, previousStatus, newStatus, changedBy, changedAt
         FROM order_status_history
         WHERE orderId = ?
         ORDER BY changedAt ASC`,
        [order.id]
      );
    } catch {}

    let parsedAddress = order.deliveryAddress;
    if (typeof order.deliveryAddress === "string") {
      try {
        parsedAddress = JSON.parse(order.deliveryAddress);
      } catch {
        parsedAddress = { raw: order.deliveryAddress };
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: Number(order.subtotal || 0),
        deliveryCharge: Number(order.deliveryCharge || 0),
        discount: Number(order.discount || 0),
        totalAmount: Number(order.totalAmount || 0),
        deliveryAddress: parsedAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: items.map((it) => ({
          id: it.id,
          productNameSnapshot: it.productNameSnapshot,
          productImageSnapshot: it.productImageSnapshot,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          totalPrice: Number(it.totalPrice),
        })),
        statusHistory,
        customer: {
          name: order.customerName || parsedAddress?.fullName || "",
          email: order.customerEmail || parsedAddress?.email || "",
          phone: order.customerPhone || parsedAddress?.phone || "",
        },
      },
    });
  } catch (error: any) {
    console.error("Get customer order by id error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load order details." },
      { status: 500 }
    );
  }
}
