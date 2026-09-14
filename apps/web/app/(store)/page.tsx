import {
  fetchCategories,
  fetchFeaturedProducts,
  fetchStoreSettings,
  fetchPublicPromotions,
  Promotion,
} from "@/lib/api";
import { CategoryGrid } from "@/components/store/CategoryGrid";
import { ProductCard } from "@/components/store/ProductCard";
import { formatPrice } from "@/lib/utils";
import {
  Sparkles,
  ShoppingBag,
  MapPin,
  Clock,
  Navigation,
  Tag,
  Gift,
  PackageCheck,
  Percent,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, products, storeSettings, activePromotions] = await Promise.all([
    fetchCategories(),
    fetchFeaturedProducts(24),
    fetchStoreSettings(),
    fetchPublicPromotions(),
  ]);

  // Create a lookup of promotion badges by product ID and variant ID
  const promoBadgeByProductId = new Map<number, string>();
  for (const promo of activePromotions) {
    let badgeText = "";
    if (promo.type === "BUY_X_GET_Y") {
      badgeText = `BUY ${promo.buyQuantity} GET ${promo.getQuantity} ${
        parseFloat(promo.getYDiscountPercent || "100") === 100 ? "FREE" : "OFF"
      }`;
    } else if (promo.type === "COMBO") {
      badgeText = "COMBO DEAL";
    } else if (promo.type === "SIMPLE_DISCOUNT") {
      badgeText =
        promo.discountType === "PERCENTAGE"
          ? `${parseFloat(promo.discountValue || "0")}% OFF`
          : `₹${parseFloat(promo.discountValue || "0")} OFF`;
    }

    // Map targets
    for (const target of promo.targets || []) {
      if (target.targetType === "PRODUCT") {
        if (!promoBadgeByProductId.has(target.targetId)) {
          promoBadgeByProductId.set(target.targetId, badgeText);
        }
      }
    }
  }

  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 sm:p-9 shadow-xl shadow-emerald-950/15 relative overflow-hidden border border-emerald-800/40">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-800/90 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full border border-emerald-700/50 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              100% शुद्ध एवं ताज़ा किराना
            </span>
            <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-400/30">
              ⚡ उसासा, बलिया • त्वरित डिलीवरी
            </span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
              Swami Super Market
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 mt-2.5 leading-relaxed max-w-2xl font-normal">
              उसासा और आसपास के क्षेत्रों के लिए आटा, दाल, तेल, मसाले, चाय, नमकीन और रोजमर्रा के आवश्यक सामान की विश्वसनीय खरीदारी।
            </p>
          </div>

          {/* Value Badges Row */}
          <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-emerald-200/90 font-medium border-t border-emerald-800/60">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>सही तौल, पक्का भरोसा</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>सीधे WhatsApp पर 1-क्लिक ऑर्डर</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <span>कैश ऑन डिलीवरी (COD) उपलब्ध</span>
            </div>
          </div>
        </div>

        {/* Decorative ambient background glows */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 -mb-16 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Today's Special Offers Rail (Only displayed when offers are active) */}
      {activePromotions.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-neutral-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-rose-600" />
                Today's Special Offers
              </h2>
              <p className="text-xs text-neutral-500">
                विशेष छूट, कॉम्बो पैकेज और बाय 1 गेट 1 फ्री ऑफर्स
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePromotions.slice(0, 3).map((promo) => (
              <div
                key={promo.id}
                className="bg-gradient-to-br from-rose-50 via-white to-amber-50 rounded-2xl border border-rose-200/80 p-4.5 shadow-2xs flex flex-col justify-between relative overflow-hidden"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full tracking-wider uppercase shadow-2xs">
                      {promo.type === "BUY_X_GET_Y"
                        ? "BOGO Offer"
                        : promo.type === "COMBO"
                        ? "Super Combo"
                        : "Special Discount"}
                    </span>
                    {promo.endDate && (
                      <span className="text-[10px] text-neutral-400 font-medium">
                        Ends {new Date(promo.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-neutral-900 leading-snug pt-1">
                    {promo.name}
                  </h3>
                  {promo.description && (
                    <p className="text-xs text-neutral-600 line-clamp-2">
                      {promo.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-between">
                  <div className="text-xs font-black text-rose-700">
                    {promo.type === "COMBO"
                      ? `Package: ${formatPrice(promo.comboPrice || 0)}`
                      : promo.type === "BUY_X_GET_Y"
                      ? `Buy ${promo.buyQuantity} Get ${promo.getQuantity} Free`
                      : promo.discountType === "PERCENTAGE"
                      ? `${parseFloat(promo.discountValue || "0")}% Instant Off`
                      : `₹${parseFloat(promo.discountValue || "0")} Instant Off`}
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-400">
                    Auto-applied at checkout
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 10 Fixed Categories Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-700" />
              Shop by Category
            </h2>
            <p className="text-xs text-neutral-500">
              श्रेणी चुनें और अपनी पसंद का सामान देखें
            </p>
          </div>
        </div>

        {categories.length > 0 ? (
          <CategoryGrid categories={categories} />
        ) : (
          <div className="p-8 text-center text-sm text-neutral-500 bg-white rounded-2xl border border-neutral-200">
            Connecting to database... Categories will appear here once seeded.
          </div>
        )}
      </section>

      {/* Featured Products Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
              🔥
            </span>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-neutral-900 tracking-tight">
                Popular Daily Groceries
              </h2>
              <p className="text-xs text-neutral-500">
                उसासा स्टोर के सर्वाधिक बिकने वाले लोकप्रिय उत्पाद
              </p>
            </div>
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 bg-emerald-50/90 px-3 py-1 rounded-full border border-emerald-200/60 self-start sm:self-auto">
            100% Original Brands & Fresh Stock
          </span>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                promotionBadge={promoBadgeByProductId.get(product.id)}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-neutral-300">
            <ShoppingBag className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-700">No products found</p>
            <p className="text-xs text-neutral-500 mt-1">
              Start the API server and seed the database to view catalog products.
            </p>
          </div>
        )}
      </section>

      {/* Visit Our Store Section */}
      {storeSettings && (
        <section className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-neutral-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-700" />
                Visit Swami Super Market
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                दुकान पर पधारें या सीधे ऑनलाइन व्हाट्सएप ऑर्डर करें
              </p>
            </div>

            {storeSettings.googleMapsUrl && (
              <a
                href={storeSettings.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs self-start sm:self-auto"
              >
                <Navigation className="w-4 h-4" />
                Get Directions / रास्ता देखें
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-6 space-y-4 text-xs text-neutral-600">
              <div className="space-y-1">
                <span className="font-bold text-neutral-900 block text-sm">Store Address:</span>
                <p className="text-neutral-800 font-medium leading-relaxed">{storeSettings.address}</p>
                {storeSettings.hindiAddress && (
                  <p className="text-neutral-500">{storeSettings.hindiAddress}</p>
                )}
              </div>

              {storeSettings.openingHoursText && (
                <div className="flex items-start gap-2 pt-2">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-900 block">Timings:</span>
                    <span>{storeSettings.openingHoursText}</span>
                  </div>
                </div>
              )}
            </div>

            {storeSettings.mapsEmbedUrl && (
              <div className="md:col-span-6 h-56 rounded-2xl overflow-hidden border border-neutral-200">
                <iframe
                  src={storeSettings.mapsEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Swami Super Market Map"
                />
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
