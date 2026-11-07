import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:4000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { formData, cart, paymentMethod } = body;

    // Convert old format to backend format if necessary
    const customer = {
      fullName: formData?.fullName || "Guest Customer",
      email: formData?.email || "customer@example.com",
      phone: formData?.phone || "9999999999",
      alternatePhone: formData?.alternatePhone || null,
    };

    const deliveryAddress = {
      houseName: formData?.houseName || formData?.address || "Address",
      street: formData?.street || formData?.address || "Street",
      city: formData?.city || "Kochi",
      district: formData?.district || "",
      state: formData?.state || "Kerala",
      pincode: formData?.pincode || "682001",
      landmark: formData?.landmark || "",
    };

    const items = (cart || []).map((item: any) => ({
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
    }));

    const res = await fetch(`${BACKEND_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer,
        deliveryAddress,
        items,
        paymentMethod: paymentMethod === "online" ? "Online" : "COD",
      }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("Next.js checkout forward error:", err);
    return NextResponse.json({ error: "Failed to connect to backend: " + err.message }, { status: 500 });
  }
}
