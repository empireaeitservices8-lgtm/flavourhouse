"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Package,
  Calendar,
  Clock,
  ArrowRight,
  ChevronRight,
  ShoppingBag,
  Truck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  User,
  MapPin,
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

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  totalAmount: number;
  deliveryAddress: any;
  createdAt: string;
  items: OrderItem[];
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { customer, isLoggedIn, isLoading: authLoading } = useCustomerAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/account/login?returnUrl=/account/orders");
      return;
    }

    const fetchOrders = async () => {
      const token = getCustomerToken();
      if (!token) return;

      try {
        const res = await fetch(`${BACKEND_URL}/api/orders/my-orders`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setOrders(data.orders || []);
        } else {
          setError(data.error || "Failed to load order history.");
        }
      } catch (err: any) {
        console.error("Orders fetch error:", err);
        setError("Could not connect to the server to retrieve your orders.");
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchOrders();
    }
  }, [isLoggedIn, authLoading, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Out for Delivery":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Confirmed":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Cancelled":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "Pending":
      default:
        return "bg-brand-sand text-brand-dark border-brand-border";
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700";
      case "Failed":
        return "bg-red-100 text-red-700";
      case "Pending":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (authLoading || (isLoggedIn && loading)) {
    return (
      <div className="min-h-[70vh] bg-brand-cream flex flex-col items-center justify-center py-20 px-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-heading text-xl text-brand-dark">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-cream min-h-screen py-10 md:py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-sans text-brand-text/60 mb-2">
              <Link href="/" className="hover:text-brand-primary transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-brand-dark font-semibold">Account</span>
              <span>/</span>
              <span className="text-brand-primary font-semibold">Orders</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-brand-dark">
              My Orders
            </h1>
            <p className="font-sans text-brand-text/70 text-sm mt-1">
              Review and track all your past and active Flavour House orders.
            </p>
          </div>

          {/* Quick Account Navigation tabs */}
          <div className="flex items-center gap-2 bg-white/70 p-1.5 rounded-2xl border border-brand-border text-xs font-button font-bold uppercase tracking-wider">
            <span className="px-3.5 py-2 bg-brand-primary text-white rounded-xl shadow-sm">
              Orders
            </span>
            <Link
              href="/account/addresses"
              className="px-3.5 py-2 text-brand-dark hover:text-brand-primary rounded-xl transition-colors"
            >
              Addresses
            </Link>
            <Link
              href="/account/profile"
              className="px-3.5 py-2 text-brand-dark hover:text-brand-primary rounded-xl transition-colors"
            >
              Profile
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-12 md:p-16 text-center border border-brand-border shadow-xl max-w-lg mx-auto"
          >
            <div className="w-20 h-20 bg-brand-cream text-brand-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-brand-dark mb-2">
              You haven&apos;t placed any orders yet.
            </h2>
            <p className="font-sans text-brand-text/70 text-sm mb-8 max-w-sm mx-auto">
              Explore our artisanal pickles, rich spices, and gourmet specialties to place your very first order!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 py-4 px-8 bg-brand-primary text-white rounded-xl shadow-lg hover:bg-brand-primaryHover transition-all font-button font-bold text-xs uppercase tracking-widest"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Start Shopping</span>
            </Link>
          </motion.div>
        ) : (
          /* Order List */
          <div className="space-y-6">
            {orders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-brand-border shadow-md hover:shadow-xl transition-all overflow-hidden"
                >
                  {/* Order Card Header */}
                  <div className="bg-brand-cream/60 px-6 py-4 border-b border-brand-border/60 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-sans">
                      <div>
                        <span className="text-brand-text/60 uppercase tracking-wider block font-semibold text-[10px]">
                          Order Placed
                        </span>
                        <span className="font-bold text-brand-dark flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                          {formattedDate}
                        </span>
                      </div>

                      <div>
                        <span className="text-brand-text/60 uppercase tracking-wider block font-semibold text-[10px]">
                          Order Number
                        </span>
                        <span className="font-mono font-bold text-brand-dark mt-0.5">
                          {order.orderNumber}
                        </span>
                      </div>

                      <div>
                        <span className="text-brand-text/60 uppercase tracking-wider block font-semibold text-[10px]">
                          Total Amount
                        </span>
                        <span className="font-bold text-brand-primary text-sm mt-0.5">
                          ₹{order.totalAmount}
                        </span>
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${getPaymentBadge(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentMethod} • {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Order Items Snapshot */}
                  <div className="p-6">
                    <div className="divide-y divide-brand-border/40">
                      {order.items?.map((item) => (
                        <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-4">
                          {item.productImageSnapshot ? (
                            <img
                              src={item.productImageSnapshot}
                              alt={item.productNameSnapshot}
                              className="w-16 h-16 object-cover rounded-xl border border-brand-border/60 shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-brand-cream rounded-xl flex items-center justify-center shrink-0 text-brand-primary font-bold text-sm">
                              FH
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className="font-heading font-bold text-brand-dark text-base truncate">
                              {item.productNameSnapshot}
                            </h4>
                            <p className="font-sans text-xs text-brand-text/60 mt-0.5">
                              Quantity: <strong className="text-brand-dark">{item.quantity}</strong> × ₹{item.unitPrice}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="font-sans font-bold text-sm text-brand-dark">
                              ₹{item.totalPrice}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Card Footer with Details Button */}
                    <div className="mt-6 pt-4 border-t border-brand-border/60 flex flex-wrap items-center justify-between gap-4">
                      <span className="text-xs text-brand-text/60 font-sans">
                        {order.items?.length || 0} {order.items?.length === 1 ? "product" : "products"} ordered
                      </span>

                      <Link
                        href={`/account/orders/${order.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-xl shadow-md hover:bg-brand-primaryHover transition-all text-xs font-button font-bold uppercase tracking-wider"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

