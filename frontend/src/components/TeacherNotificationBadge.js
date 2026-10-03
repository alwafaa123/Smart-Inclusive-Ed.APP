"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/services/api";

export default function TeacherNotificationBadge() {
  const [count, setCount] = useState(0);

  const loadCount = useCallback(async () => {
    try {
      const data = await apiRequest("/teacher-notifications");
      setCount(Number(data.unreadCount || 0));
    } catch {
      // Gagal diam-diam — badge kosong lebih baik daripada crash
    }
  }, []);

  useEffect(() => {
    loadCount();
    const id = setInterval(loadCount, 60_000);
    return () => clearInterval(id);
  }, [loadCount]);

  return (
    <Link
      href="/dashboard/guru/notifikasi"
      className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
      aria-label={`Notifikasi guru, ${count} belum dibaca`}
    >
      <span aria-hidden="true">🔔</span>
      <span>Notifikasi</span>
      {count > 0 && (
        <span
          className="badge-pulse inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white"
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
