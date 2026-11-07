import { NextResponse } from "next/server";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const rows = await query(`SELECT * FROM store_settings LIMIT 1`);
    const settings = Array.isArray(rows) && rows.length > 0 ? rows[0] : {
      storeName: "Flavour House",
      supportEmail: "flavorhousefoods@gmail.com",
      supportPhone: "+91 94471 23456",
      freeShippingThreshold: 500,
      standardShippingFee: 50,
    };
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({
      settings: {
        storeName: "Flavour House",
        supportEmail: "flavorhousefoods@gmail.com",
        supportPhone: "+91 94471 23456",
        freeShippingThreshold: 500,
        standardShippingFee: 50,
      },
    });
  }
}

export async function PUT(request: Request) {
  const token = getBearerToken(request);
  const decoded = token ? verifyToken(token) : null;
  if (!decoded || decoded.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { storeName, supportEmail, supportPhone, freeShippingThreshold, standardShippingFee } = body;

    await query(
      `UPDATE store_settings SET
         storeName = COALESCE(?, storeName),
         supportEmail = COALESCE(?, supportEmail),
         supportPhone = COALESCE(?, supportPhone),
         freeShippingThreshold = COALESCE(?, freeShippingThreshold),
         standardShippingFee = COALESCE(?, standardShippingFee),
         updatedAt = NOW()
       WHERE id = 1`,
      [storeName, supportEmail, supportPhone, freeShippingThreshold, standardShippingFee]
    );

    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update settings" }, { status: 500 });
  }
}

