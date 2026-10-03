"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LogoutButton from "@/components/auth/LogoutButton";
import { apiRequest } from "@/services/api";

function StudentClassesContent() {
  const [classes, setClasses] = useState([]);
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "info" });

  async function loadClasses() {
    try {
      setLoading(true);
      const data = await apiRequest("/classes");
      setClasses(data.classes || []);
    } catch (error) {
      setMessage({ text: error.message || "Gagal memuat kelas.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClasses();
  }, []);

  async function handleJoinClass(event) {
    event.preventDefault();
    setMessage({ text: "", type: "info" });

    if (!classCode.trim()) {
      setMessage({ text: "Masukkan kode kelas terlebih dahulu.", type: "error" });
      return;
    }

    try {
      setJoining(true);
      const data = await apiRequest("/classes/join", {
        method: "POST",
        body: JSON.stringify({ class_code: classCode.trim().toUpperCase() }),
      });
      setMessage({ text: data.message || "Berhasil bergabung dengan kelas.", type: "success" });
      setClassCode("");
      await loadClasses();
    } catch (error) {
      setMessage({ text: error.message || "Gagal bergabung dengan kelas.", type: "error" });
    } finally {
      setJoining(false);
    }
  }

  const messageColors = {
    success: "border-green-200 bg-green-50 text-green-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-blue-700">Smart Inclusive Ed</p>
            <h1 className="text-2xl font-bold text-slate-900">Kelas Saya</h1>
            <p className="mt-1 text-sm text-slate-600">
              Bergabung dan akses kelas pembelajaranmu.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <BackLink href="/dashboard/siswa">Dashboard Siswa</BackLink>
            <LogoutButton />
          </div>
        </header>

        {message.text && (
          <div
            role="status"
            className={`mb-5 rounded-lg border p-3 text-sm ${messageColors[message.type]}`}
          >
            {message.text}
          </div>
        )}

        {/* Form bergabung kelas */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            Bergabung dengan Kelas
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Minta kode kelas kepada guru, lalu masukkan kode tersebut di bawah.
          </p>
          <form
            onSubmit={handleJoinClass}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="class-code" className="sr-only">
              Kode kelas
            </label>
            <input
              id="class-code"
              value={classCode}
              onChange={(event) => setClassCode(event.target.value)}
              placeholder="Masukkan kode kelas"
              maxLength={20}
              required
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 font-mono uppercase text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={joining}
              className="rounded-lg bg-blue-700 px-5 py-2.5 font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {joining ? "Memproses..." : "Gabung Kelas"}
            </button>
          </form>
        </section>

        {/* Daftar kelas */}
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Kelas yang Diikuti
            </h2>
            <button
              onClick={loadClasses}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Muat ulang
            </button>
          </div>

          {loading ? (
            <p className="text-slate-600">Memuat kelas...</p>
          ) : classes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              Belum mengikuti kelas. Masukkan kode kelas dari guru untuk mulai belajar.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {classes.map((classItem) => (
                <article
                  key={classItem.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-slate-900">
                    {classItem.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {classItem.description || "Tidak ada deskripsi."}
                  </p>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-500">Pengajar</p>
                    <p className="font-medium text-slate-800">
                      {classItem.teacher_name}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/dashboard/siswa/kelas/${classItem.id}/materi`}
                      className="flex-1 rounded-lg bg-blue-700 py-2 text-center text-sm font-medium text-white hover:bg-blue-800"
                    >
                      Materi
                    </Link>
                    <Link
                      href={`/dashboard/siswa/kelas/${classItem.id}/tugas`}
                      className="flex-1 rounded-lg border border-slate-300 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Tugas
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function StudentClassesPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentClassesContent />
    </ProtectedRoute>
  );
}
