import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBearerToken, verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const token = getBearerToken(request);
  if (!token) return false;
  const decoded = verifyToken(token);
  return Boolean(decoded && decoded.role === "admin");
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await query<any[]>("SELECT * FROM homepage_settings LIMIT 1");
    if (rows && rows.length > 0) {
      return NextResponse.json({ settings: rows[0] });
    }

    return NextResponse.json({
      settings: {
        heroImage: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop",
        heroBadge: "Premium Organic Food",
        heroTitlePart1: "Rooted in Health.",
        heroTitlePart2: "Rich in Flavour.",
        heroDescription: "Discover premium organic foods made with wholesome ingredients and traditional goodness for modern lifestyles.",
        heroButton1Text: "Shop Products",
        heroButton1Link: "/products",
        heroButton2Text: "Explore Categories",
        heroButton2Link: "/products",
        heroFloatingTitle: "100% Natural",
        heroFloatingSubtitle: "Pure Nutrition",
        storyImage: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1080&auto=format&fit=crop",
        storyBadge: "Our Roots",
        storyTitlePart1: "Rooted in Health.",
        storyTitlePart2: "Rich in Flavour.",
        storyParagraph1: "Flavor House was founded with a simple yet powerful mission: to bring wholesome, authentic quality foods to modern dining tables without compromising on taste.",
        storyParagraph2: "We believe that pure food shouldn't be a compromise. By combining high quality natural ingredients with innovative recipes, we've created a range of products that are as delicious as they are nutritious.",
        whyMilletsImage: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=1080&auto=format&fit=crop",
        whyMilletsTitle: "100%",
        whyMilletsSubtitle: "Pure Organic Ingredients",
        banner1Image: "",
        banner1Title: "",
        banner1Link: "",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      heroImage,
      heroBadge,
      heroTitlePart1,
      heroTitlePart2,
      heroDescription,
      heroButton1Text,
      heroButton1Link,
      heroButton2Text,
      heroButton2Link,
      heroFloatingTitle,
      heroFloatingSubtitle,
      storyImage,
      storyBadge,
      storyTitlePart1,
      storyTitlePart2,
      storyParagraph1,
      storyParagraph2,
      whyMilletsImage,
      whyMilletsTitle,
      whyMilletsSubtitle,
      banner1Image,
      banner1Title,
      banner1Link,
    } = body;

    const existing = await query<any[]>("SELECT id FROM homepage_settings LIMIT 1");

    if (existing && existing.length > 0) {
      await query(
        `UPDATE homepage_settings SET
          heroImage = ?,
          heroBadge = ?,
          heroTitlePart1 = ?,
          heroTitlePart2 = ?,
          heroDescription = ?,
          heroButton1Text = ?,
          heroButton1Link = ?,
          heroButton2Text = ?,
          heroButton2Link = ?,
          heroFloatingTitle = ?,
          heroFloatingSubtitle = ?,
          storyImage = ?,
          storyBadge = ?,
          storyTitlePart1 = ?,
          storyTitlePart2 = ?,
          storyParagraph1 = ?,
          storyParagraph2 = ?,
          whyMilletsImage = ?,
          whyMilletsTitle = ?,
          whyMilletsSubtitle = ?,
          banner1Image = ?,
          banner1Title = ?,
          banner1Link = ?,
          updatedAt = NOW()
        WHERE id = ?`,
        [
          heroImage?.trim() || null,
          heroBadge?.trim() || null,
          heroTitlePart1?.trim() || null,
          heroTitlePart2?.trim() || null,
          heroDescription?.trim() || null,
          heroButton1Text?.trim() || null,
          heroButton1Link?.trim() || null,
          heroButton2Text?.trim() || null,
          heroButton2Link?.trim() || null,
          heroFloatingTitle?.trim() || null,
          heroFloatingSubtitle?.trim() || null,
          storyImage?.trim() || null,
          storyBadge?.trim() || null,
          storyTitlePart1?.trim() || null,
          storyTitlePart2?.trim() || null,
          storyParagraph1?.trim() || null,
          storyParagraph2?.trim() || null,
          whyMilletsImage?.trim() || null,
          whyMilletsTitle?.trim() || null,
          whyMilletsSubtitle?.trim() || null,
          banner1Image?.trim() || null,
          banner1Title?.trim() || null,
          banner1Link?.trim() || null,
          existing[0].id,
        ]
      );
    } else {
      await query(
        `INSERT INTO homepage_settings (
          heroImage, heroBadge, heroTitlePart1, heroTitlePart2, heroDescription,
          heroButton1Text, heroButton1Link, heroButton2Text, heroButton2Link,
          heroFloatingTitle, heroFloatingSubtitle,
          storyImage, storyBadge, storyTitlePart1, storyTitlePart2, storyParagraph1, storyParagraph2,
          whyMilletsImage, whyMilletsTitle, whyMilletsSubtitle,
          banner1Image, banner1Title, banner1Link, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          heroImage?.trim() || null,
          heroBadge?.trim() || null,
          heroTitlePart1?.trim() || null,
          heroTitlePart2?.trim() || null,
          heroDescription?.trim() || null,
          heroButton1Text?.trim() || null,
          heroButton1Link?.trim() || null,
          heroButton2Text?.trim() || null,
          heroButton2Link?.trim() || null,
          heroFloatingTitle?.trim() || null,
          heroFloatingSubtitle?.trim() || null,
          storyImage?.trim() || null,
          storyBadge?.trim() || null,
          storyTitlePart1?.trim() || null,
          storyTitlePart2?.trim() || null,
          storyParagraph1?.trim() || null,
          storyParagraph2?.trim() || null,
          whyMilletsImage?.trim() || null,
          whyMilletsTitle?.trim() || null,
          whyMilletsSubtitle?.trim() || null,
          banner1Image?.trim() || null,
          banner1Title?.trim() || null,
          banner1Link?.trim() || null,
        ]
      );
    }

    return NextResponse.json({ success: true, message: "Homepage images & content updated successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
