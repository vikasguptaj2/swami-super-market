import Link from "next/link";
import { Store, MapPin, Search } from "lucide-react";
import { CartBadge } from "./CartBadge";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-emerald-100 shadow-xs">
      {/* Top Banner */}
      <div className="bg-emerald-800 text-emerald-50 px-4 py-1.5 text-xs text-center font-medium flex items-center justify-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-emerald-300" />
        <span>स्वामी सुपर मार्केट • ग्राम: उसासा, बलिया (उत्तर प्रदेश) • तेज़ डिलीवरी</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-emerald-950 block leading-none">
              Swami Super Market
            </span>
            <span className="text-xs text-emerald-700 font-medium">
              स्वामी सुपर मार्केट — उसासा, बलिया
            </span>
          </div>
        </Link>

        {/* Search Bar Form */}
        <form
          action="/search"
          method="GET"
          className="flex-1 max-w-xl mx-4 hidden sm:flex items-center relative"
        >
          <div className="relative w-full">
            <Search className="w-4 h-4 text-emerald-700/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              name="q"
              placeholder="Search atta, dal, tel, chawal, soap (हिन्दी या English)..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-emerald-50/50 border border-emerald-200 rounded-full focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-neutral-800 placeholder:text-neutral-600"
            />
          </div>
        </form>

        {/* Action Buttons: Cart + Admin */}
        <div className="flex items-center gap-2.5 shrink-0">
          <CartBadge />
          <Link
            href="/admin/products"
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 transition"
          >
            Admin
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="sm:hidden px-4 pb-3">
        <form action="/search" method="GET" className="relative w-full">
          <Search className="w-4 h-4 text-emerald-700/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            name="q"
            placeholder="Search atta, dal, soap (हिन्दी/English)..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-emerald-50/50 border border-emerald-200 rounded-full focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-neutral-800 placeholder:text-neutral-600"
          />
        </form>
      </div>
    </header>
  );
}
