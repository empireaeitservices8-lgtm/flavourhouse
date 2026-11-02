import { getAboutPageData } from "@/lib/wp";
import { AboutClient } from "./AboutClient";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const acf = await getAboutPageData();

  return <AboutClient acf={acf} />;
}
