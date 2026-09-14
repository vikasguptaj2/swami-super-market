"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/store/cart.store";
import { formatPrice } from "@/lib/utils";
import { MessageCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export function MobileCartBar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((state) => state.items);
  const totalCount = useCartStore((state) => state.getTotalCount());
  const subtotal = useCartStore((state) => state.getSubtotal());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0 || pathname === "/cart") return null;

  return (
    <aside
      aria-label="Quick cart checkout"
      className="fixed bottom-3 inset-x-3 z-40 sm:hidden animate-in slide-in-from-bottom-5 duration-300 pointer-events-none"
    >
      <div className="pointer-events-auto bg-neutral-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-neutral-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 font-bold text-xs relative">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-neutral-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {totalCount > 99 ? "99+" : totalCount}
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-xs text-neutral-400 block font-medium">Your Cart Total</span>
            <span className="text-sm font-black text-white block truncate">
              {formatPrice(subtotal)}
            </span>
          </div>
        </div>

        <Link
          href="/cart"
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/20 flex items-center gap-1.5 transition active:scale-95 shrink-0"
        >
          <MessageCircle className="w-4 h-4 text-emerald-200" />
          <span>WhatsApp Order</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
}
