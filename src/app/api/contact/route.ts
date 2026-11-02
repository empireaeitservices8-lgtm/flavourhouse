import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const storeUrl = process.env.WC_STORE_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    if (!storeUrl || !consumerKey || !consumerSecret) {
      console.log("Contact form (no WC):", { name, email, phone, subject, message });
      return NextResponse.json({ success: true });
    }

    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] || "Unknown";
    const lastName = nameParts.slice(1).join(" ") || "";

    const authHeader =
      "Basic " + Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    console.log("🔵 Attempting WooCommerce customer creation for:", email);

    // ── Step 1: Try to find existing customer by email ──────────────────────
    let customerId: number | null = null;

    try {
      const lookupRes = await fetch(
        `${storeUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}&per_page=1`,
        { headers: { Authorization: authHeader } }
      );
      const lookupText = await lookupRes.text();
      console.log("🔍 Lookup status:", lookupRes.status, lookupText.substring(0, 200));

      if (lookupRes.ok) {
        const existing = JSON.parse(lookupText);
        if (Array.isArray(existing) && existing.length > 0) {
          customerId = existing[0].id;
          console.log("✅ Found existing customer:", customerId);
        }
      }
    } catch (e: any) {
      console.warn("Lookup failed:", e.message);
    }

    // ── Step 2: Create customer if not found ────────────────────────────────
    if (!customerId) {
      try {
        const createRes = await fetch(`${storeUrl}/wp-json/wc/v3/customers`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: authHeader },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email,
            username: email.split("@")[0] + "_" + Date.now(),
            billing: { first_name: firstName, last_name: lastName, email, phone },
          }),
        });

        const createText = await createRes.text();
        console.log("🆕 Create customer status:", createRes.status, createText.substring(0, 300));

        if (createRes.ok) {
          const created = JSON.parse(createText);
          customerId = created.id;
          console.log("✅ Created customer:", customerId);
        } else {
          // Check if it's a duplicate email error and re-lookup
          const errData = JSON.parse(createText);
          if (errData.code === "registration-error-email-exists") {
            const retryLookup = await fetch(
              `${storeUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}&per_page=1`,
              { headers: { Authorization: authHeader } }
            );
            if (retryLookup.ok) {
              const retryData = await retryLookup.json();
              if (Array.isArray(retryData) && retryData.length > 0) {
                customerId = retryData[0].id;
                console.log("✅ Found customer on retry:", customerId);
              }
            }
          } else {
            console.error("❌ Customer create failed:", errData);
            return NextResponse.json(
              { error: `WooCommerce error: ${errData.message || "Customer creation failed"}` },
              { status: 500 }
            );
          }
        }
      } catch (e: any) {
        console.error("Customer create exception:", e.message);
        return NextResponse.json({ error: "Failed to connect to WooCommerce" }, { status: 500 });
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: "Could not create or find customer" }, { status: 500 });
    }

    // ── Step 3: Save message as WordPress User Meta via REST API ───────────────
    // WooCommerce doesn't have a customer notes endpoint — we store as a note via
    // the WP REST API users endpoint instead
    const wpNoteKey = `contact_message_${Date.now()}`;
    try {
      const metaRes = await fetch(`${storeUrl}/wp-json/wc/v3/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({
          meta_data: [
            {
              key: wpNoteKey,
              value: `[${new Date().toISOString()}] Subject: ${subject} | Phone: ${phone}\n\nMessage: ${message}`,
            },
          ],
        }),
      });
      const metaText = await metaRes.text();
      console.log("📝 Meta update status:", metaRes.status, metaText.substring(0, 200));
    } catch (e: any) {
      console.warn("Meta update failed (non-fatal):", e.message);
    }

    console.log(`✅ Contact form → WooCommerce Customer #${customerId}`);
    return NextResponse.json({ success: true, customerId });

  } catch (error: any) {
    console.error("Contact API error:", error.message);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
