"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  Store,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Navigation,
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  Upload,
  Loader2,
} from "lucide-react";
import { adminFetch, uploadAdminImage } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface StoreSettingsData {
  id: number;
  address: string;
  hindiAddress: string | null;
  phoneNumber: string;
  whatsappNumber: string;
  googleMapsUrl: string | null;
  mapsEmbedUrl: string | null;
  openingHoursText: string | null;
  photos: string[];
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    address: "",
    hindiAddress: "",
    phoneNumber: "",
    whatsappNumber: "",
    googleMapsUrl: "",
    mapsEmbedUrl: "",
    openingHoursText: "",
    photos: [] as string[],
  });

  const [newPhotoInput, setNewPhotoInput] = useState("");

  const loadSettings = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await adminFetch(`${API_URL}/admin/store-settings`);
      const json = await res.json();
      if (json.success && json.data) {
        const s: StoreSettingsData = json.data;
        setFormData({
          address: s.address || "",
          hindiAddress: s.hindiAddress || "",
          phoneNumber: s.phoneNumber || "",
          whatsappNumber: s.whatsappNumber || "",
          googleMapsUrl: s.googleMapsUrl || "",
          mapsEmbedUrl: s.mapsEmbedUrl || "",
          openingHoursText: s.openingHoursText || "",
          photos: Array.isArray(s.photos) ? s.photos : [],
        });
      }
    } catch (err: any) {
      console.error("Failed to load store settings:", err);
      setErrorMessage("Failed to load store settings from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleAddPhoto = () => {
    const url = newPhotoInput.trim();
    if (!url) return;
    if (formData.photos.includes(url)) {
      alert("This image URL is already added.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, url],
    }));
    setNewPhotoInput("");
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  const handleUploadPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setPhotoUploadError(null);

    const res = await uploadAdminImage(file);
    setUploadingPhoto(false);

    if (res.success && res.url) {
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, res.url!],
      }));
    } else {
      setPhotoUploadError(res.message || "Failed to upload photo to Cloudinary.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        address: formData.address.trim(),
        hindiAddress: formData.hindiAddress.trim() || null,
        phoneNumber: formData.phoneNumber.trim().replace(/[^0-9]/g, ""),
        whatsappNumber: formData.whatsappNumber.trim().replace(/[^0-9]/g, ""),
        googleMapsUrl: formData.googleMapsUrl.trim() || null,
        mapsEmbedUrl: formData.mapsEmbedUrl.trim() || null,
        openingHoursText: formData.openingHoursText.trim() || null,
        photos: formData.photos,
      };

      const res = await adminFetch(`${API_URL}/admin/store-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMessage("Store settings saved successfully!");
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(json.message || "Failed to update store settings.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-neutral-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
        Loading store settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 flex items-center gap-2 sm:gap-2.5">
            <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-700 shrink-0" />
            <span>Store Info & Settings</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage store address, contact phone numbers, WhatsApp intake, timings, and store photos.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSettings}
          className="p-2 text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition self-end sm:self-auto cursor-pointer shrink-0"
          title="Reload settings"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: Contact & WhatsApp */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-700" />
            Contact & WhatsApp Order Intake
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                Store WhatsApp Number (Single Source of Truth) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 918853070705"
                value={formData.whatsappNumber}
                onChange={(e) =>
                  setFormData({ ...formData, whatsappNumber: e.target.value })
                }
                className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800 font-mono font-bold"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Must include country code (e.g. 91 for India). Used for incoming customer orders and WhatsApp Us button.
              </p>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                Store Calling Phone Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 918853070705"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800 font-mono"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Used for the "Call Now" tel: link in the storefront header and footer.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Physical Address & Timings */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-700" />
            Store Location & Hours
          </h2>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Store Address (English) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Usasa Bazar, Near Primary School, Ballia, Uttar Pradesh - 277001"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Store Address (हिन्दी / Hindi)
            </label>
            <input
              type="text"
              placeholder="e.g. उसासा बाज़ार, प्राथमिक विद्यालय के पास, बलिया, उत्तर प्रदेश - 277001"
              value={formData.hindiAddress}
              onChange={(e) =>
                setFormData({ ...formData, hindiAddress: e.target.value })
              }
              className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              Opening Hours / दुकान का समय
            </label>
            <input
              type="text"
              placeholder="e.g. Mon - Sun: 7:00 AM - 9:30 PM (All 7 Days Open)"
              value={formData.openingHoursText}
              onChange={(e) =>
                setFormData({ ...formData, openingHoursText: e.target.value })
              }
              className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800"
            />
          </div>
        </div>

        {/* Section 3: Google Maps Integration */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-700" />
            Google Maps Links
          </h2>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Google Maps Share URL (For "Get Directions" button)
            </label>
            <input
              type="url"
              placeholder="e.g. https://maps.google.com/?q=Usasa+Ballia"
              value={formData.googleMapsUrl}
              onChange={(e) =>
                setFormData({ ...formData, googleMapsUrl: e.target.value })
              }
              className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Google Maps Embed URL (For homepage map iframe)
            </label>
            <input
              type="text"
              placeholder="e.g. https://www.google.com/maps/embed?pb=..."
              value={formData.mapsEmbedUrl}
              onChange={(e) =>
                setFormData({ ...formData, mapsEmbedUrl: e.target.value })
              }
              className="w-full p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800"
            />
            <p className="text-[10px] text-neutral-400 mt-1">
              Optional. If provided, embeds an interactive map on the store homepage.
            </p>
          </div>
        </div>

        {/* Section 4: Store Photos Gallery */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-700" />
            Store Photos Gallery ({formData.photos.length})
          </h2>

          {/* File Upload Option */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition cursor-pointer text-xs shadow-xs">
              {uploadingPhoto ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading to Cloudinary...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload Store Photo File</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingPhoto}
                onChange={handleUploadPhotoFile}
                className="hidden"
              />
            </label>
            <span className="text-xs text-neutral-500">
              Uploads directly to Cloudinary and adds to gallery
            </span>
          </div>

          {photoUploadError && (
            <p className="text-xs text-red-600 font-medium">{photoUploadError}</p>
          )}

          {/* Manual URL Input Fallback */}
          <div className="space-y-1 pt-1">
            <span className="text-[11px] text-neutral-400 block font-medium">Or paste public image URL directly (fallback):</span>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste public image URL (https://...)"
                value={newPhotoInput}
                onChange={(e) => setNewPhotoInput(e.target.value)}
                className="flex-1 p-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-800 text-xs"
              />
              <button
                type="button"
                onClick={handleAddPhoto}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-900 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add URL
              </button>
            </div>
          </div>

          {formData.photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {formData.photos.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-4/3 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 group"
                >
                  <img
                    src={url}
                    alt={`Store photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-400 italic text-[11px] pt-1">
              No store photos added yet. Add image URLs to show in the customer footer.
            </p>
          )}
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-700/20 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Settings..." : "Save Store Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
