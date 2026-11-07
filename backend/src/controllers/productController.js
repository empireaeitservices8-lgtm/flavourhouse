const prisma = require("../config/db");

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

// GET /api/products (Public customer listing)
async function getProducts(req, res) {
  try {
    const { category, search, limit, page, sort } = req.query;

    const where = {
      isActive: true,
    };

    if (category && category !== "All") {
      where.OR = [
        { category: { name: { equals: category } } },
        { category: { slug: { equals: category.toLowerCase() } } },
      ];
    }

    if (search && search.trim()) {
      where.AND = [
        {
          OR: [
            { name: { contains: search.trim() } },
            { description: { contains: search.trim() } },
          ],
        },
      ];
    }

    let orderBy = { id: "asc" };
    if (sort === "price-asc") orderBy = { price: "asc" };
    if (sort === "price-desc") orderBy = { price: "desc" };
    if (sort === "name-asc") orderBy = { name: "asc" };
    if (sort === "newest") orderBy = { createdAt: "desc" };

    const take = limit ? parseInt(limit, 10) : undefined;
    const skip = page && limit ? (parseInt(page, 10) - 1) * parseInt(limit, 10) : undefined;

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        take,
        skip,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Format products for customer frontend compatibility
    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category?.name || "Uncategorized",
      categoryId: p.categoryId,
      price: p.price,
      discountPrice: p.discountPrice,
      image: p.image,
      description: p.description,
      stock: p.stock,
      inStock: p.stock > 0,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      SKU: p.SKU,
      createdAt: p.createdAt,
    }));

    return res.json(formatted);
  } catch (err) {
    console.error("getProducts error:", err);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
}

// GET /api/products/:id (Public single product by id or slug)
async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const isNum = !isNaN(Number(id));

    const product = await prisma.product.findFirst({
      where: isNum ? { id: Number(id) } : { slug: id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!product || (!product.isActive && !req.admin)) {
      return res.status(404).json({ error: "Product not found or unavailable." });
    }

    // Fetch related products from same category
    let relatedProducts = [];
    if (product.categoryId) {
      const related = await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          isActive: true,
          NOT: { id: product.id },
        },
        take: 4,
        include: { category: true },
      });
      relatedProducts = related.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category?.name || "Uncategorized",
        price: p.price,
        discountPrice: p.discountPrice,
        image: p.image,
        description: p.description,
        inStock: p.stock > 0,
      }));
    }

    return res.json({
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category?.name || "Uncategorized",
      categoryId: product.categoryId,
      price: product.price,
      discountPrice: product.discountPrice,
      image: product.image,
      description: product.description,
      stock: product.stock,
      inStock: product.stock > 0,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      SKU: product.SKU,
      createdAt: product.createdAt,
      relatedProducts,
    });
  } catch (err) {
    console.error("getProductById error:", err);
    return res.status(500).json({ error: "Failed to fetch product details" });
  }
}

// GET /api/admin/products (Admin list all)
async function getAdminProducts(req, res) {
  try {
    const { category, search, status } = req.query;

    const where = {};
    if (category && category !== "All") {
      where.OR = [
        { category: { name: { equals: category } } },
        { category: { slug: { equals: category.toLowerCase() } } },
      ];
    }

    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (status === "low-stock") where.stock = { lte: 10 };

    if (search && search.trim()) {
      where.AND = [
        {
          OR: [
            { name: { contains: search.trim() } },
            { SKU: { contains: search.trim() } },
          ],
        },
      ];
    }

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { id: "desc" },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category?.name || "Uncategorized",
      categoryId: p.categoryId,
      price: p.price,
      discountPrice: p.discountPrice,
      image: p.image,
      description: p.description,
      stock: p.stock,
      inStock: p.stock > 0,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      SKU: p.SKU,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return res.json({
      success: true,
      products: formatted,
      categories: categories.map((c) => c.name),
      categoryList: categories,
      total: formatted.length,
    });
  } catch (err) {
    console.error("getAdminProducts error:", err);
    return res.status(500).json({ success: false, error: "Failed to load admin products" });
  }
}

// POST /api/admin/products (Create product)
async function createProduct(req, res) {
  try {
    const { name, category, categoryId, price, discountPrice, image, description, stock, SKU, isActive, isFeatured } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Product name is required" });
    }
    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ success: false, error: "A valid positive price is required" });
    }

    let finalCategoryId = categoryId ? Number(categoryId) : null;
    if (!finalCategoryId && category) {
      const foundCat = await prisma.category.findFirst({
        where: { name: category.trim() },
      });
      if (foundCat) {
        finalCategoryId = foundCat.id;
      } else {
        const newCat = await prisma.category.create({
          data: {
            name: category.trim(),
            slug: slugify(category.trim()),
          },
        });
        finalCategoryId = newCat.id;
      }
    }

    let baseSlug = slugify(name);
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || "",
        image: image?.trim() || "https://images.unsplash.com/photo-1598720290281-9f26ae6d6f81",
        price: Number(price),
        discountPrice: discountPrice !== undefined && discountPrice !== null && discountPrice !== "" ? Number(discountPrice) : null,
        stock: stock !== undefined && !isNaN(Number(stock)) ? Number(stock) : 100,
        SKU: SKU?.trim() || `FH-${Date.now().toString().slice(-6)}`,
        isActive: isActive !== false,
        isFeatured: Boolean(isFeatured),
        categoryId: finalCategoryId,
      },
      include: {
        category: true,
      },
    });

    return res.status(201).json({
      success: true,
      product: {
        ...newProduct,
        category: newProduct.category?.name || "Uncategorized",
        inStock: newProduct.stock > 0,
      },
      message: "Product created successfully",
    });
  } catch (err) {
    console.error("createProduct error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to create product" });
  }
}

// PUT /api/admin/products/:id (Update product)
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, category, categoryId, price, discountPrice, image, description, stock, SKU, isActive, isFeatured } = req.body;

    const existing = await prisma.product.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    let finalCategoryId = existing.categoryId;
    if (categoryId !== undefined) {
      finalCategoryId = categoryId ? Number(categoryId) : null;
    } else if (category) {
      const foundCat = await prisma.category.findFirst({ where: { name: category.trim() } });
      if (foundCat) {
        finalCategoryId = foundCat.id;
      } else {
        const newCat = await prisma.category.create({
          data: { name: category.trim(), slug: slugify(category.trim()) },
        });
        finalCategoryId = newCat.id;
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = Number(price);
    if (discountPrice !== undefined) {
      updateData.discountPrice = discountPrice !== null && discountPrice !== "" ? Number(discountPrice) : null;
    }
    if (image !== undefined) updateData.image = image.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (stock !== undefined) updateData.stock = Number(stock);
    if (SKU !== undefined) updateData.SKU = SKU.trim();
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (finalCategoryId !== undefined) updateData.categoryId = finalCategoryId;

    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: updateData,
      include: { category: true },
    });

    return res.json({
      success: true,
      product: {
        ...updated,
        category: updated.category?.name || "Uncategorized",
        inStock: updated.stock > 0,
      },
      message: "Product updated successfully",
    });
  } catch (err) {
    console.error("updateProduct error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to update product" });
  }
}

// DELETE /api/admin/products/:id (Delete or deactivate safely)
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const numId = Number(id);

    const existing = await prisma.product.findUnique({
      where: { id: numId },
      include: { orderItems: { select: { id: true } } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // If product is part of previous orders, deactivate it instead of hard-deleting
    if (existing.orderItems && existing.orderItems.length > 0) {
      await prisma.product.update({
        where: { id: numId },
        data: { isActive: false, stock: 0 },
      });
      return res.json({
        success: true,
        message: "Product is associated with existing orders. It has been deactivated and removed from the customer catalog.",
        action: "deactivated",
      });
    }

    await prisma.product.delete({ where: { id: numId } });
    return res.json({
      success: true,
      message: "Product permanently deleted.",
      action: "deleted",
    });
  } catch (err) {
    console.error("deleteProduct error:", err);
    return res.status(500).json({ success: false, error: "Failed to delete product" });
  }
}

module.exports = {
  getProducts,
  getProductById,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};

