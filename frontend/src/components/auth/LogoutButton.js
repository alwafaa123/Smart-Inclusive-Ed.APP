"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/services/api";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      await apiRequest("/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch (err) {
      // Jika sesi sudah kedaluwarsa (401), tetap redirect ke login
      if (err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err.message || "Logout gagal. Silakan coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        aria-busy={loading}
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Keluar...
          </>
        ) : (
          <>
            <span aria-hidden="true">→</span>
            Logout
          </>
        )}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
