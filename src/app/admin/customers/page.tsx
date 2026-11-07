"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Calendar,
  X,
  ExternalLink,
  ChevronRight,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { fetchFromBackend } from "@/lib/api";

interface CustomerItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  isActive: boolean;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  createdAt: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Selected customer for detail modal
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Delete state
  const [customerToDelete, setCustomerToDelete] = useState<CustomerItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetchFromBackend("/api/admin/customers");
      if (res.ok && res.data.customers) {
        setCustomers(res.data.customers);
      }
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const openCustomerDetails = async (id: number) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetchFromBackend(`/api/admin/customers/${id}`);
      if (res.ok && res.data.customer) {
        setSelectedCustomer(res.data.customer);
      }
    } catch {
      console.error("Failed to fetch customer profile");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Toggle active/inactive status
  const handleToggleCustomerStatus = async (c: { id: number; name: string; isActive?: boolean }) => {
    setTogglingId(c.id);
    const targetStatus = !(c.isActive !== false);

    try {
      const res = await fetchFromBackend(`/api/admin/customers/${c.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: targetStatus }),
      });

      if (res.ok) {
        setCustomers((prev) =>
          prev.map((cust) => (cust.id === c.id ? { ...cust, isActive: targetStatus } : cust))
        );
        if (selectedCustomer && selectedCustomer.id === c.id) {
          setSelectedCustomer((prev: any) => ({ ...prev, isActive: targetStatus }));
        }
        showNotification(
          `Customer "${c.name}" is now ${targetStatus ? "Active" : "Deactivated"}.`,
          "success"
        );
      } else {
        showNotification(res.data?.error || "Failed to update customer status.", "error");
      }
    } catch {
      showNotification("Could not communicate with backend.", "error");
    } finally {
      setTogglingId(null);
    }
  };

  // Permanently delete a customer
  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetchFromBackend(`/api/admin/customers/${customerToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok && res.data?.success) {
        setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));
        if (selectedCustomer && selectedCustomer.id === customerToDelete.id) {
          setSelectedCustomer(null);
        }
        showNotification(
          `Customer "${customerToDelete.name}" was permanently deleted.`,
          "success"
        );
      } else {
        showNotification(res.data?.error || res.data?.message || "Failed to delete customer.", "error");
      }
    } catch (err) {
      showNotification("Failed to connect to backend server.", "error");
    } finally {
      setIsDeleting(false);
      setCustomerToDelete(null);
    }
  };

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.name && String(c.name).toLowerCase().includes(q)) ||
        (c.email && String(c.email).toLowerCase().includes(q)) ||
        (c.phone && String(c.phone).toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Toast Notification Box */}
      {notification && (
        <div
          role="alert"
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs shadow-md transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-stone-700 cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header (Refresh button removed as requested) */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#6E5432]">
          Customer Directory
        </h1>
        <p className="text-xs font-sans text-[#A17D49] mt-1">
          Manage registered customer profiles, track purchasing activity, and activate or deactivate accounts.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9DDC5] shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[#A17D49] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers by name, phone number, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#E9DDC5] text-[#3F3424] focus:outline-none focus:border-[#B8945F] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-[#E9DDC5] shadow-xs overflow-hidden">
        {isLoading && customers.length === 0 ? (
          <div className="py-16 text-center text-[#A17D49] text-sm">
            <div className="w-8 h-8 border-4 border-[#B8945F]/30 border-t-[#B8945F] rounded-full animate-spin mx-auto mb-3"></div>
            Loading customer profiles from database...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-sm">
            <Users className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <p>No customers found matching your query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E9DDC5] text-[#6E5432] uppercase tracking-wider font-semibold font-button">
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Orders Placed</th>
                  <th className="py-3.5 px-4">Total Spending</th>
                  <th className="py-3.5 px-4">Last Order</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF7F2]">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF7F2]/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#B8945F]/15 text-[#B8945F] font-bold flex items-center justify-center shrink-0 border border-[#E9DDC5]">
                          {c.name?.charAt(0) || "C"}
                        </div>
                        <div>
                          <p className="font-semibold text-[#3F3424]">{c.name}</p>
                          <p className="text-[11px] text-[#A17D49]">Customer #{c.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge & Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleCustomerStatus(c)}
                        disabled={togglingId === c.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition cursor-pointer disabled:opacity-50 ${
                          c.isActive !== false
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                        }`}
                        title={`Click to ${c.isActive !== false ? "deactivate" : "activate"} customer`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.isActive !== false ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        ></span>
                        <span>{c.isActive !== false ? "Active" : "Deactivated"}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-stone-800">
                      {c.phone}
                    </td>

                    <td className="py-3.5 px-4 text-stone-600">
                      {c.email}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FAF7F2] text-[#6E5432] border border-[#E9DDC5]">
                        {c.totalOrders} {c.totalOrders === 1 ? "order" : "orders"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#3F3424]">
                      ₹{c.totalSpent}
                    </td>

                    <td className="py-3.5 px-4 text-[#A17D49]">
                      {new Date(c.lastOrderDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions: View Details + Delete Bin Icon */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openCustomerDetails(c.id)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-[#E9DDC5] hover:bg-[#FAF7F2] text-[#6E5432] font-semibold text-xs transition cursor-pointer"
                        >
                          Profile & History
                        </button>
                        <button
                          onClick={() => setCustomerToDelete(c)}
                          title="Delete customer"
                          aria-label={`Delete ${c.name}`}
                          className="p-1.5 rounded-xl text-[#A17D49] hover:text-red-700 hover:bg-red-50 transition cursor-pointer border border-transparent hover:border-red-200"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
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

      {/* In-UI Custom Alert Dialog: Delete Customer Confirmation */}
      {customerToDelete && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[70]"
          onClick={() => !isDeleting && setCustomerToDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Delete customer"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E9DDC5] animate-in fade-in zoom-in-95 font-sans"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-[#6E5432]">Delete Customer?</h3>
                <p className="text-xs text-[#A17D49]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-[#3F3424] leading-relaxed">
              Are you sure you want to delete <strong className="text-[#6E5432]">{customerToDelete.name}</strong>{" "}
              (Customer #{customerToDelete.id})? All associated customer profile records and order history will be removed.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setCustomerToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-[#E9DDC5] text-[#6E5432] text-xs font-button font-semibold hover:bg-[#FAF7F2] transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCustomer}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-button font-bold uppercase tracking-wider shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#E9DDC5] my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 font-sans">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#FAF7F2]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#B8945F]/15 border border-[#E9DDC5] text-[#B8945F] font-bold flex items-center justify-center text-lg">
                  {selectedCustomer.name?.charAt(0) || "C"}
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold text-[#6E5432]">
                    {selectedCustomer.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#A17D49]">
                      Customer ID: #{selectedCustomer.id}
                    </span>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleToggleCustomerStatus(selectedCustomer)}
                      disabled={togglingId === selectedCustomer.id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer ${
                        selectedCustomer.isActive !== false
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          selectedCustomer.isActive !== false ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      ></span>
                      <span>{selectedCustomer.isActive !== false ? "Active" : "Deactivated"}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCustomerToDelete(selectedCustomer)}
                  className="p-1.5 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                  title="Delete customer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E9DDC5]">
                <p className="text-[10px] uppercase font-bold text-[#A17D49] tracking-wider">
                  Total Orders
                </p>
                <p className="text-lg font-bold text-[#3F3424] mt-1 font-heading">
                  {selectedCustomer.totalOrders ?? selectedCustomer.orderCount ?? 0}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E9DDC5]">
                <p className="text-[10px] uppercase font-bold text-[#A17D49] tracking-wider">
                  Total Spent
                </p>
                <p className="text-lg font-bold text-[#B8945F] mt-1 font-heading">
                  ₹{selectedCustomer.totalSpent ?? selectedCustomer.totalSpend ?? 0}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E9DDC5]">
                <p className="text-[10px] uppercase font-bold text-[#A17D49] tracking-wider">
                  Account Status
                </p>
                <p
                  className={`text-sm font-bold mt-1 ${
                    selectedCustomer.isActive !== false ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {selectedCustomer.isActive !== false ? "Active" : "Deactivated"}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E9DDC5]">
                <p className="text-[10px] uppercase font-bold text-[#A17D49] tracking-wider">
                  Customer Since
                </p>
                <p className="text-xs font-semibold text-[#3F3424] mt-1.5">
                  {new Date(selectedCustomer.createdAt).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E9DDC5] text-xs space-y-2 mb-6">
              <h4 className="font-bold text-[#6E5432] uppercase tracking-wider text-[10px] mb-2">
                Contact Information
              </h4>
              <p className="flex items-center gap-2 text-[#3F3424]">
                <Phone className="w-3.5 h-3.5 text-[#B8945F]" />
                <span className="font-mono font-medium">{selectedCustomer.phone}</span>
                {selectedCustomer.alternatePhone && (
                  <span className="text-[#A17D49] text-[11px]">
                    (Alt: {selectedCustomer.alternatePhone})
                  </span>
                )}
              </p>
              <p className="flex items-center gap-2 text-[#3F3424]">
                <Mail className="w-3.5 h-3.5 text-[#B8945F]" />
                <span>{selectedCustomer.email}</span>
              </p>
            </div>

            {/* Saved Delivery Addresses */}
            {selectedCustomer.savedAddresses && selectedCustomer.savedAddresses.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-[#6E5432] uppercase tracking-wider text-[10px] mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#B8945F]" />
                  <span>Saved Delivery Destinations ({selectedCustomer.savedAddresses.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedCustomer.savedAddresses.map((addr: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-[#E9DDC5] bg-white text-xs text-[#3F3424] space-y-1"
                    >
                      <p className="font-semibold text-[#6E5432]">{addr.houseName}</p>
                      <p>{addr.street}</p>
                      {addr.landmark && <p className="text-[#A17D49]">Near: {addr.landmark}</p>}
                      <p>
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order History */}
            <div>
              <h4 className="font-bold text-[#6E5432] uppercase tracking-wider text-[10px] mb-3 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#B8945F]" />
                <span>Order History ({selectedCustomer.orders?.length || 0})</span>
              </h4>

              {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                <div className="divide-y divide-[#FAF7F2] border border-[#E9DDC5] rounded-2xl overflow-hidden">
                  {selectedCustomer.orders.map((order: any) => (
                    <div
                      key={order.id}
                      className="p-3.5 flex items-center justify-between text-xs hover:bg-[#FAF7F2]/50 transition"
                    >
                      <div>
                        <p className="font-mono font-bold text-[#6E5432]">{order.orderNumber}</p>
                        <p className="text-[11px] text-[#A17D49]">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          • {order.itemCount} items
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#3F3424]">₹{order.totalAmount}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF7F2] text-[#6E5432] border border-[#E9DDC5]">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#A17D49] italic">No orders recorded for this customer yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
