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
    const customers = await query(`SELECT id, name, email, phone, createdAt FROM customers ORDER BY createdAt DESC`);
    return NextResponse.json({ customers });
  } catch (e: any) {
    return NextResponse.json({ customers: [] });
  }
}

