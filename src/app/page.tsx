import { HeroSection } from "@/components/home/HeroSection";
import { TrustIndicators } from "@/components/home/TrustIndicators";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { FeaturedProductsSection } from "@/components/home/FeaturedProductsSection";
import { ComboOffers } from "@/components/home/ComboOffers";
import { WhyMillets } from "@/components/home/WhyMillets";
import { StorySection } from "@/components/home/StorySection";
import { Newsletter } from "@/components/home/Newsletter";
import { getHomePageData } from "@/lib/wp";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const wpAcf = await getHomePageData();

  let dbHomeData: any = {};
  try {
    const rows = await query<any[]>("SELECT * FROM homepage_settings LIMIT 1");
    if (rows && rows.length > 0) {
      const s = rows[0];
      dbHomeData = {
        hero_image: s.heroImage,
        hero_badge: s.heroBadge,
        hero_title_part_1: s.heroTitlePart1,
        hero_title_part_2: s.heroTitlePart2,
        hero_description: s.heroDescription,
        hero_button_1_text: s.heroButton1Text,
        hero_button_1_link: s.heroButton1Link,
        hero_button_2_text: s.heroButton2Text,
        hero_button_2_link: s.heroButton2Link,
        hero_floating_badge_title: s.heroFloatingTitle,
        hero_floating_badge_subtitle: s.heroFloatingSubtitle,
        story_image: s.storyImage,
        story_badge: s.storyBadge,
        story_title_part_1: s.storyTitlePart1,
        story_title_part_2: s.storyTitlePart2,
        story_paragraph_1: s.storyParagraph1,
        story_paragraph_2: s.storyParagraph2,
        why_millets_image: s.whyMilletsImage,
        why_millets_floating_badge_title: s.whyMilletsTitle,
        why_millets_floating_badge_subtitle: s.whyMilletsSubtitle,
        banner1_image: s.banner1Image,
        banner1_title: s.banner1Title,
        banner1_link: s.banner1Link,
      };
    }
  } catch (err) {
    console.warn("Could not load homepage settings from DB:", err);
  }

  // Combine DB settings with WP/ACF fallback
  const acfData = {
    ...(wpAcf || {}),
    ...Object.fromEntries(Object.entries(dbHomeData).filter(([_, v]) => v !== null && v !== undefined && v !== "")),
  };

  return (
    <>
      <HeroSection acf={acfData} />
      <TrustIndicators acf={acfData} />
      <FeaturedCategories acf={acfData} />
      <FeaturedProductsSection />
      <ComboOffers acf={acfData} />
      <WhyMillets acf={acfData} />
      <StorySection acf={acfData} />
      <Newsletter acf={acfData} />
    </>
  );
}
