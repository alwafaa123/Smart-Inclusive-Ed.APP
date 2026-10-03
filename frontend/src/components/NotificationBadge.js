"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/services/api";

export default function NotificationBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCount() {
      try {
        const data = await apiRequest("/notifications/unread-count");
        if (active) setCount(Number(data?.unread_count ?? 0));
      } catch {
        // Gagal diam-diam
      }
    }

    loadCount();
    const id = setInterval(loadCount, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <Link
      href="/dashboard/siswa/notifikasi"
      className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
      aria-label={`Notifikasi, ${count} belum dibaca`}
    >
      <span aria-hidden="true">🔔</span>
      <span>Notifikasi</span>
      {count > 0 && (
        <span
          className="badge-pulse inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white"
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
