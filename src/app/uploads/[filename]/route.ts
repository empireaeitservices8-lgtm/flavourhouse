import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;
    if (!filename) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Try extracting ID if formatted as "123_name.jpg"
    const match = filename.match(/^(\d+)_(.+)$/);
    let rows: any[] = [];

    if (match) {
      const id = parseInt(match[1], 10);
      rows = await query<any[]>(
        "SELECT mimeType, data FROM uploaded_media WHERE id = ? LIMIT 1",
        [id]
      );
    }

    if (!rows || rows.length === 0) {
      rows = await query<any[]>(
        "SELECT mimeType, data FROM uploaded_media WHERE filename = ? ORDER BY id DESC LIMIT 1",
        [filename]
      );
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const media = rows[0];
    const buffer = Buffer.isBuffer(media.data)
      ? media.data
      : Buffer.from(media.data);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": media.mimeType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Upload serving error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load upload" },
      { status: 500 }
    );
  }
}

