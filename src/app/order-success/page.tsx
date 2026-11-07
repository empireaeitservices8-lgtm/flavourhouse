"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Package,
  ShoppingBag,
  ArrowRight,
  Calendar,
  CreditCard,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { BACKEND_URL } from "@/lib/api";

interface OrderSummary {
  id: number;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    id: number;
    productNameSnapshot: string;
    productImageSnapshot: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  deliveryAddress: any;
  customerName: string;
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const orderNumber = searchParams.get("orderNumber");

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const identifier = orderId || orderNumber;
      if (!identifier) {
        setError("No order identifier provided.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/api/orders/summary/${identifier}`);
        const data = await res.json();

        if (res.ok && data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || "Order not found in our records.");
        }
      } catch (err: any) {
        console.error("Order fetch error:", err);
        setError("Failed to load confirmed order details from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, orderNumber]);

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-brand-cream flex flex-col items-center justify-center py-20 px-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-heading text-xl text-brand-dark">Retrieving your order confirmation...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] bg-brand-cream flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-brand-border text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-brand-dark mb-2">Order Notice</h1>
          <p className="font-sans text-brand-text/70 text-sm mb-6">
            {error || "Could not retrieve order details. If you just placed an order, please check your orders page."}
          </p>
          <div className="flex flex-col gap-3 font-sans">
            <Link
              href="/account/orders"
              className="py-3 px-6 bg-brand-primary text-white rounded-xl shadow-md hover:bg-brand-primaryHover transition-all text-sm font-button font-bold uppercase tracking-wider"
            >
              View My Orders
            </Link>
            <Link
              href="/products"
              className="py-3 px-6 bg-brand-cream text-brand-dark rounded-xl hover:bg-brand-sand transition-all text-sm font-semibold"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const parsedAddress =
    typeof order.deliveryAddress === "string"
      ? JSON.parse(order.deliveryAddress)
      : order.deliveryAddress;

  return (
    <div className="bg-brand-cream min-h-screen py-12 md:py-20 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-brand-border text-center"
        >
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-green-50/50">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <span className="bg-brand-primary/10 text-brand-primary font-button text-xs uppercase tracking-widest px-4 py-1.5 rounded-full inline-block mb-3 font-semibold">
            Order Confirmed & Placed
          </span>

          <h1 className="font-heading text-3xl md:text-5xl font-bold text-brand-dark mb-3">
            Your Order Has Been Placed Successfully!
          </h1>

          <p className="font-sans text-brand-text/75 text-sm md:text-base max-w-lg mx-auto mb-8 leading-relaxed">
            Thank you for shopping with <strong>Flavour House</strong>, {order.customerName}! We have received your order and our culinary artisans will begin preparing it with the utmost care.
          </p>

          {/* Order Snapshot Box */}
          <div className="bg-brand-cream/60 rounded-2xl p-6 border border-brand-border text-left mb-8 space-y-4 font-sans text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-brand-border/60">
              <div>
                <span className="text-xs uppercase tracking-wider text-brand-text/60 font-semibold block mb-1">
                  Order ID / Number
                </span>
                <span className="font-mono font-bold text-base text-brand-primary">
                  {order.orderNumber}
                </span>
                <span className="text-xs text-brand-text/50 block mt-0.5">DB Ref #{order.id}</span>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-brand-text/60 font-semibold block mb-1">
                  Order Date & Time
                </span>
                <span className="font-medium text-brand-dark flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-brand-primary/70" />
                  {orderDate}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-brand-border/60">
              <div>
                <span className="text-xs uppercase tracking-wider text-brand-text/60 font-semibold block mb-1">
                  Payment Method & Status
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand-dark">
                    {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                      order.paymentStatus === "Paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-brand-text/60 font-semibold block mb-1">
                  Total Order Amount
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-2xl text-brand-primary">
                    ₹{order.totalAmount}
                  </span>
                  {order.deliveryCharge !== undefined && (
                    <span className="text-xs text-brand-text/60 font-medium">
                      ({order.deliveryCharge === 0 ? (
                        <span className="text-emerald-700 font-bold">FREE Delivery</span>
                      ) : (
                        `incl. ₹${order.deliveryCharge} delivery`
                      )})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery address snapshot */}
            {parsedAddress && (
              <div className="pt-1">
                <span className="text-xs uppercase tracking-wider text-brand-text/60 font-semibold block mb-1">
                  Delivery Destination
                </span>
                <p className="text-brand-dark font-medium text-xs leading-relaxed">
                  {parsedAddress.houseName}, {parsedAddress.street}, {parsedAddress.city},{" "}
                  {parsedAddress.state} - {parsedAddress.pincode}
                </p>
              </div>
            )}
          </div>

          {/* Ordered items preview */}
          {order.items && order.items.length > 0 && (
            <div className="text-left mb-8">
              <h3 className="text-xs uppercase tracking-wider text-brand-text/70 font-button font-bold mb-3">
                Items In This Order ({order.items.length})
              </h3>
              <div className="divide-y divide-brand-border/60 border border-brand-border rounded-2xl overflow-hidden bg-white">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 md:p-4">
                    {item.productImageSnapshot ? (
                      <img
                        src={item.productImageSnapshot}
                        alt={item.productNameSnapshot}
                        className="w-14 h-14 object-cover rounded-xl border border-brand-border/60 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-brand-cream rounded-xl flex items-center justify-center shrink-0 text-brand-primary font-bold">
                        FH
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-brand-dark truncate">
                        {item.productNameSnapshot}
                      </p>
                      <p className="text-xs text-brand-text/60">
                        Qty: {item.quantity} × ₹{item.unitPrice}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand-dark">₹{item.totalPrice}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two Action Buttons required by PRD */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href={`/account/orders/${order.id}`}
              className="w-full sm:w-auto min-w-[200px] py-4 px-8 bg-brand-primary text-white rounded-xl shadow-lg hover:bg-brand-primaryHover transition-all flex items-center justify-center gap-2 font-button font-bold text-xs uppercase tracking-widest"
            >
              <Package className="w-4 h-4" />
              <span>View Order</span>
            </Link>

            <Link
              href="/products"
              className="w-full sm:w-auto min-w-[200px] py-4 px-8 bg-brand-cream text-brand-dark border border-brand-border rounded-xl hover:bg-brand-sand transition-all flex items-center justify-center gap-2 font-button font-bold text-xs uppercase tracking-widest"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-cream flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}

