import Link from "next/link";
import { searchProducts } from "@/lib/api";
import { ProductCard } from "@/components/store/ProductCard";
import { Search, ArrowLeft } from "lucide-react";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const products = q ? await searchProducts(q) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Link href="/" className="hover:text-emerald-700 flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Home
        </Link>
        <span>/</span>
        <span className="text-neutral-900 font-semibold">Search</span>
      </div>

      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2.5">
          <Search className="w-6 h-6 text-emerald-700" />
          Search Results
        </h1>
        {q ? (
          <p className="text-xs text-neutral-500 mt-1">
            Showing results for <span className="font-semibold text-neutral-900">&quot;{q}&quot;</span> ({products.length} found)
          </p>
        ) : (
          <p className="text-xs text-neutral-500 mt-1">
            Please enter a search keyword like &ldquo;atta&rdquo;, &ldquo;dal&rdquo;, &ldquo;tel&rdquo;, or &ldquo;साबुन&rdquo;.
          </p>
        )}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : q ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-neutral-300">
          <Search className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-800">
            No products match &quot;{q}&quot;
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Try searching in Hindi or English (e.g. &ldquo;आटा&rdquo;, &ldquo;chawal&rdquo;, &ldquo;fortune&rdquo;, &ldquo;surf&rdquo;).
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition"
          >
            Back to All Products
          </Link>
        </div>
      ) : null}
    </div>
  );
}
