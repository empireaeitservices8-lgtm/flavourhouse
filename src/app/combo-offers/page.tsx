import { getComboOffersPageData } from "@/lib/wp";
import { ComboOffersClient, ComboItem } from "./ComboOffersClient";

export const dynamic = "force-dynamic";

const DEFAULT_COMBOS: ComboItem[] = [
  {
    id: "pasta-delight-bundle",
    name: "Ultimate Pasta Delight Bundle",
    subtitle: "7 Premium Pasta Varieties",
    description: "Get all 7 signature varieties of our gourmet pasta penne. Perfect for wholesome family meals and gourmet dinners.",
    originalPrice: 1400,
    offerPrice: 1120,
    savings: "20% OFF",
    tag: "POPULAR",
    image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?q=80&w=1080&auto=format&fit=crop",
    items: [
      "Moringa Pasta Penne",
      "Beetroot Pasta Penne",
      "Little Grain Pasta Penne",
      "Foxtail Pasta Penne",
      "Multi Grain Pasta Penne",
      "Ragi Pasta Penne",
      "Jackfruit Pasta Penne",
    ],
  },
  {
    id: "wholesome-breakfast-pack",
    name: "Wholesome Breakfast Pack",
    subtitle: "Vermicelli + Noodles + Cookies",
    description: "Start your morning with energizing nutrition. Includes rich vermicelli, multi-grain noodles, and delicious jaggery cookies.",
    originalPrice: 950,
    offerPrice: 712,
    savings: "25% OFF",
    tag: "BEST SELLER",
    image: "/images/breakfast_bundle.png",
    items: [
      "Quinoa Vermicelli",
      "Multi Grain Noodles",
      "Jowar Jaggery Cookies",
      "Choco Oats Nutrigen Cookies",
    ],
  },
  {
    id: "gourmet-cookies-box",
    name: "Delight Snacking Box",
    subtitle: "6 Handcrafted Cookie Packs",
    description: "Pure guilt-free indulgence. Made with natural jaggery, whole oats, and zero refined sugar.",
    originalPrice: 1200,
    offerPrice: 1020,
    savings: "15% OFF",
    tag: "NEW",
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=1080&auto=format&fit=crop",
    items: [
      "Choco Oats Cookies",
      "Vanilla Oats Cookies",
      "Fruit & Nuts Cookies",
      "Multi Grain Cookies",
      "Mocha Oats Cookies",
      "Ragi Jaggery Cookies",
    ],
  },
  {
    id: "family-pantry-mega-bundle",
    name: "Family Pantry Mega Bundle",
    subtitle: "Complete Food Assortment",
    description: "The ultimate stock-up package for your home. Includes pasta, noodles, vermicelli, and cookies at an unbeatable discount.",
    originalPrice: 2200,
    offerPrice: 1650,
    savings: "25% OFF",
    tag: "SUPER VALUE",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1080&auto=format&fit=crop",
    items: [
      "3x Pasta Packs",
      "3x Noodles Packs",
      "3x Vermicelli Packs",
      "3x Cookie Packs",
    ],
  },
];

function parseImage(raw: any, fallback: string): string {
  if (!raw) return fallback;
  if (typeof raw === "string" && raw.trim().length > 0) return raw;
  if (typeof raw === "object" && raw.url) return raw.url;
  return fallback;
}

function parseItems(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string") {
    return raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function formatSavings(raw: any): string {
  if (!raw) return "";
  const str = String(raw).trim();
  if (str.includes("%") || str.toUpperCase().includes("OFF")) return str;
  return `${str}% OFF`;
}

export default async function ComboOffersPage() {
  const acf = await getComboOffersPageData();

  const hero = {
    badge: acf?.hero_badge || "Exclusive Value Bundles",
    title: acf?.hero_title || "Combo Offers",
    description:
      acf?.hero_description ||
      "Bundle and save with our curated packages. Enjoy premium organic food products delivered right to your door.",
  };

  const parsedCombos: ComboItem[] = [];

  // Check up to 8 potential combo slots in ACF
  for (let i = 1; i <= 8; i++) {
    const title = acf?.[`combo_${i}_title`];
    if (title && typeof title === "string" && title.trim().length > 0) {
      const origPrice = Number(acf[`combo_${i}_originalPrice`]) || 0;
      const offPrice = Number(acf[`combo_${i}_offerPrice`]) || origPrice || 0;
      const fallbackImg = DEFAULT_COMBOS[(i - 1) % DEFAULT_COMBOS.length]?.image || "/images/breakfast_bundle.png";

      parsedCombos.push({
        id: `combo-acf-${i}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: title.trim(),
        subtitle: acf[`combo_${i}_subtitle`] || "Special Combo Pack",
        description: acf[`combo_${i}_description`] || "",
        originalPrice: origPrice,
        offerPrice: offPrice,
        savings: formatSavings(acf[`combo_${i}_savings`]),
        tag: acf[`combo_${i}_tag`] || "SPECIAL OFFER",
        image: parseImage(acf[`combo_${i}_image`], fallbackImg),
        items: parseItems(acf[`combo_${i}_items`]),
      });
    }
  }

  // If ACF has combo offers defined, display them! Otherwise fall back to defaults
  const combosToDisplay = parsedCombos.length > 0 ? parsedCombos : DEFAULT_COMBOS;

  return <ComboOffersClient hero={hero} combos={combosToDisplay} />;
}
