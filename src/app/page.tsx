import { HeroSection } from "@/components/home/HeroSection";
import { TrustIndicators } from "@/components/home/TrustIndicators";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { ComboOffers } from "@/components/home/ComboOffers";
import { WhyMillets } from "@/components/home/WhyMillets";
import { StorySection } from "@/components/home/StorySection";
import { Newsletter } from "@/components/home/Newsletter";
import { getHomePageData } from "@/lib/wp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const acfData = await getHomePageData();

  return (
    <>
      <HeroSection acf={acfData} />
      <TrustIndicators acf={acfData} />
      <FeaturedCategories acf={acfData} />
      <ComboOffers acf={acfData} />
      <WhyMillets acf={acfData} />
      <StorySection acf={acfData} />
      <Newsletter acf={acfData} />
    </>
  );
}
