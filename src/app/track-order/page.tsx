"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { BACKEND_URL } from "@/lib/api";

const PROGRESS_STEPS = [
  { key: "Pending", label: "Order Placed", desc: "We have received your order", icon: Clock },
  { key: "Confirmed", label: "Order Confirmed", desc: "Seller is preparing items", icon: CheckCircle2 },
  { key: "Shipped", label: "Shipped", desc: "Dispatched with courier partner", icon: Truck },
  { key: "Out for Delivery", label: "Out for Delivery", desc: "Package out with delivery agent", icon: Package },
  { key: "Delivered", label: "Delivered", desc: "Successfully handed over to customer", icon: CheckCircle },
];

function TrackOrderInner() {
  const searchParams = useSearchParams();
  const initialOrderNo = searchParams.get("orderNumber") || "";
  const initialPhone = searchParams.get("phone") || "";

  const [orderNumber, setOrderNumber] = useState(initialOrderNo);
  const [phone, setPhone] = useState(initialPhone);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setErrorMessage("Please enter both your Order Number and checkout Phone Number.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setOrderData(null);

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.trim())}`,
        { cache: "no-store" }
      );

      const data = await res.json();
      if (res.ok && data.success && data.order) {
        setOrderData(data.order);
      } else {
        setErrorMessage(data.error || "No order found matching this Order Number and Phone Number combination.");
      }
    } catch {
      setErrorMessage("Could not connect to tracking server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNo && initialPhone) {
      handleTrack();
    }
  }, [initialOrderNo, initialPhone]);

  const currentStepIndex = orderData
    ? orderData.status === "Cancelled"
      ? -1
      : PROGRESS_STEPS.findIndex((s) => s.key === orderData.status)
    : 0;

  return (
    <div className="bg-brand-cream min-h-screen pt-12 pb-24 antialiased">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        {/* Title */}
        <div className="text-center mb-10">
          <span className="inline-block py-1.5 px-4 rounded-full border border-brand-primary/30 text-brand-dark font-button text-xs uppercase tracking-widest mb-3 bg-white/60">
            Real-Time Tracking
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-medium text-brand-dark">
            Track Your Order
          </h1>
          <p className="text-brand-text/70 text-sm mt-3 max-w-md mx-auto font-sans leading-relaxed">
            Enter your order number and phone number used during checkout to inspect live delivery status.
          </p>
        </div>

        {/* Tracking Input Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-brand-border/80 mb-10">
          <form onSubmit={handleTrack} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-5">
              <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                Order Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FH-261106-ABCD"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary font-mono"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-brand-primary hover:bg-brand-dark text-white font-button uppercase tracking-wider text-xs rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Track</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {errorMessage && (
            <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Live Order Details Card */}
        {orderData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Status Header Banner */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg border border-brand-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-border">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full uppercase">
                    Order {orderData.orderNumber}
                  </span>
                  <h2 className="font-heading text-2xl font-bold text-brand-dark mt-2">
                    Customer: {orderData.customerName}
                  </h2>
                  <p className="text-xs text-brand-text/60 mt-0.5">
                    Order Date: {new Date(orderData.orderDate).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-brand-text/60 block">Current Status</span>
                  <span
                    className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mt-1 border ${
                      orderData.status === "Delivered"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : orderData.status === "Cancelled"
                        ? "bg-rose-50 text-rose-800 border-rose-300"
                        : "bg-brand-primary/10 text-brand-primary border-brand-primary/30"
                    }`}
                  >
                    {orderData.status}
                  </span>
                </div>
              </div>

              {/* Progress Timeline */}
              {orderData.status === "Cancelled" ? (
                <div className="mt-8 p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center text-rose-800 text-sm">
                  <XCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                  <p className="font-bold text-base">This order has been cancelled.</p>
                  <p className="text-xs text-rose-600 mt-1">
                    If you have questions, please reach out to customer support at support@flavorhousefoods.com.
                  </p>
                </div>
              ) : (
                <div className="mt-8 pt-2">
                  <h3 className="font-heading text-sm font-bold text-brand-dark mb-6">
                    Fulfillment Progress
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                    {PROGRESS_STEPS.map((step, idx) => {
                      const isComplete = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      const StepIcon = step.icon;

                      return (
                        <div
                          key={step.key}
                          className={`p-4 rounded-2xl border transition ${
                            isCurrent
                              ? "bg-brand-sand/60 border-brand-primary shadow-xs"
                              : isComplete
                              ? "bg-emerald-50/60 border-emerald-200"
                              : "bg-stone-50/60 border-stone-200 opacity-60"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                              isCurrent
                                ? "bg-brand-primary text-white"
                                : isComplete
                                ? "bg-emerald-600 text-white"
                                : "bg-stone-200 text-stone-500"
                            }`}
                          >
                            <StepIcon className="w-5 h-5" />
                          </div>
                          <p className="font-heading font-bold text-xs text-brand-dark">
                            {step.label}
                          </p>
                          <p className="text-[11px] text-brand-text/60 mt-1 leading-snug">
                            {step.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Address & Ordered Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Delivery Address */}
              <div className="bg-white p-6 rounded-3xl shadow-md border border-brand-border space-y-4">
                <h3 className="font-heading font-bold text-brand-dark text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-primary" />
                  <span>Delivery Address</span>
                </h3>

                <div className="font-sans text-xs text-brand-text/80 space-y-1 bg-brand-cream/40 p-4 rounded-2xl border border-brand-border">
                  <p className="font-bold text-brand-dark text-sm">
                    {orderData.deliveryAddress?.houseName}
                  </p>
                  <p>{orderData.deliveryAddress?.street}</p>
                  <p>
                    {orderData.deliveryAddress?.city}
                    {orderData.deliveryAddress?.district ? `, ${orderData.deliveryAddress.district}` : ""}
                  </p>
                  <p>
                    {orderData.deliveryAddress?.state} - <span className="font-mono font-bold text-brand-dark">{orderData.deliveryAddress?.pincode}</span>
                  </p>
                  {orderData.deliveryAddress?.landmark && (
                    <p className="text-brand-text/50 pt-1">
                      Landmark: {orderData.deliveryAddress.landmark}
                    </p>
                  )}
                </div>

                <div className="pt-2 text-xs text-brand-text/70 flex items-center justify-between border-t border-brand-border">
                  <span>Payment Mode:</span>
                  <span className="font-bold text-brand-dark uppercase">{orderData.paymentMethod}</span>
                </div>
              </div>

              {/* Order Items & Total */}
              <div className="bg-white p-6 rounded-3xl shadow-md border border-brand-border space-y-4">
                <h3 className="font-heading font-bold text-brand-dark text-lg flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-brand-primary" />
                  <span>Ordered Products</span>
                </h3>

                <div className="divide-y divide-brand-border max-h-56 overflow-y-auto pr-1">
                  {orderData.items?.map((item: any) => (
                    <div key={item.id} className="py-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover bg-brand-sand shrink-0 border border-brand-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-brand-sand flex items-center justify-center text-brand-dark">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-brand-dark">{item.name}</p>
                          <p className="text-brand-text/60 text-[11px]">
                            Qty: {item.quantity} × ₹{item.unitPrice}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-brand-dark">₹{item.totalPrice}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-brand-border text-xs space-y-1.5">
                  <div className="flex justify-between text-brand-text/70">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-brand-dark">₹{orderData.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-brand-text/70">
                    <span>Delivery:</span>
                    <span className="font-semibold text-brand-dark">
                      {orderData.deliveryCharge === 0 ? (
                        <span className="text-emerald-700 font-bold">FREE</span>
                      ) : (
                        `₹${orderData.deliveryCharge}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-brand-dark font-bold text-base pt-1 border-t border-brand-border/60">
                    <span>Final Amount:</span>
                    <span className="text-brand-primary">₹{orderData.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Back to Products */}
            <div className="text-center pt-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-brand-primary text-white font-button uppercase tracking-wider text-xs px-8 py-3.5 rounded-full hover:bg-brand-dark transition shadow-md"
              >
                <span>Continue Shopping Organic Foods</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-cream flex items-center justify-center text-brand-dark text-xs font-button uppercase tracking-wider">
          Loading Tracking Portal...
        </div>
      }
    >
      <TrackOrderInner />
    </Suspense>
  );
}

