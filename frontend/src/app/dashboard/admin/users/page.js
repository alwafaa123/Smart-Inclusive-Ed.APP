"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BackLink from "@/components/BackLink";
import { apiRequest } from "@/services/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const ROLE_LABELS  = { admin: "Admin", teacher: "Guru", student: "Siswa" };
const ROLE_COLORS  = {
  admin:   "bg-violet-100 text-violet-700",
  teacher: "bg-blue-100 text-blue-700",
  student: "bg-emerald-100 text-emerald-700",
};

function UserManagement() {
  const [users,       setUsers]       = useState([]);
  const [search,      setSearch]      = useState("");
  const [filterRole,  setFilterRole]  = useState("all");
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [updating,    setUpdating]    = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "student",
  });

  /* ── Load users ──────────────────────────────────────────────────────── */
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest("/admin/users");
      setUsers(result.users || []);
    } catch (err) {
      setError(err.message || "Gagal memuat daftar pengguna.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  /* ── Filter & search ─────────────────────────────────────────────────── */
  const filteredUsers = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchRole = filterRole === "all" || u.role === filterRole;
      const matchKw   = !kw || [u.name, u.email, u.role].some((v) =>
        String(v).toLowerCase().includes(kw),
      );
      return matchRole && matchKw;
    });
  }, [users, search, filterRole]);

  /* ── Handlers ────────────────────────────────────────────────────────── */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((c) => ({ ...c, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess(""); setSubmitting(true);
    try {
      const result = await apiRequest("/admin/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSuccess(result.message || "Pengguna berhasil ditambahkan.");
      setForm({ name: "", email: "", password: "", role: "student" });
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(err.message || "Gagal menambahkan pengguna.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateUser(e) {
    e.preventDefault();
    if (!editingUser) return;
    setError(""); setSuccess(""); setUpdating(true);
    try {
      const result = await apiRequest(`/admin/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editingUser.name, email: editingUser.email }),
      });
      setSuccess(result.message || "Data pengguna berhasil diubah.");
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      setError(err.message || "Gagal mengubah data pengguna.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleToggleStatus(user) {
    const nextActive = Number(user.is_active) !== 1;
    const confirmed = window.confirm(
      nextActive ? `Aktifkan akun ${user.name}?` : `Nonaktifkan akun ${user.name}?`,
    );
    if (!confirmed) return;
    setError(""); setSuccess("");
    try {
      const result = await apiRequest(`/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: nextActive }),
      });
      setSuccess(result.message || "Status akun berhasil diubah.");
      await loadUsers();
    } catch (err) {
      setError(err.message || "Gagal mengubah status akun.");
    }
  }

  /* ── Stats ───────────────────────────────────────────────────────────── */
  const statsData = useMemo(() => [
    { label: "Total",    value: users.length,                                             color: "text-slate-900"   },
    { label: "Guru",     value: users.filter((u) => u.role === "teacher").length,          color: "text-blue-700"    },
    { label: "Siswa",    value: users.filter((u) => u.role === "student").length,          color: "text-emerald-700" },
    { label: "Nonaktif", value: users.filter((u) => Number(u.is_active) !== 1).length,    color: "text-red-600"     },
  ], [users]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <BackLink href="/dashboard/admin">Kembali ke dashboard</BackLink>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Manajemen Pengguna
            </h1>
            <p className="mt-1 text-slate-600">
              Kelola akun guru dan siswa Smart Inclusive Ed.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={loadUsers}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
            >
              {loading ? "Memuat..." : "↻ Muat ulang"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm((v) => !v); setError(""); setSuccess(""); }}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              {showForm ? "✕ Tutup form" : "+ Tambah Pengguna"}
            </button>
          </div>
        </div>

        {/* ── Notifikasi global ────────────────────────────────────────── */}
        {error && (
          <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 fade-in">
            <span className="shrink-0">⚠️</span> {error}
          </div>
        )}
        {success && (
          <div role="status" className="mb-5 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 fade-in">
            <span className="shrink-0">✅</span> {success}
          </div>
        )}

        {/* ── Stats bar ────────────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statsData.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center">
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Form tambah pengguna (collapsible) ────────────────────────── */}
        {showForm && (
          <section className="mb-6 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm fade-in">
            <h2 className="mb-5 text-lg font-bold text-slate-900">
              Tambah Pengguna Baru
            </h2>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-800">
                  Nama lengkap
                </label>
                <input
                  id="name" name="name" type="text" autoComplete="name"
                  required minLength={2} maxLength={100}
                  value={form.name} onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-800">
                  Email
                </label>
                <input
                  id="email" name="email" type="email" autoComplete="email"
                  required maxLength={100}
                  value={form.email} onChange={handleChange}
                  placeholder="nama@email.com"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-800">
                  Password awal
                </label>
                <input
                  id="password" name="password" type="password" autoComplete="new-password"
                  required minLength={8} maxLength={72}
                  value={form.password} onChange={handleChange}
                  placeholder="Minimal 8 karakter"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-800">
                  Peran
                </label>
                <select
                  id="role" name="role"
                  value={form.role} onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="student">Siswa</option>
                  <option value="teacher">Guru</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit" disabled={submitting}
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Menyimpan..." : "Tambah Pengguna"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ── Form edit (tampil inline di atas tabel) ───────────────────── */}
        {editingUser && (
          <section className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6 shadow-sm fade-in">
            <h2 className="mb-4 font-bold text-slate-900">
              ✏️ Edit Pengguna — {editingUser.name}
            </h2>
            <form onSubmit={handleUpdateUser} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-name" className="mb-1.5 block text-sm font-medium text-slate-800">
                  Nama lengkap
                </label>
                <input
                  id="edit-name" type="text" required minLength={2} maxLength={100}
                  value={editingUser.name}
                  onChange={(e) => setEditingUser((c) => ({ ...c, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label htmlFor="edit-email" className="mb-1.5 block text-sm font-medium text-slate-800">
                  Email
                </label>
                <input
                  id="edit-email" type="email" required maxLength={100}
                  value={editingUser.email}
                  onChange={(e) => setEditingUser((c) => ({ ...c, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <button
                  type="submit" disabled={updating}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {updating ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
                <button
                  type="button" onClick={() => setEditingUser(null)} disabled={updating}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ── Tabel pengguna ────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
            <h2 className="font-bold text-slate-900">
              Daftar Pengguna
              {!loading && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {filteredUsers.length}
                </span>
              )}
            </h2>
            <div className="flex flex-wrap gap-3">
              {/* Filter peran */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">Semua peran</option>
                <option value="teacher">Guru</option>
                <option value="student">Siswa</option>
              </select>
              {/* Pencarian */}
              <div className="relative w-full sm:w-auto">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  🔍
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama atau email..."
                  aria-label="Cari pengguna"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-64"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="mb-3 skeleton h-12 rounded-xl" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-medium">
                {search || filterRole !== "all"
                  ? "Tidak ada pengguna yang cocok."
                  : "Belum ada data pengguna."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-slate-600">
                    <th className="px-5 py-3.5 font-semibold">Nama</th>
                    <th className="px-5 py-3.5 font-semibold">Email</th>
                    <th className="px-5 py-3.5 font-semibold">Peran</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isActive = Number(user.is_active) === 1;
                    return (
                      <tr
                        key={user.id}
                        className="border-t border-slate-100 transition hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {user.name}
                        </td>
                        <td className="px-5 py-4 text-slate-600">{user.email}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              ROLE_COLORS[user.role] || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-slate-400"}`}
                            />
                            {isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingUser({ id: user.id, name: user.name, email: user.email })
                              }
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(user)}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                                isActive
                                  ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {isActive ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <UserManagement />
    </ProtectedRoute>
  );
}
