import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBearerToken, verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = getBearerToken(request);
  const decoded = token ? verifyToken(token) : null;
  const customerId = decoded?.customerId || decoded?.id;

  if (!customerId) {
    return NextResponse.json({ success: true, addresses: [] });
  }

  try {
    const addresses = await query<any[]>(
      `SELECT * FROM addresses WHERE customerId = ? ORDER BY isDefault DESC, createdAt DESC`,
      [customerId]
    );
    return NextResponse.json({ success: true, addresses });
  } catch (e: any) {
    return NextResponse.json({ success: true, addresses: [] });
  }
}

export async function POST(request: Request) {
  const token = getBearerToken(request);
  const decoded = token ? verifyToken(token) : null;
  const customerId = decoded?.customerId || decoded?.id;

  if (!customerId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fullName, phone, houseName, street, city, state, pincode, isDefault = 0 } = body;

    if (!houseName || !street || !city || !state || !pincode) {
      return NextResponse.json(
        { success: false, error: "All address fields are required." },
        { status: 400 }
      );
    }

    if (isDefault) {
      await query("UPDATE addresses SET isDefault = 0 WHERE customerId = ?", [customerId]);
    }

    const res = await query<any>(
      `INSERT INTO addresses (customerId, fullName, phone, houseName, street, city, state, pincode, isDefault, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [customerId, fullName || "", phone || "", houseName, street, city, state, pincode, isDefault ? 1 : 0]
    );

    return NextResponse.json({ success: true, addressId: res.insertId });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
