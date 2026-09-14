"use client";

import { useEffect, useState, useMemo } from "react";
import { formatPrice } from "@/lib/utils";
import {
  Tag,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  X,
  Search,
  Calendar,
  Layers,
  ShoppingBag,
  Percent,
  IndianRupee,
  Gift,
  PackageCheck,
  Clock,
  Archive,
  Info,
} from "lucide-react";
import {
  Promotion,
  Category,
  Product,
  fetchAdminPromotions,
  createAdminPromotion,
  updateAdminPromotion,
  updateAdminPromotionStatus,
  fetchCategories,
  fetchAdminProducts,
} from "@/lib/api";

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search state
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "SIMPLE_DISCOUNT" as "SIMPLE_DISCOUNT" | "BUY_X_GET_Y" | "COMBO",
    status: "ACTIVE" as "DRAFT" | "ACTIVE" | "EXPIRED" | "ARCHIVED",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT" | "FREE" | "COMBO_PRICE",
    discountValue: "10",
    minOrderAmount: "",
    minQuantity: "1",
    buyQuantity: "1",
    getQuantity: "1",
    getYDiscountPercent: "100",
    comboPrice: "",
    startDate: "",
    endDate: "",
    priority: "0",
    usageLimit: "",
    // Target state for simple / BOGO
    targetType: "PRODUCT" as "PRODUCT" | "VARIANT" | "CATEGORY",
    targetId: "",
    // Combo components builder
    comboComponents: [] as Array<{
      productVariantId: number;
      quantity: number;
      label?: string;
    }>,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [promos, cats, prods] = await Promise.all([
        fetchAdminPromotions({
          type: typeFilter !== "ALL" ? typeFilter : undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          search: searchQuery.trim() || undefined,
        }),
        fetchCategories(),
        fetchAdminProducts(),
      ]);
      setPromotions(promos);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      console.error("Failed to load promotions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openCreateModal = () => {
    setEditingPromo(null);
    setFormData({
      name: "",
      description: "",
      type: "SIMPLE_DISCOUNT",
      status: "ACTIVE",
      discountType: "PERCENTAGE",
      discountValue: "10",
      minOrderAmount: "",
      minQuantity: "1",
      buyQuantity: "1",
      getQuantity: "1",
      getYDiscountPercent: "100",
      comboPrice: "",
      startDate: "",
      endDate: "",
      priority: "0",
      usageLimit: "",
      targetType: "PRODUCT",
      targetId: products[0]?.id ? String(products[0].id) : "",
      comboComponents: [],
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (promo: Promotion) => {
    setEditingPromo(promo);
    const target = promo.targets?.[0];
    setFormData({
      name: promo.name,
      description: promo.description || "",
      type: promo.type,
      status: promo.status,
      discountType: promo.discountType,
      discountValue: promo.discountValue ? parseFloat(promo.discountValue).toString() : "",
      minOrderAmount: promo.minOrderAmount ? parseFloat(promo.minOrderAmount).toString() : "",
      minQuantity: promo.minQuantity ? promo.minQuantity.toString() : "1",
      buyQuantity: promo.buyQuantity ? promo.buyQuantity.toString() : "1",
      getQuantity: promo.getQuantity ? promo.getQuantity.toString() : "1",
      getYDiscountPercent: promo.getYDiscountPercent
        ? parseFloat(promo.getYDiscountPercent).toString()
        : "100",
      comboPrice: promo.comboPrice ? parseFloat(promo.comboPrice).toString() : "",
      startDate: promo.startDate ? promo.startDate.substring(0, 16) : "",
      endDate: promo.endDate ? promo.endDate.substring(0, 16) : "",
      priority: promo.priority.toString(),
      usageLimit: promo.usageLimit ? promo.usageLimit.toString() : "",
      targetType: target?.targetType || "PRODUCT",
      targetId: target ? String(target.targetId) : "",
      comboComponents: (promo.comboComponents || []).map((c) => ({
        productVariantId: c.productVariantId,
        quantity: c.quantity,
        label: c.productName ? `${c.productName} (${c.variantUnit})` : undefined,
      })),
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleToggleStatus = async (promo: Promotion) => {
    const nextStatus = promo.status === "ACTIVE" ? "DRAFT" : "ACTIVE";
    try {
      const res = await updateAdminPromotionStatus(promo.id, nextStatus);
      if (res.success) {
        setPromotions((prev) =>
          prev.map((p) =>
            p.id === promo.id
              ? {
                  ...p,
                  status: nextStatus,
                  derivedStatus:
                    nextStatus === "ACTIVE" && p.isExpired
                      ? "EXPIRED"
                      : nextStatus,
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  // Add combo component item
  const addComboComponent = (variantId: number) => {
    if (!variantId) return;
    if (formData.comboComponents.some((c) => c.productVariantId === variantId)) {
      return;
    }
    // Find variant name
    let label = `Variant #${variantId}`;
    for (const p of products) {
      const v = p.variants?.find((va) => va.id === variantId);
      if (v) {
        label = `${p.name} (${v.unit})`;
        break;
      }
    }
    setFormData((prev) => ({
      ...prev,
      comboComponents: [
        ...prev.comboComponents,
        { productVariantId: variantId, quantity: 1, label },
      ],
    }));
  };

  const removeComboComponent = (variantId: number) => {
    setFormData((prev) => ({
      ...prev,
      comboComponents: prev.comboComponents.filter(
        (c) => c.productVariantId !== variantId
      ),
    }));
  };

  const updateComboQuantity = (variantId: number, qty: number) => {
    setFormData((prev) => ({
      ...prev,
      comboComponents: prev.comboComponents.map((c) =>
        c.productVariantId === variantId ? { ...c, quantity: Math.max(1, qty) } : c
      ),
    }));
  };

  // Live Rule Preview computation
  const rulePreviewText = useMemo(() => {
    if (formData.type === "SIMPLE_DISCOUNT") {
      let targetName = "selected item";
      if (formData.targetType === "PRODUCT") {
        const prod = products.find((p) => p.id === Number(formData.targetId));
        if (prod) targetName = prod.name;
      } else if (formData.targetType === "CATEGORY") {
        const cat = categories.find((c) => c.id === Number(formData.targetId));
        if (cat) targetName = `all items in "${cat.name}" category`;
      } else if (formData.targetType === "VARIANT") {
        for (const p of products) {
          const v = p.variants?.find((va) => va.id === Number(formData.targetId));
          if (v) {
            targetName = `${p.name} (${v.unit})`;
            break;
          }
        }
      }

      const val = formData.discountValue || "0";
      const discountDesc =
        formData.discountType === "PERCENTAGE" ? `${val}% off` : `₹${val} off`;

      const minQtyDesc =
        Number(formData.minQuantity) > 1
          ? ` when buying ${formData.minQuantity}+ units`
          : "";
      const minOrderDesc =
        Number(formData.minOrderAmount) > 0
          ? ` on orders above ₹${formData.minOrderAmount}`
          : "";

      return `Get ${discountDesc} on ${targetName}${minQtyDesc}${minOrderDesc}.`;
    }

    if (formData.type === "BUY_X_GET_Y") {
      let targetName = "selected product";
      if (formData.targetType === "PRODUCT") {
        const prod = products.find((p) => p.id === Number(formData.targetId));
        if (prod) targetName = prod.name;
      } else if (formData.targetType === "VARIANT") {
        for (const p of products) {
          const v = p.variants?.find((va) => va.id === Number(formData.targetId));
          if (v) {
            targetName = `${p.name} (${v.unit})`;
            break;
          }
        }
      }

      const buy = formData.buyQuantity || "1";
      const get = formData.getQuantity || "1";
      const pct = Number(formData.getYDiscountPercent) || 100;
      const benefit = pct === 100 ? "FREE" : `at ${pct}% off`;

      return `Buy ${buy} unit(s) of ${targetName}, get ${get} unit(s) ${benefit}.`;
    }

    if (formData.type === "COMBO") {
      const price = formData.comboPrice ? `₹${formData.comboPrice}` : "special price";
      const compCount = formData.comboComponents.length;
      if (compCount === 0) {
        return `Special combo bundle at ${price} (select at least 2 products).`;
      }
      const itemsList = formData.comboComponents
        .map((c) => `${c.label || `#${c.productVariantId}`} × ${c.quantity}`)
        .join(" + ");
      return `Bundle Deal: [ ${itemsList} ] for only ${price}!`;
    }

    return "";
  }, [formData, products, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      // Build targets payload
      const targets = [];
      if (formData.type === "SIMPLE_DISCOUNT") {
        if (!formData.targetId) {
          throw new Error("Please select a target product, variant, or category.");
        }
        targets.push({
          targetType: formData.targetType,
          targetId: Number(formData.targetId),
        });
      } else if (formData.type === "BUY_X_GET_Y") {
        if (!formData.targetId) {
          throw new Error("Please select a target product or variant for BOGO.");
        }
        // BOGO strictly forbids CATEGORY
        if (formData.targetType === "CATEGORY") {
          throw new Error("BOGO promotions only support Product or Variant targets.");
        }
        targets.push({
          targetType: formData.targetType,
          targetId: Number(formData.targetId),
        });
      }

      // Build combo components
      const comboComponents = [];
      if (formData.type === "COMBO") {
        if (formData.comboComponents.length < 2) {
          throw new Error("A combo requires at least 2 distinct component variants.");
        }
        const comboPriceNum = parseFloat(formData.comboPrice);
        if (isNaN(comboPriceNum) || comboPriceNum <= 0) {
          throw new Error("Please enter a valid positive combo bundle price.");
        }
        for (const c of formData.comboComponents) {
          comboComponents.push({
            productVariantId: c.productVariantId,
            quantity: c.quantity,
          });
        }
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        status: formData.status,
        discountType:
          formData.type === "COMBO"
            ? "COMBO_PRICE"
            : formData.type === "BUY_X_GET_Y"
            ? Number(formData.getYDiscountPercent) === 100
              ? "FREE"
              : "PERCENTAGE"
            : formData.discountType,
        discountValue:
          formData.type === "SIMPLE_DISCOUNT"
            ? parseFloat(formData.discountValue) || 0
            : null,
        minOrderAmount: formData.minOrderAmount.trim()
          ? parseFloat(formData.minOrderAmount)
          : null,
        minQuantity: parseInt(formData.minQuantity, 10) || 1,
        buyQuantity:
          formData.type === "BUY_X_GET_Y"
            ? parseInt(formData.buyQuantity, 10) || 1
            : null,
        getQuantity:
          formData.type === "BUY_X_GET_Y"
            ? parseInt(formData.getQuantity, 10) || 1
            : null,
        getYDiscountPercent:
          formData.type === "BUY_X_GET_Y"
            ? parseFloat(formData.getYDiscountPercent) || 100
            : null,
        comboPrice:
          formData.type === "COMBO" ? parseFloat(formData.comboPrice) || 0 : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        priority: parseInt(formData.priority, 10) || 0,
        usageLimit: formData.usageLimit.trim()
          ? parseInt(formData.usageLimit, 10)
          : null,
        targets,
        comboComponents,
      };

      const res = editingPromo
        ? await updateAdminPromotion(editingPromo.id, payload)
        : await createAdminPromotion(payload);

      if (res.success) {
        setModalOpen(false);
        loadData();
      } else {
        setFormError(res.message || "Failed to save promotion.");
      }
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 flex items-center gap-2 sm:gap-2.5">
            <Tag className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600 shrink-0" />
            <span>Offers & Promotions</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Create simple discounts, BOGO offers, and multi-product grocery bundles with production-safe rules.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promotion</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition cursor-pointer shrink-0"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 text-xs font-medium overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-xl p-1 shrink-0">
            {["ALL", "SIMPLE_DISCOUNT", "BUY_X_GET_Y", "COMBO"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition font-semibold cursor-pointer shrink-0 ${
                  typeFilter === t
                    ? "bg-white text-neutral-900 shadow-2xs border border-neutral-200/80"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {t === "ALL"
                  ? "All Types"
                  : t === "SIMPLE_DISCOUNT"
                  ? "Discounts"
                  : t === "BUY_X_GET_Y"
                  ? "BOGO"
                  : "Combos"}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl p-1">
            {["ALL", "ACTIVE", "DRAFT", "EXPIRED", "ARCHIVED"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg transition font-semibold cursor-pointer ${
                  statusFilter === s
                    ? "bg-white text-neutral-900 shadow-2xs border border-neutral-200/80"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search promotions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </form>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-neutral-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
            Loading promotions...
          </div>
        ) : promotions.length === 0 ? (
          <div className="py-20 text-center text-sm text-neutral-500">
            <Tag className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
            No promotions found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Promotion Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Discount / Benefit</th>
                  <th className="py-3.5 px-4">Target / Components</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Usage</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                {promotions.map((p) => {
                  const isExpired = p.derivedStatus === "EXPIRED" || p.isExpired;
                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/60 transition">
                      {/* Name & Dates */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-neutral-900 text-sm">{p.name}</div>
                        {p.description && (
                          <div className="text-[11px] text-neutral-500 truncate mt-0.5">
                            {p.description}
                          </div>
                        )}
                        <div className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {p.startDate ? new Date(p.startDate).toLocaleDateString() : "Immediate"}
                          {" → "}
                          {p.endDate ? new Date(p.endDate).toLocaleDateString() : "No Expiry"}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        {p.type === "SIMPLE_DISCOUNT" && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                            <Percent className="w-3 h-3" /> Simple Discount
                          </span>
                        )}
                        {p.type === "BUY_X_GET_Y" && (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                            <Gift className="w-3 h-3" /> BOGO
                          </span>
                        )}
                        {p.type === "COMBO" && (
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                            <PackageCheck className="w-3 h-3" /> Combo
                          </span>
                        )}
                      </td>

                      {/* Discount / Benefit */}
                      <td className="py-3.5 px-4">
                        {p.type === "SIMPLE_DISCOUNT" && (
                          <div className="font-bold text-neutral-900">
                            {p.discountType === "PERCENTAGE"
                              ? `${parseFloat(p.discountValue || "0")}% OFF`
                              : `₹${parseFloat(p.discountValue || "0")} OFF`}
                          </div>
                        )}
                        {p.type === "BUY_X_GET_Y" && (
                          <div className="font-bold text-neutral-900">
                            Buy {p.buyQuantity} Get {p.getQuantity}{" "}
                            {parseFloat(p.getYDiscountPercent || "100") === 100
                              ? "FREE"
                              : `@ ${p.getYDiscountPercent}% off`}
                          </div>
                        )}
                        {p.type === "COMBO" && (
                          <div className="font-bold text-neutral-900 text-rose-700">
                            Combo: {formatPrice(p.comboPrice || 0)}
                          </div>
                        )}
                      </td>

                      {/* Target Summary */}
                      <td className="py-3.5 px-4 text-[11px]">
                        {p.type === "COMBO" ? (
                          <span className="text-purple-700 font-semibold">
                            {p.comboComponents?.length || 0} component variants
                          </span>
                        ) : p.targets?.[0] ? (
                          <span className="bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-md">
                            {p.targets[0].targetType}: #{p.targets[0].targetId}
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 font-bold text-neutral-800">
                        {p.priority}
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4 text-[11px]">
                        <span className="font-semibold text-neutral-900">{p.timesUsed}</span>
                        <span className="text-neutral-400">
                          {" "}/ {p.usageLimit ? p.usageLimit : "∞"}
                        </span>
                      </td>

                      {/* Derived Status Badge */}
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                            <Clock className="w-3 h-3" /> Expired
                          </span>
                        ) : p.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : p.status === "DRAFT" ? (
                          <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-600 border border-neutral-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                            Archived
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(p)}
                            title={p.status === "ACTIVE" ? "Set to Draft" : "Activate"}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition cursor-pointer"
                          >
                            {p.status === "ACTIVE" ? (
                              <XCircle className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-neutral-200 overflow-hidden my-8">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-rose-700" />
                {editingPromo ? "Edit Promotion" : "Create New Promotion"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Promotion Type Selector */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Promotion Type *
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    {
                      id: "SIMPLE_DISCOUNT",
                      label: "Simple Discount",
                      desc: "Percentage or fixed ₹ off",
                      icon: Percent,
                    },
                    {
                      id: "BUY_X_GET_Y",
                      label: "Buy X Get Y (BOGO)",
                      desc: "Buy X get Y free or % off",
                      icon: Gift,
                    },
                    {
                      id: "COMBO",
                      label: "Multi-Product Combo",
                      desc: "Grocery bundle package",
                      icon: PackageCheck,
                    },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = formData.type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            type: t.id as any,
                            // Ensure BOGO target type is never category
                            targetType:
                              t.id === "BUY_X_GET_Y" && formData.targetType === "CATEGORY"
                                ? "PRODUCT"
                                : formData.targetType,
                          })
                        }
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                          isSelected
                            ? "border-rose-600 bg-rose-50/70 text-rose-950 ring-2 ring-rose-500/20 shadow-xs"
                            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Icon className="w-4 h-4 text-rose-600" />
                          {t.label}
                        </div>
                        <span className="text-[10px] text-neutral-500 mt-1">
                          {t.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Basic Details: Name & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Promotion Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Tea Gold 10% Discount"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Description (Customer-Facing)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Get 10% off instantly on aromatic tea packs"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Conditional Form Sections */}
              {/* 1. SIMPLE DISCOUNT CONFIG */}
              {formData.type === "SIMPLE_DISCOUNT" && (
                <div className="p-4 bg-amber-50/40 border border-amber-200/80 rounded-2xl space-y-3">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-amber-700" />
                    Simple Discount Rules
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Discount Type
                      </label>
                      <select
                        value={formData.discountType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountType: e.target.value as any,
                          })
                        }
                        className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl font-medium"
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED_AMOUNT">Fixed Rupee (₹)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Discount Value *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        placeholder="10"
                        value={formData.discountValue}
                        onChange={(e) =>
                          setFormData({ ...formData, discountValue: e.target.value })
                        }
                        className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Target Type
                      </label>
                      <select
                        value={formData.targetType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetType: e.target.value as any,
                            targetId: "",
                          })
                        }
                        className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl font-medium"
                      >
                        <option value="PRODUCT">Product</option>
                        <option value="CATEGORY">Entire Category</option>
                        <option value="VARIANT">Product Variant</option>
                      </select>
                    </div>
                  </div>

                  {/* Target Entity Selector */}
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Target {formData.targetType} *
                    </label>
                    {formData.targetType === "PRODUCT" && (
                      <select
                        required
                        value={formData.targetId}
                        onChange={(e) =>
                          setFormData({ ...formData, targetId: e.target.value })
                        }
                        className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
                      >
                        <option value="">Select a Product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.hindiName ? `(${p.hindiName})` : ""}
                          </option>
                        ))}
                      </select>
                    )}

                    {formData.targetType === "CATEGORY" && (
                      <select
                        required
                        value={formData.targetId}
                        onChange={(e) =>
                          setFormData({ ...formData, targetId: e.target.value })
                        }
                        className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
                      >
                        <option value="">Select a Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.hindiName ? `(${c.hindiName})` : ""}
                          </option>
                        ))}
                      </select>
                    )}

                    {formData.targetType === "VARIANT" && (
                      <select
                        required
                        value={formData.targetId}
                        onChange={(e) =>
                          setFormData({ ...formData, targetId: e.target.value })
                        }
                        className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
                      >
                        <option value="">Select a Variant</option>
                        {products.flatMap((p) =>
                          (p.variants || []).map((v) => (
                            <option key={v.id} value={v.id}>
                              {p.name} — {v.unit} (₹{v.sellingPrice})
                            </option>
                          ))
                        )}
                      </select>
                    )}
                  </div>

                  {/* Optional Min Quantity and Min Order Amount */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Min Quantity (Default: 1)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.minQuantity}
                        onChange={(e) =>
                          setFormData({ ...formData, minQuantity: e.target.value })
                        }
                        className="w-full p-2 bg-white border border-neutral-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Min Gross Cart Subtotal (₹ Optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 500"
                        value={formData.minOrderAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, minOrderAmount: e.target.value })
                        }
                        className="w-full p-2 bg-white border border-neutral-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. BUY X GET Y CONFIG */}
              {formData.type === "BUY_X_GET_Y" && (
                <div className="p-4 bg-blue-50/40 border border-blue-200/80 rounded-2xl space-y-3">
                  <div className="font-bold text-blue-950 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-blue-700" />
                      Buy X Get Y (BOGO) Rules
                    </span>
                    <span className="text-[10px] text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                      Product or Variant Targets Only
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Target Type
                      </label>
                      <select
                        value={formData.targetType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetType: e.target.value as any,
                            targetId: "",
                          })
                        }
                        className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
                      >
                        <option value="PRODUCT">Product</option>
                        <option value="VARIANT">Product Variant</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Select Target *
                      </label>
                      {formData.targetType === "PRODUCT" ? (
                        <select
                          required
                          value={formData.targetId}
                          onChange={(e) =>
                            setFormData({ ...formData, targetId: e.target.value })
                          }
                          className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
                        >
                          <option value="">Select a Product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.hindiName ? `(${p.hindiName})` : ""}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          required
                          value={formData.targetId}
                          onChange={(e) =>
                            setFormData({ ...formData, targetId: e.target.value })
                          }
                          className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl"
                        >
                          <option value="">Select a Variant</option>
                          {products.flatMap((p) =>
                            (p.variants || []).map((v) => (
                              <option key={v.id} value={v.id}>
                                {p.name} — {v.unit} (₹{v.sellingPrice})
                              </option>
                            ))
                          )}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Buy Quantity (X) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.buyQuantity}
                        onChange={(e) =>
                          setFormData({ ...formData, buyQuantity: e.target.value })
                        }
                        className="w-full p-2 bg-white border border-neutral-200 rounded-xl font-bold text-center"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Get Quantity (Y) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.getQuantity}
                        onChange={(e) =>
                          setFormData({ ...formData, getQuantity: e.target.value })
                        }
                        className="w-full p-2 bg-white border border-neutral-200 rounded-xl font-bold text-center"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Get-Y Discount (%) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={formData.getYDiscountPercent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            getYDiscountPercent: e.target.value,
                          })
                        }
                        className="w-full p-2 bg-white border border-neutral-200 rounded-xl font-bold text-center"
                      />
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        100 = Free, 50 = Half Price
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. COMBO CONFIG */}
              {formData.type === "COMBO" && (
                <div className="p-4 bg-purple-50/40 border border-purple-200/80 rounded-2xl space-y-3">
                  <div className="font-bold text-purple-950 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <PackageCheck className="w-4 h-4 text-purple-700" />
                      Multi-Product Combo Rules
                    </span>
                    <span className="text-[10px] text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">
                      Physical Variant Inventory Preserved
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Combo Package Price (₹) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      placeholder="e.g. 499"
                      value={formData.comboPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, comboPrice: e.target.value })
                      }
                      className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl font-bold text-neutral-900"
                    />
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">
                      Note: Combo will only apply if the normal component price total is greater than this combo price.
                    </span>
                  </div>

                  {/* Component Variants Builder */}
                  <div className="space-y-2 pt-1">
                    <label className="block font-semibold text-neutral-700">
                      Required Component Variants (At least 2):
                    </label>

                    {formData.comboComponents.length > 0 && (
                      <div className="space-y-1.5 divide-y divide-neutral-100 bg-white p-3 rounded-xl border border-neutral-200">
                        {formData.comboComponents.map((c) => (
                          <div
                            key={c.productVariantId}
                            className="flex items-center justify-between gap-3 pt-1.5 first:pt-0"
                          >
                            <span className="font-medium text-neutral-800 text-xs">
                              {c.label || `Variant #${c.productVariantId}`}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-neutral-500">Qty:</span>
                              <input
                                type="number"
                                min="1"
                                value={c.quantity}
                                onChange={(e) =>
                                  updateComboQuantity(
                                    c.productVariantId,
                                    parseInt(e.target.value, 10) || 1
                                  )
                                }
                                className="w-14 p-1 text-center bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => removeComboComponent(c.productVariantId)}
                                className="p-1 text-neutral-400 hover:text-rose-600 rounded-md"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Component Variant Selector */}
                    <div className="flex items-center gap-2">
                      <select
                        id="comboVariantSelect"
                        className="flex-1 p-2 bg-white border border-neutral-200 rounded-xl text-xs"
                        defaultValue=""
                      >
                        <option value="">Select variant to add to combo...</option>
                        {products.flatMap((p) =>
                          (p.variants || []).map((v) => (
                            <option key={v.id} value={v.id}>
                              {p.name} — {v.unit} (₹{v.sellingPrice})
                            </option>
                          ))
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const select = document.getElementById(
                            "comboVariantSelect"
                          ) as HTMLSelectElement;
                          if (select && select.value) {
                            addComboComponent(Number(select.value));
                            select.value = "";
                          }
                        }}
                        className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs cursor-pointer"
                      >
                        + Add Component
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Priority, Dates & Usage Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                  <span className="text-[10px] text-neutral-400">Higher = wins</span>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="∞"
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, usageLimit: e.target.value })
                    }
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl"
                  />
                  <span className="text-[10px] text-neutral-400">Leave blank for ∞</span>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Live Rule Preview Card */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-2 text-emerald-950">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold block">Live Rule Preview:</span>
                  <p className="text-emerald-800 mt-0.5">{rulePreviewText}</p>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="pt-3 flex items-center justify-between border-t border-neutral-100">
                <label className="flex items-center gap-2 font-semibold text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.status === "ACTIVE"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.checked ? "ACTIVE" : "DRAFT",
                      })
                    }
                    className="w-4 h-4 rounded-sm text-rose-600 focus:ring-rose-500"
                  />
                  Activate promotion immediately
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer"
                  >
                    {submitting
                      ? "Saving..."
                      : editingPromo
                      ? "Update Promotion"
                      : "Create Promotion"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
