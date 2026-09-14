import Link from "next/link";
import { Category } from "@/lib/api";
import {
  Wheat,
  CookingPot,
  Cookie,
  Coffee,
  Sparkles,
  Home,
  Baby,
  Candy,
  ShoppingBag,
  Package,
} from "lucide-react";

// Lucide icon mapping for the 10 fixed categories
const CATEGORY_ICONS: Record<string, any> = {
  "grocery-essentials": ShoppingBag,
  "rice-flour-pulses": Wheat,
  "oil-spices-masalas": CookingPot,
  "biscuits-snacks": Cookie,
  "beverages-cold-drinks": Coffee,
  "personal-care": Sparkles,
  "home-cleaning-products": Home,
  "baby-products": Baby,
  "chocolates-sweets": Candy,
  "daily-essentials": Package,
};

export function CategoryGrid({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug?: string;
}) {
  return (
    <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
      {categories.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.slug] || ShoppingBag;
        const isActive = activeSlug === cat.slug;

        return (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className={`flex flex-col items-center text-center p-3.5 rounded-2xl border transition-all duration-200 group ${
              isActive
                ? "bg-emerald-800 text-white border-emerald-800 shadow-md shadow-emerald-900/20"
                : "bg-white text-neutral-800 border-neutral-200/80 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-950/5 hover:bg-emerald-50/40"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 ${
                isActive
                  ? "bg-emerald-700 text-emerald-100"
                  : "bg-emerald-100/70 text-emerald-800 group-hover:bg-emerald-200/70"
              }`}
            >
              <Icon className="w-6 h-6" />
            </div>

            <span
              className={`text-xs font-bold leading-tight line-clamp-1 ${
                isActive ? "text-white" : "text-neutral-900"
              }`}
            >
              {cat.name}
            </span>

            {cat.hindiName && (
              <span
                className={`text-[11px] mt-0.5 line-clamp-1 font-medium ${
                  isActive ? "text-emerald-200" : "text-emerald-700"
                }`}
              >
                {cat.hindiName}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
