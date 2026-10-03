"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LogoutButton from "@/components/auth/LogoutButton";
import { apiRequest } from "@/services/api";

function TeacherClassesContent() {
  const [classes,     setClasses]     = useState([]);
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [students,    setStudents]    = useState({});
  const [loading,     setLoading]     = useState(true);
  const [creating,    setCreating]    = useState(false);
  // FIX: pisahkan error dan success agar tampil dengan warna yang tepat
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");

  function flashSuccess(msg) {
    setError("");
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }
  function flashError(msg) {
    setSuccess("");
    setError(msg);
  }

  const loadClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");  // FIX: clear error setiap kali load ulang
      const data = await apiRequest("/classes");
      setClasses(data.classes || []);
    } catch (err) {
      flashError(err.message || "Gagal memuat kelas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  async function handleCreateClass(e) {
    e.preventDefault();
    if (!name.trim()) { flashError("Nama kelas wajib diisi."); return; }

    try {
      setCreating(true);
      const data = await apiRequest("/classes", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      flashSuccess(data.message || "Kelas berhasil dibuat.");
      setName("");
      setDescription("");
      await loadClasses();
    } catch (err) {
      flashError(err.message || "Gagal membuat kelas.");
    } finally {
      setCreating(false);
    }
  }

  async function loadMembers(classId) {
    try {
      const data = await apiRequest(`/classes/${classId}/members`);
      setStudents((prev) => ({ ...prev, [classId]: data.students || [] }));
    } catch (err) {
      flashError(err.message || "Gagal memuat anggota kelas.");
    }
  }

  async function handleRemoveStudent(classId, studentId, studentName) {
    if (!window.confirm(`Keluarkan ${studentName} dari kelas ini?`)) return;
    try {
      const data = await apiRequest(`/classes/${classId}/members/${studentId}`, {
        method: "DELETE",
      });
      flashSuccess(data.message || "Siswa berhasil dikeluarkan.");
      await loadMembers(classId);
      await loadClasses();
    } catch (err) {
      flashError(err.message || "Gagal mengeluarkan siswa.");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg text-white">♾</span>
              <span className="text-sm font-semibold text-blue-700">Smart Inclusive Ed</span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              🏫 Manajemen Kelas
            </h1>
            <p className="mt-1 text-slate-600">
              Buat kelas, kelola anggota, dan buka materi atau tugas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <BackLink href="/dashboard/guru">Dashboard Guru</BackLink>
            <LogoutButton />
          </div>
        </header>

        {/* ── Alert ───────────────────────────────────────────────────── */}
        {error && (
          <div role="alert"
            className="mb-5 flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 fade-in">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div role="status"
            className="mb-5 flex gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 fade-in">
            ✅ {success}
          </div>
        )}

        {/* ── Form buat kelas ──────────────────────────────────────────── */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Buat Kelas Baru</h2>
          <form onSubmit={handleCreateClass} className="space-y-4">
            <div>
              <label htmlFor="class-name"
                className="mb-1.5 block text-sm font-semibold text-slate-800">
                Nama kelas <span className="text-red-500">*</span>
              </label>
              <input id="class-name" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Matematika Kelas 10"
                maxLength={100} required
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label htmlFor="class-desc"
                className="mb-1.5 block text-sm font-semibold text-slate-800">
                Deskripsi <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <textarea id="class-desc" value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Keterangan singkat tentang kelas."
                rows={2}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button type="submit" disabled={creating}
              className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60">
              {creating ? "Membuat kelas…" : "+ Buat Kelas"}
            </button>
          </form>
        </section>

        {/* ── Daftar kelas ────────────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Kelas Saya
              {!loading && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-500">
                  {classes.length}
                </span>
              )}
            </h2>
            <button onClick={loadClasses} disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60">
              ↻ Muat ulang
            </button>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => <div key={i} className="skeleton h-56 rounded-2xl" />)}
            </div>
          ) : classes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-4xl mb-3">🏫</p>
              <p className="font-semibold text-slate-700">Belum ada kelas</p>
              <p className="mt-1 text-sm text-slate-500">Buat kelas di atas untuk mulai mengajar.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {classes.map((cls) => (
                <article key={cls.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">

                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{cls.name}</h3>
                    <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {cls.student_count ?? 0} siswa
                    </span>
                  </div>

                  <p className="mt-1 min-h-8 text-sm text-slate-500">
                    {cls.description || "Tidak ada deskripsi."}
                  </p>

                  {/* Kode kelas */}
                  <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-3">
                    <p className="text-xs font-semibold text-blue-600">Kode Kelas (bagikan ke siswa)</p>
                    <p className="mt-1 select-all font-mono text-2xl font-bold tracking-widest text-blue-900">
                      {cls.class_code}
                    </p>
                  </div>

                  {/* Navigasi cepat ke materi & tugas */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link href={`/dashboard/guru/kelas/${cls.id}/materi`}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
                      📚 Materi
                    </Link>
                    <Link href={`/dashboard/guru/kelas/${cls.id}/tugas`}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600">
                      ✏️ Tugas
                    </Link>
                  </div>

                  {/* Tombol lihat anggota */}
                  <button onClick={() =>
                      students[cls.id]
                        ? setStudents((p) => { const n = { ...p }; delete n[cls.id]; return n; })
                        : loadMembers(cls.id)
                    }
                    className="mt-3 w-full rounded-xl border border-slate-300 bg-slate-50 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                    {students[cls.id] ? "▲ Sembunyikan Anggota" : "▼ Lihat Anggota"}
                  </button>

                  {/* Daftar anggota */}
                  {students[cls.id] && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      {students[cls.id].length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-2">
                          Belum ada siswa yang bergabung.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {students[cls.id].map((student) => (
                            <li key={student.id}
                              className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {student.name}
                                </p>
                                <p className="truncate text-xs text-slate-400">
                                  {student.email}
                                </p>
                              </div>
                              <button
                                onClick={() => handleRemoveStudent(cls.id, student.id, student.name)}
                                className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100">
                                Keluarkan
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function TeacherClassesPage() {
  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <TeacherClassesContent />
    </ProtectedRoute>
  );
}
