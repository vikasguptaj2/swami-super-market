import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchOrderByCode, fetchStoreSettings } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  ExternalLink,
  ArrowLeft,
  Package,
  Check,
  Gift,
} from "lucide-react";

interface OrderStatusPageProps {
  params: Promise<{ orderCode: string }>;
}

export default async function OrderStatusPage({ params }: OrderStatusPageProps) {
  const { orderCode } = await params;
  const [data, storeSettings] = await Promise.all([
    fetchOrderByCode(orderCode),
    fetchStoreSettings(),
  ]);

  if (!data || !data.order) {
    notFound();
  }

  const { order, items } = data;

  const storePhone = storeSettings?.whatsappNumber || "918853070705";
  const formattedItems = items
    .map((i) => {
      if (i.freeQuantity && i.freeQuantity > 0) {
        return `- ${i.productNameSnapshot} (${i.variantUnitSnapshot}) x ${i.quantity}\n  (${i.paidQuantity} paid + ${i.freeQuantity} FREE)\n  = Rs. ${parseFloat(
          i.lineTotal
        ).toFixed(2)}`;
      }
      return `- ${i.productNameSnapshot} (${i.variantUnitSnapshot}) x ${i.quantity} = Rs. ${parseFloat(
        i.lineTotal
      ).toFixed(2)}`;
    })
    .join("\n");

  const discountNum = order.totalDiscount ? parseFloat(order.totalDiscount) : 0;
  const discountSection =
    discountNum > 0 ? `*Offer Savings:* - Rs. ${discountNum.toFixed(2)}\n` : "";

  const whatsappMessage = `*NEW ORDER: ${order.orderCode}*
*Swami Super Market - Usasa, Ballia*
----------------------------------------
*Customer:* ${order.customerName}
*Phone:* ${order.customerPhone}
*Address:* ${order.customerAddress}
----------------------------------------
*Order Items:*
${formattedItems}
----------------------------------------
*Gross Subtotal:* Rs. ${parseFloat(order.subtotal).toFixed(2)}
${discountSection}*Delivery Charge:* Rs. ${parseFloat(order.deliveryCharge).toFixed(2)}
*Total Amount:* Rs. ${parseFloat(order.totalAmount).toFixed(2)}
*Payment Method:* ${order.paymentMethod}
----------------------------------------
Please confirm my order! (Kripya order confirm karein)`;

  const fallbackWhatsappUrl = `https://wa.me/${storePhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  // Status mapping
  const statusConfig: Record<
    string,
    { label: string; hindi: string; color: string; desc: string }
  > = {
    PENDING_WHATSAPP: {
      label: "Waiting for WhatsApp Confirmation",
      hindi: "व्हाट्सएप पर पुष्टि की प्रतीक्षा है",
      color: "bg-amber-100 text-amber-900 border-amber-300",
      desc: "Please send the WhatsApp message to our store number so our team can immediately begin packing your order.",
    },
    CONFIRMED: {
      label: "Order Confirmed",
      hindi: "ऑर्डर कन्फर्म हो गया है",
      color: "bg-blue-100 text-blue-900 border-blue-300",
      desc: "Our store team in Usasa has accepted your order and is preparing items.",
    },
    PACKED: {
      label: "Order Packed & Ready",
      hindi: "सामान पैक हो चुका है",
      color: "bg-purple-100 text-purple-900 border-purple-300",
      desc: "Your groceries are packed and waiting for delivery or counter pickup.",
    },
    DELIVERED: {
      label: "Delivered",
      hindi: "डिलीवरी पूरी हुई",
      color: "bg-emerald-100 text-emerald-900 border-emerald-300",
      desc: "Order has been successfully delivered. Thank you for shopping with Swami Super Market!",
    },
    CANCELLED: {
      label: "Cancelled",
      hindi: "ऑर्डर रद्द किया गया",
      color: "bg-rose-100 text-rose-900 border-rose-300",
      desc: "This order has been cancelled.",
    },
  };

  const currentStatus =
    statusConfig[order.status] || statusConfig.PENDING_WHATSAPP;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Link href="/" className="hover:text-emerald-700 flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Home
        </Link>
        <span>/</span>
        <span className="text-neutral-900 font-semibold">Order Status</span>
      </div>

      {/* Main Order Confirmation Card */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
                Order #{order.orderCode}
              </span>
              <span className="text-xs text-neutral-400">
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 mt-2">
              Thank you, {order.customerName}!
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Swami Super Market • Usasa, Ballia (उत्तर प्रदेश)
            </p>
          </div>

          {/* Status Badge */}
          <div
            className={`self-start sm:self-auto px-3.5 py-2 rounded-2xl border text-xs font-bold ${currentStatus.color}`}
          >
            <div>{currentStatus.label}</div>
            <div className="text-[10px] opacity-80 font-medium">{currentStatus.hindi}</div>
          </div>
        </div>

        {/* WhatsApp Call to Action Banner if PENDING_WHATSAPP */}
        {order.status === "PENDING_WHATSAPP" && (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-5 space-y-3 shadow-md shadow-emerald-950/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm text-emerald-50">
                  Step 2: Confirm your order on WhatsApp
                </p>
                <p className="text-emerald-200 leading-relaxed">
                  {currentStatus.desc}
                </p>
              </div>
            </div>

            <a
              href={fallbackWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black py-3 px-4 rounded-xl text-sm transition cursor-pointer shadow-xs"
            >
              <span>Open WhatsApp & Send Order</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Ordered Items (Snapshot list) */}
        <div>
          <h2 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-700" />
            Ordered Items ({items.length})
          </h2>

          <div className="border border-neutral-200/80 rounded-2xl divide-y divide-neutral-100 overflow-hidden">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between gap-4 text-xs hover:bg-neutral-50/50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-neutral-900 text-sm">
                      {item.productNameSnapshot}
                    </p>
                    {item.freeQuantity && item.freeQuantity > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                        <Gift className="w-3 h-3" />
                        BUY {item.paidQuantity} GET {item.freeQuantity} FREE
                      </span>
                    ) : null}
                  </div>
                  {item.freeQuantity && item.freeQuantity > 0 ? (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-emerald-800 font-bold text-xs">
                        {item.paidQuantity} paid + {item.freeQuantity} FREE — Total received: {item.quantity} units
                      </p>
                      <p className="text-neutral-500 text-[11px]">
                        Pack: <span className="font-medium text-neutral-700">{item.variantUnitSnapshot}</span> • Rate: {formatPrice(item.unitPriceSnapshot)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-neutral-500 mt-0.5">
                      Pack: <span className="font-medium text-neutral-700">{item.variantUnitSnapshot}</span> • {formatPrice(item.unitPriceSnapshot)} × {item.quantity}
                    </p>
                  )}
                </div>
                <div className="font-black text-sm text-neutral-900 shrink-0">
                  {formatPrice(item.lineTotal)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-neutral-50 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex justify-between text-neutral-600">
            <span>Items Subtotal</span>
            <span className="font-semibold text-neutral-900">{formatPrice(order.subtotal)}</span>
          </div>
          {order.totalDiscount && parseFloat(order.totalDiscount) > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Offer Savings</span>
              <span>-{formatPrice(order.totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-neutral-600">
            <span>Delivery Fee</span>
            <span className="font-semibold text-neutral-900">
              {parseFloat(order.deliveryCharge) === 0 ? (
                <span className="text-emerald-700 font-bold">FREE</span>
              ) : (
                formatPrice(order.deliveryCharge)
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm font-black text-neutral-900 pt-2 border-t border-neutral-200">
            <span>Total Payable</span>
            <span className="text-emerald-800">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        {/* Delivery & Payment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Customer Address */}
          <div className="p-4 rounded-2xl border border-neutral-200/70 space-y-1">
            <p className="font-bold text-neutral-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              Delivery Address
            </p>
            <p className="text-neutral-600 leading-relaxed mt-1">
              {order.customerAddress}
            </p>
          </div>

          {/* Contact & Payment */}
          <div className="p-4 rounded-2xl border border-neutral-200/70 space-y-1">
            <p className="font-bold text-neutral-800 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-700" />
              Customer Contact & Payment
            </p>
            <p className="text-neutral-600 mt-1">
              Mobile: <span className="font-semibold text-neutral-900">+91 {order.customerPhone}</span>
            </p>
            <p className="text-neutral-600">
              Payment: <span className="font-semibold text-neutral-900">{order.paymentMethod}</span> ({order.paymentStatus})
            </p>
          </div>
        </div>

        {/* Return to Shop */}
        <div className="pt-2 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-5 py-2.5 rounded-xl transition"
          >
            ← Continue Shopping at Swami Super Market
          </Link>
        </div>
      </div>
    </div>
  );
}
