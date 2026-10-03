"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/services/api";

// Aturan kekuatan password
function getPasswordStrength(pw) {
  if (!pw) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8)                    score++;
  if (pw.length >= 12)                   score++;
  if (/[A-Z]/.test(pw))                  score++;
  if (/[0-9]/.test(pw))                  score++;
  if (/[^A-Za-z0-9]/.test(pw))          score++;

  if (score <= 1) return { level: 1, label: "Lemah",   color: "bg-red-500"    };
  if (score <= 3) return { level: 2, label: "Sedang",  color: "bg-amber-400"  };
  return           { level: 3, label: "Kuat",   color: "bg-emerald-500" };
}

const ROLE_OPTIONS = [
  {
    value: "student",
    label: "Siswa",
    icon: "🎒",
    desc: "Akses materi, kerjakan tugas, dan pantau progres belajarmu.",
    bg: "bg-blue-50 border-blue-200",
    active: "ring-2 ring-blue-600 border-blue-400 bg-blue-50",
  },
  {
    value: "teacher",
    label: "Guru",
    icon: "👩‍🏫",
    desc: "Buat kelas, unggah materi, kelola tugas, dan pantau siswa.",
    bg: "bg-indigo-50 border-indigo-200",
    active: "ring-2 ring-indigo-600 border-indigo-400 bg-indigo-50",
  },
];

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name:            "",
    email:           "",
    password:        "",
    confirmPassword: "",
    role:            "student",
  });
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const pwStrength = getPasswordStrength(form.password);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // ── Validasi sisi klien ──────────────────────────────────────────────
    if (!form.name.trim()) {
      setError("Nama lengkap wajib diisi.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email wajib diisi.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const result = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name:     form.name.trim(),
          email:    form.email.trim(),
          password: form.password,
          role:     form.role,
        }),
      });

      setSuccess("Akun berhasil dibuat! Mengalihkan ke dashboard…");

      // Auto-redirect berdasarkan role (sudah auto-login dari server)
      setTimeout(() => {
        const routes = {
          teacher: "/dashboard/guru",
          student: "/dashboard/siswa",
        };
        router.replace(routes[result.user.role] || "/login");
      }, 1200);
    } catch (err) {
      if (err.status === 409) {
        setError("Email sudah terdaftar. Silakan masuk atau gunakan email lain.");
      } else if (err.status === 400) {
        setError(err.message || "Data yang dimasukkan tidak valid.");
      } else {
        setError(err.message || "Tidak dapat terhubung ke server. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Panel kiri ─────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="hidden flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 px-12 lg:flex lg:w-5/12"
      >
        <div className="max-w-xs text-white">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur-sm">
            ♾
          </span>
          <h1 className="mt-8 text-3xl font-extrabold leading-tight">
            Bergabung dengan Smart Inclusive Ed
          </h1>
          <p className="mt-4 text-base leading-relaxed text-blue-100">
            Platform kelas digital inklusif — dirancang untuk semua siswa,
            termasuk mereka dengan kebutuhan khusus.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-blue-100">
            {[
              "✅ Daftar gratis, langsung bisa pakai",
              "✅ Materi dengan Text-to-Speech otomatis",
              "✅ Font khusus & kontras tinggi untuk disleksia",
              "✅ Pengingat tugas dan analitik progres",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="shrink-0">{item.slice(0, 1)}</span>
                <span>{item.slice(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Panel kanan (form) ─────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-lg">
          {/* Logo mobile */}
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg text-white">
              ♾
            </span>
            <span className="font-bold text-slate-900">Smart Inclusive Ed</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Buat Akun Baru
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 rounded"
              >
                Masuk di sini
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
              {/* ── Pilihan peran ─────────────────────────────────────────── */}
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-800">
                  Daftar sebagai
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border p-4 text-center transition ${
                        form.role === opt.value ? opt.active : `${opt.bg} hover:opacity-90`
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={opt.value}
                        checked={form.role === opt.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="text-3xl">{opt.icon}</span>
                      <span className="font-bold text-slate-900">{opt.label}</span>
                      <span className="text-xs leading-tight text-slate-500">
                        {opt.desc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ── Nama lengkap ───────────────────────────────────────────── */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium text-slate-800"
                >
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* ── Email ─────────────────────────────────────────────────── */}
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
                  autoComplete="email"
                  required
                  maxLength={100}
                  value={form.email}
                  onChange={handleChange}
                  placeholder="nama@email.com"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* ── Password ──────────────────────────────────────────────── */}
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
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={72}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimal 8 karakter"
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

                {/* Indikator kekuatan password */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((lvl) => (
                        <div
                          key={lvl}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            pwStrength.level >= lvl
                              ? pwStrength.color
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Kekuatan password:{" "}
                      <span className="font-semibold">{pwStrength.label}</span>
                      {pwStrength.level < 3 && (
                        <> — tambahkan huruf kapital, angka, atau simbol</>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Konfirmasi password ────────────────────────────────────── */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium text-slate-800"
                >
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Ulangi password"
                    className={`w-full rounded-xl border bg-slate-50 px-4 py-3 pr-28 text-slate-900 outline-none transition focus:bg-white focus:ring-2 ${
                      form.confirmPassword &&
                      form.password !== form.confirmPassword
                        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                        : form.confirmPassword &&
                            form.password === form.confirmPassword
                          ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100"
                          : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-pressed={showConfirmPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {showConfirmPassword ? "Sembunyikan" : "Tampilkan"}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    Password tidak cocok.
                  </p>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <p className="mt-1 text-xs text-emerald-600">
                    ✓ Password cocok.
                  </p>
                )}
              </div>

              {/* ── Error / Success ────────────────────────────────────────── */}
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
              {success && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                >
                  <span className="shrink-0">✅</span>
                  <span>{success}</span>
                </div>
              )}

              {/* ── Submit ────────────────────────────────────────────────── */}
              <button
                type="submit"
                disabled={
                  loading ||
                  (!!form.confirmPassword &&
                    form.password !== form.confirmPassword)
                }
                className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-bold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
                    Membuat akun…
                  </span>
                ) : (
                  `Daftar sebagai ${form.role === "student" ? "Siswa" : "Guru"}`
                )}
              </button>

              {/* ── Info kebijakan ────────────────────────────────────────── */}
              <p className="text-center text-xs leading-relaxed text-slate-400">
                Dengan mendaftar, Anda setuju menggunakan platform ini untuk
                tujuan pembelajaran yang sesuai.
              </p>
            </form>
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
