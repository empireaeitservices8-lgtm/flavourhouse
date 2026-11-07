"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Phone,
  User,
  HelpCircle,
} from "lucide-react";
import { BACKEND_URL, getCustomerToken } from "@/lib/api";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

interface OrderItem {
  id: number;
  productNameSnapshot: string;
  productImageSnapshot: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface StatusHistory {
  id: number;
  previousStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
}

interface OrderDetails {
  id: number;
  orderNumber: string;
  customerId: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  totalAmount: number;
  deliveryAddress: any;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  statusHistory: StatusHistory[];
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
}

const ORDER_STEPS = ["Pending", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.orderId;

  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useCustomerAuth();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push(`/account/login?returnUrl=/account/orders/${orderId}`);
      return;
    }

    const fetchOrderDetails = async () => {
      const token = getCustomerToken();
      if (!token) return;

      try {
        const res = await fetch(`${BACKEND_URL}/api/orders/my-orders/${orderId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok && data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || "Order not found or access denied.");
        }
      } catch (err: any) {
        console.error("Order details fetch error:", err);
        setError("Could not load order details from the server.");
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchOrderDetails();
    }
  }, [isLoggedIn, authLoading, orderId, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Shipped":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Out for Delivery":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "Confirmed":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Cancelled":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "Pending":
      default:
        return "bg-brand-sand text-brand-dark border-brand-border";
    }
  };

  const getStepStatus = (stepName: string, currentStatus: string) => {
    if (currentStatus === "Cancelled") return "cancelled";
    const currentIndex = ORDER_STEPS.indexOf(currentStatus);
    const stepIndex = ORDER_STEPS.indexOf(stepName);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  if (authLoading || (isLoggedIn && loading)) {
    return (
      <div className="min-h-[70vh] bg-brand-cream flex flex-col items-center justify-center py-20 px-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-heading text-xl text-brand-dark">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[70vh] bg-brand-cream flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-brand-border text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-brand-dark mb-2">Order Notice</h1>
          <p className="font-sans text-brand-text/70 text-sm mb-6">
            {error || "We could not find the requested order."}
          </p>
          <Link
            href="/account/orders"
            className="inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-brand-primary text-white rounded-xl shadow-md hover:bg-brand-primaryHover transition-all text-xs font-button font-bold uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Orders</span>
          </Link>
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

  const isCancelled = order.status === "Cancelled";

  return (
    <div className="bg-brand-cream min-h-screen py-10 md:py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Back Link & Header */}
        <div className="mb-6">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-xs font-semibold text-brand-primary hover:underline mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Orders</span>
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-brand-dark">
                Order <span className="font-mono text-brand-primary">{order.orderNumber}</span>
              </h1>
              <p className="font-sans text-brand-text/70 text-xs md:text-sm mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                <span>Placed on {orderDate}</span>
                <span>•</span>
                <span>DB Ref #{order.id}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-3.5 py-1.5 rounded-full border ${getStatusBadge(
                  order.status
                )}`}
              >
                {order.status}
              </span>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-md ${
                  order.paymentStatus === "Paid"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {order.paymentMethod} • {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Status Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 md:p-8 border border-brand-border shadow-md mb-8"
        >
          <h2 className="font-heading text-xl font-bold text-brand-dark mb-6 flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-primary" />
            <span>Delivery Progression</span>
          </h2>

          {isCancelled ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>This order has been cancelled. If you need any assistance, please contact our support team.</span>
            </div>
          ) : (
            <div className="relative">
              {/* Stepper bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {ORDER_STEPS.map((step, idx) => {
                  const state = getStepStatus(step, order.status);
                  return (
                    <div key={step} className="flex flex-col items-center text-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-2 ${
                          state === "completed"
                            ? "bg-brand-primary text-white ring-4 ring-brand-primary/20"
                            : state === "current"
                            ? "bg-brand-dark text-white ring-4 ring-brand-primary/40 animate-pulse"
                            : "bg-brand-cream text-brand-text/50 border border-brand-border"
                        }`}
                      >
                        {state === "completed" ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          state === "current"
                            ? "text-brand-primary"
                            : state === "completed"
                            ? "text-brand-dark"
                            : "text-brand-text/50"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* 2 Column Layout: Items on Left, Address & Payment on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items Section (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-brand-border shadow-md">
              <h2 className="font-heading text-xl font-bold text-brand-dark mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-primary" />
                <span>Ordered Items ({order.items.length})</span>
              </h2>

              <div className="divide-y divide-brand-border/60">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                    {item.productImageSnapshot ? (
                      <img
                        src={item.productImageSnapshot}
                        alt={item.productNameSnapshot}
                        className="w-20 h-20 object-cover rounded-2xl border border-brand-border/60 shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-brand-cream rounded-2xl flex items-center justify-center shrink-0 text-brand-primary font-bold">
                        FH
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-brand-dark text-base md:text-lg truncate">
                        {item.productNameSnapshot}
                      </h3>
                      <p className="font-sans text-xs text-brand-text/60 mt-1">
                        Price: ₹{item.unitPrice} each
                      </p>
                      <p className="font-sans text-xs text-brand-text/80 mt-0.5">
                        Quantity: <strong className="text-brand-dark">{item.quantity}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-sans font-bold text-base text-brand-dark">
                        ₹{item.totalPrice}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status History Timeline (if available) */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-brand-border shadow-md">
                <h2 className="font-heading text-xl font-bold text-brand-dark mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-primary" />
                  <span>Order Activity Timeline</span>
                </h2>

                <div className="space-y-4">
                  {order.statusHistory.map((hist, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs font-sans">
                      <div className="w-2 h-2 rounded-full bg-brand-primary mt-1.5 shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-bold text-brand-dark">
                          Status changed to <span className="text-brand-primary">&quot;{hist.newStatus}&quot;</span>
                        </p>
                        <p className="text-brand-text/50 text-[11px]">
                          {new Date(hist.changedAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          by {hist.changedBy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Address & Payment Summary (1 col) */}
          <div className="space-y-6">
            {/* Delivery Address Card */}
            <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-md font-sans">
              <h3 className="font-heading text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-primary" />
                <span>Delivery Address</span>
              </h3>

              {parsedAddress ? (
                <div className="text-xs space-y-1.5 text-brand-text/80 leading-relaxed">
                  <p className="font-bold text-brand-dark text-sm">
                    {order.customer?.name || "Recipient"}
                  </p>
                  <p>{parsedAddress.houseName}</p>
                  <p>{parsedAddress.street}</p>
                  {parsedAddress.landmark && <p>Landmark: {parsedAddress.landmark}</p>}
                  <p>
                    {parsedAddress.city}, {parsedAddress.state} - {parsedAddress.pincode}
                  </p>
                  {order.customer?.phone && (
                    <p className="pt-2 text-brand-dark font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-brand-primary" />
                      <span>{order.customer.phone}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-brand-text/60">No address snapshot found.</p>
              )}
            </div>

            {/* Payment Summary Card */}
            <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-md font-sans">
              <h3 className="font-heading text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-primary" />
                <span>Payment Summary</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-brand-text/70">
                  <span>Subtotal</span>
                  <span className="font-semibold text-brand-dark">₹{order.subtotal}</span>
                </div>

                <div className="flex justify-between text-brand-text/70">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-brand-dark">
                    {order.deliveryCharge === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      `₹${order.deliveryCharge}`
                    )}
                  </span>
                </div>

                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-₹{order.discount}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-brand-border/60 flex justify-between items-center text-sm font-bold">
                  <span className="text-brand-dark">Total Amount</span>
                  <span className="text-brand-primary text-xl font-bold">₹{order.totalAmount}</span>
                </div>

                <div className="pt-2 bg-brand-cream/50 p-3 rounded-xl border border-brand-border/40 text-[11px] text-brand-text/70 space-y-1">
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <strong className="text-brand-dark">
                      {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <strong
                      className={
                        order.paymentStatus === "Paid" ? "text-green-700" : "text-amber-700"
                      }
                    >
                      {order.paymentStatus}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Help / Contact Support Box */}
            <div className="bg-brand-cream/70 rounded-3xl p-6 border border-brand-border/80 text-xs font-sans">
              <h4 className="font-bold text-brand-dark mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-brand-primary" />
                <span>Need help with this order?</span>
              </h4>
              <p className="text-brand-text/70 mb-3 leading-relaxed">
                Contact our customer support team for inquiries regarding preparation, dispatch, or modifications.
              </p>
              <Link
                href="/contact"
                className="text-brand-primary font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>Contact Customer Care</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

