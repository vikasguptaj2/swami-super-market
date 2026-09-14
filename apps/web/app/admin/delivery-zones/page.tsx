"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import {
  Truck,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  X,
  MapPin,
  IndianRupee,
} from "lucide-react";
import { adminFetch } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface DeliveryZone {
  id: number;
  name: string;
  hindiName: string | null;
  minOrderAmount: string;
  deliveryCharge: string;
  freeDeliveryAboveAmount: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDeliveryZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    hindiName: "",
    minOrderAmount: "0",
    deliveryCharge: "0",
    freeDeliveryAboveAmount: "",
    displayOrder: "0",
    isActive: true,
  });

  const loadZones = async () => {
    try {
      setLoading(true);
      const res = await adminFetch(`${API_URL}/admin/delivery-zones`);
      const data = await res.json();
      if (data.success) {
        setZones(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load delivery zones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  const openCreateModal = () => {
    setEditingZone(null);
    setFormData({
      name: "",
      hindiName: "",
      minOrderAmount: "0",
      deliveryCharge: "0",
      freeDeliveryAboveAmount: "",
      displayOrder: (zones.length + 1).toString(),
      isActive: true,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      hindiName: zone.hindiName || "",
      minOrderAmount: parseFloat(zone.minOrderAmount || "0").toString(),
      deliveryCharge: parseFloat(zone.deliveryCharge || "0").toString(),
      freeDeliveryAboveAmount: zone.freeDeliveryAboveAmount
        ? parseFloat(zone.freeDeliveryAboveAmount).toString()
        : "",
      displayOrder: zone.displayOrder.toString(),
      isActive: zone.isActive,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleToggleActive = async (zone: DeliveryZone) => {
    try {
      const res = await adminFetch(`${API_URL}/admin/delivery-zones/${zone.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !zone.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setZones((prev) =>
          prev.map((z) => (z.id === zone.id ? { ...z, isActive: !z.isActive } : z))
        );
      }
    } catch (err) {
      console.error("Failed to toggle zone active state:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        hindiName: formData.hindiName.trim() || null,
        minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
        deliveryCharge: parseFloat(formData.deliveryCharge) || 0,
        freeDeliveryAboveAmount: formData.freeDeliveryAboveAmount.trim()
          ? parseFloat(formData.freeDeliveryAboveAmount)
          : null,
        displayOrder: parseInt(formData.displayOrder, 10) || 0,
        isActive: formData.isActive,
      };

      const url = editingZone
        ? `${API_URL}/admin/delivery-zones/${editingZone.id}`
        : `${API_URL}/admin/delivery-zones`;

      const method = editingZone ? "PUT" : "POST";

      const res = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        loadZones();
      } else {
        setFormError(data.message || "Failed to save delivery zone.");
      }
    } catch (err: any) {
      setFormError(err.message || "Network error occurred.");
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
            <Truck className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-700 shrink-0" />
            <span>Delivery Zones</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Configure delivery charges, minimum order limits, and free-delivery thresholds by area.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Zone</span>
          </button>
          <button
            onClick={loadZones}
            className="p-2 text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition cursor-pointer shrink-0"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Zones Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-neutral-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            Loading delivery zones...
          </div>
        ) : zones.length === 0 ? (
          <div className="py-20 text-center text-sm text-neutral-500">
            <MapPin className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
            No delivery zones configured yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Order</th>
                  <th className="py-3.5 px-4">Area / Zone Name</th>
                  <th className="py-3.5 px-4">Min. Order</th>
                  <th className="py-3.5 px-4">Delivery Fee</th>
                  <th className="py-3.5 px-4">Free Delivery Above</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-neutral-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-neutral-400">
                      #{zone.displayOrder}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-900">{zone.name}</div>
                      {zone.hindiName && (
                        <div className="text-[11px] text-neutral-500 font-normal">
                          {zone.hindiName}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-neutral-800">
                      {parseFloat(zone.minOrderAmount) > 0 ? (
                        formatPrice(zone.minOrderAmount)
                      ) : (
                        <span className="text-neutral-400 font-normal">No minimum</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      {parseFloat(zone.deliveryCharge) === 0 ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                          FREE
                        </span>
                      ) : (
                        <span className="text-neutral-900">
                          {formatPrice(zone.deliveryCharge)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-neutral-700">
                      {zone.freeDeliveryAboveAmount ? (
                        <span className="text-emerald-700 font-bold">
                          {formatPrice(zone.freeDeliveryAboveAmount)}
                        </span>
                      ) : (
                        <span className="text-neutral-400 font-normal">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(zone)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                          zone.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200"
                        }`}
                      >
                        {zone.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(zone)}
                        className="p-1.5 text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-700" />
                {editingZone ? "Edit Delivery Zone" : "New Delivery Zone"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition"
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

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Zone Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Usasa & Nearby Villages"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Hindi Name (वैकल्पिक / Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. उसासा एवं नजदीकी गाँव"
                  value={formData.hindiName}
                  onChange={(e) => setFormData({ ...formData, hindiName: e.target.value })}
                  className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Delivery Charge (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="0"
                    value={formData.deliveryCharge}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryCharge: e.target.value })
                    }
                    className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800"
                  />
                  <span className="text-[10px] text-neutral-400">0 for always free</span>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Minimum Order (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={formData.minOrderAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, minOrderAmount: e.target.value })
                    }
                    className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800"
                  />
                  <span className="text-[10px] text-neutral-400">0 for no minimum</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Free Delivery Above (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 500 (Optional)"
                    value={formData.freeDeliveryAboveAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        freeDeliveryAboveAmount: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800"
                  />
                  <span className="text-[10px] text-neutral-400">
                    Leave blank if never waived
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: e.target.value })
                    }
                    className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800"
                  />
                  <span className="text-[10px] text-neutral-400">Lower = shows first</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
                <label className="flex items-center gap-2 font-semibold text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500"
                  />
                  Zone is Active
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer"
                  >
                    {submitting ? "Saving..." : editingZone ? "Update Zone" : "Create Zone"}
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
