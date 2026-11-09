import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query<any[]>("SELECT * FROM store_settings LIMIT 1");
    if (rows && rows.length > 0) {
      const s = rows[0];
      // Do not leak SMTP password in public endpoint
      const { smtpPass, ...safeSettings } = s;
      return NextResponse.json({ settings: safeSettings });
    }

    return NextResponse.json({
      settings: {
        storeName: "Flavour House",
        email: "support@flavorhousefoods.com",
        phone: "+91 9876543210",
        address: "123 Organic Street, Kochi, Kerala, India",
        deliveryCharge: 50,
        minFreeDelivery: 500,
        storeAvailability: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

