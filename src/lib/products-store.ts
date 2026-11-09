import fs from "fs";
import path from "path";
import { PRODUCTS, CATEGORIES } from "@/lib/data";

export interface StoredProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description?: string;
  inStock?: boolean;
  createdAt?: string;
}

// On Vercel (serverless), filesystem writes don't persist.
// reads work from the committed data/products.json
// writes are only supported on Node.js environments (Hostinger)
const IS_VERCEL = process.env.VERCEL === "1";
const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");

function initProductsFile(): StoredProduct[] {
  try {
    // On Vercel: try to read committed data/products.json
    if (fs.existsSync(PRODUCTS_FILE)) {
      const fileContent = fs.readFileSync(PRODUCTS_FILE, "utf8");
      if (fileContent.trim()) {
        return JSON.parse(fileContent);
      }
    }

    // Fallback to hardcoded data
    return PRODUCTS.map((p) => ({
      ...p,
      description: `${p.name} - Premium healthy organic millet product by Flavor House.`,
      inStock: true,
      createdAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error reading products.json, falling back to default PRODUCTS:", error);
    return PRODUCTS as StoredProduct[];
  }
}

export function getAllStoredProducts(): StoredProduct[] {
  return initProductsFile();
}

export function getStoredProductById(id: number | string): StoredProduct | undefined {
  const products = getAllStoredProducts();
  return products.find((p) => p.id.toString() === id.toString());
}

export function saveAllProducts(products: StoredProduct[]): boolean {
  if (IS_VERCEL) {
    console.warn("Cannot persist products on Vercel serverless. Use Hostinger admin panel.");
    return false;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Failed to save products:", error);
    return false;
  }
}

export function addStoredProduct(productData: {
  name: string;
  category: string;
  price: number;
  image: string;
  description?: string;
  inStock?: boolean;
}): StoredProduct {
  const products = getAllStoredProducts();
  const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);
  const newProduct: StoredProduct = {
    id: maxId + 1,
    name: productData.name.trim(),
    category: productData.category.trim() || "Pasta",
    price: Number(productData.price) || 0,
    image: productData.image.trim() || "/images/pasta.png",
    description: productData.description?.trim() || "",
    inStock: productData.inStock !== false,
    createdAt: new Date().toISOString(),
  };

  products.unshift(newProduct);
  saveAllProducts(products);
  return newProduct;
}

export function updateStoredProduct(
  id: number | string,
  updatedData: Partial<Omit<StoredProduct, "id">>
): StoredProduct | null {
  const products = getAllStoredProducts();
  const index = products.findIndex((p) => p.id.toString() === id.toString());

  if (index === -1) return null;

  const existing = products[index];
  const updatedProduct: StoredProduct = {
    ...existing,
    ...updatedData,
    id: existing.id,
  };

  products[index] = updatedProduct;
  saveAllProducts(products);
  return updatedProduct;
}

export function deleteStoredProduct(id: number | string): boolean {
  const products = getAllStoredProducts();
  const initialLength = products.length;
  const filtered = products.filter((p) => p.id.toString() !== id.toString());

  if (filtered.length === initialLength) return false;
  return saveAllProducts(filtered);
}

export function getAllCategories(): string[] {
  const products = getAllStoredProducts();
  const dynamicCategories = Array.from(new Set(products.map((p) => p.category)));
  const merged = Array.from(new Set([...CATEGORIES, ...dynamicCategories]));
  return merged;
}
