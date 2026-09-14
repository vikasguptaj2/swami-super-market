"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  Package,
  Truck,
  Settings,
  ArrowLeft,
  LogOut,
  User,
  Tag,
} from "lucide-react";
import { fetchCurrentAdmin, adminLogout, AdminUserSession } from "@/lib/api";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUserSession | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Exclude navbar on login page
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!isLoginPage) {
      fetchCurrentAdmin().then((user) => {
        if (user) {
          setAdminUser(user);
        }
      });
    }
  }, [isLoginPage]);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out of the admin panel?")) {
      setLoggingOut(true);
      await adminLogout();
      window.location.href = "/";
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100/70 text-neutral-900">
      {/* Top Admin Navbar */}
      <header className="bg-neutral-900 text-white border-b border-neutral-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[4rem] py-2 sm:py-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-white shadow-xs shrink-0">
                <Store className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm tracking-wide block leading-tight">
                  Swami Super Market — Admin
                </span>
                <span className="text-[10px] sm:text-[11px] text-neutral-400 block leading-tight">
                  Store Inventory & Order Management
                </span>
              </div>
            </div>

            {/* Mobile-visible logout icon */}
            <div className="flex items-center sm:hidden gap-1">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                title="Log out of Admin"
                className="p-2 text-red-400 hover:text-red-300 bg-neutral-800 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <Link
              href="/admin/orders"
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition shrink-0 ${
                pathname?.startsWith("/admin/orders")
                  ? "bg-emerald-700 text-white"
                  : "text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750"
              }`}
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              Orders
            </Link>
            <Link
              href="/admin/products"
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition shrink-0 ${
                pathname?.startsWith("/admin/products")
                  ? "bg-amber-700 text-white"
                  : "text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750"
              }`}
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              Products
            </Link>
            <Link
              href="/admin/promotions"
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition shrink-0 ${
                pathname?.startsWith("/admin/promotions")
                  ? "bg-rose-700 text-white"
                  : "text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750"
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-rose-400" />
              Promotions
            </Link>
            <Link
              href="/admin/delivery-zones"
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition shrink-0 ${
                pathname?.startsWith("/admin/delivery-zones")
                  ? "bg-blue-700 text-white"
                  : "text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750"
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              Delivery
            </Link>
            <Link
              href="/admin/settings"
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition shrink-0 ${
                pathname?.startsWith("/admin/settings")
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750"
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-neutral-400" />
              Settings
            </Link>

            {/* Logged in Admin Profile Badge */}
            {adminUser && (
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-neutral-700/80 ml-1 shrink-0">
                <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-semibold text-neutral-200 leading-none">
                    {adminUser.name}
                  </span>
                  <span className="block text-[10px] text-neutral-400 leading-none mt-0.5">
                    {adminUser.email}
                  </span>
                </div>
              </div>
            )}

            {/* Desktop Logout Button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Log out of Admin"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-neutral-800/80 hover:bg-red-950/40 border border-neutral-700/60 hover:border-red-800/60 px-3 py-2 rounded-lg transition ml-1 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? "Logging out..." : "Logout"}</span>
            </button>

            {/* Storefront Link */}
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800/40 hover:bg-neutral-800 px-2.5 py-1.5 sm:py-2 rounded-lg transition ml-1 shrink-0"
              title="View Public Storefront"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Storefront</span>
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
