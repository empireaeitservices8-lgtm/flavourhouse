const express = require("express");
const fs = require("fs");
const path = require("path");
const { verifyToken } = require("./auth");
const router = express.Router();

// ── Data File Setup ────────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, "..", "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");

// Seed data - original 34 Flavor House products
const SEED_PRODUCTS = [
  // PASTA
  { id: 1, name: "Moringa Pasta Penne", category: "Pasta", price: 180, image: "https://plus.unsplash.com/premium_photo-1705404738201-8904bca55e2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Moringa Pasta Penne - Premium healthy organic millet product by Flavor House.", inStock: true },
  { id: 2, name: "Beetroot Pasta Penne", category: "Pasta", price: 180, image: "https://images.unsplash.com/photo-1598720290281-9f26ae6d6f81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Beetroot Pasta Penne - Premium healthy organic millet product by Flavor House.", inStock: true },
  { id: 3, name: "Little Grain Pasta Penne", category: "Pasta", price: 170, image: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Little Grain Pasta Penne - Premium healthy organic millet product.", inStock: true },
  { id: 4, name: "Foxtail Pasta Penne", category: "Pasta", price: 170, image: "https://images.unsplash.com/photo-1612966893103-790e549a2ab1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Foxtail Pasta Penne - Premium healthy organic millet product.", inStock: true },
  { id: 5, name: "Multi Grain Pasta Penne", category: "Pasta", price: 190, image: "https://plus.unsplash.com/premium_photo-1705404738522-9fbccb624cf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Multi Grain Pasta Penne - Premium healthy organic product.", inStock: true },
  { id: 6, name: "Ragi Pasta Penne", category: "Pasta", price: 170, image: "https://images.unsplash.com/photo-1587682725980-b9ac16626266?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Ragi Pasta Penne - Premium healthy organic millet product.", inStock: true },
  { id: 7, name: "Jackfruit Pasta Penne", category: "Pasta", price: 210, image: "https://images.unsplash.com/photo-1646953568310-8def6eb5a317?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Jackfruit Pasta Penne - Premium healthy organic millet product.", inStock: true },
  // VERMICELLI
  { id: 8, name: "Quinoa Vermicelli", category: "Vermicelli", price: 160, image: "https://plus.unsplash.com/premium_photo-1674025753567-48b817c5b62c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Quinoa Vermicelli - Premium healthy organic product.", inStock: true },
  { id: 9, name: "Little Vermicelli", category: "Vermicelli", price: 140, image: "https://images.unsplash.com/photo-1646338118864-6976f8182717?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Little Vermicelli - Premium healthy organic millet product.", inStock: true },
  { id: 10, name: "Foxtail Vermicelli", category: "Vermicelli", price: 140, image: "https://images.unsplash.com/photo-1722032393693-691b59565eaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Foxtail Vermicelli - Premium healthy organic millet product.", inStock: true },
  { id: 11, name: "Multi Grain Vermicelli", category: "Vermicelli", price: 150, image: "https://images.unsplash.com/photo-1710508803646-88f4fba75c11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Multi Grain Vermicelli - Premium healthy organic product.", inStock: true },
  { id: 12, name: "Ragi Vermicelli", category: "Vermicelli", price: 140, image: "https://plus.unsplash.com/premium_photo-1675338317134-cf4a9ee1f869?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Ragi Vermicelli - Premium healthy organic millet product.", inStock: true },
  { id: 13, name: "Moringa Vermicelli", category: "Vermicelli", price: 150, image: "https://images.unsplash.com/photo-1701480254009-53c2bf8a82ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Moringa Vermicelli - Premium healthy organic millet product.", inStock: true },
  { id: 14, name: "Horsegram Vermicelli", category: "Vermicelli", price: 150, image: "https://images.unsplash.com/photo-1677657094943-35ff0718211b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Horsegram Vermicelli - Premium healthy organic millet product.", inStock: true },
  // NOODLES
  { id: 15, name: "Multi Grain Noodles", category: "Noodles", price: 160, image: "https://plus.unsplash.com/premium_photo-1694670234085-4f38b261ce5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Multi Grain Noodles - Premium healthy organic product.", inStock: true },
  { id: 16, name: "Ragi Noodles", category: "Noodles", price: 150, image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Ragi Noodles - Premium healthy organic millet product.", inStock: true },
  { id: 17, name: "Moringa Noodles", category: "Noodles", price: 160, image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Moringa Noodles - Premium healthy organic millet product.", inStock: true },
  { id: 18, name: "Beetroot Noodles", category: "Noodles", price: 160, image: "https://images.unsplash.com/photo-1600490036275-35f5f1656861?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Beetroot Noodles - Premium healthy organic millet product.", inStock: true },
  { id: 19, name: "Horsegram Noodles", category: "Noodles", price: 150, image: "https://plus.unsplash.com/premium_photo-1694547926001-f2151e4a476b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Horsegram Noodles - Premium healthy organic product.", inStock: true },
  { id: 20, name: "Quinoa Noodles", category: "Noodles", price: 180, image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Quinoa Noodles - Premium healthy organic product.", inStock: true },
  { id: 21, name: "Little Noodles", category: "Noodles", price: 150, image: "https://images.unsplash.com/photo-1633352615955-f0c99e8b7e5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Little Noodles - Premium healthy organic millet product.", inStock: true },
  { id: 22, name: "Foxtail Noodles", category: "Noodles", price: 150, image: "https://images.unsplash.com/photo-1555126634-323283e090fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Foxtail Noodles - Premium healthy organic millet product.", inStock: true },
  // COOKIES
  { id: 23, name: "Jowar Jaggery Cookies", category: "Cookies", price: 120, image: "https://plus.unsplash.com/premium_photo-1668772704254-c4c4798b0e5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Jowar Jaggery Cookies - Premium healthy organic product.", inStock: true },
  { id: 24, name: "Choco Oats Nutrigen Cookies", category: "Cookies", price: 140, image: "https://images.unsplash.com/photo-1598839950984-034f6dc7b495?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Choco Oats Nutrigen Cookies - Premium healthy organic product.", inStock: true },
  { id: 25, name: "Multi Grain Jaggery Cookies", category: "Cookies", price: 130, image: "https://images.unsplash.com/photo-1557310717-d6bea9f36682?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Multi Grain Jaggery Cookies - Premium healthy organic product.", inStock: true },
  { id: 26, name: "Vanilla Oats Nutrigen Cookies", category: "Cookies", price: 130, image: "https://images.unsplash.com/photo-1576717585968-8ea8166b89b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Vanilla Oats Nutrigen Cookies - Premium healthy organic product.", inStock: true },
  { id: 27, name: "Fruit and Nuts Oats Nutrigen Cookies", category: "Cookies", price: 160, image: "https://plus.unsplash.com/premium_photo-1670895801135-858a7d167ea4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Fruit and Nuts Oats Nutrigen Cookies - Premium healthy organic product.", inStock: true },
  { id: 28, name: "Mocha Oats Nutrigen Cookies", category: "Cookies", price: 150, image: "https://images.unsplash.com/photo-1664854678365-ad59da72356c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Mocha Oats Nutrigen Cookies - Premium healthy organic product.", inStock: true },
  { id: 29, name: "Little Grain Jaggery Cookies", category: "Cookies", price: 120, image: "https://images.unsplash.com/photo-1571165841024-2ce92069301d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Little Grain Jaggery Cookies - Premium healthy organic product.", inStock: true },
  { id: 30, name: "Barnyard Jaggery Cookies", category: "Cookies", price: 120, image: "https://images.unsplash.com/photo-1673886089869-a9b1c71a8138?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Barnyard Jaggery Cookies - Premium healthy organic product.", inStock: true },
  { id: 31, name: "Foxtail Jaggery Cookies", category: "Cookies", price: 120, image: "https://plus.unsplash.com/premium_photo-1670895802275-ed748ced4309?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Foxtail Jaggery Cookies - Premium healthy organic product.", inStock: true },
  { id: 32, name: "Kodo Jaggery Cookies", category: "Cookies", price: 120, image: "https://images.unsplash.com/photo-1600147573971-a2135dbff47e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Kodo Jaggery Cookies - Premium healthy organic product.", inStock: true },
  { id: 33, name: "Ragi Jaggery Cookies", category: "Cookies", price: 120, image: "https://images.unsplash.com/photo-1505252784141-72a7a8073787?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Ragi Jaggery Cookies - Premium healthy organic product.", inStock: true },
  { id: 34, name: "Pearl Grain Jaggery Cookies", category: "Cookies", price: 120, image: "https://images.unsplash.com/photo-1554175231-8367073ba4e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", description: "Pearl Grain Jaggery Cookies - Premium healthy organic product.", inStock: true },
];

// ── Helper: read/write products.json ─────────────────────────────────────────
function readProducts() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PRODUCTS_FILE)) {
      // Seed initial data
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(SEED_PRODUCTS, null, 2), "utf8");
      return SEED_PRODUCTS;
    }
    const content = fs.readFileSync(PRODUCTS_FILE, "utf8");
    return content.trim() ? JSON.parse(content) : SEED_PRODUCTS;
  } catch (err) {
    console.error("Error reading products:", err.message);
    return SEED_PRODUCTS;
  }
}

function writeProducts(products) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing products:", err.message);
    return false;
  }
}

// ── GET /api/products - Public: list all products ─────────────────────────────
router.get("/", (req, res) => {
  const products = readProducts();
  res.json(products);
});

// ── GET /api/products/:id - Public: single product ────────────────────────────
router.get("/:id", (req, res) => {
  const products = readProducts();
  const product = products.find((p) => p.id.toString() === req.params.id.toString());
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

// ── GET /api/products/admin/all - Admin: products + categories ────────────────
router.get("/admin/all", verifyToken, (req, res) => {
  const products = readProducts();
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
  res.json({ products, categories });
});

// ── POST /api/products - Admin: create product ────────────────────────────────
router.post("/", verifyToken, (req, res) => {
  const { name, category, price, image, description, inStock } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Product name is required" });
  }
  if (price === undefined || isNaN(Number(price))) {
    return res.status(400).json({ error: "Valid price is required" });
  }

  const products = readProducts();
  const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);

  const newProduct = {
    id: maxId + 1,
    name: name.trim(),
    category: category?.trim() || "Pasta",
    price: Number(price),
    image: image?.trim() || "https://images.unsplash.com/photo-1598720290281-9f26ae6d6f81",
    description: description?.trim() || "",
    inStock: inStock !== false,
    createdAt: new Date().toISOString(),
  };

  products.unshift(newProduct);
  if (!writeProducts(products)) {
    return res.status(500).json({ error: "Failed to save product" });
  }

  res.status(201).json({ success: true, product: newProduct });
});

// ── PUT /api/products/:id - Admin: update product ─────────────────────────────
router.put("/:id", verifyToken, (req, res) => {
  const products = readProducts();
  const index = products.findIndex((p) => p.id.toString() === req.params.id.toString());

  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const { name, category, price, image, description, inStock } = req.body;
  const updated = {
    ...products[index],
    ...(name !== undefined && { name: name.trim() }),
    ...(category !== undefined && { category: category.trim() }),
    ...(price !== undefined && { price: Number(price) }),
    ...(image !== undefined && { image: image.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(inStock !== undefined && { inStock }),
    id: products[index].id, // keep ID unchanged
  };

  products[index] = updated;
  if (!writeProducts(products)) {
    return res.status(500).json({ error: "Failed to update product" });
  }

  res.json({ success: true, product: updated });
});

// ── DELETE /api/products/:id - Admin: delete product ──────────────────────────
router.delete("/:id", verifyToken, (req, res) => {
  const products = readProducts();
  const filtered = products.filter((p) => p.id.toString() !== req.params.id.toString());

  if (filtered.length === products.length) {
    return res.status(404).json({ error: "Product not found" });
  }

  if (!writeProducts(filtered)) {
    return res.status(500).json({ error: "Failed to delete product" });
  }

  res.json({ success: true, message: "Product deleted successfully" });
});

module.exports = router;

