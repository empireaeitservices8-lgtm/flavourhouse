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

// GET /api/categories (Public)
async function getCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    const formatted = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      productCount: c._count.products,
    }));

    return res.json(formatted);
  } catch (err) {
    console.error("getCategories error:", err);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
}

// POST /api/admin/categories
async function createCategory(req, res) {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Category name is required" });
    }

    const trimmed = name.trim();
    const slug = slugify(trimmed);

    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: trimmed }, { slug: slug }] },
    });
    if (existing) {
      return res.status(400).json({ success: false, error: "Category already exists" });
    }

    const category = await prisma.category.create({
      data: {
        name: trimmed,
        slug,
        description: description?.trim() || "",
      },
    });

    return res.status(201).json({ success: true, category, message: "Category created" });
  } catch (err) {
    console.error("createCategory error:", err);
    return res.status(500).json({ success: false, error: "Failed to create category" });
  }
}

// PUT /api/admin/categories/:id
async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existing = await prisma.category.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Category not found" });
    }

    const updateData = {};
    if (name) {
      updateData.name = name.trim();
      updateData.slug = slugify(name.trim());
    }
    if (description !== undefined) {
      updateData.description = description.trim();
    }

    const updated = await prisma.category.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return res.json({ success: true, category: updated, message: "Category updated" });
  } catch (err) {
    console.error("updateCategory error:", err);
    return res.status(500).json({ success: false, error: "Failed to update category" });
  }
}

// DELETE /api/admin/categories/:id
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const count = await prisma.product.count({ where: { categoryId: Number(id) } });
    if (count > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category. ${count} product(s) are assigned to it. Please reassign them first.`,
      });
    }

    await prisma.category.delete({ where: { id: Number(id) } });
    return res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    console.error("deleteCategory error:", err);
    return res.status(500).json({ success: false, error: "Failed to delete category" });
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

