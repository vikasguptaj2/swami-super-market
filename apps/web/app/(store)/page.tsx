import { fetchCategories, fetchFeaturedProducts } from "@/lib/api";
import { CategoryGrid } from "@/components/store/CategoryGrid";
import { ProductCard } from "@/components/store/ProductCard";
import { Sparkles, ShoppingBag } from "lucide-react";

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    fetchCategories(),
    fetchFeaturedProducts(24),
  ]);

  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 bg-emerald-700/80 text-emerald-200 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            दैनिक किराने का ताज़ा सामान
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            Swami Super Market
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 mt-2 leading-relaxed">
            उसासा और आसपास के क्षेत्रों के लिए आटा, दाल, तेल, मसाले, चाय और रोजमर्रा के आवश्यक सामान की आसान खरीदारी।
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

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
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
            Popular Daily Groceries
          </h2>
          <p className="text-xs text-neutral-500">
            रोजमर्रा के सबसे लोकप्रिय उत्पाद
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
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
    </div>
  );
}
