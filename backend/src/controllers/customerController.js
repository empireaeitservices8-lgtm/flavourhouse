const prisma = require("../config/db");

// GET /api/admin/customers (List customers with stats)
async function getAdminCustomers(req, res) {
  try {
    const { search, page, limit } = req.query;

    const where = {};
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const take = limit ? parseInt(limit, 10) : 50;
    const skip = page ? (parseInt(page, 10) - 1) * take : 0;

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take,
        skip,
        include: {
          orders: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const formatted = customers.map((c) => {
      const nonCancelledOrders = c.orders.filter((o) => o.status !== "Cancelled");
      const totalSpent = nonCancelledOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const latestOrder = c.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        alternatePhone: c.alternatePhone,
        isActive: c.isActive !== false,
        totalOrders: c.orders.length,
        totalSpent,
        lastOrderDate: latestOrder ? latestOrder.createdAt : c.createdAt,
        createdAt: c.createdAt,
      };
    });

    return res.json({
      success: true,
      customers: formatted,
      totalCount,
      page: page ? parseInt(page, 10) : 1,
      totalPages: Math.ceil(totalCount / take),
    });
  } catch (err) {
    console.error("getAdminCustomers error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch customers" });
  }
}

// GET /api/admin/customers/:id (Single customer details with saved addresses and order history)
async function getAdminCustomerById(req, res) {
  try {
    const { id } = req.params;
    const numId = Number(id);

    const customer = await prisma.customer.findUnique({
      where: { id: numId },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            items: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    const nonCancelledOrders = customer.orders.filter((o) => o.status !== "Cancelled");
    const totalSpent = nonCancelledOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Extract unique saved addresses from customer's previous orders
    const addressList = [];
    const addressKeys = new Set();
    for (const order of customer.orders) {
      const addr = typeof order.deliveryAddress === "string"
        ? JSON.parse(order.deliveryAddress)
        : order.deliveryAddress;

      if (addr && addr.street && addr.pincode) {
        const key = `${addr.houseName}-${addr.street}-${addr.pincode}`.toLowerCase();
        if (!addressKeys.has(key)) {
          addressKeys.add(key);
          addressList.push(addr);
        }
      }
    }

    const formattedOrders = customer.orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      totalAmount: o.totalAmount,
      itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
    }));

    return res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        alternatePhone: customer.alternatePhone,
        isActive: customer.isActive !== false,
        createdAt: customer.createdAt,
        totalOrders: customer.orders.length,
        totalSpent,
        savedAddresses: addressList,
        orders: formattedOrders,
      },
    });
  } catch (err) {
    console.error("getAdminCustomerById error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch customer profile" });
  }
}

// GET /api/admin/customers/:id/orders
async function getAdminCustomerOrders(req, res) {
  try {
    const { id } = req.params;
    const orders = await prisma.order.findMany({
      where: { customerId: Number(id) },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    return res.json({ success: true, orders });
  } catch (err) {
    console.error("getAdminCustomerOrders error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch customer orders" });
  }
}

// DELETE /api/admin/customers/:id
async function deleteCustomer(req, res) {
  try {
    const { id } = req.params;
    const numId = Number(id);
    if (isNaN(numId)) {
      return res.status(400).json({ success: false, error: "Invalid customer ID" });
    }

    const existing = await prisma.customer.findUnique({ where: { id: numId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    await prisma.customer.delete({ where: { id: numId } });

    return res.json({
      success: true,
      message: `Customer "${existing.name}" and associated records were deleted successfully.`,
    });
  } catch (err) {
    console.error("deleteCustomer error:", err);
    return res.status(500).json({ success: false, error: "Failed to delete customer." });
  }
}

// PATCH /api/admin/customers/:id/status
async function toggleCustomerStatus(req, res) {
  try {
    const { id } = req.params;
    const numId = Number(id);
    if (isNaN(numId)) {
      return res.status(400).json({ success: false, error: "Invalid customer ID" });
    }

    const existing = await prisma.customer.findUnique({ where: { id: numId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    const newStatus = typeof req.body.isActive === "boolean" ? req.body.isActive : !existing.isActive;

    const updated = await prisma.customer.update({
      where: { id: numId },
      data: { isActive: newStatus },
    });

    return res.json({
      success: true,
      customer: updated,
      message: `Customer is now ${newStatus ? "Active" : "Deactivated"}.`,
    });
  } catch (err) {
    console.error("toggleCustomerStatus error:", err);
    return res.status(500).json({ success: false, error: "Failed to update customer status." });
  }
}

module.exports = {
  getAdminCustomers,
  getAdminCustomerById,
  getAdminCustomerOrders,
  deleteCustomer,
  toggleCustomerStatus,
};

