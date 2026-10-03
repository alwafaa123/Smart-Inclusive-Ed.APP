"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/services/api";

export default function ProtectedRoute({ allowedRoles, children }) {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | authorized | forbidden | error

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const result = await apiRequest("/auth/me");
        if (!active) return;

        if (!allowedRoles.includes(result.user?.role)) {
          setStatus("forbidden");
        } else {
          setStatus("authorized");
        }
      } catch (err) {
        if (!active) return;
        if (err.status === 401) {
          router.replace("/login");
        } else {
          setStatus("error");
        }
      }
    }

    checkSession();
    return () => { active = false; };
  }, [allowedRoles, router]);

  /* ── Loading ──────────────────────────────────────────────────────────── */
  if (status === "loading") {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-50 to-blue-50/30 p-8"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-lg">
          ♾
        </div>
        <div className="space-y-3 text-center">
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="h-4 w-4 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-sm font-medium">Memeriksa sesi akun…</span>
          </div>
        </div>
        {/* Skeleton preview */}
        <div className="w-full max-w-2xl space-y-3">
          <div className="skeleton h-10 w-48 rounded-xl" />
          <div className="skeleton h-32 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-24 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Forbidden ────────────────────────────────────────────────────────── */
  if (status === "forbidden") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50 p-6 text-center">
        <span className="text-5xl" aria-hidden="true">🚫</span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Akses Ditolak</h1>
          <p className="mt-2 text-sm text-slate-600">
            Akun ini tidak memiliki izin untuk membuka halaman tersebut.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          Kembali ke Login
        </button>
      </main>
    );
  }

  /* ── Error ────────────────────────────────────────────────────────────── */
  if (status === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50 p-6 text-center">
        <span className="text-5xl" aria-hidden="true">⚠️</span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Koneksi Bermasalah</h1>
          <p className="mt-2 text-sm text-slate-600" role="alert">
            Tidak dapat memeriksa sesi. Pastikan server backend berjalan, lalu coba lagi.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            Coba Lagi
          </button>
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            Ke Login
          </button>
        </div>
      </main>
    );
  }

  return children;
}
