import { NextResponse } from "next/server";
import Razorpay from "razorpay";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay keys missing in environment variables");
      return NextResponse.json(
        { error: "Razorpay keys are missing. Please add NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local" },
        { status: 500 }
      );
    }

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: "rcpt_" + Date.now().toString(36),
    };

    const order = await instance.orders.create(options);

    return NextResponse.json({
      ...order,
      key_id: keyId,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { error: error?.error?.description || error.message || "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}

