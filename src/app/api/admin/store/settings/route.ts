import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBearerToken, verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const token = getBearerToken(request);
  if (!token) return false;
  const decoded = verifyToken(token);
  return Boolean(decoded && decoded.role === "admin");
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await query<any[]>("SELECT * FROM store_settings LIMIT 1");
    if (rows && rows.length > 0) {
      return NextResponse.json({ settings: rows[0] });
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
        orderNotificationEmail: "support@flavorhousefoods.com",
        smtpHost: "smtp.hostinger.com",
        smtpPort: 465,
        smtpUser: "support@flavorhousefoods.com",
        emailNotificationsEnabled: 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      storeName,
      logo,
      email,
      phone,
      address,
      deliveryCharge,
      minFreeDelivery,
      storeAvailability,
      facebookUrl,
      instagramUrl,
      youtubeUrl,
      orderNotificationEmail,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      emailNotificationsEnabled,
    } = body;

    const existing = await query<any[]>("SELECT id, smtpPass FROM store_settings LIMIT 1");

    if (existing && existing.length > 0) {
      const id = existing[0].id;
      // If smtpPass was not provided or empty, retain previous password
      const finalSmtpPass = smtpPass !== undefined && smtpPass !== "" ? smtpPass : existing[0].smtpPass;

      await query(
        `UPDATE store_settings SET
          storeName = ?,
          logo = ?,
          email = ?,
          phone = ?,
          address = ?,
          deliveryCharge = ?,
          minFreeDelivery = ?,
          storeAvailability = ?,
          facebookUrl = ?,
          instagramUrl = ?,
          youtubeUrl = ?,
          orderNotificationEmail = ?,
          smtpHost = ?,
          smtpPort = ?,
          smtpUser = ?,
          smtpPass = ?,
          emailNotificationsEnabled = ?,
          updatedAt = NOW()
        WHERE id = ?`,
        [
          storeName ?? "Flavour House",
          logo ?? null,
          email ?? null,
          phone ?? null,
          address ?? null,
          deliveryCharge !== undefined ? Number(deliveryCharge) : 50,
          minFreeDelivery !== undefined ? Number(minFreeDelivery) : 500,
          storeAvailability !== false ? 1 : 0,
          facebookUrl ?? null,
          instagramUrl ?? null,
          youtubeUrl ?? null,
          orderNotificationEmail ?? null,
          smtpHost ?? "smtp.hostinger.com",
          smtpPort !== undefined ? Number(smtpPort) : 465,
          smtpUser ?? null,
          finalSmtpPass ?? null,
          emailNotificationsEnabled !== false ? 1 : 0,
          id,
        ]
      );
    } else {
      await query(
        `INSERT INTO store_settings (
          storeName, logo, email, phone, address, deliveryCharge, minFreeDelivery,
          storeAvailability, facebookUrl, instagramUrl, youtubeUrl,
          orderNotificationEmail, smtpHost, smtpPort, smtpUser, smtpPass, emailNotificationsEnabled, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          storeName ?? "Flavour House",
          logo ?? null,
          email ?? null,
          phone ?? null,
          address ?? null,
          deliveryCharge !== undefined ? Number(deliveryCharge) : 50,
          minFreeDelivery !== undefined ? Number(minFreeDelivery) : 500,
          storeAvailability !== false ? 1 : 0,
          facebookUrl ?? null,
          instagramUrl ?? null,
          youtubeUrl ?? null,
          orderNotificationEmail ?? null,
          smtpHost ?? "smtp.hostinger.com",
          smtpPort !== undefined ? Number(smtpPort) : 465,
          smtpUser ?? null,
          smtpPass ?? null,
          emailNotificationsEnabled !== false ? 1 : 0,
        ]
      );
    }

    return NextResponse.json({ success: true, message: "Store & Email settings updated successfully." });
  } catch (error: any) {
    console.error("Store settings update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}

