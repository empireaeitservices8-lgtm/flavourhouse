"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  ShoppingBag,
  Lock,
  Smartphone,
  Banknote,
  Search,
  AlertCircle,
  MapPin,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { BACKEND_URL, getCustomerAuthHeaders, getCustomerToken } from "@/lib/api";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, totalItems, clearCart } = useCart();
  const { customer, isLoggedIn } = useCustomerAuth();

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);

  // Saved addresses for logged in customers
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">("new");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    alternatePhone: "",
    email: "",
    houseName: "",
    street: "",
    city: "",
    district: "",
    state: "Kerala",
    pincode: "",
    landmark: "",
  });

  // Pre-fill user data when logged in
  useEffect(() => {
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || customer.name || "",
        email: prev.email || customer.email || "",
        phone: prev.phone || customer.phone || "",
        alternatePhone: prev.alternatePhone || customer.alternatePhone || "",
      }));
    } else {
      // Auto-load remembered address for guest customers without login
      try {
        const saved = localStorage.getItem("fh_guest_saved_address");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            setFormData((prev) => ({
              ...prev,
              fullName: prev.fullName || parsed.fullName || "",
              email: prev.email || parsed.email || "",
              phone: prev.phone || parsed.phone || "",
              alternatePhone: prev.alternatePhone || parsed.alternatePhone || "",
              houseName: prev.houseName || parsed.houseName || "",
              street: prev.street || parsed.street || "",
              city: prev.city || parsed.city || "",
              district: prev.district || parsed.district || "",
              state: prev.state || parsed.state || "Kerala",
              pincode: prev.pincode || parsed.pincode || "",
              landmark: prev.landmark || parsed.landmark || "",
            }));
          }
        }
      } catch (e) {}
    }
  }, [customer]);

  // Fetch saved addresses if logged in
  useEffect(() => {
    const fetchSavedAddresses = async () => {
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
        if (res.ok && data.success && data.addresses?.length > 0) {
          setSavedAddresses(data.addresses);
          const defaultAddr = data.addresses.find((a: any) => a.isDefault) || data.addresses[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            setFormData((prev) => ({
              ...prev,
              fullName: defaultAddr.fullName || prev.fullName,
              phone: defaultAddr.phone || prev.phone,
              houseName: defaultAddr.houseName,
              street: defaultAddr.street,
              city: defaultAddr.city,
              state: defaultAddr.state || "Kerala",
              pincode: defaultAddr.pincode,
            }));
          }
        }
      } catch (e) {
        console.warn("Could not fetch saved addresses", e);
      }
    };

    if (isLoggedIn) {
      fetchSavedAddresses();
    }
  }, [isLoggedIn]);

  const handleSelectSavedAddress = (addrId: number | "new") => {
    setSelectedAddressId(addrId);
    if (addrId === "new") {
      setFormData((prev) => ({
        ...prev,
        houseName: "",
        street: "",
        city: "",
        district: "",
        state: "Kerala",
        pincode: "",
        landmark: "",
      }));
    } else {
      const chosen = savedAddresses.find((a) => a.id === addrId);
      if (chosen) {
        setFormData((prev) => ({
          ...prev,
          fullName: chosen.fullName || prev.fullName,
          phone: chosen.phone || prev.phone,
          houseName: chosen.houseName,
          street: chosen.street,
          city: chosen.city,
          state: chosen.state,
          pincode: chosen.pincode,
        }));
      }
    }
  };

  const calculateDeliveryCharge = (amount: number) => {
    if (!amount || amount <= 0) return 0;
    if (amount <= 500) return 50;
    return 0; // Above 500 is FREE delivery
  };

  const shippingFee = calculateDeliveryCharge(subtotal);
  const finalTotal = subtotal + shippingFee;
  const amountForFreeDelivery = subtotal > 0 && subtotal <= 500 ? 501 - subtotal : 0;

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const sendOrderToBackend = async (actualPaymentMethod: string, actualPaymentStatus: string) => {
    // If customer requested to save address, remember it locally as well for next time
    if (saveAddress) {
      try {
        localStorage.setItem("fh_guest_saved_address", JSON.stringify(formData));
      } catch (e) {}
    } else {
      try {
        localStorage.removeItem("fh_guest_saved_address");
      } catch (e) {}
    }

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getCustomerAuthHeaders(),
      },
      body: JSON.stringify({
        customer: {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          alternatePhone: formData.alternatePhone.trim() || undefined,
        },
        deliveryAddress: {
          houseName: formData.houseName.trim(),
          street: formData.street.trim(),
          city: formData.city.trim(),
          district: formData.district.trim() || undefined,
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          landmark: formData.landmark.trim() || undefined,
        },
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
        paymentMethod: actualPaymentMethod,
        paymentStatus: actualPaymentStatus,
        saveAddress: saveAddress,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success && data.orderNumber) {
      clearCart();
      router.push(`/order-success?orderId=${data.orderId}&orderNumber=${data.orderNumber}`);
    } else {
      setErrorMessage(data.error || "Failed to place order. Please review your details and try again.");
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setErrorMessage("");
    setIsProcessing(true);

    try {
      if (paymentMethod === "online") {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setErrorMessage("Failed to load secure payment gateway. Please check your connection or choose Cash on Delivery.");
          setIsProcessing(false);
          return;
        }

        const rzpRes = await fetch("/api/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: finalTotal }),
        });
        const rzpData = await rzpRes.json();

        if (rzpRes.ok && rzpData.id && rzpData.key_id) {
          const rzp = new (window as any).Razorpay({
            key: rzpData.key_id,
            amount: rzpData.amount,
            currency: "INR",
            name: "Flavour House Foods",
            description: `Order Payment (${cart.length} items)`,
            order_id: rzpData.id,
            prefill: {
              name: formData.fullName.trim(),
              email: formData.email.trim(),
              contact: formData.phone.trim(),
            },
            theme: { color: "#8E2B1F" },
            handler: async function () {
              try {
                await sendOrderToBackend("Online", "Paid");
              } catch (err: any) {
                setErrorMessage("Payment was successful but failed to register order. Please contact support.");
              } finally {
                setIsProcessing(false);
              }
            },
            modal: {
              ondismiss: function () {
                setIsProcessing(false);
              },
            },
          });
          rzp.open();
          return;
        } else {
          setErrorMessage(
            rzpData.error ||
            "Failed to initiate online payment. Please try again or choose Cash on Delivery (COD)."
          );
          setIsProcessing(false);
          return;
        }
      }

      // Default: Cash on Delivery
      await sendOrderToBackend("COD", "Pending");
    } catch (err: any) {
      setErrorMessage("Could not connect to the backend server. Please check your connection.");
    } finally {
      if (paymentMethod !== "online") {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="bg-brand-cream min-h-screen pt-10 pb-24">
      <div className="container mx-auto px-6 md:px-12">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm font-sans">
          <Link
            href="/products"
            className="text-brand-text/60 hover:text-brand-primary transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Products
          </Link>
          <span className="text-brand-text/40">/</span>
          <span className="text-brand-dark font-medium">Checkout</span>
        </div>

        {isOrderPlaced ? (
          /* Order Placed Success View */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-brand-border text-center"
          >
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <span className="bg-brand-primary/10 text-brand-primary font-button text-xs uppercase tracking-widest px-4 py-1.5 rounded-full inline-block mb-3">
              Order Confirmed & Received
            </span>

            <h1 className="font-heading text-4xl font-bold text-brand-dark mb-2">
              Thank You For Your Order!
            </h1>
            <p className="font-sans text-brand-text/70 text-sm mb-6">
              Your unique Order Number is: <strong className="text-brand-primary text-base font-mono">{orderNumber}</strong>
            </p>

            <div className="bg-brand-cream/60 p-6 rounded-2xl border border-brand-border text-left mb-8 space-y-3 font-sans text-sm">
              <div className="flex justify-between border-b border-brand-border/60 pb-2">
                <span className="text-brand-text/70">Estimated Delivery:</span>
                <span className="font-bold text-brand-dark">3 - 5 Business Days</span>
              </div>
              <div className="flex justify-between border-b border-brand-border/60 pb-2">
                <span className="text-brand-text/70">Payment Mode:</span>
                <span className="font-bold text-brand-dark uppercase">
                  {paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
                </span>
              </div>
              <div className="flex justify-between border-b border-brand-border/60 pb-2">
                <span className="text-brand-text/70">Deliver To:</span>
                <span className="font-bold text-brand-dark">
                  {formData.fullName} ({formData.city}, {formData.state} - {formData.pincode})
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-brand-text/70">Total Amount:</span>
                <span className="font-bold text-brand-primary text-base">₹{finalTotal}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/track-order?orderNumber=${orderNumber}&phone=${formData.phone}`}
                className="w-full sm:w-auto bg-brand-primary text-white font-button uppercase tracking-wider text-xs px-8 py-4 rounded-full hover:bg-brand-dark transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Track Your Order</span>
              </Link>
              <Link
                href="/products"
                className="w-full sm:w-auto bg-brand-cream border border-brand-border text-brand-dark font-button uppercase tracking-wider text-xs px-8 py-4 rounded-full hover:bg-brand-sand transition-all"
              >
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Main Checkout Form & Summary */
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Shipping & Payment Form */}
            <div className="lg:col-span-7 space-y-8">
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handlePlaceOrder} id="checkout-form">
                {/* 1. Customer Information */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-border mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-button font-bold text-sm">
                      1
                    </div>
                    <h2 className="font-heading text-2xl font-bold text-brand-dark">
                      Customer Information
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Rohan Sharma"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="rohan@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        Alternate Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="9876500000"
                        value={formData.alternatePhone}
                        onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                        className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Delivery Address */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-border mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-button font-bold text-sm">
                        2
                      </div>
                      <h2 className="font-heading text-2xl font-bold text-brand-dark">
                        Delivery Address
                      </h2>
                    </div>

                    {isLoggedIn && (
                      <Link
                        href="/account/addresses"
                        className="text-xs font-semibold text-brand-primary hover:underline"
                        target="_blank"
                      >
                        Manage Addresses
                      </Link>
                    )}
                  </div>

                  {/* Saved Address Selector for Logged in Users */}
                  {savedAddresses.length > 0 && (
                    <div className="mb-6 pb-6 border-b border-brand-border/60">
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-3">
                        Choose Delivery Destination
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {savedAddresses.map((addr) => (
                          <button
                            type="button"
                            key={addr.id}
                            onClick={() => handleSelectSavedAddress(addr.id)}
                            className={`p-3.5 rounded-2xl border text-left text-xs font-sans transition-all flex flex-col justify-between ${
                              selectedAddressId === addr.id
                                ? "border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary/20 shadow-sm"
                                : "border-brand-border bg-white hover:bg-brand-cream/50"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-brand-dark truncate">{addr.fullName}</span>
                                {selectedAddressId === addr.id && (
                                  <span className="w-4 h-4 rounded-full bg-brand-primary text-white flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>
                              <p className="text-brand-text/70 text-[11px] line-clamp-2">
                                {addr.houseName}, {addr.street}, {addr.city} - {addr.pincode}
                              </p>
                            </div>
                            <span className="text-[10px] text-brand-text/50 mt-2 block font-medium">
                              Ph: {addr.phone}
                            </span>
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleSelectSavedAddress("new")}
                          className={`p-3.5 rounded-2xl border text-left text-xs font-sans transition-all flex items-center justify-center gap-2 ${
                            selectedAddressId === "new"
                              ? "border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary/20"
                              : "border-dashed border-brand-border/80 bg-brand-cream/30 hover:bg-brand-cream"
                          }`}
                        >
                          <MapPin className="w-4 h-4 text-brand-primary" />
                          <span className="font-bold text-brand-dark">Enter New Address</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        House / Building Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="House No. 12B, Palm Grove"
                        value={formData.houseName}
                        onChange={(e) => setFormData({ ...formData, houseName: e.target.value })}
                        className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        Street / Locality *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="MG Road, Kakkanad"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        City / Town *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Kochi"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        District
                      </label>
                      <input
                        type="text"
                        placeholder="Ernakulam"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        State *
                      </label>
                      <select
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary cursor-pointer"
                      >
                        <option value="Kerala">Kerala</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Other">Other State</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="682001"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Near Metro Station or Supermarket"
                        value={formData.landmark}
                        onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                        className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div className="md:col-span-2 pt-2 bg-brand-cream/40 p-4 rounded-2xl border border-brand-border/60">
                      <label className="flex items-start sm:items-center gap-3 cursor-pointer text-xs font-sans text-brand-dark">
                        <input
                          type="checkbox"
                          checked={saveAddress}
                          onChange={(e) => setSaveAddress(e.target.checked)}
                          className="rounded border-brand-border text-brand-primary focus:ring-brand-primary w-4 h-4 mt-0.5 sm:mt-0 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-brand-dark block">
                            Save this delivery address for future orders
                          </span>
                          <span className="text-[11px] text-brand-text/65 block">
                            {isLoggedIn
                              ? "Save to your account address book for 1-click checkout."
                              : "Remember this delivery address on this device and link it with your order history."}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3. Payment Method */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-button font-bold text-sm">
                      3
                    </div>
                    <h2 className="font-heading text-2xl font-bold text-brand-dark">
                      Payment Method
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {/* Cash on Delivery */}
                    <label
                      onClick={() => setPaymentMethod("cod")}
                      className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition ${
                        paymentMethod === "cod"
                          ? "border-brand-primary bg-brand-cream/50 shadow-xs"
                          : "border-brand-border hover:bg-stone-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                        className="w-4 h-4 text-brand-primary focus:ring-brand-primary"
                      />
                      <Banknote className="w-6 h-6 text-brand-primary shrink-0" />
                      <div className="flex-1">
                        <p className="font-heading font-bold text-brand-dark text-base">Cash on Delivery (COD)</p>
                        <p className="font-sans text-xs text-brand-text/60">Pay safely in cash or UPI when your organic products arrive at your doorstep.</p>
                      </div>
                      <span className="bg-brand-primary/10 text-brand-primary text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full">
                        Recommended
                      </span>
                    </label>

                    {/* Online Payment */}
                    <label
                      onClick={() => setPaymentMethod("online")}
                      className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition ${
                        paymentMethod === "online"
                          ? "border-brand-primary bg-brand-cream/50 shadow-xs"
                          : "border-brand-border hover:bg-stone-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={paymentMethod === "online"}
                        onChange={() => setPaymentMethod("online")}
                        className="w-4 h-4 text-brand-primary focus:ring-brand-primary"
                      />
                      <CreditCard className="w-6 h-6 text-stone-600 shrink-0" />
                      <div className="flex-1">
                        <p className="font-heading font-bold text-brand-dark text-base">Online Payment</p>
                        <p className="font-sans text-xs text-brand-text/60">UPI, NetBanking, Credit/Debit Cards</p>
                      </div>
                      <span className="bg-stone-100 text-stone-600 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full">
                        Secure
                      </span>
                    </label>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 bg-white p-8 rounded-3xl shadow-lg border border-brand-border sticky top-28">
              <h2 className="font-heading text-2xl font-bold text-brand-dark mb-6">
                Order Summary
              </h2>

              {cart.length > 0 ? (
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 divide-y divide-brand-border/40">
                  {cart.map((item) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover bg-brand-sand shrink-0 border border-brand-border"
                        />
                        <div>
                          <p className="font-heading font-bold text-brand-dark text-sm">{item.name}</p>
                          <p className="font-sans text-xs text-brand-text/60">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-button font-bold text-brand-dark text-sm">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-brand-text/50 font-sans text-sm mb-6">
                  Your cart is empty. Add products to checkout.
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-3 font-sans text-sm pt-4 border-t border-brand-border mb-8">
                <div className="flex justify-between text-brand-text/75 text-sm">
                  <span>Subtotal</span>
                  <span className="font-semibold text-brand-dark">₹{subtotal}</span>
                </div>

                <div className="flex justify-between items-center text-sm text-brand-text/75">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-brand-primary" />
                    <span>Delivery Charge</span>
                  </div>
                  {shippingFee === 0 ? (
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">
                      FREE
                    </span>
                  ) : (
                    <span className="font-semibold text-brand-dark">₹{shippingFee}</span>
                  )}
                </div>

                {amountForFreeDelivery > 0 && (
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-xs text-amber-900 leading-snug">
                    ✨ Add <span className="font-bold">₹{amountForFreeDelivery}</span> more for <span className="font-bold">FREE Delivery</span>!
                  </div>
                )}

                <div className="flex justify-between text-brand-dark font-bold text-xl pt-2 border-t border-brand-border/60">
                  <span>Payable Amount</span>
                  <span className="text-brand-primary">₹{finalTotal}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                form="checkout-form"
                disabled={cart.length === 0 || isProcessing}
                className="w-full bg-brand-primary text-white font-button uppercase tracking-wider py-4 rounded-full hover:bg-brand-dark disabled:opacity-50 transition-all duration-300 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Place Order (₹{finalTotal})</span>
                  </>
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs font-sans text-brand-text/60">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>Guest Checkout • No Account Required</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
