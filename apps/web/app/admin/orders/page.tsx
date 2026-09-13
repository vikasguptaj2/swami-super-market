"use client";

import { useEffect, useState, useTransition } from "react";
import { formatPrice } from "@/lib/utils";
import {
  ClipboardList,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  Clock,
  AlertCircle,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  X,
  AlertTriangle,
  ChevronRight,
  Info,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

type OrderStatus =
  | "PENDING_WHATSAPP"
  | "CONFIRMED"
  | "PACKED"
  | "DELIVERED"
  | "CANCELLED";

type PaymentMethod = "COD" | "UPI" | "ONLINE";
type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

interface OrderSummary {
  id: number;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  subtotal: string;
  deliveryCharge: string;
  totalAmount: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
}

interface OrderDetailItem {
  id: number;
  orderId: number;
  productVariantId: number | null;
  productNameSnapshot: string;
  variantUnitSnapshot: string;
  unitPriceSnapshot: string;
  quantity: number;
  lineTotal: string;
  currentVariantStock?: number | null;
}

interface StatusHistoryItem {
  id: number;
  orderId: number;
  status: OrderStatus;
  note: string | null;
  changedAt: string;
}

interface OrderDetail extends OrderSummary {
  items: OrderDetailItem[];
  history: StatusHistoryItem[];
}

interface ShortStockItem {
  variantId: number;
  productName: string;
  unit: string;
  required: number;
  available: number;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  PENDING_WHATSAPP: {
    label: "Pending WhatsApp",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: CheckCircle2,
  },
  PACKED: {
    label: "Packed",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: Package,
  },
  DELIVERED: {
    label: "Delivered",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: Truck,
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: XCircle,
  },
};

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_WHATSAPP: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Detail drawer
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Transition form state
  const [transitionNote, setTransitionNote] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [stockConflict, setStockConflict] = useState<ShortStockItem[] | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.append("status", filterStatus);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`${API_URL}/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const loadOrderDetail = async (id: number) => {
    try {
      setSelectedOrderId(id);
      setDetailLoading(true);
      setStockConflict(null);
      setActionError(null);
      setTransitionNote("");

      const res = await fetch(`${API_URL}/admin/orders/${id}`);
      const data = await res.json();
      if (data.success) {
        setOrderDetail(data.data);
      }
    } catch (err) {
      console.error("Failed to load order detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusTransition = async (nextStatus: OrderStatus) => {
    if (!orderDetail) return;

    setStockConflict(null);
    setActionError(null);
    setTransitioning(true);

    try {
      const res = await fetch(
        `${API_URL}/admin/orders/${orderDetail.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: nextStatus,
            note: transitionNote.trim() || undefined,
          }),
        }
      );

      const data = await res.json();

      if (res.status === 409 && data.shortItems) {
        // Insufficient stock conflict
        setStockConflict(data.shortItems);
        return;
      }

      if (!res.ok || !data.success) {
        setActionError(data.message || "Failed to update order status");
        return;
      }

      // Success: reload detail and list
      await loadOrderDetail(orderDetail.id);
      fetchOrders();
    } catch (err: any) {
      setActionError(err.message || "Network error occurred");
    } finally {
      setTransitioning(false);
    }
  };

  // Helper date formatter
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const allowedTransitions = orderDetail
    ? VALID_TRANSITIONS[orderDetail.status] || []
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-emerald-700" />
            Order Management & Fulfillment
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Review customer orders, verify items, confirm stock, and track local delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search code or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-hidden focus:border-emerald-600 bg-neutral-50"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          </form>

          <button
            onClick={fetchOrders}
            className="p-2 text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            "ALL",
            "PENDING_WHATSAPP",
            "CONFIRMED",
            "PACKED",
            "DELIVERED",
            "CANCELLED",
          ] as const
        ).map((status) => {
          const isActive = filterStatus === status;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                isActive
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
              }`}
            >
              {status === "ALL"
                ? "All Orders"
                : STATUS_CONFIG[status]?.label || status}
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-neutral-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-sm text-neutral-500">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
            No orders found matching the filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Order Code</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Placed At</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                {orders.map((order) => {
                  const conf = STATUS_CONFIG[order.status];
                  const StatusIcon = conf?.icon || Clock;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => loadOrderDetail(order.id)}
                      className="hover:bg-neutral-50/80 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-bold text-neutral-900">
                        {order.orderCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-neutral-900">
                          {order.customerName}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {order.customerPhone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600">
                        {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-neutral-900">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-neutral-800">
                            {order.paymentMethod}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              order.paymentStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${conf.bg} ${conf.text} ${conf.border}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {conf.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-neutral-500 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadOrderDetail(order.id);
                          }}
                          className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition inline-flex items-center gap-1"
                        >
                          View
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal / Drawer */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-neutral-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {detailLoading || !orderDetail ? (
              <div className="py-24 text-center text-sm text-neutral-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                Loading order details...
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="p-6 border-b border-neutral-100 flex items-start justify-between bg-neutral-50/50">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black text-neutral-900">
                        {orderDetail.orderCode}
                      </h2>
                      {(() => {
                        const conf = STATUS_CONFIG[orderDetail.status];
                        const Icon = conf?.icon || Clock;
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${conf.bg} ${conf.text} ${conf.border}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {conf.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      Placed on {formatDate(orderDetail.createdAt)}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedOrderId(null);
                      setOrderDetail(null);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                  {/* Stock Conflict Alert (409 Error) */}
                  {stockConflict && stockConflict.length > 0 && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-800">
                      <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        Cannot Confirm Order: Insufficient Stock!
                      </div>
                      <p className="text-xs text-rose-700">
                        The following items do not have enough inventory to fulfill this order:
                      </p>
                      <div className="divide-y divide-rose-200/60 bg-white/60 rounded-lg p-2.5">
                        {stockConflict.map((item, idx) => (
                          <div
                            key={idx}
                            className="py-1.5 flex items-center justify-between font-medium"
                          >
                            <div>
                              <span className="font-bold text-neutral-900">
                                {item.productName}
                              </span>
                              <span className="text-neutral-500 ml-1">
                                ({item.unit})
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-rose-600 font-bold">
                                Required: {item.required}
                              </span>
                              <span className="text-neutral-500 ml-2">
                                (Available: {item.available})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-rose-600 italic">
                        Action required: Contact customer to propose an alternative product or cancel the order.
                      </p>
                    </div>
                  )}

                  {/* General Action Error */}
                  {actionError && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      {actionError}
                    </div>
                  )}

                  {/* Customer Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200/80">
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-neutral-400">
                        Customer Contact
                      </span>
                      <div className="font-bold text-sm text-neutral-900">
                        {orderDetail.customerName}
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600">
                        <Phone className="w-3.5 h-3.5 text-neutral-400" />
                        <span>+91 {orderDetail.customerPhone}</span>
                      </div>
                      <div className="pt-2 flex items-center gap-2">
                        <a
                          href={`https://wa.me/91${orderDetail.customerPhone}?text=${encodeURIComponent(
                            `Namaste ${orderDetail.customerName}, regarding your order ${orderDetail.orderCode} at Swami Super Market:`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition"
                        >
                          <MessageCircle className="w-3 h-3" />
                          Chat WhatsApp
                        </a>
                        <a
                          href={`tel:${orderDetail.customerPhone}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-[11px] font-semibold transition"
                        >
                          <Phone className="w-3 h-3" />
                          Call
                        </a>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-neutral-400">
                        Delivery Address
                      </span>
                      <div className="flex items-start gap-1.5 text-neutral-800 font-medium leading-relaxed">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{orderDetail.customerAddress}</span>
                      </div>
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                          Payment Mode
                        </span>
                        <div className="flex items-center gap-2 font-semibold text-neutral-800 mt-0.5">
                          <span>{orderDetail.paymentMethod}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              orderDetail.paymentStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            Status: {orderDetail.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div>
                    <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-neutral-600" />
                      Order Items ({orderDetail.items.length})
                    </h3>
                    <div className="border border-neutral-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">Item</th>
                            <th className="py-2.5 px-3">Pack Unit</th>
                            <th className="py-2.5 px-3">Rate</th>
                            <th className="py-2.5 px-3">Qty</th>
                            <th className="py-2.5 px-3">Stock Available</th>
                            <th className="py-2.5 px-3 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-medium">
                          {orderDetail.items.map((item) => (
                            <tr key={item.id} className="hover:bg-neutral-50/50">
                              <td className="py-2.5 px-3 font-semibold text-neutral-900">
                                {item.productNameSnapshot}
                              </td>
                              <td className="py-2.5 px-3 text-neutral-600">
                                {item.variantUnitSnapshot}
                              </td>
                              <td className="py-2.5 px-3 text-neutral-600">
                                {formatPrice(item.unitPriceSnapshot)}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-neutral-900">
                                {item.quantity}
                              </td>
                              <td className="py-2.5 px-3">
                                {typeof item.currentVariantStock === "number" ? (
                                  <span
                                    className={`font-semibold ${
                                      item.currentVariantStock < item.quantity
                                        ? "text-rose-600 font-bold"
                                        : "text-neutral-700"
                                    }`}
                                  >
                                    {item.currentVariantStock} in stock
                                  </span>
                                ) : (
                                  <span className="text-neutral-400">—</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-neutral-900">
                                {formatPrice(item.lineTotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-neutral-50/80 border-t border-neutral-200 font-semibold">
                          <tr>
                            <td colSpan={5} className="py-2 px-3 text-neutral-500 text-right">
                              Subtotal:
                            </td>
                            <td className="py-2 px-3 text-right text-neutral-800">
                              {formatPrice(orderDetail.subtotal)}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={5} className="py-1 px-3 text-neutral-500 text-right">
                              Delivery Charge:
                            </td>
                            <td className="py-1 px-3 text-right text-neutral-800">
                              {parseFloat(orderDetail.deliveryCharge) === 0
                                ? "FREE"
                                : formatPrice(orderDetail.deliveryCharge)}
                            </td>
                          </tr>
                          <tr className="border-t border-neutral-200 text-sm">
                            <td colSpan={5} className="py-2.5 px-3 text-neutral-900 font-black text-right">
                              Total Amount:
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-emerald-800">
                              {formatPrice(orderDetail.totalAmount)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div>
                    <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-neutral-600" />
                      Order Status Timeline
                    </h3>
                    <div className="space-y-3 pl-2 border-l-2 border-neutral-200 ml-2 py-1">
                      {orderDetail.history.map((h) => {
                        const conf = STATUS_CONFIG[h.status];
                        return (
                          <div key={h.id} className="relative pl-5">
                            <div
                              className={`absolute -left-[13px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                conf ? conf.bg.replace("50", "500") : "bg-neutral-400"
                              }`}
                            />
                            <div className="flex items-baseline justify-between">
                              <span className="font-bold text-neutral-900">
                                {conf?.label || h.status}
                              </span>
                              <span className="text-[10px] text-neutral-400">
                                {formatDate(h.changedAt)}
                              </span>
                            </div>
                            {h.note && (
                              <p className="text-[11px] text-neutral-600 mt-0.5">
                                Note: {h.note}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Modal Footer: Action Controls */}
                <div className="p-4 sm:p-6 border-t border-neutral-200 bg-neutral-50/80">
                  {allowedTransitions.length > 0 ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                          Optional transition note:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Verified by phone, ready for evening run, etc."
                          value={transitionNote}
                          onChange={(e) => setTransitionNote(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 bg-white focus:outline-hidden focus:border-emerald-600"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2.5">
                        {/* Whitelist-Driven Action Buttons */}
                        {allowedTransitions.includes("CONFIRMED") && (
                          <button
                            disabled={transitioning}
                            onClick={() => handleStatusTransition("CONFIRMED")}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Confirm Order & Deduct Stock
                          </button>
                        )}

                        {allowedTransitions.includes("PACKED") && (
                          <button
                            disabled={transitioning}
                            onClick={() => handleStatusTransition("PACKED")}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                          >
                            <Package className="w-4 h-4" />
                            Mark as Packed
                          </button>
                        )}

                        {allowedTransitions.includes("DELIVERED") && (
                          <button
                            disabled={transitioning}
                            onClick={() => handleStatusTransition("DELIVERED")}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                          >
                            <Truck className="w-4 h-4" />
                            Mark as Delivered (Collect Payment)
                          </button>
                        )}

                        {allowedTransitions.includes("CANCELLED") && (
                          <button
                            disabled={transitioning}
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to cancel this order? Any deducted stock will be returned to inventory."
                                )
                              ) {
                                handleStatusTransition("CANCELLED");
                              }
                            }}
                            className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 disabled:opacity-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-neutral-500 text-xs">
                      <span className="flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-neutral-400" />
                        This order is in a terminal state ({orderDetail.status}). No further transitions can be made.
                      </span>
                      <button
                        onClick={() => {
                          setSelectedOrderId(null);
                          setOrderDetail(null);
                        }}
                        className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold rounded-lg text-xs transition"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
