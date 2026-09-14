"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { adminLogin } from "@/lib/api";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/admin/orders";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await adminLogin({
        email: email.trim(),
        password,
      });

      if (!res.success) {
        setErrorMessage(res.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      // Success! Redirect with full window navigation to ensure all session cookies are recognized
      window.location.href = returnUrl;
    } catch (err: any) {
      setErrorMessage(
        err.message || "An unexpected error occurred. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
      {/* Header / Brand */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-white shadow-lg mb-4 ring-4 ring-emerald-500/20">
          <Store className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Swami Super Market
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Store Management & Administration Portal
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/80 flex items-start gap-3 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Admin Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@swamisupermarket.com"
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-800/80 border border-neutral-700 rounded-xl text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-800/80 border border-neutral-700 rounded-xl text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In to Admin</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-neutral-800/60 text-center">
        <p className="text-[11px] text-neutral-500">
          Internal single-shop tool. Access restricted to authorized personnel.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 p-4">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading login...
          </div>
        }
      >
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
