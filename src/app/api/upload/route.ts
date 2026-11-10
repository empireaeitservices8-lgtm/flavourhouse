import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";
import sharp from "sharp";

export const dynamic = "force-dynamic";

const TOKEN_VALUE = "flavorhouse_auth_session_token_valid";

async function isAuthorized(request: Request): Promise<boolean> {
  const token = getBearerToken(request);
  if (token) {
    if (token === TOKEN_VALUE) return true;
    const decoded = verifyToken(token);
    if (decoded && (decoded.role === "admin" || decoded.adminId)) return true;
  }

  try {
    const cookieStore = await cookies();
    const cToken = cookieStore.get("fh_admin_token");
    if (cToken) {
      if (cToken.value === TOKEN_VALUE) return true;
      const decoded = verifyToken(cToken.value);
      if (decoded && (decoded.role === "admin" || decoded.adminId)) return true;
    }
  } catch {}

  return false;
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const validMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/avif",
    ];

    if (!validMimes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPEG, PNG, WEBP, or SVG image." },
        { status: 400 }
      );
    }

    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const arrayBuffer = await file.arrayBuffer();
    let fileBuffer: Buffer = Buffer.from(arrayBuffer);
    let mimeType = file.type;

    // Optimize raster images using sharp for faster loading and compact DB storage
    if (file.type !== "image/svg+xml") {
      try {
        const optimized = await sharp(fileBuffer)
          .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
          .toBuffer();
        fileBuffer = Buffer.from(optimized);
      } catch (sharpError) {
        console.warn("Sharp optimization skipped, using original buffer:", sharpError);
      }
    }

    const result = await query<any>(
      `INSERT INTO uploaded_media (filename, mimeType, data, size, createdAt)
       VALUES (?, ?, ?, ?, NOW())`,
      [originalName, mimeType, fileBuffer, fileBuffer.length]
    );

    const insertId = result?.insertId;
    if (!insertId) {
      throw new Error("Failed to save media to database");
    }

    const publicUrl = `/api/media/${insertId}/${originalName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      id: insertId,
      filename: originalName,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
