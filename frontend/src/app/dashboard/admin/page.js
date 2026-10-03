"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LogoutButton from "@/components/auth/LogoutButton";
import { apiRequest } from "@/services/api";

function AdminDashboardContent() {
  const [stats, setStats] = useState({
    total: 0,
    teacher: 0,
    student: 0,
    inactive: 0,
    loaded: false,
  });

  useEffect(() => {
    apiRequest("/admin/users")
      .then((data) => {
        const users = data.users || [];
        setStats({
          total:    users.length,
          teacher:  users.filter((u) => u.role === "teacher").length,
          student:  users.filter((u) => u.role === "student").length,
          inactive: users.filter((u) => Number(u.is_active) !== 1).length,
          loaded:   true,
        });
      })
      .catch(() => setStats((s) => ({ ...s, loaded: true })));
  }, []);

  const STAT_CARDS = [
    {
      label: "Total Pengguna",
      value: stats.total,
      icon: "👥",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    {
      label: "Guru",
      value: stats.teacher,
      icon: "👩‍🏫",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    {
      label: "Siswa",
      value: stats.student,
      icon: "🎒",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
    },
    {
      label: "Akun Nonaktif",
      value: stats.inactive,
      icon: "🔒",
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
    },
  ];

  return (
    <main className="dashboard-page min-h-screen bg-[radial-gradient(ellipse_at_top_right,_#dbeafe_0%,_#f8fafc_42%,_#f8fafc_100%)] px-4 py-6 sm:px-8 sm:py-10">
      <div className="dashboard-content mx-auto max-w-6xl">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-xl text-white shadow-lg shadow-blue-900/20">
                ♾
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900">
                Smart Inclusive Ed
              </p>
              <p className="text-xs font-medium text-slate-500">
                Ruang kerja administrator
              </p>
            </div>
          </div>
          <LogoutButton />
        </header>

        <section className="relative isolate mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-800 px-6 py-8 text-white shadow-xl shadow-blue-950/15 sm:px-10 sm:py-10">
          <div aria-hidden="true" className="absolute -right-12 -top-24 -z-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-32 right-1/4 -z-10 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-7">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Panel administrator
              </span>
              <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Semua kendali,{" "}
                <span className="text-blue-200">dalam satu tempat.</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100/85 sm:text-base">
                Kelola komunitas belajar dan pantau perkembangan platform
                inklusifmu dengan lebih mudah.
              </p>
            </div>
            <Link
              href="/dashboard/admin/users"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-white"
            >
              Kelola pengguna <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute right-8 top-8 hidden text-7xl text-white/10 sm:block">
            ♾
          </div>
        </section>

        {/* ── Statistik ─────────────────────────────────────────────────── */}
        <section aria-labelledby="stats-title" className="mb-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                Sekilas
              </p>
              <h2 id="stats-title" className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
                Ringkasan platform
              </h2>
            </div>
            <p className="text-sm text-slate-500">Data pengguna terdaftar</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAT_CARDS.map((card) => (
              <div
                key={card.label}
                className={`card-interactive rounded-2xl border ${card.border} bg-white p-5 shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-600">
                    {card.label}
                  </p>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} text-xl`}>
                    {card.icon}
                  </span>
                </div>
                <p
                  className={`mt-2 text-3xl font-extrabold ${card.text}`}
                >
                  {stats.loaded ? (
                    card.value
                  ) : (
                    <span className="skeleton inline-block h-8 w-12">&nbsp;</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Menu admin ────────────────────────────────────────────────── */}
        <section aria-labelledby="admin-menu-title">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              Kendali platform
            </p>
            <h2 id="admin-menu-title" className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
              Manajemen
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/dashboard/admin/users"
              className="card-interactive group flex items-start gap-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/5 sm:p-7"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-3xl shadow-inner">
                👥
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700">
                  Manajemen Pengguna
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Lihat daftar pengguna, buat akun guru atau siswa, edit data,
                  dan aktifkan/nonaktifkan akun.
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
                  Buka manajemen pengguna <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>

            {/* Placeholder untuk fitur mendatang */}
            <div className="flex items-start gap-5 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 opacity-75 sm:p-7">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                ⚙️
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-700">
                  Pengaturan Platform
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Konfigurasi platform dan pengaturan global. Segera hadir.
                </p>
                <span className="mt-4 inline-block rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Segera hadir
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Info sistem ───────────────────────────────────────────────── */}
        <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              Tentang
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">Info sistem</h2>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            {[
              { label: "Platform", value: "Smart Inclusive Ed" },
              { label: "Framework", value: "Next.js + Node.js Express" },
              { label: "Database", value: "MySQL (XAMPP)" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 font-medium text-slate-700">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
