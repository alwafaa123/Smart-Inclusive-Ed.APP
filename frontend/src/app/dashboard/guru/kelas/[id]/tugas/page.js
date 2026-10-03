"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import BackLink from "@/components/BackLink";
import AttachmentDownload from "@/components/AttachmentDownload";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LogoutButton from "@/components/auth/LogoutButton";
import { apiRequest } from "@/services/api";

/* ══════════════════════════════════════════════════════════════════════════
   Komponen: SubmissionReview — kartu penilaian tiap siswa
══════════════════════════════════════════════════════════════════════════ */
function SubmissionReview({ submission, onSave }) {
  const [score,        setScore]        = useState(submission.score === null ? "" : String(submission.score));
  const [feedback,     setFeedback]     = useState(submission.feedback || "");
  const [saving,       setSaving]       = useState(false);
  const [savedMsg,     setSavedMsg]     = useState("");

  async function handleSave() {
    if (score === "" || isNaN(Number(score))) return;
    setSaving(true);
    setSavedMsg("");
    try {
      await onSave(submission.id, Number(score), feedback);
      setSavedMsg("✅ Penilaian tersimpan.");
    } catch {
      setSavedMsg("⚠️ Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  const scoreNum   = Number(score);
  const scoreColor =
    scoreNum >= 80 ? "text-emerald-700" :
    scoreNum >= 60 ? "text-amber-600"   : "text-red-600";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header siswa */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold text-slate-900">{submission.student_name}</p>
          <p className="text-sm text-slate-500">{submission.student_email}</p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <p>Dikumpulkan</p>
          <p className="font-medium text-slate-600">
            {submission.submitted_at
              ? new Date(submission.submitted_at).toLocaleString("id-ID")
              : "—"}
          </p>
        </div>
      </div>

      {/* Jawaban siswa */}
      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Jawaban Siswa
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
          {submission.answer}
        </p>
      </div>

      {submission.attachment_name && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Berkas Jawaban
          </p>
          <AttachmentDownload
            endpoint={`/assignments/submissions/${submission.id}/attachment`}
            filename={submission.attachment_name}
          />
        </div>
      )}

      {/* Form penilaian */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`score-${submission.id}`}
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Nilai (0 – 100)
          </label>
          <div className="flex items-center gap-3">
            <input
              id={`score-${submission.id}`}
              type="number"
              min="0"
              max="100"
              step="1"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-28 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-center text-lg font-bold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="—"
            />
            {score !== "" && !isNaN(scoreNum) && (
              <span className={`text-2xl font-extrabold ${scoreColor}`}>
                {scoreNum}
              </span>
            )}
          </div>
          {/* Visual bar nilai */}
          {score !== "" && !isNaN(scoreNum) && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-2 rounded-full transition-all ${
                  scoreNum >= 80 ? "bg-emerald-500" :
                  scoreNum >= 60 ? "bg-amber-400"   : "bg-red-400"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, scoreNum))}%` }}
              />
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor={`feedback-${submission.id}`}
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Umpan Balik
          </label>
          <textarea
            id={`feedback-${submission.id}`}
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Tulis komentar atau saran untuk siswa…"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || score === "" || isNaN(scoreNum)}
          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Simpan Penilaian"}
        </button>
        {savedMsg && (
          <span role="status" className="text-sm text-slate-600">{savedMsg}</span>
        )}
      </div>
    </article>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Komponen utama: TeacherAssignmentsContent
══════════════════════════════════════════════════════════════════════════ */
function TeacherAssignmentsContent() {
  const params  = useParams();
  const classId = params.id;

  const EMPTY_FORM = { title: "", instructions: "", due_at: "" };

  const [assignments,        setAssignments]        = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions,        setSubmissions]        = useState([]);
  const [loadingSubs,        setLoadingSubs]        = useState(false);
  const [loading,            setLoading]            = useState(true);
  const [submitting,         setSubmitting]         = useState(false);
  const [message,            setMessage]            = useState({ text: "", type: "success" });
  const [editingId,          setEditingId]          = useState(null);
  const [showForm,           setShowForm]           = useState(false);
  const [form,               setForm]               = useState(EMPTY_FORM);
  const [attachment,         setAttachment]         = useState(null);
  const attachmentInput = useRef(null);

  /* ── Muat daftar tugas ──────────────────────────────────────────────── */
  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/assignments/classes/${classId}`);
      // Backend mengembalikan { assignments: [...] }
      setAssignments(data.assignments || []);
    } catch (err) {
      setMessage({ text: err.message || "Gagal memuat tugas.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { if (classId) loadAssignments(); }, [classId, loadAssignments]);

  /* ── Buat / edit tugas ──────────────────────────────────────────────── */
  async function handleSubmitForm(e) {
    e.preventDefault();
    setMessage({ text: "", type: "success" });
    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("instructions", form.instructions.trim());
      payload.append("due_at", form.due_at ? form.due_at.replace("T", " ") + ":00" : "");
      if (attachment) payload.append("attachment", attachment);

      if (editingId) {
        await apiRequest(`/assignments/${editingId}`, {
          method: "PUT",
          body: payload,
        });
        setMessage({ text: "✅ Tugas berhasil diperbarui.", type: "success" });
      } else {
        await apiRequest(`/assignments/classes/${classId}`, {
          method: "POST",
          body: payload,
        });
        setMessage({ text: "✅ Tugas berhasil dibuat dan dikirim ke siswa.", type: "success" });
      }

      setForm(EMPTY_FORM);
      setAttachment(null);
      if (attachmentInput.current) attachmentInput.current.value = "";
      setEditingId(null);
      setShowForm(false);
      await loadAssignments();
    } catch (err) {
      setMessage({ text: err.message || "Gagal menyimpan tugas.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(assignment) {
    setEditingId(assignment.id);
    setForm({
      title:        assignment.title || "",
      instructions: assignment.instructions || "",
      due_at:       assignment.due_at
        ? String(assignment.due_at).replace(" ", "T").slice(0, 16)
        : "",
    });
    setAttachment(null);
    if (attachmentInput.current) attachmentInput.current.value = "";
    setShowForm(true);
    setMessage({ text: "", type: "success" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setAttachment(null);
    if (attachmentInput.current) attachmentInput.current.value = "";
    setShowForm(false);
    setMessage({ text: "", type: "success" });
  }

  /* ── Hapus tugas ────────────────────────────────────────────────────── */
  async function handleDelete(id) {
    if (!window.confirm("Hapus tugas ini beserta semua jawaban siswa?")) return;
    try {
      await apiRequest(`/assignments/${id}`, { method: "DELETE" });
      if (selectedAssignment?.id === id) {
        setSelectedAssignment(null);
        setSubmissions([]);
      }
      setMessage({ text: "✅ Tugas berhasil dihapus.", type: "success" });
      await loadAssignments();
    } catch (err) {
      setMessage({ text: err.message || "Gagal menghapus tugas.", type: "error" });
    }
  }

  /* ── Lihat jawaban siswa ────────────────────────────────────────────── */
  async function viewSubmissions(assignment) {
    setSelectedAssignment(assignment);
    setSubmissions([]);
    setLoadingSubs(true);
    setMessage({ text: "", type: "success" });
    try {
      const data = await apiRequest(`/assignments/${assignment.id}/submissions`);
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage({ text: err.message || "Gagal memuat jawaban siswa.", type: "error" });
    } finally {
      setLoadingSubs(false);
    }
  }

  /* ── Simpan penilaian ───────────────────────────────────────────────── */
  async function saveGrade(submissionId, score, feedback) {
    await apiRequest(`/assignments/submissions/${submissionId}/grade`, {
      method: "PUT",
      body: JSON.stringify({ score, feedback }),
    });
    if (selectedAssignment) await viewSubmissions(selectedAssignment);
  }

  /* ── Helpers ────────────────────────────────────────────────────────── */
  function formatDate(dateStr) {
    if (!dateStr) return "Tidak ada tenggat";
    return new Date(dateStr).toLocaleString("id-ID", {
      weekday: "short", day: "numeric", month: "long",
      year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  function daysLeft(dateStr) {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
  }

  const msgColor = message.type === "error"
    ? "border-red-200 bg-red-50 text-red-800"
    : "border-emerald-200 bg-emerald-50 text-emerald-800";

  /* ═══════════════════════════════════════════════════════════════════════
     Render
  ═══════════════════════════════════════════════════════════════════════ */
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <BackLink href="/dashboard/guru/kelas">
              Kembali ke daftar kelas
            </BackLink>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              📝 Manajemen Tugas
            </h1>
            <p className="mt-1 text-slate-600">
              Buat soal, kirim ke siswa, dan berikan penilaian.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setShowForm((v) => !v); if (showForm) cancelForm(); }}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {showForm ? "✕ Tutup Form" : "+ Buat Tugas Baru"}
            </button>
            <LogoutButton />
          </div>
        </header>

        {/* ── Notifikasi global ─────────────────────────────────────────── */}
        {message.text && (
          <div role={message.type === "error" ? "alert" : "status"}
            className={`mb-6 flex items-start gap-2 rounded-2xl border p-4 text-sm fade-in ${msgColor}`}>
            <span className="shrink-0">{message.type === "error" ? "⚠️" : "✅"}</span>
            <span>{message.text}</span>
          </div>
        )}

        {/* ── Form buat / edit tugas ────────────────────────────────────── */}
        {showForm && (
          <section className="mb-8 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm fade-in sm:p-7">
            <h2 className="mb-5 text-lg font-bold text-slate-900">
              {editingId ? "✏️ Edit Tugas" : "📋 Buat Soal / Tugas Baru"}
            </h2>

            <form onSubmit={handleSubmitForm} className="space-y-5">
              {/* Judul */}
              <div>
                <label htmlFor="title"
                  className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Judul Tugas / Soal <span className="text-red-500">*</span>
                </label>
                <input
                  id="title" name="title" type="text"
                  required minLength={3} maxLength={200}
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Contoh: Ulangan Harian Bab 3 — Ekosistem"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Instruksi / Soal */}
              <div>
                <label htmlFor="instructions"
                  className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Instruksi & Soal <span className="text-red-500">*</span>
                </label>
                <p className="mb-2 text-xs text-slate-500">
                  Tuliskan petunjuk pengerjaan dan soal-soal secara lengkap.
                  Siswa akan membaca dan menjawab di kotak teks.
                </p>
                <textarea
                  id="instructions" name="instructions"
                  required rows={10}
                  value={form.instructions}
                  onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
                  placeholder={`Contoh:\nPetunjuk: Jawab pertanyaan di bawah ini dengan lengkap.\n\n1. Apa yang dimaksud dengan ekosistem?\n2. Sebutkan 3 komponen biotik dalam ekosistem!\n3. Jelaskan perbedaan rantai makanan dan jaring makanan.`}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {form.instructions.length} karakter
                </p>
              </div>

              <div>
                <label htmlFor="assignment-attachment"
                  className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Lampiran Soal <span className="font-normal text-slate-400">(opsional, maksimal 15 MB)</span>
                </label>
                <input
                  id="assignment-attachment"
                  ref={attachmentInput}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.ogg,.mp4,.webm"
                  onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:font-semibold file:text-blue-800"
                />
                {editingId && assignments.find((assignment) => assignment.id === editingId)?.attachment_name && (
                  <div className="mt-2">
                    <p className="mb-1 text-xs text-slate-500">
                      Pilih berkas baru untuk mengganti lampiran yang ada.
                    </p>
                    <AttachmentDownload
                      endpoint={`/assignments/${editingId}/attachment`}
                      filename={assignments.find((assignment) => assignment.id === editingId).attachment_name}
                    />
                  </div>
                )}
                {attachment && (
                  <p className="mt-2 text-sm text-slate-600">Berkas dipilih: {attachment.name}</p>
                )}
              </div>

              {/* Tenggat waktu */}
              <div>
                <label htmlFor="due_at"
                  className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Tenggat Waktu <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  id="due_at" name="due_at" type="datetime-local"
                  value={form.due_at}
                  onChange={(e) => setForm((p) => ({ ...p, due_at: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Jika dikosongkan, siswa dapat mengumpulkan kapan saja.
                </p>
              </div>

              {/* Tombol aksi */}
              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                <button type="submit" disabled={submitting}
                  className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting
                    ? "Menyimpan…"
                    : editingId ? "Simpan Perubahan" : "🚀 Kirim Tugas ke Siswa"}
                </button>
                <button type="button" onClick={cancelForm}
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600">
                  Batal
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ── Daftar tugas ─────────────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Daftar Tugas
              {!loading && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-500">
                  {assignments.length}
                </span>
              )}
            </h2>
            <button onClick={loadAssignments}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              ↻ Muat ulang
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton h-32 rounded-2xl" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-semibold text-slate-700">Belum ada tugas</p>
              <p className="mt-1 text-sm text-slate-500">
                Klik "Buat Tugas Baru" untuk membuat soal pertama.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const days = daysLeft(assignment.due_at);
                const expired = days !== null && days < 0;
                const urgent  = days !== null && days >= 0 && days <= 2;

                return (
                  <article key={assignment.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-lg">
                            {assignment.title}
                          </h3>
                          {expired && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                              Selesai
                            </span>
                          )}
                          {urgent && !expired && (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600">
                              ⏰ {days === 0 ? "Hari ini" : `${days} hari lagi`}
                            </span>
                          )}
                        </div>

                        {/* Preview instruksi */}
                        <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">
                          {assignment.instructions}
                        </p>

                        <p className="mt-3 text-xs text-slate-400">
                          🗓 Tenggat: {formatDate(assignment.due_at)}
                        </p>
                        {assignment.attachment_name && (
                          <div className="mt-3">
                            <AttachmentDownload
                              endpoint={`/assignments/${assignment.id}/attachment`}
                              filename={assignment.attachment_name}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          selectedAssignment?.id === assignment.id
                            ? setSelectedAssignment(null)
                            : viewSubmissions(assignment)
                        }
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      >
                        {selectedAssignment?.id === assignment.id
                          ? "✕ Tutup Jawaban"
                          : "📩 Lihat Jawaban Siswa"}
                      </button>
                      <button type="button" onClick={() => startEdit(assignment)}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600">
                        ✏️ Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(assignment.id)}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500">
                        🗑 Hapus
                      </button>
                    </div>

                    {/* ── Panel jawaban siswa (inline expand) ─────────── */}
                    {selectedAssignment?.id === assignment.id && (
                      <div className="mt-5 border-t border-slate-100 pt-5 fade-in">
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="font-bold text-slate-900">
                            Jawaban Siswa
                            {!loadingSubs && (
                              <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                {submissions.length} dikumpulkan
                              </span>
                            )}
                          </h4>
                        </div>

                        {loadingSubs ? (
                          <div className="space-y-3">
                            {[1, 2].map((i) => (
                              <div key={i} className="skeleton h-24 rounded-2xl" />
                            ))}
                          </div>
                        ) : submissions.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
                            <p className="text-3xl mb-2">📭</p>
                            Belum ada siswa yang mengumpulkan jawaban.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {submissions.map((sub) => (
                              <SubmissionReview
                                key={sub.id}
                                submission={sub}
                                onSave={saveGrade}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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

export default function TeacherAssignmentsPage() {
  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <TeacherAssignmentsContent />
    </ProtectedRoute>
  );
}
