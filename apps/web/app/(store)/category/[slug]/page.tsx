import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchCategoryBySlug, fetchCategories } from "@/lib/api";
import { ProductCard } from "@/components/store/ProductCard";
import { ChevronRight, ArrowLeft, ShoppingBag } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [data, allCategories] = await Promise.all([
    fetchCategoryBySlug(slug),
    fetchCategories(),
  ]);

  if (!data || !data.category) {
    notFound();
  }

  const { category, products } = data;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Link href="/" className="hover:text-emerald-700 flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        <span className="text-neutral-900 font-semibold">{category.name}</span>
      </div>

      {/* Category Header */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              {category.name}
            </h1>
            {category.hindiName && (
              <span className="text-sm font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                {category.hindiName}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-1.5">
            Showing {products.length} {products.length === 1 ? "product" : "products"} available in store
          </p>
        </div>

        {/* Quick category horizontal chip switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xl">
          {allCategories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition ${
                c.slug === slug
                  ? "bg-emerald-800 text-white border-emerald-800 font-semibold"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-neutral-300">
          <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-800">
            No products in this category yet
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Products can be added to {category.name} anytime from the Admin Panel.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition"
          >
            Explore Other Categories
          </Link>
        </div>
      )}
    </div>
  );
}
