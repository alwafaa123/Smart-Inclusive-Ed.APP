"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LogoutButton from "@/components/auth/LogoutButton";
import TeacherNotificationBadge from "@/components/TeacherNotificationBadge";
import { apiRequest } from "@/services/api";

const QUICK_LINKS = [
  {
    href: "/dashboard/guru/kelas",
    icon: "🏫",
    iconBg: "bg-blue-100 text-blue-700",
    title: "Manajemen Kelas",
    desc: "Buat kelas baru, kelola anggota, unggah materi, dan buat tugas.",
    cta: "Buka kelas",
    border: "hover:border-blue-300",
  },
  {
    href: "/dashboard/guru/analitik",
    icon: "📊",
    iconBg: "bg-emerald-100 text-emerald-700",
    title: "Analitik Pembelajaran",
    desc: "Pantau progres materi, pengumpulan tugas, dan aktivitas siswa per kelas.",
    cta: "Lihat analitik",
    border: "hover:border-emerald-300",
  },
  {
    href: "/dashboard/guru/notifikasi",
    icon: "🔔",
    iconBg: "bg-amber-100 text-amber-700",
    title: "Notifikasi",
    desc: "Periksa tugas yang perlu dinilai dan pembaruan kelas terkini.",
    cta: "Buka notifikasi",
    border: "hover:border-amber-300",
  },
];

function GuruDashboardContent() {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    apiRequest("/auth/me")
      .then((data) => setUserName(data.user?.name || ""))
      .catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";

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
                Ruang kerja pengajar
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <TeacherNotificationBadge />
            <LogoutButton />
          </div>
        </header>

        {/* ── Banner inklusif ────────────────────────────────────────────── */}
        <section className="relative isolate mb-9 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-800 px-6 py-8 text-white shadow-xl shadow-blue-950/15 sm:px-10 sm:py-10">
          <div aria-hidden="true" className="absolute -right-12 -top-24 -z-10 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-32 right-1/4 -z-10 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-7">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-blue-200">
                {greeting}{userName ? `, ${userName.split(" ")[0]}` : ""} 👋
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Inspirasi belajar dimulai{" "}
                <span className="text-blue-200">dari kelasmu.</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100/85 sm:text-base">
                Kelola kelas dan pantau aktivitas pembelajaran inklusif dalam
                satu ruang kerja yang praktis.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                  ♿ Materi aksesibel
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                  ✨ Belajar untuk semua
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/guru/kelas"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-white"
            >
              Buka kelas <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute right-8 top-8 hidden text-7xl text-white/10 sm:block">
            ✦
          </div>
        </section>

        {/* ── Akses cepat ───────────────────────────────────────────────── */}
        <section aria-labelledby="quick-access-title">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              Siap beraktivitas?
            </p>
            <h2 id="quick-access-title" className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
              Akses cepat
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`card-interactive group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 hover:shadow-lg hover:shadow-blue-900/5 ${link.border}`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-inner ${link.iconBg}`}
                >
                  {link.icon}
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-blue-700">
                  {link.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {link.desc}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
                  {link.cta} <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Tips aksesibilitas ────────────────────────────────────────── */}
        <section className="mt-8 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-xl">💡</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Ide praktis</p>
              <h2 className="mt-0.5 font-extrabold text-emerald-950">
                Tips membuat materi inklusif
              </h2>
            </div>
          </div>
          <ul className="grid gap-3 text-sm text-emerald-900 sm:grid-cols-2">
            {[
              "Gunakan bahasa yang sederhana dan kalimat pendek agar mudah dipahami.",
              "Tambahkan deskripsi singkat pada setiap modul untuk membantu orientasi siswa.",
              "Atur batas waktu tugas dengan cukup untuk mengakomodasi semua siswa.",
              "Pantau progres materi secara rutin melalui halaman Analitik.",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2 rounded-xl bg-white/75 p-3">
                <span className="mt-0.5 shrink-0 font-bold text-emerald-600">✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

export default function GuruDashboard() {
  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <GuruDashboardContent />
    </ProtectedRoute>
  );
}
