import { NextResponse } from "next/server";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

async function updateStatusHandler(
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
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "New status is required" }, { status: 400 });
    }

    const currentOrder = await query<any[]>("SELECT status FROM orders WHERE id = ?", [id]);
    const previousStatus = currentOrder[0]?.status || null;

    await query("UPDATE orders SET status = ?, updatedAt = NOW() WHERE id = ?", [status, id]);

    try {
      await query(
        `INSERT INTO order_status_history (orderId, previousStatus, newStatus, changedAt, changedBy)
         VALUES (?, ?, ?, NOW(), 'Administrator')`,
        [id, previousStatus, status]
      );
    } catch (e) {}

    return NextResponse.json({ success: true, status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return updateStatusHandler(request, context);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return updateStatusHandler(request, context);
}
