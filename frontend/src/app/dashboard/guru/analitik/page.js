"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LogoutButton from "@/components/auth/LogoutButton";
import { apiRequest } from "@/services/api";

function StatCard({ title, value, desc, color = "text-slate-900" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-1 text-3xl font-extrabold ${color}`}>{value}</p>
      {desc && <p className="mt-1 text-xs text-slate-400">{desc}</p>}
    </div>
  );
}

function AnalyticsContent() {
  const [classes,          setClasses]          = useState([]);
  const [selectedClass,    setSelectedClass]    = useState("");
  const [analytics,        setAnalytics]        = useState(null);
  const [loadingClasses,   setLoadingClasses]   = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error,            setError]            = useState("");

  // FIX: wrap dengan useCallback agar stabil
  const loadAnalytics = useCallback(async (classId) => {
    if (!classId) return;
    try {
      setLoadingAnalytics(true);
      setError("");
      const data = await apiRequest(`/analytics/classes/${classId}`);
      setAnalytics(data);
    } catch (err) {
      setAnalytics(null);
      setError(err.message || "Gagal memuat analitik kelas.");
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  // FIX: wrap dengan useCallback
  const loadClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      setError("");
      const data = await apiRequest("/classes");
      const list = data.classes || [];
      setClasses(list);
      if (list.length > 0) setSelectedClass(String(list[0].id));
    } catch (err) {
      setError(err.message || "Gagal memuat daftar kelas.");
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  // FIX: loadAnalytics masuk dependency array
  useEffect(() => {
    if (selectedClass) loadAnalytics(selectedClass);
    else setAnalytics(null);
  }, [selectedClass, loadAnalytics]);

  const summary = analytics?.summary || {};
  const fmt = (v) => Number(v || 0).toLocaleString("id-ID");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <BackLink href="/dashboard/guru">Kembali ke dashboard</BackLink>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              📊 Analitik Pembelajaran
            </h1>
            <p className="mt-1 text-slate-600">
              Pantau perkembangan siswa dan aktivitas kelas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => selectedClass && loadAnalytics(selectedClass)}
              disabled={!selectedClass || loadingAnalytics}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              {loadingAnalytics ? "Memuat…" : "↻ Muat ulang"}
            </button>
            <LogoutButton />
          </div>
        </header>

        {/* ── Pilih kelas ──────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label htmlFor="class-select"
            className="mb-2 block text-sm font-semibold text-slate-800">
            Pilih Kelas
          </label>
          {loadingClasses ? (
            <div className="skeleton h-11 w-64 rounded-xl" />
          ) : classes.length === 0 ? (
            <p className="text-sm text-slate-500">
              Belum ada kelas.{" "}
              <Link href="/dashboard/guru/kelas" className="text-blue-700 hover:underline">
                Buat kelas terlebih dahulu.
              </Link>
            </p>
          ) : (
            <select id="class-select" value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:min-w-72">
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </section>

        {error && (
          <div role="alert"
            className="flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            ⚠️ {error}
          </div>
        )}

        {/* ── Konten analitik ──────────────────────────────────────────── */}
        {loadingAnalytics ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
            </div>
            <div className="skeleton h-56 rounded-2xl" />
          </div>
        ) : analytics ? (
          <>
            {/* Ringkasan */}
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard title="Jumlah Siswa"  value={fmt(summary.total_students)}   desc="Tergabung di kelas"      color="text-blue-700" />
              <StatCard title="Total Materi"  value={fmt(summary.total_modules)}    desc="Materi tersedia"         color="text-indigo-700" />
              <StatCard title="Total Tugas"   value={fmt(summary.total_assignments)} desc="Tugas dibuat"           color="text-violet-700" />
            </div>

            {/* Progres materi */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-slate-900">Progres Materi</h2>
              {analytics.moduleProgress?.length ? (
                <div className="space-y-5">
                  {analytics.moduleProgress.map((item) => {
                    const total     = Number(item.total_students || 0);
                    const completed = Number(item.completed || 0);
                    const inProg    = Number(item.in_progress || 0);
                    const notStart  = Number(item.not_started || 0);
                    const pct       = total ? Math.round((completed / total) * 100) : 0;
                    return (
                      <div key={item.module_id}>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <p className="font-semibold text-slate-800">{item.module_title}</p>
                          <p className="text-sm text-slate-500">
                            {completed}/{total} selesai ({pct}%)
                          </p>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100"
                          role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
                          aria-label={`Progres ${item.module_title}: ${pct}%`}>
                          <div className="h-full rounded-full bg-emerald-500 progress-bar-fill transition-all"
                            style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                          <span>✅ Selesai: {completed}</span>
                          <span>📖 Sedang belajar: {inProg}</span>
                          <span>⬜ Belum mulai: {notStart}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Belum ada data materi.</p>
              )}
            </section>

            {/* Statistik tugas */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-slate-900">Statistik Tugas</h2>
              {analytics.assignmentStats?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                        <th className="p-3 font-semibold">Tugas</th>
                        <th className="p-3 font-semibold text-center">Siswa</th>
                        <th className="p-3 font-semibold text-center">Dikumpulkan</th>
                        <th className="p-3 font-semibold text-center">Belum</th>
                        <th className="p-3 font-semibold text-center">Rata-rata Nilai</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.assignmentStats.map((item) => (
                        <tr key={item.assignment_id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="p-3 font-medium text-slate-800">{item.assignment_title}</td>
                          <td className="p-3 text-center">{item.total_students}</td>
                          <td className="p-3 text-center">
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                              {item.submitted}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              Number(item.not_submitted) > 0
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-500"
                            }`}>
                              {item.not_submitted}
                            </span>
                          </td>
                          <td className="p-3 text-center font-semibold text-slate-700">
                            {item.average_score != null ? item.average_score : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Belum ada tugas untuk kelas ini.</p>
              )}
            </section>

            {/* Progres per siswa */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-slate-900">Progres Per Siswa</h2>
              {analytics.studentProgress?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                        <th className="p-3 font-semibold">Siswa</th>
                        <th className="p-3 font-semibold text-center">Materi Selesai</th>
                        <th className="p-3 font-semibold text-center">Tugas Dikumpul</th>
                        <th className="p-3 font-semibold text-center">Rata-rata Nilai</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.studentProgress.map((s) => {
                        const modPct = Number(s.total_modules) > 0
                          ? Math.round((Number(s.completed_modules) / Number(s.total_modules)) * 100)
                          : 0;
                        return (
                          <tr key={s.student_id}
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <td className="p-3">
                              <p className="font-semibold text-slate-800">{s.student_name}</p>
                              <p className="text-xs text-slate-400">{s.email}</p>
                            </td>
                            <td className="p-3 text-center">
                              <div className="inline-flex flex-col items-center gap-1">
                                <span className="font-semibold text-slate-700">
                                  {s.completed_modules}/{s.total_modules}
                                </span>
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                                  <div className="h-1.5 rounded-full bg-emerald-500"
                                    style={{ width: `${modPct}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center font-semibold text-slate-700">
                              {s.submitted_assignments}/{s.total_assignments}
                            </td>
                            <td className="p-3 text-center">
                              {s.average_score != null ? (
                                <span className={`font-bold ${
                                  Number(s.average_score) >= 80 ? "text-emerald-600" :
                                  Number(s.average_score) >= 60 ? "text-amber-600"   : "text-red-600"
                                }`}>
                                  {s.average_score}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Belum ada siswa di kelas ini.</p>
              )}
            </section>
          </>
        ) : (
          !error && selectedClass && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              <p className="text-3xl mb-2">📊</p>
              Data analitik belum tersedia untuk kelas ini.
            </div>
          )
        )}
      </div>
    </main>
  );
}

export default function TeacherAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}
