import { NextResponse } from "next/server";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { sendTestEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = getBearerToken(request);
  const decoded = token ? verifyToken(token) : null;
  if (!decoded || decoded.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const toEmail = body.toEmail?.trim();

    if (!toEmail || !toEmail.includes("@")) {
      return NextResponse.json({ success: false, error: "Please provide a valid recipient email address." }, { status: 400 });
    }

    const result = await sendTestEmail(toEmail);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Test email failed" }, { status: 500 });
  }
}

