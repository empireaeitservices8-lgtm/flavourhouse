import { NextResponse } from "next/server";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
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
    const { isActive } = body;

    const activeVal = isActive === true || isActive === 1 ? 1 : 0;
    await query("UPDATE customers SET isActive = ?, updatedAt = NOW() WHERE id = ?", [
      activeVal,
      Number(id),
    ]);

    return NextResponse.json({ success: true, isActive: Boolean(activeVal) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

