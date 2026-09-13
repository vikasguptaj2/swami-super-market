"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store/cart.store";

export function CartBadge() {
  const [mounted, setMounted] = useState(false);
  const totalCount = useCartStore((state) => state.getTotalCount());

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs group cursor-pointer"
    >
      <div className="relative">
        <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
        {mounted && totalCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-amber-400 text-neutral-900 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-75">
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </div>
      <span className="hidden sm:inline">Cart</span>
    </Link>
  );
}
