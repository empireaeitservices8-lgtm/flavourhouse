import { NextResponse } from "next/server";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { query, pool } from "@/lib/db";

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
    const customers = await query<any[]>(
      `SELECT c.id, c.name, c.email, c.phone, c.alternatePhone, c.isActive, c.createdAt,
              COUNT(DISTINCT o.id) as orderCount,
              COALESCE(SUM(o.totalAmount), 0) as totalSpend
       FROM customers c
       LEFT JOIN orders o ON c.id = o.customerId
       WHERE c.id = ?
       GROUP BY c.id
       LIMIT 1`,
      [Number(id)]
    );

    if (!customers || customers.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customer = customers[0];

    // Fetch addresses
    const addresses = await query<any[]>(
      `SELECT * FROM addresses WHERE customerId = ? ORDER BY isDefault DESC, createdAt DESC`,
      [customer.id]
    );

    // Fetch orders
    const orders = await query<any[]>(
      `SELECT id, orderNumber, status, paymentMethod, paymentStatus, totalAmount, createdAt
       FROM orders
       WHERE customerId = ?
       ORDER BY createdAt DESC`,
      [customer.id]
    );

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name || "Customer",
        email: customer.email || "-",
        phone: customer.phone || "-",
        alternatePhone: customer.alternatePhone || null,
        isActive: customer.isActive === 1 || customer.isActive === true,
        orderCount: Number(customer.orderCount || 0),
        totalSpend: Number(customer.totalSpend || 0),
        createdAt: customer.createdAt,
        addresses: addresses || [],
        orders: orders || [],
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
  const customerId = Number(id);

  if (!customerId || isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Get all orders for this customer
    const [orders] = (await conn.query(
      "SELECT id FROM orders WHERE customerId = ?",
      [customerId]
    )) as any[];

    if (orders && orders.length > 0) {
      const orderIds = orders.map((o: any) => o.id);

      // Delete status history
      await conn.query(
        `DELETE FROM order_status_history WHERE orderId IN (${orderIds.map(() => "?").join(",")})`,
        orderIds
      );

      // Delete order items
      await conn.query(
        `DELETE FROM order_items WHERE orderId IN (${orderIds.map(() => "?").join(",")})`,
        orderIds
      );

      // Delete orders
      await conn.query(
        `DELETE FROM orders WHERE customerId = ?`,
        [customerId]
      );
    }

    // 2. Delete addresses
    await conn.query("DELETE FROM addresses WHERE customerId = ?", [customerId]);

    // 3. Delete customer record
    await conn.query("DELETE FROM customers WHERE id = ?", [customerId]);

    await conn.commit();

    return NextResponse.json({
      success: true,
      message: "Customer and all associated records permanently deleted.",
    });
  } catch (e: any) {
    await conn.rollback();
    console.error("Delete customer error:", e);
    return NextResponse.json({ error: e.message || "Failed to delete customer" }, { status: 500 });
  } finally {
    conn.release();
  }
}

