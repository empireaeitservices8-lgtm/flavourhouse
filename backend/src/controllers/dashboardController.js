const prisma = require("../config/db");

// GET /api/admin/dashboard/stats
async function getDashboardStats(req, res) {
  try {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      outForDeliveryOrders,
      deliveredOrders,
      cancelledOrders,
      totalCustomers,
      totalProducts,
      activeProducts,
      lowStockProducts,
      revenueResult,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "Pending" } }),
      prisma.order.count({ where: { status: "Confirmed" } }),
      prisma.order.count({ where: { status: "Shipped" } }),
      prisma.order.count({ where: { status: "Out for Delivery" } }),
      prisma.order.count({ where: { status: "Delivered" } }),
      prisma.order.count({ where: { status: "Cancelled" } }),
      prisma.customer.count(),
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { stock: { lte: 10 } } }),
      prisma.order.aggregate({
        where: { status: { not: "Cancelled" } },
        _sum: { totalAmount: true },
      }),
    ]);

    const totalRevenue = revenueResult._sum.totalAmount || 0;

    return res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        confirmedOrders,
        shippedOrders,
        outForDeliveryOrders,
        deliveredOrders,
        cancelledOrders,
        totalCustomers,
        totalProducts,
        activeProducts,
        lowStockProducts,
      },
    });
  } catch (err) {
    console.error("getDashboardStats error:", err);
    return res.status(500).json({ success: false, error: "Failed to calculate dashboard statistics" });
  }
}

// GET /api/admin/dashboard/sales
async function getSalesOverview(req, res) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { not: "Cancelled" },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group daily for last 30 days
    const dailyMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().slice(0, 10);
      dailyMap[dateKey] = { date: dateKey, revenue: 0, orders: 0 };
    }

    orders.forEach((o) => {
      const key = o.createdAt.toISOString().slice(0, 10);
      if (dailyMap[key]) {
        dailyMap[key].revenue += o.totalAmount;
        dailyMap[key].orders += 1;
      }
    });

    const dailySales = Object.values(dailyMap);

    return res.json({
      success: true,
      sales: dailySales,
      dailySales,
    });
  } catch (err) {
    console.error("getSalesOverview error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch sales overview" });
  }
}

// GET /api/admin/dashboard/recent-orders
async function getRecentOrders(req, res) {
  try {
    const orders = await prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
      },
    });

    const formatted = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customer.name,
      customerPhone: o.customer.phone,
      orderDate: o.createdAt,
      totalAmount: o.totalAmount,
      paymentMethod: o.paymentMethod,
      status: o.status,
    }));

    return res.json({ success: true, orders: formatted, recentOrders: formatted });
  } catch (err) {
    console.error("getRecentOrders error:", err);
    return res.status(500).json({ success: false, error: "Failed to load recent orders" });
  }
}

// GET /api/admin/dashboard/top-products
async function getTopProducts(req, res) {
  try {
    const topItems = await prisma.orderItem.groupBy({
      by: ["productNameSnapshot"],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 6,
    });

    const formatted = topItems.map((item) => ({
      name: item.productNameSnapshot,
      totalSold: item._sum.quantity || 0,
      totalRevenue: item._sum.totalPrice || 0,
    }));

    return res.json({ success: true, topProducts: formatted });
  } catch (err) {
    console.error("getTopProducts error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch top-selling products" });
  }
}

// GET /api/admin/dashboard/low-stock
async function getLowStock(req, res) {
  try {
    const products = await prisma.product.findMany({
      where: { stock: { lte: 10 } },
      orderBy: { stock: "asc" },
      take: 10,
      include: { category: true },
    });

    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category?.name || "Uncategorized",
      stock: p.stock,
      price: p.price,
      image: p.image,
      isActive: p.isActive,
    }));

    return res.json({ success: true, lowStock: formatted, lowStockProducts: formatted });
  } catch (err) {
    console.error("getLowStock error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch low stock products" });
  }
}

// GET /api/admin/dashboard/recent-activities
async function getRecentActivities(req, res) {
  try {
    const [recentHistory, recentOrders, recentProducts] = await Promise.all([
      prisma.orderStatusHistory.findMany({
        take: 6,
        orderBy: { changedAt: "desc" },
        include: {
          order: {
            select: { orderNumber: true },
          },
        },
      }),
      prisma.order.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
        select: { orderNumber: true, totalAmount: true, createdAt: true },
      }),
      prisma.product.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
        select: { name: true, createdAt: true },
      }),
    ]);

    const activities = [];

    recentHistory.forEach((h) => {
      activities.push({
        type: "status_update",
        title: `Order ${h.order.orderNumber} updated to ${h.newStatus}`,
        timestamp: h.changedAt,
        actor: h.changedBy,
      });
    });

    recentOrders.forEach((o) => {
      activities.push({
        type: "new_order",
        title: `New order ${o.orderNumber} received (₹${o.totalAmount})`,
        timestamp: o.createdAt,
        actor: "Customer",
      });
    });

    recentProducts.forEach((p) => {
      activities.push({
        type: "product_added",
        title: `Product "${p.name}" added to catalog`,
        timestamp: p.createdAt,
        actor: "Admin",
      });
    });

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.json({ success: true, activities: activities.slice(0, 10) });
  } catch (err) {
    console.error("getRecentActivities error:", err);
    return res.status(500).json({ success: false, error: "Failed to load recent activities" });
  }
}

module.exports = {
  getDashboardStats,
  getSalesOverview,
  getRecentOrders,
  getTopProducts,
  getLowStock,
  getRecentActivities,
};

