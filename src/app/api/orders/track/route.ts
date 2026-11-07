import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

function normalizePhone(phone: any): string {
  if (!phone) return "";
  const cleaned = phone.toString().replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.slice(2);
  }
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return cleaned.slice(1);
  }
  return cleaned;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber")?.trim();
    const phone = searchParams.get("phone")?.trim();

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { success: false, error: "Both Order Number and Phone Number are required." },
        { status: 400 }
      );
    }

    const normPhone = normalizePhone(phone);

    const orderRows = await query<any[]>(
      `SELECT o.*, c.name as customerName, c.phone as customerPhone, c.email as customerEmail
       FROM orders o
       LEFT JOIN customers c ON o.customerId = c.id
       WHERE o.orderNumber = ?
       LIMIT 1`,
      [orderNumber]
    );

    if (!orderRows || orderRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No order found matching this Order Number." },
        { status: 404 }
      );
    }

    const order = orderRows[0];
    const customerPhoneNorm = normalizePhone(order.customerPhone || "");

    // Verify phone against customer record or address JSON
    let addressPhoneNorm = "";
    let parsedAddress = order.deliveryAddress;
    if (typeof order.deliveryAddress === "string") {
      try {
        parsedAddress = JSON.parse(order.deliveryAddress);
        addressPhoneNorm = normalizePhone(parsedAddress?.phone || "");
      } catch (e) {}
    } else if (order.deliveryAddress) {
      addressPhoneNorm = normalizePhone(order.deliveryAddress.phone || "");
    }

    if (
      normPhone !== customerPhoneNorm &&
      normPhone !== addressPhoneNorm &&
      !customerPhoneNorm.endsWith(normPhone) &&
      !addressPhoneNorm.endsWith(normPhone)
    ) {
      return NextResponse.json(
        { success: false, error: "The phone number does not match this order's contact details." },
        { status: 403 }
      );
    }

    // Fetch items
    const items = await query<any[]>(
      `SELECT id, orderId, productId, productNameSnapshot, productImageSnapshot, quantity, unitPrice, totalPrice
       FROM order_items
       WHERE orderId = ?`,
      [order.id]
    );

    // Fetch status history
    let history: any[] = [];
    try {
      history = await query<any[]>(
        `SELECT id, orderId, previousStatus, newStatus, changedAt, changedBy
         FROM order_status_history
         WHERE orderId = ?
         ORDER BY changedAt ASC`,
        [order.id]
      );
    } catch (e) {}

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
        updatedAt: order.updatedAt,
        deliveryAddress: parsedAddress,
        customerName: order.customerName || parsedAddress?.fullName || "Valued Customer",
        items,
        history,
      },
    });
  } catch (error: any) {
    console.error("Track order error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve order tracking details." },
      { status: 500 }
    );
  }
}
