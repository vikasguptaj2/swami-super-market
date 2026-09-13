"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { createOrder } from "@/lib/api";
import { useCartStore } from "@/lib/store/cart.store";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  MapPin,
  CreditCard,
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getTotalSavings = useCartStore((state) => state.getTotalSavings);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI" | "ONLINE">("COD");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="py-20 text-center text-xs font-semibold text-neutral-500">
        Loading cart...
      </div>
    );
  }

  const subtotal = getSubtotal();
  const savings = getTotalSavings();
  const deliveryFee = 0; // Free delivery in Usasa
  const totalAmount = subtotal + deliveryFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic validation
    const cleanPhone = customerPhone.trim().replace(/[^0-9]/g, "");
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setErrorMessage("Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Your cart is empty. Please add items before checking out.");
      return;
    }

    try {
      setLoading(true);
      const res = await createOrder({
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerAddress: customerAddress.trim(),
        paymentMethod,
        items: items.map((i) => ({
          productVariantId: i.productVariantId,
          quantity: i.quantity,
        })),
      });

      if (res.success && res.data) {
        const { order, whatsappUrl } = res.data;
        // Clear cart
        clearCart();

        // Try opening WhatsApp in a new tab
        if (whatsappUrl) {
          try {
            window.open(whatsappUrl, "_blank");
          } catch (e) {
            console.error("Popup blocked:", e);
          }
        }

        // Navigate to the order status page
        router.push(`/order-status/${order.orderCode}`);
      } else {
        setErrorMessage(res.message || "Failed to place order. Please try again.");
      }
    } catch (err: any) {
      console.error("Order submission error:", err);
      setErrorMessage("Network error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Link href="/" className="hover:text-emerald-700 flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Continue Shopping
        </Link>
        <span>/</span>
        <span className="text-neutral-900 font-semibold">Cart & Checkout</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-emerald-700" />
            Shopping Cart
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {items.length} {items.length === 1 ? "item" : "different items"} in your bag
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-neutral-300 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-neutral-800">Your cart is empty</h2>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Add fresh grocery items, atta, spices, or daily essentials to get started with instant WhatsApp ordering.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-xs"
            >
              Browse Super Market
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 shadow-xs divide-y divide-neutral-100">
              {items.map((item) => {
                const lineTotal = item.sellingPrice * item.quantity;
                return (
                  <div
                    key={item.productVariantId}
                    className="py-4 first:pt-0 last:pb-0 flex items-center gap-4"
                  >
                    {/* Item Image */}
                    <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ShoppingBag className="w-6 h-6 text-neutral-400" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      {item.hindiName && (
                        <span className="text-[11px] font-medium text-emerald-800 block">
                          {item.hindiName}
                        </span>
                      )}
                      <h3 className="font-bold text-sm text-neutral-900 truncate">
                        {item.productName}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Pack: <span className="font-semibold text-neutral-700">{item.variantUnit}</span> • {formatPrice(item.sellingPrice)} each
                      </p>
                      <div className="text-sm font-black text-neutral-900 mt-1 sm:hidden">
                        {formatPrice(lineTotal)}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productVariantId, item.quantity - 1)
                        }
                        className="w-7 h-7 rounded-lg bg-white flex items-center justify-center hover:bg-neutral-100 font-bold transition shadow-2xs cursor-pointer text-neutral-700"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black px-1.5 min-w-[1.25rem] text-center text-neutral-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productVariantId, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.maxStock}
                        className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center hover:bg-emerald-800 font-bold transition shadow-2xs disabled:opacity-50 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line Total & Remove (Desktop) */}
                    <div className="hidden sm:block text-right shrink-0 min-w-[5rem]">
                      <span className="font-black text-sm text-neutral-900 block">
                        {formatPrice(lineTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productVariantId)}
                        className="text-[11px] text-neutral-400 hover:text-rose-600 font-medium inline-flex items-center gap-0.5 mt-0.5 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Store Guarantee Box */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3.5 text-emerald-950">
              <Truck className="w-6 h-6 text-emerald-700 shrink-0" />
              <div className="text-xs">
                <p className="font-bold">Fast Local Delivery in Usasa & Nearby Villages</p>
                <p className="text-emerald-800 mt-0.5">
                  Order is verified with the store team directly via WhatsApp for quick packing.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Form & Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs space-y-5">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                Customer & Delivery Details
              </h2>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs">
                {/* Full Name */}
                <div>
                  <label className="block font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    Full Name / आपका नाम
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800"
                  />
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    WhatsApp Mobile Number / मोबाइल नंबर
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-neutral-500">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-12 pr-3 py-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Order confirmation message will be sent through WhatsApp.
                  </p>
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    Delivery Address / पता (गाँव/मुहल्ला)
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Village / Mohalla, Landmark (e.g. Usasa Bazar near Primary School)"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800 resize-none"
                  />
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block font-bold text-neutral-700 mb-2 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                    Payment Method / भुगतान का तरीका
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: "COD",
                        label: "Cash on Delivery",
                        sub: "सामान मिलने पर नकद",
                        badge: "Default",
                      },
                      {
                        id: "UPI",
                        label: "UPI on Delivery",
                        sub: "स्कैनर या GPay / PhonePe",
                      },
                      {
                        id: "ONLINE",
                        label: "Pay Online",
                        sub: "ऑनलाइन पे (Cards / Netbanking)",
                      },
                    ].map((opt) => {
                      const isSelected = paymentMethod === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPaymentMethod(opt.id as any)}
                          className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs"
                              : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs">{opt.label}</span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition ${
                                isSelected
                                  ? "border-emerald-700 bg-emerald-700"
                                  : "border-neutral-300 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-neutral-500 font-normal leading-tight">
                              {opt.sub}
                            </span>
                            {opt.badge && (
                              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Order Summary breakdown */}
                <div className="pt-3 border-t border-neutral-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-neutral-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Delivery Charge</span>
                    <span className="font-semibold text-emerald-700">FREE</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Total Savings</span>
                      <span>- {formatPrice(savings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-neutral-900 pt-2 border-t border-neutral-200">
                    <span>Total Amount</span>
                    <span className="text-emerald-800">{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                {/* Submit Order via WhatsApp */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-emerald-700/20 text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {loading ? (
                    <span>Placing Order...</span>
                  ) : (
                    <>
                      <span>Place Order & Open WhatsApp</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
