"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Check,
  Star,
  AlertCircle,
  CheckCircle2,
  Phone,
  User,
  X,
} from "lucide-react";
import { BACKEND_URL, getCustomerToken } from "@/lib/api";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

interface Address {
  id: number;
  customerId: number;
  fullName: string;
  phone: string;
  houseName: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
}

export default function MyAddressesPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useCustomerAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    houseName: "",
    street: "",
    city: "",
    state: "Kerala",
    pincode: "",
    isDefault: false,
  });

  const fetchAddresses = async () => {
    const token = getCustomerToken();
    if (!token) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/customer/addresses`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.addresses || []);
      }
    } catch (err: any) {
      console.error("Fetch addresses error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/account/login?returnUrl=/account/addresses");
      return;
    }

    if (isLoggedIn) {
      fetchAddresses();
    }
  }, [isLoggedIn, authLoading, router]);

  const handleOpenAddModal = () => {
    setEditingAddressId(null);
    setFormData({
      fullName: "",
      phone: "",
      houseName: "",
      street: "",
      city: "",
      state: "Kerala",
      pincode: "",
      isDefault: addresses.length === 0,
    });
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (addr: Address) => {
    setEditingAddressId(addr.id);
    setFormData({
      fullName: addr.fullName,
      phone: addr.phone,
      houseName: addr.houseName,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    });
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const token = getCustomerToken();
    if (!token) return;

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.houseName.trim() || !formData.street.trim() || !formData.city.trim() || !formData.pincode.trim()) {
      setActionError("Please complete all required address fields.");
      return;
    }

    setSubmitting(true);
    try {
      const isEditing = editingAddressId !== null;
      const url = isEditing
        ? `${BACKEND_URL}/api/customer/addresses/${editingAddressId}`
        : `${BACKEND_URL}/api/customer/addresses`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(isEditing ? "Address updated successfully." : "New address added.");
        setIsModalOpen(false);
        await fetchAddresses();
      } else {
        setActionError(data.error || "Failed to save address.");
      }
    } catch (err: any) {
      setActionError("Could not reach backend to save address.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    setActionError(null);
    setActionSuccess(null);
    const token = getCustomerToken();
    if (!token) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/customer/addresses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess("Address removed successfully.");
        setAddressToDelete(null);
        await fetchAddresses();
      } else {
        setActionError(data.error || "Failed to delete address.");
      }
    } catch (err: any) {
      setActionError("Could not delete address.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    setActionError(null);
    setActionSuccess(null);
    const token = getCustomerToken();
    if (!token) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/customer/addresses/${id}/default`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess("Default address updated.");
        await fetchAddresses();
      } else {
        setActionError(data.error || "Failed to update default address.");
      }
    } catch (err: any) {
      setActionError("Could not set default address.");
    }
  };

  if (authLoading || (isLoggedIn && loading)) {
    return (
      <div className="min-h-[70vh] bg-brand-cream flex flex-col items-center justify-center py-20 px-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-heading text-xl text-brand-dark">Loading your addresses...</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-cream min-h-screen py-10 md:py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-sans text-brand-text/60 mb-2">
              <Link href="/" className="hover:text-brand-primary transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-brand-dark font-semibold">Account</span>
              <span>/</span>
              <span className="text-brand-primary font-semibold">Addresses</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-brand-dark">
              My Addresses
            </h1>
            <p className="font-sans text-brand-text/70 text-sm mt-1">
              Manage your saved delivery destinations for quick and seamless checkout.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 py-3 px-5 bg-brand-primary text-white rounded-xl shadow-md hover:bg-brand-primaryHover transition-all text-xs font-button font-bold uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {actionError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Empty State */}
        {addresses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-12 text-center border border-brand-border shadow-xl max-w-lg mx-auto"
          >
            <div className="w-16 h-16 bg-brand-cream text-brand-primary rounded-full flex items-center justify-center mx-auto mb-5">
              <MapPin className="w-8 h-8" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-brand-dark mb-2">
              No saved addresses yet
            </h2>
            <p className="font-sans text-brand-text/70 text-sm mb-6 max-w-sm mx-auto">
              Add your home or work delivery address to enjoy 1-click checkout on your next culinary cravings.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 py-3.5 px-6 bg-brand-primary text-white rounded-xl shadow-md hover:bg-brand-primaryHover transition-all text-xs font-button font-bold uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Address</span>
            </button>
          </motion.div>
        ) : (
          /* Address Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <motion.div
                key={addr.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                  addr.isDefault
                    ? "border-brand-primary ring-2 ring-brand-primary/20"
                    : "border-brand-border"
                }`}
              >
                <div>
                  {/* Top Bar with Default Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-dark text-base">{addr.fullName}</span>
                      {addr.isDefault && (
                        <span className="bg-brand-primary/15 text-brand-primary text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-brand-primary" />
                          Default
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Address Body */}
                  <div className="font-sans text-xs text-brand-text/80 space-y-1 leading-relaxed">
                    <p className="font-medium text-brand-dark">{addr.houseName}</p>
                    <p>{addr.street}</p>
                    <p>
                      {addr.city}, {addr.state} - <strong className="text-brand-dark">{addr.pincode}</strong>
                    </p>
                    <p className="pt-2 text-brand-dark font-medium flex items-center gap-1.5 text-xs">
                      <Phone className="w-3.5 h-3.5 text-brand-primary" />
                      <span>{addr.phone}</span>
                    </p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-6 pt-4 border-t border-brand-border/60 flex items-center justify-between text-xs font-sans">
                  {!addr.isDefault ? (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-brand-primary hover:underline font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Set as Default</span>
                    </button>
                  ) : (
                    <span className="text-brand-text/50 text-[11px]">Primary delivery address</span>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleOpenEditModal(addr)}
                      className="p-1.5 text-brand-text/70 hover:text-brand-primary transition-colors"
                      title="Edit Address"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setAddressToDelete(addr)}
                      className="p-1.5 text-brand-text/70 hover:text-red-600 transition-colors"
                      title="Delete Address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add / Edit Address Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !submitting && setIsModalOpen(false)}
                className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-brand-border my-8"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-brand-border/60 mb-6">
                    <h3 className="font-heading text-2xl font-bold text-brand-dark">
                      {editingAddressId ? "Edit Address" : "Add New Address"}
                    </h3>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      disabled={submitting}
                      className="p-1 rounded-full text-brand-text/60 hover:text-brand-dark hover:bg-brand-cream transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleFormSubmit} className="space-y-4 font-sans text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold uppercase tracking-wider text-brand-dark mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Recipient Name"
                          className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold uppercase tracking-wider text-brand-dark mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })
                          }
                          placeholder="10-digit mobile number"
                          className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-brand-dark mb-1">
                        House Name / Flat / Building *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.houseName}
                        onChange={(e) => setFormData({ ...formData, houseName: e.target.value })}
                        placeholder="e.g. Green Meadows Apt 3B"
                        className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-brand-dark mb-1">
                        Street / Area / Colony *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        placeholder="e.g. MG Road, Near Central Mosque"
                        className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold uppercase tracking-wider text-brand-dark mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="e.g. Kozhikode"
                          className="w-full px-3 py-2.5 bg-brand-cream/40 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold uppercase tracking-wider text-brand-dark mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="w-full px-3 py-2.5 bg-brand-cream/40 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold uppercase tracking-wider text-brand-dark mb-1">
                          PIN Code *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={formData.pincode}
                          onChange={(e) =>
                            setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })
                          }
                          placeholder="673001"
                          className="w-full px-3 py-2.5 bg-brand-cream/40 border border-brand-border rounded-xl text-sm focus:outline-none focus:border-brand-primary"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-brand-dark">
                        <input
                          type="checkbox"
                          checked={formData.isDefault}
                          onChange={(e) =>
                            setFormData({ ...formData, isDefault: e.target.checked })
                          }
                          className="w-4 h-4 text-brand-primary rounded border-brand-border focus:ring-brand-primary"
                        />
                        <span>Set as my default shipping address</span>
                      </label>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        disabled={submitting}
                        className="py-2.5 px-5 bg-brand-cream text-brand-dark rounded-xl hover:bg-brand-sand transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="py-2.5 px-6 bg-brand-primary text-white rounded-xl shadow-md hover:bg-brand-primaryHover transition-all font-button font-bold uppercase tracking-wider disabled:opacity-50"
                      >
                        {submitting ? "Saving..." : editingAddressId ? "Save Changes" : "Add Address"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
        {/* In-UI Alert Dialog: Delete Address Confirmation */}
        <AnimatePresence>
          {addressToDelete && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isDeleting && setAddressToDelete(null)}
                className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-brand-border text-center font-sans"
                >
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-brand-dark">
                    Delete Delivery Address?
                  </h3>
                  <p className="text-xs text-brand-text/70 mt-2 leading-relaxed">
                    Are you sure you want to remove <strong>{addressToDelete.fullName}</strong>&apos;s address (
                    {addressToDelete.houseName}, {addressToDelete.city})?
                  </p>

                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAddressToDelete(null)}
                      disabled={isDeleting}
                      className="py-2.5 px-5 bg-brand-cream text-brand-dark rounded-xl hover:bg-brand-sand transition-colors font-semibold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDeleteAddress(addressToDelete.id)}
                      className="py-2.5 px-6 bg-red-600 text-white rounded-xl shadow-md hover:bg-red-700 transition-all font-button font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Delete Address"}
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

