import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { emailOrPhone, password } = await request.json();
    const identifier = (emailOrPhone || "").trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Please enter your email/phone and password." },
        { status: 400 }
      );
    }

    const rows = await query(
      `SELECT id, name, email, phone, passwordHash, createdAt
       FROM customers
       WHERE LOWER(email) = ? OR phone = ?
       LIMIT 1`,
      [identifier.toLowerCase(), identifier]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No account found with this email or phone." },
        { status: 401 }
      );
    }

    const customer = rows[0];
    let isMatch = customer.passwordHash === password;
    if (!isMatch) {
      try {
        const bcrypt = require("bcryptjs");
        isMatch = await bcrypt.compare(password, customer.passwordHash);
      } catch {}
    }

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    const token = signToken(
      { customerId: customer.id, email: customer.email, role: "customer" },
      "30d"
    );

    return NextResponse.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        createdAt: customer.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Customer login error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process login." },
      { status: 500 }
    );
  }
}

