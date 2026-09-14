"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Store,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Navigation,
  ExternalLink,
} from "lucide-react";
import { fetchStoreSettings, StoreSettings } from "@/lib/api";

export function Footer() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    fetchStoreSettings().then((s) => {
      if (s) setSettings(s);
    });
  }, []);

  const phone = settings?.phoneNumber || "918853070705";
  const whatsapp = settings?.whatsappNumber || "918853070705";
  const address =
    settings?.address ||
    "Usasa Bazar, Near Primary School, Ballia, Uttar Pradesh - 277001";
  const hindiAddress =
    settings?.hindiAddress ||
    "उसासा बाज़ार, प्राथमिक विद्यालय के पास, बलिया, उत्तर प्रदेश - 277001";
  const hours =
    settings?.openingHoursText ||
    "Mon - Sun: 7:00 AM - 9:30 PM (All 7 Days Open)";
  const mapsUrl =
    settings?.googleMapsUrl ||
    "https://maps.google.com/?q=Usasa+Ballia+Uttar+Pradesh";
  const photos = settings?.photos || [];

  const cleanWhatsApp = whatsapp.replace(/[^0-9]/g, "");
  const generalInquiryMessage = encodeURIComponent(
    "Namaste Swami Super Market! I have an inquiry regarding your store and groceries."
  );

  return (
    <footer className="bg-white border-t border-neutral-200 mt-16 text-neutral-600 text-xs">
      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Column 1: Store Brand & About */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-lg text-neutral-900 block leading-tight">
                  Swami Super Market
                </span>
                <span className="text-xs text-emerald-700 font-semibold">
                  स्वामी सुपर मार्केट • उसासा, बलिया
                </span>
              </div>
            </div>

            <p className="text-neutral-500 leading-relaxed max-w-md">
              Your trusted local grocery store in Usasa, Ballia (UP). Providing fresh flour, pulses, spices, daily staples, and home essentials with instant WhatsApp ordering and doorstep village delivery.
            </p>

            {/* Quick Action Contact Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <a
                href={`https://wa.me/${cleanWhatsApp}?text=${generalInquiryMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Us
              </a>

              <a
                href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-semibold transition cursor-pointer"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                Call Now
              </a>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-semibold transition cursor-pointer"
                >
                  <Navigation className="w-4 h-4 text-emerald-600" />
                  Get Directions
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Location & Hours */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">
              Store Visit & Timings
            </h3>

            <div className="space-y-3 text-neutral-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-neutral-900">{address}</div>
                  {hindiAddress && (
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      {hindiAddress}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-neutral-900 block">Opening Hours:</span>
                  <span className="text-neutral-600">{hours}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-semibold text-neutral-900">Phone: </span>
                  <span>+{phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Store Photos Gallery */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">
              Our Store
            </h3>

            {photos && photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {photos.slice(0, 4).map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-4/3 rounded-xl overflow-hidden border border-neutral-200/80 bg-neutral-100 group"
                  >
                    <img
                      src={imgUrl}
                      alt={`Swami Super Market store ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-neutral-400 text-center">
                <Store className="w-6 h-6 mx-auto mb-1 opacity-50" />
                <span>Local Super Market in Usasa, Ballia</span>
              </div>
            )}
          </div>
        </div>

        {/* Trust & Payment Modes Row */}
        <div className="mt-10 pt-6 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-neutral-600">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50/80 border border-neutral-100">
            <span className="text-xl">💵</span>
            <div>
              <span className="font-bold text-neutral-900 block text-xs">कैश ऑन डिलीवरी (COD)</span>
              <span className="text-[11px] text-neutral-500">घर पर सामान देखकर भुगतान करें</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50/80 border border-neutral-100">
            <span className="text-xl">📱</span>
            <div>
              <span className="font-bold text-neutral-900 block text-xs">UPI पेमेंट उपलब्ध</span>
              <span className="text-[11px] text-neutral-500">Google Pay, PhonePe, Paytm QR</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50/80 border border-neutral-100">
            <span className="text-xl">💬</span>
            <div>
              <span className="font-bold text-neutral-900 block text-xs">सीधे WhatsApp पर ऑर्डर</span>
              <span className="text-[11px] text-neutral-500">लिस्ट भेजें या 1-क्लिक कार्ट चेकआउट</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-neutral-400 text-[11px]">
          <p>© {new Date().getFullYear()} Swami Super Market (स्वामी सुपर मार्केट) • उसासा, बलिया (उ.प्र.). All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-emerald-700 font-medium transition">
              Home
            </Link>
            <span>•</span>
            <Link href="/cart" className="hover:text-emerald-700 font-medium transition">
              Cart
            </Link>
            <span>•</span>
            <Link href="/admin/orders" className="hover:text-neutral-700 transition">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
