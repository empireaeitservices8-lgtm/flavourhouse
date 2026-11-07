"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Clock,
  CheckCircle2,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Layers,
  ChevronRight,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  X,
  ArrowRight,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { fetchFromBackend } from "@/lib/api";

const STATUS_FILTERS = [
  "All",
  "Pending",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "All";
  const highlightOrderNo = searchParams.get("highlight");

  const [orders, setOrders] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Deletion modal state
  const [deleteOrder, setDeleteOrder] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetchFromBackend("/api/admin/orders");
      if (res.ok && res.data?.orders) {
        setOrders(res.data.orders);

        if (highlightOrderNo) {
          const matched = res.data.orders.find((o: any) => o.orderNumber === highlightOrderNo);
          if (matched) {
            openOrderDetails(matched.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const openOrderDetails = async (orderId: number | string) => {
    try {
      const res = await fetchFromBackend(`/api/admin/orders/${orderId}`);
      if (res.ok && res.data?.order) {
        setSelectedOrder(res.data.order);
      }
    } catch {
      showNotification("Failed to fetch order details", "error");
    }
  };

  const handleUpdateStatus = async (nextStatus: string) => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);

    try {
      const res = await fetchFromBackend(`/api/admin/orders/${selectedOrder.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok && res.data?.success) {
        showNotification(`Order marked as "${nextStatus}" successfully!`);
        openOrderDetails(selectedOrder.id);
        setOrders((prev) =>
          prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: nextStatus } : o))
        );
      } else {
        showNotification(res.data?.error || "Failed to update order status.", "error");
      }
    } catch {
      showNotification("Network error while updating status.", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteOrder) return;
    setIsDeleting(true);

    try {
      const res = await fetchFromBackend(`/api/admin/orders/${deleteOrder.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== deleteOrder.id));
        showNotification("Order deleted successfully.");
      } else {
        showNotification(res.data?.error || "Failed to delete order.", "error");
      }
    } catch {
      showNotification("Error communicating with backend.", "error");
    } finally {
      setIsDeleting(false);
      setDeleteOrder(null);
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case "Pending":
        return { label: "Mark as Confirmed", next: "Confirmed", color: "bg-blue-600 hover:bg-blue-500" };
      case "Confirmed":
        return { label: "Mark as Shipped", next: "Shipped", color: "bg-purple-600 hover:bg-purple-500" };
      case "Shipped":
        return { label: "Mark as Out for Delivery", next: "Out for Delivery", color: "bg-indigo-600 hover:bg-indigo-500" };
      case "Out for Delivery":
        return { label: "Mark as Delivered", next: "Delivered", color: "bg-emerald-600 hover:bg-emerald-500" };
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Confirmed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Shipped":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "Out for Delivery":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "Delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Cancelled":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-stone-100 text-stone-800 border-stone-300";
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesFilter = activeFilter === "All" || o.status === activeFilter;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (o.orderNumber && String(o.orderNumber).toLowerCase().includes(q)) ||
        (o.customerName && String(o.customerName).toLowerCase().includes(q)) ||
        (o.customerPhone && String(o.customerPhone).toLowerCase().includes(q)) ||
        (o.customerEmail && String(o.customerEmail).toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [orders, activeFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 ${
            notification.type === "success"
              ? "bg-emerald-950 text-emerald-100 border-emerald-800"
              : "bg-red-950 text-red-100 border-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#6E5432]">
          Order Management
        </h1>
        <p className="text-xs font-sans text-[#A17D49] mt-1">
          Track customer orders, update delivery milestones, and inspect customer addresses.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9DDC5] shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#A17D49] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer Name, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E9DDC5] rounded-xl text-xs text-[#3F3424] focus:outline-none focus:border-[#B8945F] focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              onClick={() => setActiveFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-button transition cursor-pointer ${
                activeFilter === st
                  ? "bg-[#6E5432] text-white font-bold shadow-xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-3xl border border-[#E9DDC5] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-stone-500">Loading orders from database...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-stone-700">No orders found</p>
            <p className="text-xs text-stone-400 mt-1">
              {searchQuery ? "Try refining your search filter." : "New orders will appear here automatically."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-900">
                      {o.orderNumber || `FH-${o.id}`}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-stone-900">
                      {o.customerName || "Customer"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-600">
                      {o.customerPhone || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500">
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-medium">
                      {o.itemCount || 1} {o.itemCount === 1 ? "item" : "items"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      ₹{o.totalAmount}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">
                      <span className="font-medium">{o.paymentMethod || "COD"}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(o.status)}`}>
                        {o.status || "Pending"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openOrderDetails(o.id)}
                          className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-amber-600 hover:text-white text-stone-700 font-semibold text-xs transition cursor-pointer"
                        >
                          View & Update
                        </button>
                        <button
                          onClick={() => setDeleteOrder(o)}
                          className="p-1.5 rounded-lg text-[#A17D49] hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                          title="Delete order"
                          aria-label={`Delete order ${o.orderNumber}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E9DDC5] animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mb-4 border border-red-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#6E5432] font-heading">
              Delete Order
            </h3>
            <p className="text-xs text-[#3F3424] mt-2 leading-relaxed font-sans">
              Are you sure you want to delete order <strong className="text-[#6E5432]">{deleteOrder.orderNumber}</strong>{" "}
              placed by {deleteOrder.customerName}? This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteOrder(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-[#E9DDC5] text-[#6E5432] text-xs font-button hover:bg-[#FAF7F2] transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-button shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "Processing..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Alert Dialog */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E9DDC5] animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#6E5432] font-heading">
              Cancel Order
            </h3>
            <p className="text-xs text-[#3F3424] mt-2 leading-relaxed font-sans">
              Are you sure you want to cancel order <strong className="text-[#6E5432]">{selectedOrder.orderNumber}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isUpdatingStatus}
                className="px-4 py-2.5 rounded-xl border border-[#E9DDC5] text-[#6E5432] text-xs font-button hover:bg-[#FAF7F2] transition cursor-pointer disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={async () => {
                  setShowCancelModal(false);
                  await handleUpdateStatus("Cancelled");
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-button shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isUpdatingStatus ? "Cancelling..." : "Yes, Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-stone-200">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {selectedOrder.orderNumber}
                </span>
                <h3 className="text-xl font-heading font-bold text-stone-900 mt-2">
                  Order Details
                </h3>
                <p className="text-xs text-stone-400">
                  Placed on {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString("en-IN") : "-"}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-stone-500 font-medium">Current Fulfillment Status:</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                  {selectedOrder.status === "Delivered" && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Order Complete
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getNextAction(selectedOrder.status) && (
                  <button
                    onClick={() => handleUpdateStatus(getNextAction(selectedOrder.status)!.next)}
                    disabled={isUpdatingStatus}
                    className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50 ${getNextAction(selectedOrder.status)!.color}`}
                  >
                    <span>{getNextAction(selectedOrder.status)!.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {selectedOrder.status !== "Delivered" && selectedOrder.status !== "Cancelled" && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={isUpdatingStatus}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-2xl border border-stone-200/80 bg-white">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  <span>Customer Details</span>
                </h4>
                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-stone-900">{selectedOrder.customer?.name || selectedOrder.customerName || "Customer"}</p>
                  <p className="text-stone-600 flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-stone-400" />
                    <span>{selectedOrder.customer?.email || selectedOrder.customerEmail || "-"}</span>
                  </p>
                  <p className="text-stone-600 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-stone-400" />
                    <span>{selectedOrder.customer?.phone || selectedOrder.customerPhone || "-"}</span>
                  </p>
                  {selectedOrder.customer?.alternatePhone && (
                    <p className="text-stone-400">
                      Alt: {selectedOrder.customer.alternatePhone}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-stone-200/80 bg-white">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Delivery Address</span>
                </h4>
                <div className="text-xs text-stone-600 space-y-1">
                  <p className="font-semibold text-stone-900">{selectedOrder.deliveryAddress?.houseName || "-"}</p>
                  <p>{selectedOrder.deliveryAddress?.street || ""}</p>
                  <p>
                    {selectedOrder.deliveryAddress?.city || ""}
                    {selectedOrder.deliveryAddress?.district ? `, ${selectedOrder.deliveryAddress.district}` : ""}
                  </p>
                  <p>
                    {selectedOrder.deliveryAddress?.state || ""} {selectedOrder.deliveryAddress?.pincode ? `- ${selectedOrder.deliveryAddress.pincode}` : ""}
                  </p>
                  {selectedOrder.deliveryAddress?.landmark && (
                    <p className="text-stone-400 text-[11px]">
                      Landmark: {selectedOrder.deliveryAddress.landmark}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                Ordered Products ({selectedOrder.items?.length || 0})
              </h4>
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-stone-50/50">
                    <div className="flex items-center gap-3">
                      {item.productImageSnapshot ? (
                        <img
                          src={item.productImageSnapshot}
                          alt={item.productNameSnapshot}
                          className="w-10 h-10 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-stone-900">{item.productNameSnapshot}</p>
                        <p className="text-stone-400 text-[11px]">
                          ₹{item.unitPrice} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-stone-900">₹{item.totalPrice}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery Charge</span>
                <span>
                  {Number(selectedOrder.deliveryCharge) === 0 ? (
                    <strong className="text-emerald-700">FREE</strong>
                  ) : (
                    `₹${selectedOrder.deliveryCharge}`
                  )}
                </span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-₹{selectedOrder.discount}</span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-stone-900 text-sm">
                <span>Total Amount</span>
                <span>₹{selectedOrder.totalAmount}</span>
              </div>
              <div className="flex justify-between text-stone-500 text-[11px] pt-1">
                <span>Payment: {selectedOrder.paymentMethod}</span>
                <span>Status: <strong className="text-stone-800">{selectedOrder.paymentStatus}</strong></span>
              </div>
            </div>

            {selectedOrder.history && selectedOrder.history.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                  Status Progression History
                </h4>
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-stone-200">
                  {selectedOrder.history.map((h: any, idx: number) => (
                    <div key={h.id || idx} className="relative flex items-start gap-3 pl-8 text-xs">
                      <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-amber-600 border-2 border-white shadow-xs"></div>
                      <div>
                        <p className="font-bold text-stone-900">
                          {h.newStatus}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          {h.changedAt ? new Date(h.changedAt).toLocaleString("en-IN") : ""} • by {h.changedBy || "System"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#B8945F]/30 border-t-[#B8945F] rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-stone-500 font-sans">Loading orders dashboard...</p>
        </div>
      }
    >
      <AdminOrdersContent />
    </Suspense>
  );
}
