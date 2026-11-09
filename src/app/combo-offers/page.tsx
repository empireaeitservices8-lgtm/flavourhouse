import { getComboOffersPageData } from "@/lib/wp";
import { ComboOffersClient, ComboItem } from "./ComboOffersClient";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:4000";

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
    image: "/images/pasta.png",
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
    image: "/images/cookies.png",
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
    image: "/images/noodles.png",
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

  // 1. Fetch dynamic combos from combo_offers table in database
  const dynamicDbCombos: ComboItem[] = [];
  try {
    const rows = await query<any[]>("SELECT * FROM combo_offers WHERE isActive = 1 ORDER BY id DESC");
    if (rows && rows.length > 0) {
      rows.forEach((c) => {
        let itemsList: string[] = [];
        if (Array.isArray(c.items)) {
          itemsList = c.items;
        } else if (typeof c.items === "string") {
          try {
            itemsList = JSON.parse(c.items);
          } catch {
            itemsList = c.items.split(/\r?\n/).map((s: string) => s.trim()).filter(Boolean);
          }
        }

        const orig = Number(c.originalPrice) || 0;
        const offer = Number(c.offerPrice) || orig || 0;

        dynamicDbCombos.push({
          id: `combo-db-${c.id}`,
          name: c.name,
          subtitle: c.subtitle || "Special Offer Bundle",
          description: c.description || "",
          originalPrice: orig,
          offerPrice: offer,
          savings: c.savings || (orig > offer ? `${Math.round(((orig - offer) / orig) * 100)}% OFF` : ""),
          tag: c.tag || "SPECIAL OFFER",
          image: c.image || "/images/breakfast_bundle.png",
          items: itemsList.length > 0 ? itemsList : [c.name, "100% Organic", "Farm Fresh"],
        });
      });
    }
  } catch (err) {
    console.warn("Could not fetch DB combo_offers:", err);
  }

  // 2. Fallback to DEFAULT_COMBOS only if no combos in database
  const combosToDisplay = dynamicDbCombos.length > 0 ? dynamicDbCombos : DEFAULT_COMBOS;

  return <ComboOffersClient hero={hero} combos={combosToDisplay} />;
}
