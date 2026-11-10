import { NextResponse } from "next/server";
import { query, pool } from "@/lib/db";
import { getBearerToken, verifyToken } from "@/lib/auth";
import { sendOrderNotificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

function normalizePhone(phone: any): string {
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

function calculateTieredDeliveryCharge(subtotal: number): number {
  if (!subtotal || subtotal <= 0) return 0;
  if (subtotal <= 500) return 50;
  return 0; // Above 500 is FREE delivery
}

function generateOrderNumber(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FH-${yy}${mm}${dd}-${rand}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, deliveryAddress, items, paymentMethod = "Online", paymentStatus = "Pending", saveAddress } = body;

    // 1. Validation
    if (!customer || !customer.fullName || !customer.email || !customer.phone) {
      return NextResponse.json(
        { success: false, error: "Customer full name, email, and phone number are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email.trim())) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const normPhone = normalizePhone(customer.phone);
    if (normPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid 10-digit phone number." },
        { status: 400 }
      );
    }

    if (
      !deliveryAddress ||
      !deliveryAddress.houseName ||
      !deliveryAddress.street ||
      !deliveryAddress.city ||
      !deliveryAddress.state ||
      !deliveryAddress.pincode
    ) {
      return NextResponse.json(
        { success: false, error: "Complete delivery address (house name, street, city, state, pincode) is required." },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Your shopping cart is empty." },
        { status: 400 }
      );
    }

    // Optional customer token check
    let customerId: number | null = null;
    const token = getBearerToken(request);
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && (decoded.customerId || decoded.id)) {
        customerId = decoded.customerId || decoded.id;
      }
    }

    // 2. Validate Items & calculate subtotal from Hostinger DB
    let calculatedSubtotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid product quantity." },
          { status: 400 }
        );
      }

      let product: any = null;
      if (item.productId && !isNaN(Number(item.productId))) {
        const prods = await query<any[]>("SELECT * FROM products WHERE id = ? LIMIT 1", [Number(item.productId)]);
        if (prods.length > 0) product = prods[0];
      } else if (item.name) {
        const prods = await query<any[]>("SELECT * FROM products WHERE name = ? LIMIT 1", [item.name]);
        if (prods.length > 0) product = prods[0];
      }

      if (product) {
        if (product.isActive === 0 || product.isActive === false) {
          return NextResponse.json(
            { success: false, error: `Product "${product.name}" is currently unavailable.` },
            { status: 400 }
          );
        }
        if (product.stock < qty) {
          return NextResponse.json(
            { success: false, error: `Only ${product.stock} units of "${product.name}" are in stock.` },
            { status: 400 }
          );
        }

        const unitPrice =
          product.discountPrice !== null &&
          Number(product.discountPrice) > 0 &&
          Number(product.discountPrice) < Number(product.price)
            ? Number(product.discountPrice)
            : Number(product.price);
        const totalPrice = unitPrice * qty;
        calculatedSubtotal += totalPrice;

        validatedItems.push({
          productId: product.id,
          productNameSnapshot: product.name,
          productImageSnapshot: product.image || item.image || "",
          quantity: qty,
          unitPrice,
          totalPrice,
        });
      } else {
        const unitPrice = parseFloat(item.price || "0");
        if (isNaN(unitPrice) || unitPrice <= 0) {
          return NextResponse.json(
            { success: false, error: `Invalid price for item "${item.name}".` },
            { status: 400 }
          );
        }
        const totalPrice = unitPrice * qty;
        calculatedSubtotal += totalPrice;

        validatedItems.push({
          productId: null,
          productNameSnapshot: item.name || "Special Item",
          productImageSnapshot: item.image || "",
          quantity: qty,
          unitPrice,
          totalPrice,
        });
      }
    }

    const deliveryFee = calculateTieredDeliveryCharge(calculatedSubtotal);
    const finalTotal = calculatedSubtotal + deliveryFee;
    const orderNumber = generateOrderNumber();

    // 3. Database operations using connection
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Find or create customer
      if (!customerId) {
        const existingCust = await conn.query(
          "SELECT id FROM customers WHERE phone = ? OR email = ? LIMIT 1",
          [normPhone, customer.email.trim().toLowerCase()]
        ) as any[];

        if (existingCust[0] && existingCust[0].length > 0) {
          customerId = existingCust[0][0].id;
          await conn.query(
            "UPDATE customers SET name = ?, alternatePhone = COALESCE(?, alternatePhone) WHERE id = ?",
            [customer.fullName.trim(), customer.alternatePhone?.trim() || null, customerId]
          );
        } else {
          const [insertCust] = await conn.query(
            "INSERT INTO customers (name, email, phone, alternatePhone, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
            [
              customer.fullName.trim(),
              customer.email.trim().toLowerCase(),
              normPhone,
              customer.alternatePhone?.trim() || null,
            ]
          ) as any[];
          customerId = insertCust.insertId;
        }
      }

      // Save Address if requested
      if (saveAddress && customerId) {
        try {
          await conn.query(
            `INSERT INTO addresses (customerId, fullName, phone, houseName, street, city, state, pincode, isDefault, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            [
              customerId,
              customer.fullName.trim(),
              normPhone,
              deliveryAddress.houseName.trim(),
              deliveryAddress.street.trim(),
              deliveryAddress.city.trim(),
              deliveryAddress.state.trim(),
              deliveryAddress.pincode.trim(),
            ]
          );
        } catch (e: any) {
          console.warn("Failed to save address silently:", e.message);
        }
      }

      // Insert Order
      const deliveryAddressJson = JSON.stringify({
        fullName: customer.fullName.trim(),
        phone: normPhone,
        alternatePhone: customer.alternatePhone?.trim() || null,
        email: customer.email.trim().toLowerCase(),
        ...deliveryAddress,
      });

      const initialStatus = "Pending";
      const actualPaymentMethod = paymentMethod === "COD" || paymentMethod === "cod" ? "COD" : "Online";
      const actualPaymentStatus = paymentStatus === "Paid" ? "Paid" : "Pending";

      const [orderRes] = await conn.query(
        `INSERT INTO orders (orderNumber, customerId, status, paymentMethod, paymentStatus, subtotal, deliveryCharge, discount, totalAmount, deliveryAddress, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, NOW(), NOW())`,
        [
          orderNumber,
          customerId,
          initialStatus,
          actualPaymentMethod,
          actualPaymentStatus,
          calculatedSubtotal,
          deliveryFee,
          finalTotal,
          deliveryAddressJson,
        ]
      ) as any[];

      const orderId = orderRes.insertId;

      // Insert Order Items and decrement stock
      for (const item of validatedItems) {
        await conn.query(
          `INSERT INTO order_items (orderId, productId, productNameSnapshot, productImageSnapshot, quantity, unitPrice, totalPrice)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.productId,
            item.productNameSnapshot,
            item.productImageSnapshot,
            item.quantity,
            item.unitPrice,
            item.totalPrice,
          ]
        );

        if (item.productId) {
          await conn.query(
            "UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?",
            [item.quantity, item.productId]
          );
        }
      }

      // Add to Order Status History
      try {
        await conn.query(
          `INSERT INTO order_status_history (orderId, previousStatus, newStatus, changedAt, changedBy)
           VALUES (?, NULL, ?, NOW(), 'Customer Checkout')`,
          [orderId, initialStatus]
        );
      } catch (e: any) {
        console.warn("Order status history note:", e.message);
      }

      await conn.commit();

      // Dispatch order notification email asynchronously (won't block response or fail order if SMTP fails)
      sendOrderNotificationEmail({
        orderId,
        orderNumber,
        customer: {
          fullName: customer.fullName.trim(),
          email: customer.email.trim(),
          phone: normPhone,
          alternatePhone: customer.alternatePhone?.trim(),
        },
        deliveryAddress: {
          houseName: deliveryAddress.houseName.trim(),
          street: deliveryAddress.street.trim(),
          city: deliveryAddress.city.trim(),
          state: deliveryAddress.state.trim(),
          pincode: deliveryAddress.pincode.trim(),
        },
        items: validatedItems,
        subtotal: calculatedSubtotal,
        deliveryCharge: deliveryFee,
        totalAmount: finalTotal,
        paymentMethod: actualPaymentMethod,
        paymentStatus: actualPaymentStatus,
      }).catch((emailErr) => {
        console.error("Order notification email dispatch caught error:", emailErr);
      });

      return NextResponse.json({
        success: true,
        orderId,
        orderNumber,
        message: "Order placed successfully!",
      });
    } catch (txError: any) {
      await conn.rollback();
      throw txError;
    } finally {
      conn.release();
    }
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create order. Please try again." },
      { status: 500 }
    );
  }
}
