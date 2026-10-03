"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LogoutButton from "@/components/auth/LogoutButton";
import NotificationBadge from "@/components/NotificationBadge";
import AccessibilitySettings from "@/components/AccessibilitySettings";
import { apiRequest } from "@/services/api";

function SiswaDashboardContent() {
  const [userName, setUserName] = useState("");
  const [upcomingCount, setUpcomingCount] = useState(0);

  useEffect(() => {
    apiRequest("/auth/me")
      .then((data) => setUserName(data.user?.name || ""))
      .catch(() => {});

    apiRequest("/notifications/upcoming-deadlines")
      .then((data) => setUpcomingCount((data.deadlines || []).length))
      .catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";

  return (
    <main className="dashboard-page min-h-screen bg-[radial-gradient(ellipse_at_top_right,_#dbeafe_0%,_#f8fafc_42%,_#f8fafc_100%)] px-4 py-6 sm:px-8 sm:py-10">
      <div className="dashboard-content mx-auto max-w-5xl">
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
                Ruang belajarmu
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NotificationBadge />
            <LogoutButton />
          </div>
        </header>

        <section className="relative isolate mb-7 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-800 px-6 py-8 text-white shadow-xl shadow-blue-950/15 sm:px-10 sm:py-10">
          <div aria-hidden="true" className="absolute -right-12 -top-24 -z-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-32 right-1/4 -z-10 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-7">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-blue-200">
                {greeting}{userName ? `, ${userName.split(" ")[0]}` : ""} 👋
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Yuk, temukan hal{" "}
                <span className="text-blue-200">baru hari ini.</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100/85 sm:text-base">
                Semua kelas, materi, dan pengingat belajarmu ada di satu tempat.
                Belajar dengan cara yang paling nyaman untukmu.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                  📚 Ruang belajar inklusif
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                  ✨ Belajar sesuai gayamu
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/siswa/kelas"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-white"
            >
              Mulai belajar <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute right-8 top-8 hidden text-7xl text-white/10 sm:block">
            ✦
          </div>
        </section>

        {/* ── Alert tugas mendatang ─────────────────────────────────────── */}
        {upcomingCount > 0 && (
          <div className="mb-7 flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 shadow-sm fade-in sm:p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-2xl">⏰</span>
            <div className="flex-1">
              <p className="font-bold text-amber-950">
                {upcomingCount} tugas mendekati batas waktu
              </p>
              <p className="text-sm text-amber-700">
                Segera selesaikan agar tidak terlewat.
              </p>
            </div>
            <Link
              href="/dashboard/siswa/notifikasi"
              className="shrink-0 rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-900 transition hover:-translate-y-0.5 hover:bg-amber-50"
            >
              Lihat
            </Link>
          </div>
        )}

        {/* ── Navigasi ruang belajar ────────────────────────────────────── */}
        <section aria-labelledby="study-space-title" className="mb-8">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              Lanjutkan perjalananmu
            </p>
            <h2 id="study-space-title" className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
              Ruang belajar
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/dashboard/siswa/kelas"
              className="card-interactive group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/5 sm:p-7"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-2xl text-blue-700 shadow-inner">
                🏫
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700">
                  Kelas Saya
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  Buka kelas, akses materi pembelajaran, dan kerjakan tugas.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
                  Lihat kelas <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>

            <Link
              href="/dashboard/siswa/notifikasi"
              className="card-interactive group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-900/5 sm:p-7"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 text-2xl text-amber-700 shadow-inner">
                🔔
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700">
                  Notifikasi
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  Pantau pengumuman baru, nilai tugas, dan pengingat batas waktu.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
                  Lihat notifikasi <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* ── Pengaturan aksesibilitas ──────────────────────────────────── */}
        <section aria-labelledby="accessibility-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2
              id="accessibility-title"
              className="text-xl font-extrabold tracking-tight text-slate-900"
            >
              Pengaturan Aksesibilitas
            </h2>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              Tersimpan otomatis
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <p className="mb-5 max-w-2xl text-sm leading-relaxed text-slate-600">
              Sesuaikan tampilan agar belajar lebih nyaman. Semua pengaturan
              tersimpan otomatis dan berlaku di semua halaman materi.
            </p>
            <AccessibilitySettings />
          </div>
        </section>

        {/* ── Tips belajar ──────────────────────────────────────────────── */}
        <section className="mt-6 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl">💡</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Biar makin nyaman</p>
              <h2 className="mt-0.5 font-extrabold text-blue-950">
                Tips belajar inklusif
              </h2>
            </div>
          </div>
          <ul className="grid gap-3 text-sm text-blue-950 sm:grid-cols-2">
            {[
              "Aktifkan Text-to-Speech agar materi bisa didengar, bukan hanya dibaca.",
              "Gunakan font disleksia dan perbesar teks jika merasa kesulitan membaca.",
              "Aktifkan kontras tinggi jika layar terasa menyilaukan.",
              "Tandai materi 'Selesai' agar progres belajarmu tercatat.",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2 rounded-xl bg-white/80 p-3">
                <span className="mt-0.5 shrink-0 font-bold text-blue-600">✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

export default function SiswaDashboard() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <SiswaDashboardContent />
    </ProtectedRoute>
  );
}
