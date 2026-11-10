import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await context.params;
    if (!slug || slug.length === 0) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const firstSegment = slug[0];
    const maybeId = parseInt(firstSegment, 10);

    let rows: any[] = [];
    if (!isNaN(maybeId) && maybeId > 0) {
      rows = await query<any[]>(
        "SELECT mimeType, data FROM uploaded_media WHERE id = ? LIMIT 1",
        [maybeId]
      );
    } else {
      const filename = slug.join("/");
      rows = await query<any[]>(
        "SELECT mimeType, data FROM uploaded_media WHERE filename = ? ORDER BY id DESC LIMIT 1",
        [filename]
      );
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
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
    console.error("Media serving error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load media" },
      { status: 500 }
    );
  }
}

