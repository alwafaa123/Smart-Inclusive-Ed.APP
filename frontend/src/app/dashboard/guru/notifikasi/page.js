"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LogoutButton from "@/components/auth/LogoutButton";
import { apiRequest } from "@/services/api";

function TeacherNotificationsContent() {
  const [notifications, setNotifications] = useState([]);
  const [pendingGrading, setPendingGrading] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);  // ← true saat mount
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);   // ← FIX: reset ke true setiap kali loadData dipanggil
      setError("");

      const [notifData, gradingData] = await Promise.all([
        apiRequest("/teacher-notifications"),
        apiRequest("/teacher-notifications/pending-grading"),
      ]);

      setNotifications(notifData.notifications || []);
      setUnreadCount(Number(notifData.unreadCount || 0));
      setPendingGrading(gradingData.pendingGrading || []);
    } catch (err) {
      setError(err.message || "Gagal memuat notifikasi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function markRead(id) {
    try {
      await apiRequest(`/teacher-notifications/${id}/read`, { method: "PATCH" });
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err.message || "Gagal memperbarui notifikasi.");
    }
  }

  async function markAllRead() {
    try {
      await apiRequest("/teacher-notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
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
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <BackLink href="/dashboard/guru">Kembali ke dashboard</BackLink>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              🔔 Notifikasi Guru
            </h1>
            <p className="mt-1 text-slate-600">
              Pantau tugas yang perlu dinilai dan aktivitas kelas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              ↻ Muat ulang
            </button>
            <LogoutButton />
          </div>
        </header>

        {error && (
          <div role="alert"
            className="flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            ⚠️ {error}
          </div>
        )}

        {/* ── Ringkasan ────────────────────────────────────────────────── */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-slate-500">Belum dibaca</p>
              <p className="text-3xl font-extrabold text-blue-700">
                {loading ? "—" : unreadCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Menunggu penilaian</p>
              <p className="text-3xl font-extrabold text-amber-600">
                {loading ? "—" : pendingGrading.length}
              </p>
            </div>
          </div>
          <button onClick={markAllRead} disabled={unreadCount === 0}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            Tandai semua dibaca
          </button>
        </section>

        {/* ── Tugas menunggu penilaian ─────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">
            📩 Tugas Menunggu Penilaian
          </h2>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
            </div>
          ) : pendingGrading.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
              <p className="text-2xl mb-2">✅</p>
              Semua tugas sudah dinilai.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingGrading.map((item) => (
                <article key={item.assignment_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div>
                    <p className="font-bold text-slate-900">{item.assignment_title}</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {item.class_name} ·{" "}
                      <span className="font-semibold text-amber-700">
                        {item.pending_count} jawaban menunggu
                      </span>
                    </p>
                  </div>
                  <Link href={`/dashboard/guru/kelas/${item.class_id}/tugas`}
                    className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
                    Nilai Sekarang →
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── Notifikasi belum dibaca ───────────────────────────────────── */}
        {!loading && unread.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold text-slate-900">
              🔵 Belum Dibaca ({unread.length})
            </h2>
            <div className="space-y-3">
              {unread.map((item) => (
                <article key={item.id}
                  className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-700">{item.message}</p>
                      <p className="mt-1.5 text-xs text-slate-400">
                        {new Date(item.created_at).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <button onClick={() => markRead(item.id)}
                      aria-label={`Tandai "${item.title}" sudah dibaca`}
                      className="shrink-0 rounded-xl border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">
                      Tandai dibaca
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ── Riwayat ──────────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">
            Riwayat Notifikasi
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
            </div>
          ) : read.length === 0 && unread.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              <p className="text-3xl mb-2">📭</p>
              Belum ada notifikasi.
            </div>
          ) : read.length === 0 ? null : (
            <div className="space-y-2">
              {read.map((item) => (
                <article key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="font-semibold text-slate-700">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">{item.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(item.created_at).toLocaleString("id-ID")}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function TeacherNotificationsPage() {
  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <TeacherNotificationsContent />
    </ProtectedRoute>
  );
}
