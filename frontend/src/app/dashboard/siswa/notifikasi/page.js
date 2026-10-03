"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { apiRequest } from "@/services/api";

const TYPE_META = {
  new_assignment:    { label: "Tugas Baru",        icon: "📋", color: "bg-blue-100 text-blue-700"    },
  deadline_reminder: { label: "Pengingat Tenggat",  icon: "⏰", color: "bg-amber-100 text-amber-700"  },
  graded:            { label: "Hasil Penilaian",    icon: "🏆", color: "bg-emerald-100 text-emerald-700" },
  grading_reminder:  { label: "Notifikasi",         icon: "🔔", color: "bg-slate-100 text-slate-600"  },
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StudentNotificationsContent() {
  const [notifications, setNotifications] = useState([]);
  const [deadlines,     setDeadlines]     = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [successMsg,    setSuccessMsg]    = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [notifData, countData, deadlineData] = await Promise.all([
        apiRequest("/notifications"),
        apiRequest("/notifications/unread-count"),
        apiRequest("/notifications/upcoming-deadlines"),
      ]);

      // GET /notifications → array langsung
      setNotifications(Array.isArray(notifData) ? notifData : []);

      // GET /notifications/unread-count → { unread_count }
      setUnreadCount(Number(countData?.unread_count ?? 0));

      // GET /notifications/upcoming-deadlines → { deadlines: [...] }   ← FIX KRITIS
      setDeadlines(Array.isArray(deadlineData?.deadlines) ? deadlineData.deadlines : []);
    } catch (err) {
      setError(err.message || "Gagal memuat notifikasi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function markAsRead(id) {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setSuccessMsg("Notifikasi ditandai dibaca.");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err) {
      setError(err.message || "Gagal memperbarui notifikasi.");
    }
  }

  async function markAllAsRead() {
    try {
      await apiRequest("/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      setSuccessMsg("Semua notifikasi sudah dibaca.");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err) {
      setError(err.message || "Gagal memperbarui notifikasi.");
    }
  }

  const unread = notifications.filter((n) => !n.is_read);
  const read   = notifications.filter((n) =>  n.is_read);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header>
          <BackLink href="/dashboard/siswa">Kembali ke dashboard</BackLink>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            🔔 Pusat Notifikasi
          </h1>
          <p className="mt-1 text-slate-600">
            Informasi tugas, pengingat tenggat, dan hasil penilaian.
          </p>
        </header>

        {/* ── Alert ───────────────────────────────────────────────────── */}
        {error && (
          <div role="alert"
            className="flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <span>⚠️</span> {error}
          </div>
        )}
        {successMsg && (
          <div role="status"
            className="flex gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 fade-in">
            <span>✅</span> {successMsg}
          </div>
        )}

        {/* ── Ringkasan + aksi ─────────────────────────────────────────── */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-slate-500">Belum dibaca</p>
              <p className="text-3xl font-extrabold text-blue-700">
                {loading ? "—" : unreadCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Pengingat tenggat</p>
              <p className="text-3xl font-extrabold text-amber-600">
                {loading ? "—" : deadlines.length}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={loadData}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              ↻ Muat ulang
            </button>
            <button onClick={markAllAsRead} disabled={unreadCount === 0}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              Baca semua
            </button>
          </div>
        </section>

        {/* ── Pengingat tenggat ────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">
            ⏰ Pengingat Tenggat
          </h2>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
            </div>
          ) : deadlines.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
              <p className="text-2xl mb-2">✅</p>
              Tidak ada tugas mendekati tenggat dalam 3 hari ke depan.
            </div>
          ) : (
            <div className="space-y-3">
              {deadlines.map((item) => {
                const days = Math.ceil((new Date(item.due_at) - Date.now()) / 86400000);
                return (
                  <article key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div>
                      <p className="font-bold text-amber-950">{item.title}</p>
                      <p className="mt-0.5 text-sm text-amber-800">
                        Tenggat: {formatDate(item.due_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        days === 0 ? "bg-red-100 text-red-700" :
                        days <= 1  ? "bg-orange-100 text-orange-700" :
                                     "bg-amber-100 text-amber-700"
                      }`}>
                        {days === 0 ? "Hari ini!" : days === 1 ? "Besok!" : `${days} hari lagi`}
                      </span>
                      {/* FIX KRITIS: class_id sekarang tersedia dari backend */}
                      <Link href={`/dashboard/siswa/kelas/${item.class_id}/tugas`}
                        className="rounded-xl bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700">
                        Kerjakan →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Notifikasi belum dibaca ──────────────────────────────────── */}
        {!loading && unread.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold text-slate-900">
              🔵 Belum Dibaca ({unread.length})
            </h2>
            <div className="space-y-3">
              {unread.map((item) => {
                const meta = TYPE_META[item.type] || TYPE_META.grading_reminder;
                return (
                  <article key={item.id}
                    className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm fade-in">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${meta.color}`}>
                          {meta.icon}
                        </span>
                        <div>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>
                            {meta.label}
                          </span>
                          <h3 className="mt-1 font-bold text-slate-900">{item.title}</h3>
                          <p className="mt-1 text-sm text-slate-700">{item.message}</p>
                          <p className="mt-1.5 text-xs text-slate-400">{formatDate(item.created_at)}</p>
                        </div>
                      </div>
                      <button onClick={() => markAsRead(item.id)}
                        aria-label={`Tandai "${item.title}" sudah dibaca`}
                        className="shrink-0 rounded-xl border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">
                        Tandai dibaca
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Riwayat (sudah dibaca) ────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">
            Riwayat Notifikasi
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
            </div>
          ) : read.length === 0 && unread.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              <p className="text-3xl mb-2">📭</p>
              Belum ada notifikasi.
            </div>
          ) : read.length === 0 ? null : (
            <div className="space-y-2">
              {read.map((item) => {
                const meta = TYPE_META[item.type] || TYPE_META.grading_reminder;
                return (
                  <article key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-lg opacity-50">{meta.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{meta.label}</span>
                        </div>
                        <h3 className="font-semibold text-slate-700">{item.title}</h3>
                        <p className="mt-0.5 text-sm text-slate-500">{item.message}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatDate(item.created_at)}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function StudentNotificationsPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentNotificationsContent />
    </ProtectedRoute>
  );
}
