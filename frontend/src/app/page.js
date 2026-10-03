"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const FEATURES = [
  {
    icon: "🔊",
    title: "Text-to-Speech",
    desc: "Materi dibacakan secara otomatis untuk siswa tunanetra atau disleksia.",
    color: "bg-blue-50 text-blue-700",
  },
  {
    icon: "🎨",
    title: "Mode Kontras Tinggi",
    desc: "Tampilan adaptif dengan kontras tinggi dan ukuran font yang bisa disesuaikan.",
    color: "bg-indigo-50 text-indigo-700",
  },
  {
    icon: "📋",
    title: "Live Transcription",
    desc: "Konversi materi guru menjadi teks secara real-time untuk siswa tunarungu.",
    color: "bg-sky-50 text-sky-700",
  },
  {
    icon: "📊",
    title: "Analitik Inklusif",
    desc: "Guru memantau pemahaman dan kenyamanan belajar setiap siswa berkebutuhan khusus.",
    color: "bg-violet-50 text-violet-700",
  },
  {
    icon: "✏️",
    title: "Manajemen Tugas",
    desc: "Pengumpulan tugas dan penilaian terintegrasi dengan pengingat batas waktu otomatis.",
    color: "bg-amber-50 text-amber-700",
  },
  {
    icon: "🔤",
    title: "Font Disleksia",
    desc: "Font khusus yang meningkatkan keterbacaan bagi siswa dengan disleksia.",
    color: "bg-emerald-50 text-emerald-700",
  },
];

const ROLES = [
  {
    icon: "👩‍🏫",
    title: "Guru",
    desc: "Buat kelas, unggah materi, kelola tugas, dan pantau progres siswa.",
    color: "border-blue-200 bg-blue-50/60",
  },
  {
    icon: "🎒",
    title: "Siswa",
    desc: "Akses materi dengan pengaturan aksesibilitas personal dan kumpulkan tugas.",
    color: "border-indigo-200 bg-indigo-50/60",
  },
  {
    icon: "🛡️",
    title: "Admin",
    desc: "Kelola akun pengguna dan pantau kesehatan platform secara keseluruhan.",
    color: "border-violet-200 bg-violet-50/60",
  },
];

export default function Home() {
  const [serverStatus, setServerStatus] = useState("checking"); // checking | ok | error
  const [serverMsg, setServerMsg] = useState("");

  useEffect(() => {
    async function checkBackend() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/health`,
        );
        if (!res.ok) throw new Error("Server memberikan respons error.");
        const data = await res.json();
        setServerMsg(data.message || "Server berjalan normal.");
        setServerStatus("ok");
      } catch (err) {
        setServerMsg(err.message || "Tidak dapat terhubung ke server.");
        setServerStatus("error");
      }
    }
    checkBackend();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg text-white shadow-sm">
              ♾
            </span>
            <span className="font-bold text-slate-900">Smart Inclusive Ed</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              Daftar
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              Masuk
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-16 pt-20 text-center sm:px-8 sm:pt-28">
        {/* Background blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-16 h-80 w-80 rounded-full bg-indigo-100/50 blur-3xl"
        />

        <div className="relative mx-auto max-w-3xl">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700">
            ✨ Pendidikan Inklusif Digital
          </span>

          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Ruang Kelas yang{" "}
            <span className="gradient-text">Aksesibel</span>{" "}
            untuk Semua
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Platform manajemen kelas digital dengan fitur aksesibilitas tinggi —
            dirancang khusus untuk mendukung siswa dengan kebutuhan khusus
            seperti tunanetra, tunarungu, dan disleksia.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              Daftar Sekarang — Gratis
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              Sudah Punya Akun
            </Link>
          </div>

          {/* Server status pill */}
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                serverStatus === "checking"
                  ? "animate-pulse bg-amber-400"
                  : serverStatus === "ok"
                    ? "bg-green-500"
                    : "bg-red-500"
              }`}
            />
            <span className="text-slate-600">
              {serverStatus === "checking"
                ? "Memeriksa server..."
                : serverMsg}
            </span>
          </div>
        </div>
      </section>

      {/* ── Fitur ──────────────────────────────────────────────────────────── */}
      <section
        id="fitur"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-20"
      >
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900">
            Fitur Aksesibilitas Lengkap
          </h2>
          <p className="mt-3 text-slate-600">
            Setiap fitur dirancang agar semua siswa dapat belajar dengan nyaman.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card-interactive rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-xl ${f.color}`}
              >
                {f.icon}
              </span>
              <h3 className="mt-3 font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Peran pengguna ─────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Untuk Siapa Platform Ini?
          </h2>
          <p className="mt-3 text-blue-100">
            Tiga peran yang saling mendukung ekosistem kelas inklusif.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {ROLES.map((r) => (
              <div
                key={r.title}
                className={`card-interactive rounded-2xl border p-6 text-left ${r.color}`}
              >
                <span className="text-3xl">{r.icon}</span>
                <h3 className="mt-3 font-bold text-slate-900">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/register"
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-bold text-blue-700 shadow-lg transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-700"
          >
            Daftar Sekarang — Gratis →
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white px-4 py-8 text-center sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm text-white">
              ♾
            </span>
            <span className="font-semibold text-slate-700">Smart Inclusive Ed</span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Ruang Kelas Digital Aksesibel · Dibuat dengan ❤️ untuk pendidikan yang adil
          </p>
        </div>
      </footer>
    </div>
  );
}
