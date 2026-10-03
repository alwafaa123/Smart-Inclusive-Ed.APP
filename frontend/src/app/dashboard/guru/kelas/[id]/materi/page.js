"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import BackLink from "@/components/BackLink";
import AttachmentDownload from "@/components/AttachmentDownload";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LogoutButton from "@/components/auth/LogoutButton";
import { apiRequest } from "@/services/api";

const EMPTY_FORM = { title: "", description: "", content: "", content_type: "text" };

const CONTENT_TYPE_LABELS = {
  text:  "📝 Teks",
  video: "🎬 Video",
  audio: "🎧 Audio",
  mixed: "🗂 Campuran",
};

function TeacherModulesContent() {
  const params  = useParams();
  const classId = params.id;

  const [modules,    setModules]    = useState([]);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [attachment, setAttachment] = useState(null);
  const attachmentInput = useRef(null);
  const [editingId,  setEditingId]  = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");

  function flashSuccess(msg) { setError(""); setSuccess(msg); setTimeout(() => setSuccess(""), 3000); }
  function flashError(msg)   { setSuccess(""); setError(msg); }

  const loadModules = useCallback(async () => {
    if (!classId) return;
    try {
      setLoading(true);
      setError("");
      const data = await apiRequest(`/modules/classes/${classId}/modules`);
      setModules(data.modules || []);
    } catch (err) {
      flashError(err.message || "Gagal memuat materi.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { loadModules(); }, [loadModules]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setAttachment(null);
    if (attachmentInput.current) attachmentInput.current.value = "";
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      flashError("Judul dan isi materi wajib diisi.");
      return;
    }
    try {
      setSaving(true);
      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("description", form.description.trim());
      payload.append("content", form.content.trim());
      payload.append("content_type", form.content_type);
      if (attachment) payload.append("attachment", attachment);

      const result = editingId
        ? await apiRequest(`/modules/${editingId}`, { method: "PUT", body: payload })
        : await apiRequest(`/modules/classes/${classId}/modules`, { method: "POST", body: payload });

      flashSuccess(result.message || "Materi berhasil disimpan sebagai draf.");
      resetForm();
      await loadModules();
    } catch (err) {
      flashError(err.message || "Gagal menyimpan materi.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(module) {
    setEditingId(module.id);
    setForm({
      title:        module.title,
      description:  module.description || "",
      content:      module.content,
      content_type: module.content_type,
    });
    setAttachment(null);
    if (attachmentInput.current) attachmentInput.current.value = "";
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function togglePublished(module) {
    try {
      const result = await apiRequest(`/modules/${module.id}/publish`, {
        method: "PATCH",
        body: JSON.stringify({ is_published: Number(module.is_published) !== 1 }),
      });
      flashSuccess(result.message || "Status materi diperbarui.");
      await loadModules();
    } catch (err) {
      flashError(err.message || "Gagal mengubah status materi.");
    }
  }

  async function deleteModule(module) {
    if (!window.confirm(`Hapus materi "${module.title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const result = await apiRequest(`/modules/${module.id}`, { method: "DELETE" });
      flashSuccess(result.message || "Materi berhasil dihapus.");
      if (editingId === module.id) resetForm();
      await loadModules();
    } catch (err) {
      flashError(err.message || "Gagal menghapus materi.");
    }
  }

  const published = modules.filter((m) => Number(m.is_published) === 1).length;
  const drafts    = modules.length - published;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <BackLink href="/dashboard/guru/kelas">
              Kembali ke daftar kelas
            </BackLink>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              📚 Materi Pembelajaran
            </h1>
            <p className="mt-1 text-slate-600">
              Buat, edit, dan terbitkan materi untuk siswa.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowForm((v) => !v); if (showForm) resetForm(); }}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
              {showForm ? "✕ Tutup Form" : "+ Buat Materi Baru"}
            </button>
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

        {/* ── Stats ringkas ────────────────────────────────────────────── */}
        {!loading && modules.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { label: "Total Materi", value: modules.length,  color: "text-slate-900" },
              { label: "Diterbitkan",  value: published,       color: "text-emerald-700" },
              { label: "Draf",         value: drafts,          color: "text-amber-600" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Form buat / edit materi ──────────────────────────────────── */}
        {showForm && (
          <section className="mb-8 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm fade-in sm:p-7">
            <h2 className="mb-5 text-lg font-bold text-slate-900">
              {editingId ? "✏️ Edit Materi" : "📝 Buat Materi Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="mod-title"
                    className="mb-1.5 block text-sm font-semibold text-slate-800">
                    Judul Materi <span className="text-red-500">*</span>
                  </label>
                  <input id="mod-title" name="title" required maxLength={150}
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Contoh: Bab 1 — Pengenalan Ekosistem"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label htmlFor="mod-type"
                    className="mb-1.5 block text-sm font-semibold text-slate-800">
                    Jenis Materi
                  </label>
                  <select id="mod-type" name="content_type"
                    value={form.content_type}
                    onChange={(e) => setForm((p) => ({ ...p, content_type: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100">
                    <option value="text">📝 Teks</option>
                    <option value="video">🎬 Video (tautan/keterangan)</option>
                    <option value="audio">🎧 Audio (tautan/keterangan)</option>
                    <option value="mixed">🗂 Campuran</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="mod-desc"
                  className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Deskripsi <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <input id="mod-desc" name="description"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Ringkasan singkat tentang materi ini."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label htmlFor="mod-content"
                  className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Isi Materi <span className="text-red-500">*</span>
                </label>
                <textarea id="mod-content" name="content" required rows={10}
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Tuliskan isi materi pembelajaran di sini. Siswa akan membacanya dengan dukungan aksesibilitas (TTS, font disleksia, dll)."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {form.content.length} karakter
                </p>
              </div>
              <div>
                <label htmlFor="mod-attachment"
                  className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Lampiran Materi <span className="font-normal text-slate-400">(opsional, maksimal 15 MB)</span>
                </label>
                <input
                  id="mod-attachment"
                  ref={attachmentInput}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.ogg,.mp4,.webm"
                  onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:font-semibold file:text-blue-800"
                />
                {editingId && modules.find((module) => module.id === editingId)?.attachment_name && (
                  <div className="mt-2">
                    <p className="mb-1 text-xs text-slate-500">
                      Pilih berkas baru untuk mengganti lampiran yang ada.
                    </p>
                    <AttachmentDownload
                      endpoint={`/modules/${editingId}/attachment`}
                      filename={modules.find((module) => module.id === editingId).attachment_name}
                    />
                  </div>
                )}
                {attachment && (
                  <p className="mt-2 text-sm text-slate-600">Berkas dipilih: {attachment.name}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                <button type="submit" disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? "Menyimpan…" : editingId ? "Simpan Perubahan" : "💾 Simpan sebagai Draf"}
                </button>
                <button type="button" onClick={resetForm}
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50">
                  Batal
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ── Daftar materi ────────────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Daftar Materi
              {!loading && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-500">
                  {modules.length}
                </span>
              )}
            </h2>
            <button onClick={loadModules} disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60">
              ↻ Muat ulang
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
            </div>
          ) : modules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-4xl mb-3">📚</p>
              <p className="font-semibold text-slate-700">Belum ada materi</p>
              <p className="mt-1 text-sm text-slate-500">Klik "Buat Materi Baru" untuk memulai.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((module) => {
                const isPublished = Number(module.is_published) === 1;
                return (
                  <article key={module.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-lg">{module.title}</h3>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {isPublished ? "✓ Diterbitkan" : "⏸ Draf"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {CONTENT_TYPE_LABELS[module.content_type] || module.content_type}
                          </span>
                        </div>
                        {module.description && (
                          <p className="mt-1 text-sm text-slate-500">{module.description}</p>
                        )}
                        <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-slate-600">
                          {module.content}
                        </p>
                        {module.attachment_name && (
                          <div className="mt-3">
                            <AttachmentDownload
                              endpoint={`/modules/${module.id}/attachment`}
                              filename={module.attachment_name}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      <button onClick={() => startEditing(module)}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        ✏️ Edit
                      </button>
                      <button onClick={() => togglePublished(module)}
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                          isPublished
                            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}>
                        {isPublished ? "⏸ Sembunyikan" : "▶ Terbitkan ke Siswa"}
                      </button>
                      <button onClick={() => deleteModule(module)}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">
                        🗑 Hapus
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function TeacherModulesPage() {
  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <TeacherModulesContent />
    </ProtectedRoute>
  );
}
