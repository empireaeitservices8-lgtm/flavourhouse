"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  CheckCircle,
  Users,
  Package,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { fetchFromBackend } from "@/lib/api";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  outForDeliveryOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchFromBackend("/api/admin/dashboard");
      if (res.ok && res.data) {
        const d = res.data;
        if (d.stats) setStats(d.stats);
        if (Array.isArray(d.orders || d.recentOrders)) setRecentOrders(d.orders || d.recentOrders);
        if (Array.isArray(d.topProducts)) setTopProducts(d.topProducts);
        if (Array.isArray(d.lowStock)) setLowStock(d.lowStock);
        if (Array.isArray(d.activities)) setActivities(d.activities);
        if (Array.isArray(d.sales)) setDailySales(d.sales);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-[#F8F1D8] text-[#A17D49] border-[#E9DDC5]";
      case "Confirmed":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "Shipped":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "Out for Delivery":
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "Delivered":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Cancelled":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-[#FAF7F2] text-[#6E5432] border-[#E9DDC5]";
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#A17D49]">
        <div className="w-8 h-8 border-4 border-[#B8945F]/30 border-t-[#B8945F] rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-sans">Loading store metrics...</p>
      </div>
    );
  }

  const maxSale = dailySales.reduce((max, d) => (d.revenue > max ? d.revenue : max), 100);

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#6E5432]">
          Store Overview
        </h1>
        <p className="text-xs font-sans text-[#A17D49] mt-1">
          Store performance, order fulfillment pipeline, and inventory status.
        </p>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-[#E9DDC5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-button font-semibold text-[#A17D49] uppercase tracking-wider">Total Revenue</p>
            <h2 className="text-2xl font-bold text-[#3F3424] mt-1 font-heading">
              ₹{(stats?.totalRevenue || 0).toLocaleString("en-IN")}
            </h2>
            <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1 font-sans">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Real database sales</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#B8945F]/15 text-[#B8945F] flex items-center justify-center border border-[#E9DDC5]">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-[#E9DDC5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-button font-semibold text-[#A17D49] uppercase tracking-wider">Total Orders</p>
            <h2 className="text-2xl font-bold text-[#3F3424] mt-1 font-heading">
              {stats?.totalOrders || 0}
            </h2>
            <p className="text-xs text-[#A17D49] mt-1 font-sans">
              {stats?.deliveredOrders || 0} delivered
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#F8F1D8] text-[#6E5432] flex items-center justify-center border border-[#E9DDC5]">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-5 rounded-2xl border border-[#E9DDC5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-button font-semibold text-[#A17D49] uppercase tracking-wider">Customers</p>
            <h2 className="text-2xl font-bold text-[#3F3424] mt-1 font-heading">
              {stats?.totalCustomers || 0}
            </h2>
            <p className="text-xs text-[#A17D49] mt-1 font-sans">Guest & repeat shoppers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-white p-5 rounded-2xl border border-[#E9DDC5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-button font-semibold text-[#A17D49] uppercase tracking-wider">Active Products</p>
            <h2 className="text-2xl font-bold text-[#3F3424] mt-1 font-heading">
              {stats?.activeProducts || 0} <span className="text-[#A17D49] text-sm font-normal">/ {stats?.totalProducts || 0}</span>
            </h2>
            <p className="text-xs text-[#A17D49] mt-1 font-sans">
              {stats?.lowStockProducts || 0} low in stock
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#F4E8D0] text-[#A17D49] flex items-center justify-center border border-[#E9DDC5]">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Order Progression Status Cards */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E9DDC5] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-base text-[#6E5432]">
            Order Fulfillment Pipeline
          </h2>
          <Link
            href="/admin/orders"
            className="text-xs font-button font-semibold text-[#B8945F] hover:text-[#A17D49] flex items-center gap-1"
          >
            <span>Manage All Orders</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link href="/admin/orders?status=Pending" className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E9DDC5] hover:bg-[#F8F1D8] transition">
            <div className="flex items-center justify-between text-[#A17D49] mb-1">
              <span className="text-xs font-button font-semibold">Pending</span>
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-[#3F3424] font-heading">{stats?.pendingOrders || 0}</p>
          </Link>

          <Link href="/admin/orders?status=Confirmed" className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/60 hover:bg-blue-50 transition">
            <div className="flex items-center justify-between text-blue-700 mb-1">
              <span className="text-xs font-button font-semibold">Confirmed</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-blue-900 font-heading">{stats?.confirmedOrders || 0}</p>
          </Link>

          <Link href="/admin/orders?status=Shipped" className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/60 hover:bg-purple-50 transition">
            <div className="flex items-center justify-between text-purple-700 mb-1">
              <span className="text-xs font-button font-semibold">Shipped</span>
              <Truck className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-purple-900 font-heading">{stats?.shippedOrders || 0}</p>
          </Link>

          <Link href="/admin/orders?status=Out%20for%20Delivery" className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/60 hover:bg-indigo-50 transition">
            <div className="flex items-center justify-between text-indigo-700 mb-1">
              <span className="text-xs font-button font-semibold">Out for Delivery</span>
              <Layers className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-indigo-900 font-heading">{stats?.outForDeliveryOrders || 0}</p>
          </Link>

          <Link href="/admin/orders?status=Delivered" className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 hover:bg-emerald-50 transition col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-button font-semibold">Delivered</span>
              <CheckCircle className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-emerald-900 font-heading">{stats?.deliveredOrders || 0}</p>
          </Link>
        </div>
      </div>

      {/* Sales Analytics Chart & Low Stock Side Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-[#E9DDC5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading font-semibold text-base text-[#6E5432]">
                  Sales Overview (Last 30 Days)
                </h2>
                <p className="text-xs text-[#A17D49]">Daily revenue generated from live customer orders</p>
              </div>
            </div>

            {/* Visual Bar representation */}
            <div className="mt-6 flex items-end gap-1.5 h-48 pt-6 border-b border-[#E9DDC5] px-2 overflow-x-auto">
              {dailySales.slice(-21).map((day, idx) => {
                const heightPercent = maxSale > 0 ? Math.max((day.revenue / maxSale) * 100, day.revenue > 0 ? 10 : 2) : 2;
                return (
                  <div key={day.date || idx} className="flex-1 flex flex-col items-center min-w-[14px] group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition bg-[#2D2318] text-white text-[10px] px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap z-20 font-sans">
                      {day.date}: ₹{day.revenue} ({day.orders} orders)
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t transition-all ${
                        day.revenue > 0 ? "bg-[#B8945F] hover:bg-[#A17D49]" : "bg-[#F4E8D0]"
                      }`}
                    ></div>
                    <span className="text-[9px] text-[#A17D49] mt-1 truncate font-mono">
                      {day.date.slice(8)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-[#A17D49] pt-3 font-sans">
            <span>Showing daily revenue trends</span>
            <span className="font-semibold text-[#6E5432]">Peak: ₹{maxSale}</span>
          </div>
        </div>

        {/* Low Stock Alert List */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E9DDC5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-base text-[#6E5432]">
                Low Stock Warning
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                {lowStock.length} items
              </span>
            </div>

            {lowStock.length === 0 ? (
              <p className="text-xs text-[#A17D49] py-8 text-center">All inventory levels are healthy.</p>
            ) : (
              <div className="space-y-3">
                {lowStock.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DDC5]">
                    <div className="overflow-hidden pr-2">
                      <p className="text-xs font-semibold text-[#3F3424] truncate">{p.name}</p>
                      <p className="text-[11px] text-[#A17D49]">{p.category?.name || "Organic"}</p>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-red-100 text-red-800 text-[11px] font-bold shrink-0">
                      {p.stock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/admin/products?status=low-stock"
            className="w-full mt-4 py-2 px-3 bg-[#FAF7F2] hover:bg-[#F8F1D8] text-[#6E5432] rounded-xl text-xs font-button font-medium text-center transition border border-[#E9DDC5] block"
          >
            Review Low Stock Products →
          </Link>
        </div>
      </div>

      {/* Recent Orders & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Table */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E9DDC5] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-base text-[#6E5432]">
              Recent Customer Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-button text-[#B8945F] hover:text-[#A17D49] flex items-center gap-1 font-semibold"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-[#A17D49] py-8 text-center">No recent orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E9DDC5] text-[#A17D49] uppercase tracking-wider font-button">
                    <th className="pb-3">Order</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4E8D0]">
                  {recentOrders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="hover:bg-[#FAF7F2]/50 transition">
                      <td className="py-3 font-mono font-semibold text-[#6E5432]">
                        <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3">
                        <p className="font-medium text-[#3F3424] truncate max-w-[120px]">
                          {o.customer?.name || "Guest"}
                        </p>
                      </td>
                      <td className="py-3 font-semibold text-[#3F3424]">₹{o.totalAmount}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E9DDC5] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-base text-[#6E5432]">
              Top Selling Products
            </h2>
            <Link
              href="/admin/products"
              className="text-xs font-button text-[#B8945F] hover:text-[#A17D49] flex items-center gap-1 font-semibold"
            >
              <span>Manage Products</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <p className="text-xs text-[#A17D49] py-8 text-center">No sales data recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((tp, idx) => (
                <div key={tp.productId || idx} className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E9DDC5]">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#B8945F]/20 text-[#B8945F] flex items-center justify-center font-bold text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#3F3424] truncate max-w-xs">{tp.product?.name}</p>
                      <p className="text-[11px] text-[#A17D49]">₹{tp.product?.price} per unit</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#6E5432]">{tp._sum?.quantity || 0} sold</p>
                    <p className="text-[10px] text-[#A17D49]">₹{tp._sum?.subtotal || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
