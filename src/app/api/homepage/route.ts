import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
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
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

