"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Truck, CreditCard, CheckCircle2, ArrowLeft, ShoppingBag, Lock, Smartphone } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const { cart, subtotal, totalItems, clearCart } = useCart();

  const [paymentMethod, setPaymentMethod] = useState("online");
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const shippingFee = subtotal >= 500 || cart.length === 0 ? 0 : 50;
  const finalTotal = subtotal + shippingFee;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById("razorpay-script")) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const createWooCommerceOrder = async (transactionId: string | null = null) => {
    const response = await fetch("/api/checkout/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formData,
        cart,
        paymentMethod,
        shippingFee,
        transactionId,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setOrderId(data.id.toString());
      setIsOrderPlaced(true);
      clearCart();
    } else {
      alert("Failed to place order: " + (data.error || "Unknown error"));
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsProcessing(true);

    try {
      if (paymentMethod === "online") {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          alert("Failed to load Razorpay SDK. Are you online?");
          setIsProcessing(false);
          return;
        }

        const rzRes = await fetch("/api/razorpay/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: finalTotal }),
        });

        const rzOrder = await rzRes.json();
        
        if (rzOrder.error || !rzOrder.id) {
           alert("Could not initialize payment: " + (rzOrder.error || "Please check Razorpay keys."));
           setIsProcessing(false);
           return;
        }

        const razorpayKey = rzOrder.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!razorpayKey) {
           alert("Razorpay Key ID is not configured. Please add NEXT_PUBLIC_RAZORPAY_KEY_ID to .env.local.");
           setIsProcessing(false);
           return;
        }

        const options = {
          key: razorpayKey,
          amount: rzOrder.amount,
          currency: rzOrder.currency,
          name: "Flavor House",
          description: "Premium Organic Foods",
          order_id: rzOrder.id,
          handler: async function (response: any) {
            // Payment succeeded, create WooCommerce order
            await createWooCommerceOrder(response.razorpay_payment_id);
            setIsProcessing(false);
          },
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: "#B8945F", // brand-primary
          },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.on("payment.failed", function (response: any) {
          alert("Payment failed: " + response.error.description);
          setIsProcessing(false);
        });
        paymentObject.open();

      } else {
        // COD logic
        await createWooCommerceOrder(null);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred during checkout. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-brand-cream min-h-screen pt-10 pb-24">
      <div className="container mx-auto px-6 md:px-12">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm font-sans">
          <Link href="/products" className="text-brand-text/60 hover:text-brand-primary transition-colors flex items-center gap-1">
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
              Order Confirmed
            </span>

            <h1 className="font-heading text-4xl font-bold text-brand-dark mb-2">
              Thank You For Your Order!
            </h1>
            <p className="font-sans text-brand-text/70 text-sm mb-6">
              Order ID: <strong className="text-brand-dark">{orderId}</strong>
            </p>

            <div className="bg-brand-cream/60 p-6 rounded-2xl border border-brand-border text-left mb-8 space-y-3 font-sans text-sm">
              <div className="flex justify-between border-b border-brand-border/60 pb-2">
                <span className="text-brand-text/70">Estimated Delivery:</span>
                <span className="font-bold text-brand-dark">3 - 5 Business Days</span>
              </div>
              <div className="flex justify-between border-b border-brand-border/60 pb-2">
                <span className="text-brand-text/70">Payment Mode:</span>
                <span className="font-bold text-brand-dark uppercase">{paymentMethod}</span>
              </div>
              <div className="flex justify-between border-b border-brand-border/60 pb-2">
                <span className="text-brand-text/70">Deliver To:</span>
                <span className="font-bold text-brand-dark">{formData.fullName || "Customer"} ({formData.city}, {formData.state} - {formData.pincode})</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-brand-text/70">Total Amount:</span>
                <span className="font-bold text-brand-primary text-base">₹{finalTotal}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/products"
                className="w-full sm:w-auto bg-brand-primary text-white font-button uppercase tracking-wider text-xs px-8 py-4 rounded-full hover:bg-brand-dark transition-all shadow-md"
              >
                Continue Shopping
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto bg-brand-cream border border-brand-border text-brand-dark font-button uppercase tracking-wider text-xs px-8 py-4 rounded-full hover:bg-brand-sand transition-all"
              >
                Return to Home
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Main Checkout Form & Summary */
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: Shipping & Payment Form */}
            <div className="lg:col-span-7 space-y-8">
              
              <form onSubmit={handlePlaceOrder} id="checkout-form">
                
                {/* 1. Shipping Details */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-border mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-button font-bold text-sm">
                      1
                    </div>
                    <h2 className="font-heading text-2xl font-bold text-brand-dark">Shipping Address</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        House / Building / Street Address *
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="11/280 Medammal Building, Street Name..."
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        City / Town *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Tirur / Malappuram"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
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
                        <option value="">Select State</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="676103"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">
                        Country *
                      </label>
                      <select
                        required
                        disabled
                        className="w-full bg-brand-cream/40 border border-brand-border rounded-xl px-4 py-3 font-sans text-sm text-brand-text/60 cursor-not-allowed"
                      >
                        <option value="India">India</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Payment Method */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-brand-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-button font-bold text-sm">
                      2
                    </div>
                    <h2 className="font-heading text-2xl font-bold text-brand-dark">Payment Method</h2>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-2xl border border-brand-primary bg-brand-cream/40 shadow-sm">
                    <CreditCard className="w-6 h-6 text-brand-primary shrink-0" />
                    <div className="flex-1">
                      <p className="font-heading font-bold text-brand-dark text-base">Pay Online</p>
                      <p className="font-sans text-xs text-brand-text/60">UPI, Credit/Debit Cards, NetBanking via Razorpay</p>
                    </div>
                    <span className="bg-brand-primary text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full">
                      100% Secure
                    </span>
                  </div>
                </div>

              </form>

            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 bg-white p-8 rounded-3xl shadow-lg border border-brand-border sticky top-28">
              <h2 className="font-heading text-2xl font-bold text-brand-dark mb-6">Order Summary</h2>

              {cart.length > 0 ? (
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 divide-y divide-brand-border/40">
                  {cart.map((item) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover bg-brand-sand shrink-0 border border-brand-border" />
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
                  Your cart is empty. Add items to checkout.
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-3 font-sans text-sm pt-4 border-t border-brand-border mb-8">
                <div className="flex justify-between text-brand-text/80">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="font-bold text-brand-dark">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-brand-text/80">
                  <span>Shipping Fee</span>
                  <span className="text-green-600 font-medium">
                    {shippingFee === 0 ? "FREE" : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-brand-dark font-bold text-xl pt-3 border-t border-brand-border">
                  <span>Total</span>
                  <span className="text-brand-primary">₹{finalTotal}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                form="checkout-form"
                disabled={cart.length === 0 || isProcessing}
                className="w-full bg-brand-primary text-white font-button uppercase tracking-wider py-4 rounded-full hover:bg-brand-dark disabled:opacity-50 transition-all duration-300 shadow-xl flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Place Order (₹{finalTotal})
                  </>
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs font-sans text-brand-text/60">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>100% Encrypted & Secure Checkout</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
