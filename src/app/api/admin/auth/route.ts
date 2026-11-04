import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "Fh@2026#SecureAdmin!";
const TOKEN_VALUE = "flavorhouse_auth_session_token_valid";

// GET - verify auth status
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("fh_admin_token");

  if (token && token.value === TOKEN_VALUE) {
    return NextResponse.json({ authenticated: true, username: ADMIN_USER });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

// POST - login
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const cookieStore = await cookies();
      cookieStore.set("fh_admin_token", TOKEN_VALUE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return NextResponse.json({ success: true, message: "Logged in successfully" });
    }

    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process login request" },
      { status: 500 }
    );
  }
}

// DELETE - logout
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("fh_admin_token");
  return NextResponse.json({ success: true, message: "Logged out" });
}

