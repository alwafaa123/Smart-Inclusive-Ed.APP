"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/services/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const roleRoutes = {
        admin:   "/dashboard/admin",
        teacher: "/dashboard/guru",
        student: "/dashboard/siswa",
      };
      const destination = roleRoutes[result.user.role];
      if (!destination) {
        setError("Peran akun tidak dikenali.");
        return;
      }
      router.replace(destination);
    } catch (err) {
      if (err.status === 401) {
        setError("Email atau password salah.");
      } else if (err.status === 403) {
        setError("Akun ini sedang dinonaktifkan. Hubungi administrator.");
      } else {
        setError(err.message || "Tidak dapat terhubung ke server. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Panel kiri (ilustrasi) — sembunyikan di layar kecil ────────────── */}
      <div
        aria-hidden="true"
        className="hidden flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-12 lg:flex lg:w-1/2"
      >
        <div className="max-w-sm text-white">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur-sm">
            ♾
          </span>
          <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight">
            Smart Inclusive Ed
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-blue-100">
            Ruang kelas digital yang dirancang untuk semua siswa, termasuk mereka
            dengan kebutuhan khusus.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-blue-100">
            {[
              "🔊 Text-to-Speech untuk materi pembelajaran",
              "🎨 Mode kontras tinggi & font disleksia",
              "📊 Analitik inklusif untuk guru",
              "✏️ Manajemen tugas terintegrasi",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">{item.slice(0, 2)}</span>
                <span>{item.slice(3)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Panel kanan (form login) ────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg text-white">
              ♾
            </span>
            <span className="font-bold text-slate-900">Smart Inclusive Ed</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Selamat datang kembali
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Masuk untuk melanjutkan pembelajaran.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-slate-800"
                >
                  Alamat Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-slate-800"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pr-28 text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {showPassword ? "Sembunyikan" : "Tampilkan"}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  <span className="shrink-0">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden rounded-xl bg-blue-600 px-4 py-3.5 font-bold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Sedang masuk...
                  </span>
                ) : (
                  "Masuk ke Akun"
                )}
              </button>
            </form>

            {/* Link ke register */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-600">
                Belum punya akun?
              </p>
              <Link
                href="/register"
                className="mt-2 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                <span aria-hidden="true">✨</span>
                Daftar Sekarang — Gratis
              </Link>
              <p className="mt-3 text-xs text-slate-400">
                Lupa password? Hubungi administrator sekolah.
              </p>
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-slate-500">
            <Link
              href="/"
              className="font-medium text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded"
            >
              ← Kembali ke halaman utama
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
