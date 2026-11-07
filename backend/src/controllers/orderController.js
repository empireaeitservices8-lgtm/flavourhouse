const prisma = require("../config/db");

// Helper to normalize phone numbers (digits only, remove country code 91 if present)
function normalizePhone(phone) {
  if (!phone) return "";
  const cleaned = phone.toString().replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.slice(2);
  }
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return cleaned.slice(1);
  }
  return cleaned;
}

// Calculate tiered delivery charge:
// Upto 500: ₹70
// 501 to 1000: ₹100
// Above 1000: Free (₹0)
function calculateTieredDeliveryCharge(subtotal) {
  if (!subtotal || subtotal <= 0) return 0;
  if (subtotal <= 500) return 70;
  if (subtotal <= 1000) return 100;
  return 0;
}

// Generate unique order number
function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FH-${dateStr}-${randomStr}`;
}

// Allowed status progression
const VALID_NEXT_STATUS = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Shipped", "Cancelled"],
  Shipped: ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

// POST /api/orders (Public guest checkout)
async function createOrder(req, res) {
  try {
    const { customer, deliveryAddress, items, paymentMethod } = req.body;

    // 1. Validate customer info
    if (!customer || !customer.fullName || !customer.email || !customer.phone) {
      return res.status(400).json({
        success: false,
        error: "Customer full name, email, and phone number are required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email.trim())) {
      return res.status(400).json({ success: false, error: "Please provide a valid email address." });
    }

    const normPhone = normalizePhone(customer.phone);
    if (normPhone.length < 10) {
      return res.status(400).json({ success: false, error: "Please provide a valid 10-digit phone number." });
    }

    // 2. Validate delivery address
    if (
      !deliveryAddress ||
      !deliveryAddress.houseName ||
      !deliveryAddress.street ||
      !deliveryAddress.city ||
      !deliveryAddress.state ||
      !deliveryAddress.pincode
    ) {
      return res.status(400).json({
        success: false,
        error: "Complete delivery address (house name, street, city, state, PIN code) is required.",
      });
    }

    // 3. Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "Your order cart is empty." });
    }

    // 4. Fetch store settings for shipping rules
    const settings = (await prisma.storeSettings.findFirst()) || {
      deliveryCharge: 0,
      minFreeDelivery: 0,
      storeAvailability: true,
    };

    if (settings.storeAvailability === false) {
      return res.status(400).json({
        success: false,
        error: "Store is currently not accepting new orders. Please check back later.",
      });
    }

    // 5. Look up products & calculate verified totals
    let calculatedSubtotal = 0;
    const validatedOrderItems = [];

    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ success: false, error: "Invalid product quantity in cart." });
      }

      // Check if product exists in DB
      let product = null;
      if (item.productId && !isNaN(Number(item.productId))) {
        product = await prisma.product.findUnique({
          where: { id: Number(item.productId) },
        });
      } else if (item.name) {
        product = await prisma.product.findFirst({
          where: { name: item.name },
        });
      }

      if (product) {
        if (!product.isActive) {
          return res.status(400).json({
            success: false,
            error: `Product "${product.name}" is currently unavailable.`,
          });
        }
        if (product.stock < qty) {
          return res.status(400).json({
            success: false,
            error: `Only ${product.stock} units of "${product.name}" are in stock.`,
          });
        }

        const unitPrice = product.discountPrice !== null && product.discountPrice > 0
          ? product.discountPrice
          : product.price;

        const totalPrice = unitPrice * qty;
        calculatedSubtotal += totalPrice;

        validatedOrderItems.push({
          productId: product.id,
          productNameSnapshot: product.name,
          productImageSnapshot: product.image,
          quantity: qty,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
        });
      } else {
        // Fallback for custom bundles or combo items with fixed price
        const unitPrice = parseFloat(item.price || "0");
        if (isNaN(unitPrice) || unitPrice <= 0) {
          return res.status(400).json({ success: false, error: `Invalid price for item "${item.name}".` });
        }
        const totalPrice = unitPrice * qty;
        calculatedSubtotal += totalPrice;

        validatedOrderItems.push({
          productId: null,
          productNameSnapshot: item.name || "Special Item",
          productImageSnapshot: item.image || "",
          quantity: qty,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
        });
      }
    }

    const deliveryFee = calculateTieredDeliveryCharge(calculatedSubtotal);
    const finalTotal = calculatedSubtotal + deliveryFee;
    const orderNumber = generateOrderNumber();

    // 6. Execute Transaction
    const createdOrder = await prisma.$transaction(async (tx) => {
      // Find or create customer
      let cust = null;
      if (req.customer) {
        cust = await tx.customer.findUnique({ where: { id: req.customer.id } });
      }
      if (!cust) {
        cust = await tx.customer.findFirst({
          where: {
            OR: [
              { phone: normPhone },
              { email: customer.email.trim().toLowerCase() },
            ],
          },
        });
      }

      if (!cust) {
        cust = await tx.customer.create({
          data: {
            name: customer.fullName.trim(),
            email: customer.email.trim().toLowerCase(),
            phone: normPhone,
            alternatePhone: customer.alternatePhone?.trim() || null,
          },
        });
      } else {
        // Keep name and alternate phone up to date
        cust = await tx.customer.update({
          where: { id: cust.id },
          data: {
            name: customer.fullName.trim(),
            alternatePhone: customer.alternatePhone?.trim() || cust.alternatePhone,
          },
        });
      }

      // If user requested to save address and is authenticated or provided consent
      if (req.body.saveAddress && cust) {
        try {
          const addrCount = await tx.address.count({ where: { customerId: cust.id } });
          await tx.address.create({
            data: {
              customerId: cust.id,
              fullName: customer.fullName.trim(),
              phone: normPhone,
              houseName: deliveryAddress.houseName.trim(),
              street: deliveryAddress.street.trim(),
              city: deliveryAddress.city.trim(),
              state: deliveryAddress.state.trim(),
              pincode: deliveryAddress.pincode.trim(),
              isDefault: addrCount === 0,
            },
          });
        } catch (e) {
          console.warn("Could not auto-save address:", e.message);
        }
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: cust.id,
          status: "Pending",
          paymentMethod: paymentMethod === "online" ? "Online" : "COD",
          paymentStatus: paymentMethod === "online" ? "Pending" : "Pending",
          subtotal: calculatedSubtotal,
          deliveryCharge: deliveryFee,
          discount: 0,
          totalAmount: finalTotal,
          deliveryAddress: {
            houseName: deliveryAddress.houseName.trim(),
            street: deliveryAddress.street.trim(),
            city: deliveryAddress.city.trim(),
            district: deliveryAddress.district?.trim() || "",
            state: deliveryAddress.state.trim(),
            pincode: deliveryAddress.pincode.trim(),
            landmark: deliveryAddress.landmark?.trim() || "",
          },
          items: {
            create: validatedOrderItems,
          },
          statusHistory: {
            create: {
              previousStatus: "None",
              newStatus: "Pending",
              changedBy: "Customer",
            },
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // Reduce product stock for real products
      for (const item of validatedOrderItems) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
            },
          });
        }
      }

      return newOrder;
    });

    return res.status(201).json({
      success: true,
      orderNumber: createdOrder.orderNumber,
      orderId: createdOrder.id,
      totalAmount: createdOrder.totalAmount,
      subtotal: createdOrder.subtotal,
      deliveryCharge: createdOrder.deliveryCharge,
      status: createdOrder.status,
      message: "Order placed successfully!",
    });
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({ success: false, error: "Failed to place order. " + err.message });
  }
}

// GET /api/orders/track (Public customer order tracking)
async function trackOrder(req, res) {
  try {
    const { orderNumber, phone } = req.query;

    if (!orderNumber || !phone) {
      return res.status(400).json({
        success: false,
        error: "Both Order Number and Phone Number are required to track an order.",
      });
    }

    const cleanedOrderNo = orderNumber.toString().trim();
    const inputNormPhone = normalizePhone(phone);

    const order = await prisma.order.findUnique({
      where: { orderNumber: cleanedOrderNo },
      include: {
        customer: {
          select: { name: true, phone: true, email: true },
        },
        items: true,
        statusHistory: {
          orderBy: { changedAt: "asc" },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "No order found matching the provided Order Number.",
      });
    }

    const orderCustPhone = normalizePhone(order.customer.phone);
    if (orderCustPhone !== inputNormPhone) {
      return res.status(404).json({
        success: false,
        error: "Order found, but the phone number does not match our records.",
      });
    }

    // Parse delivery address snapshot safely
    const address = typeof order.deliveryAddress === "string"
      ? JSON.parse(order.deliveryAddress)
      : order.deliveryAddress;

    return res.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        customerName: order.customer.name,
        orderDate: order.createdAt,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        deliveryCharge: order.deliveryCharge,
        discount: order.discount,
        totalAmount: order.totalAmount,
        deliveryAddress: address,
        items: order.items.map((i) => ({
          id: i.id,
          name: i.productNameSnapshot,
          image: i.productImageSnapshot,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
        })),
        statusHistory: order.statusHistory.map((h) => ({
          status: h.newStatus,
          timestamp: h.changedAt,
          changedBy: h.changedBy,
        })),
      },
    });
  } catch (err) {
    console.error("trackOrder error:", err);
    return res.status(500).json({ success: false, error: "Failed to track order" });
  }
}

// GET /api/admin/orders (Admin list orders with filters & search)
async function getAdminOrders(req, res) {
  try {
    const { status, search, page, limit } = req.query;

    const where = {};
    if (status && status !== "All") {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { orderNumber: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { phone: { contains: q } } },
        { customer: { email: { contains: q } } },
      ];
    }

    const take = limit ? parseInt(limit, 10) : 50;
    const skip = page ? (parseInt(page, 10) - 1) * take : 0;

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          customer: {
            select: { id: true, name: true, phone: true, email: true },
          },
          items: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    const formatted = orders.map((o) => {
      const address = typeof o.deliveryAddress === "string"
        ? JSON.parse(o.deliveryAddress)
        : o.deliveryAddress;

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        customerId: o.customerId,
        customerName: o.customer.name,
        customerPhone: o.customer.phone,
        customerEmail: o.customer.email,
        itemCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        subtotal: o.subtotal,
        deliveryCharge: o.deliveryCharge,
        totalAmount: o.totalAmount,
        deliveryAddress: address,
        createdAt: o.createdAt,
      };
    });

    return res.json({
      success: true,
      orders: formatted,
      totalCount,
      page: page ? parseInt(page, 10) : 1,
      totalPages: Math.ceil(totalCount / take),
    });
  } catch (err) {
    console.error("getAdminOrders error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch orders" });
  }
}

// GET /api/admin/orders/:id (Admin order details)
async function getAdminOrderById(req, res) {
  try {
    const { id } = req.params;
    const numId = Number(id);

    const order = await prisma.order.findFirst({
      where: isNaN(numId) ? { orderNumber: id } : { id: numId },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: { id: true, name: true, image: true, stock: true },
            },
          },
        },
        statusHistory: {
          orderBy: { changedAt: "asc" },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const address = typeof order.deliveryAddress === "string"
      ? JSON.parse(order.deliveryAddress)
      : order.deliveryAddress;

    return res.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        deliveryCharge: order.deliveryCharge,
        discount: order.discount,
        totalAmount: order.totalAmount,
        customer: order.customer,
        deliveryAddress: address,
        items: order.items,
        statusHistory: order.statusHistory,
        allowedNextStatuses: VALID_NEXT_STATUS[order.status] || [],
      },
    });
  } catch (err) {
    console.error("getAdminOrderById error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch order details" });
  }
}

// PATCH /api/admin/orders/:id/status (Admin button-based order status change)
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const numId = Number(id);

    if (!status) {
      return res.status(400).json({ success: false, error: "New status is required." });
    }

    const order = await prisma.order.findUnique({
      where: { id: numId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found." });
    }

    if (order.status === status) {
      return res.json({ success: true, order, message: "Order status is already " + status });
    }

    const allowed = VALID_NEXT_STATUS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot transition order status from "${order.status}" to "${status}". Allowed transitions: ${allowed.join(", ") || "None"}`,
      });
    }

    // Execute status update with transaction
    const updated = await prisma.$transaction(async (tx) => {
      // If order is cancelled and wasn't already delivered, restore product stock
      if (status === "Cancelled" && order.status !== "Delivered") {
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      // If delivered, mark paymentStatus as Paid if COD
      const paymentStatus = (status === "Delivered" && order.paymentMethod === "COD")
        ? "Paid"
        : order.paymentStatus;

      const orderUpdated = await tx.order.update({
        where: { id: numId },
        data: {
          status,
          paymentStatus,
        },
      });

      // Record history
      await tx.orderStatusHistory.create({
        data: {
          orderId: numId,
          previousStatus: order.status,
          newStatus: status,
          changedBy: req.admin?.name || "Admin",
        },
      });

      return orderUpdated;
    });

    return res.json({
      success: true,
      order: updated,
      message: `Order status successfully updated to "${status}".`,
    });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return res.status(500).json({ success: false, error: "Failed to update order status." });
  }
}

// GET /api/orders/my-orders (Customer order history)
async function getCustomerOrders(req, res) {
  try {
    const customerId = req.customer.id;
    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      orders,
    });
  } catch (err) {
    console.error("getCustomerOrders error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch customer orders." });
  }
}

// GET /api/orders/my-orders/:id (Customer order detail with verification)
async function getCustomerOrderById(req, res) {
  try {
    const customerId = req.customer.id;
    const param = req.params.id;
    const isNum = !isNaN(parseInt(param, 10)) && /^\d+$/.test(param);

    const order = await prisma.order.findFirst({
      where: isNum
        ? { id: parseInt(param, 10), customerId }
        : { orderNumber: param, customerId },
      include: {
        items: true,
        statusHistory: {
          orderBy: { changedAt: "asc" },
        },
        customer: {
          select: { name: true, email: true, phone: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found or you do not have permission to view this order.",
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("getCustomerOrderById error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch order details." });
  }
}

// GET /api/orders/summary/:idOrNumber (For Order Success page)
async function getOrderSummary(req, res) {
  try {
    const param = req.params.idOrNumber;
    if (!param) {
      return res.status(400).json({ success: false, error: "Order identifier is required." });
    }

    const isNum = !isNaN(parseInt(param, 10)) && /^\d+$/.test(param);

    const order = await prisma.order.findFirst({
      where: isNum ? { id: parseInt(param, 10) } : { orderNumber: param },
      include: {
        items: true,
        customer: {
          select: { name: true, phone: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found." });
    }

    return res.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        deliveryCharge: order.deliveryCharge,
        discount: order.discount,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        items: order.items,
        deliveryAddress: order.deliveryAddress,
        customerName: order.customer?.name || "Customer",
      },
    });
  } catch (err) {
    console.error("getOrderSummary error:", err);
    return res.status(500).json({ success: false, error: "Failed to retrieve order summary." });
  }
}

// DELETE /api/admin/orders/:id
async function deleteOrder(req, res) {
  try {
    const { id } = req.params;
    const numId = Number(id);
    if (isNaN(numId)) {
      return res.status(400).json({ success: false, error: "Invalid order ID" });
    }

    const order = await prisma.order.findUnique({
      where: { id: numId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Delete order (Prisma cascades items and status history)
    await prisma.order.delete({
      where: { id: numId },
    });

    return res.json({
      success: true,
      message: `Order #${order.orderNumber} deleted successfully.`,
    });
  } catch (err) {
    console.error("deleteOrder error:", err);
    return res.status(500).json({ success: false, error: "Failed to delete order." });
  }
}

module.exports = {
  createOrder,
  trackOrder,
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  deleteOrder,
  getCustomerOrders,
  getCustomerOrderById,
  getOrderSummary,
};

