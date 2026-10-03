"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LogoutButton from "@/components/auth/LogoutButton";
import { apiRequest } from "@/services/api";

function ClassOverviewContent() {
  const params = useParams();
  const classId = params.id;

  const [classInfo, setClassInfo] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    if (!classId) return;
    try {
      setLoading(true);
      const [classesData, assignmentData, moduleData, progressData] =
        await Promise.all([
          apiRequest("/classes"),
          apiRequest(`/assignments/classes/${classId}`),
          apiRequest(`/modules/classes/${classId}/modules`),
          apiRequest(`/modules/classes/${classId}/progress`),
        ]);

      // Cari informasi kelas dari daftar kelas siswa
      const found = (classesData.classes || []).find(
        (c) => String(c.id) === String(classId),
      );
      setClassInfo(found || null);
      setAssignments(assignmentData.assignments || []);
      setModules(moduleData.modules || []);

      const progressMap = {};
      (progressData.progress || []).forEach((item) => {
        progressMap[item.module_id] = item.status;
      });
      setProgress(progressMap);
    } catch (err) {
      setError(err.message || "Gagal memuat informasi kelas.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const completedModules = modules.filter(
    (m) => progress[m.id] === "completed",
  ).length;
  const totalModules = modules.length;

  const now = new Date();
  const upcomingAssignments = assignments.filter(
    (a) => a.due_at && new Date(a.due_at) > now,
  );

  function formatDate(dateStr) {
    if (!dateStr) return "Tidak ada batas waktu";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const diff = Math.ceil(
      (new Date(dateStr) - now) / (1000 * 60 * 60 * 24),
    );
    return diff;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BackLink href="/dashboard/siswa/kelas">
                Kembali ke Kelas Saya
              </BackLink>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              {loading ? "Memuat..." : classInfo?.name || "Kelas"}
            </h1>
            {classInfo && (
              <p className="mt-1 text-sm text-slate-600">
                Pengajar: <span className="font-medium">{classInfo.teacher_name}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/siswa" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
              Dashboard
            </Link>
            <LogoutButton />
          </div>
        </header>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Statistik ringkas */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Progres Materi</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {completedModules}
                  <span className="text-lg font-normal text-slate-400">/{totalModules}</span>
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all"
                    style={{
                      width: totalModules > 0
                        ? `${(completedModules / totalModules) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {totalModules > 0
                    ? `${Math.round((completedModules / totalModules) * 100)}% selesai`
                    : "Belum ada materi"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total Tugas</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {assignments.length}
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  {upcomingAssignments.length} tugas mendatang
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Kode Kelas</p>
                <p className="mt-1 text-2xl font-bold font-mono tracking-widest text-slate-900">
                  {classInfo?.class_code || "—"}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Bagikan kepada teman sekelas
                </p>
              </div>
            </div>

            {/* Navigasi utama */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              <Link
                href={`/dashboard/siswa/kelas/${classId}/materi`}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                  📚
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-700">
                    Materi Pembelajaran
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {totalModules > 0
                      ? `${totalModules} materi tersedia · ${completedModules} selesai`
                      : "Belum ada materi diterbitkan"}
                  </p>
                  <span className="mt-3 inline-block text-sm font-semibold text-blue-700">
                    Buka materi →
                  </span>
                </div>
              </Link>

              <Link
                href={`/dashboard/siswa/kelas/${classId}/tugas`}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-2xl">
                  ✏️
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-700">
                    Tugas
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {assignments.length > 0
                      ? `${assignments.length} tugas · ${upcomingAssignments.length} mendatang`
                      : "Belum ada tugas"}
                  </p>
                  <span className="mt-3 inline-block text-sm font-semibold text-blue-700">
                    Buka tugas →
                  </span>
                </div>
              </Link>
            </div>

            {/* Tugas mendatang */}
            {upcomingAssignments.length > 0 && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="mb-4 font-semibold text-amber-900">
                  ⏰ Tugas Mendatang
                </h2>
                <div className="space-y-3">
                  {upcomingAssignments.slice(0, 5).map((a) => {
                    const days = daysUntil(a.due_at);
                    const urgent = days !== null && days <= 3;
                    return (
                      <div
                        key={a.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-white p-4"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{a.title}</p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {formatDate(a.due_at)}
                          </p>
                        </div>
                        {days !== null && (
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              urgent
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {days === 0
                              ? "Hari ini"
                              : days === 1
                                ? "Besok"
                                : `${days} hari lagi`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Deskripsi kelas */}
            {classInfo?.description && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-2 font-semibold text-slate-900">
                  Tentang Kelas
                </h2>
                <p className="text-sm leading-relaxed text-slate-600">
                  {classInfo.description}
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function StudentClassOverviewPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <ClassOverviewContent />
    </ProtectedRoute>
  );
}
