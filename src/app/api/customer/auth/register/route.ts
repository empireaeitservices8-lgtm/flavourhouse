import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { name, email, phone, password } = await request.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { success: false, error: "All fields are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Check existing customer
    const existing = await query(
      `SELECT id FROM customers WHERE LOWER(email) = ? OR phone = ? LIMIT 1`,
      [cleanEmail, cleanPhone]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "An account already exists with this email or phone." },
        { status: 409 }
      );
    }

    let passwordHash = password;
    try {
      const bcrypt = require("bcryptjs");
      passwordHash = await bcrypt.hash(password, 10);
    } catch {}

    const result = await query(
      `INSERT INTO customers (name, email, phone, passwordHash, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [name.trim(), cleanEmail, cleanPhone, passwordHash]
    );

    const customerId = (result as any).insertId;

    const token = signToken(
      { customerId, email: cleanEmail, role: "customer" },
      "30d"
    );

    return NextResponse.json({
      success: true,
      token,
      customer: {
        id: customerId,
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
      },
    });
  } catch (error: any) {
    console.error("Customer register error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create account." },
      { status: 500 }
    );
  }
}

