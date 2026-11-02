import { NextResponse } from "next/server";
import { api } from "@/lib/woocommerce";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { formData, cart, paymentMethod, shippingFee, transactionId } = body;

    // WooCommerce requires first_name and last_name, so we split fullName if possible
    const nameParts = formData.fullName.trim().split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "";

    const isPaid = paymentMethod === "online";

    // Standardize Indian State codes for WooCommerce and Shiprocket integration
    const stateCodeMap: Record<string, string> = {
      "Kerala": "KL",
      "Tamil Nadu": "TN",
      "Karnataka": "KA",
      "Maharashtra": "MH",
      "Andhra Pradesh": "AP",
      "Telangana": "TS",
      "Delhi": "DL",
      "Gujarat": "GJ",
      "Uttar Pradesh": "UP",
    };
    const stateCode = stateCodeMap[formData.state] || formData.state || "KL";

    const orderData = {
      payment_method: isPaid ? "razorpay" : "cod",
      payment_method_title: paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay (Online)",
      set_paid: isPaid,
      status: "processing", // Standard WooCommerce status for new actionable orders, picked up instantly by Shiprocket
      transaction_id: transactionId || "",
      billing: {
        first_name: firstName,
        last_name: lastName,
        address_1: formData.address,
        city: formData.city,
        state: stateCode,
        postcode: formData.pincode,
        country: "IN",
        email: formData.email,
        phone: formData.phone,
      },
      shipping: {
        first_name: firstName,
        last_name: lastName,
        address_1: formData.address,
        city: formData.city,
        state: stateCode,
        postcode: formData.pincode,
        country: "IN",
      },
    };

    // Separate regular WooCommerce products and custom bundle/combo items
    const lineItems: any[] = [];
    const feeLines: any[] = [];
    const comboNotes: string[] = [];

    cart.forEach((item: any) => {
      const numId = parseInt(item.id, 10);
      if (!isNaN(numId) && numId > 0) {
        lineItems.push({
          product_id: numId,
          quantity: item.quantity,
        });
      } else {
        // Custom combo/bundle from ACF without standard WooCommerce product ID
        feeLines.push({
          name: `${item.name} (Qty: ${item.quantity})`,
          total: (item.price * item.quantity).toString(),
        });
        comboNotes.push(`${item.name} x${item.quantity}`);
      }
    });

    const fullOrderData = {
      ...orderData,
      line_items: lineItems,
      fee_lines: feeLines,
      shipping_lines: [
        {
          method_id: "flat_rate",
          method_title: "Flat Rate",
          total: shippingFee.toString(),
        },
      ],
      customer_note: comboNotes.length > 0 ? `Bundles Ordered: ${comboNotes.join(", ")}` : "",
    };

    if (!process.env.WC_STORE_URL || !process.env.WC_CONSUMER_KEY) {
      console.log("WooCommerce not configured, returning mock order.", fullOrderData);
      return NextResponse.json({ id: "FH-MOCK-" + Math.floor(1000 + Math.random() * 9000) });
    }

    const response = await api.post("orders", fullOrderData);
    
    return NextResponse.json({
      id: response.data.id,
      status: response.data.status,
    });
  } catch (error: any) {
    console.error("WooCommerce checkout error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Failed to process order" },
      { status: 500 }
    );
  }
}
