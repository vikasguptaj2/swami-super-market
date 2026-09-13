import Link from "next/link";
import { Store, Package, ArrowLeft } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100/70 text-neutral-900">
      {/* Top Admin Navbar */}
      <header className="bg-neutral-900 text-white border-b border-neutral-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-white shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide block">
                Swami Super Market — Admin
              </span>
              <span className="text-[11px] text-neutral-400">
                Store Inventory & Product Management
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750 px-3 py-2 rounded-lg transition"
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              Orders
            </Link>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750 px-3 py-2 rounded-lg transition"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              Products
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 px-3 py-2 rounded-lg transition ml-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Storefront
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
