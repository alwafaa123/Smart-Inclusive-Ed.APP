"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import AttachmentDownload from "@/components/AttachmentDownload";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LogoutButton from "@/components/auth/LogoutButton";
import { apiRequest } from "@/services/api";
import { useAccessibility } from "@/components/AccessibilityProvider";

/* ── Badge status pengumpulan ──────────────────────────────────────────── */
function StatusBadge({ submission, deadlinePassed }) {
  if (submission?.score !== null && submission?.score !== undefined) {
    const score = Number(submission.score);
    const color =
      score >= 80 ? "bg-emerald-100 text-emerald-700" :
      score >= 60 ? "bg-amber-100 text-amber-700"     : "bg-red-100 text-red-700";
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${color}`}>
        Nilai: {score}
      </span>
    );
  }
  if (submission) {
    return (
      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
        ✓ Sudah dikumpulkan — menunggu penilaian
      </span>
    );
  }
  if (deadlinePassed) {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
        Tenggat berakhir
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
      Belum dikerjakan
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Komponen utama
══════════════════════════════════════════════════════════════════════════ */
function StudentAssignmentsContent() {
  const params  = useParams();
  const classId = params.id;

  const { preferences } = useAccessibility();

  const [assignments,   setAssignments]   = useState([]);
  const [submissions,   setSubmissions]   = useState({});
  const [answers,       setAnswers]       = useState({});
  const [submissionFiles, setSubmissionFiles] = useState({});
  const submissionFileInputs = useRef({});
  const [openId,        setOpenId]        = useState(null); // soal yang sedang dibuka
  const [loading,       setLoading]       = useState(true);
  const [submittingId,  setSubmittingId]  = useState(null);
  const [message,       setMessage]       = useState({ text: "", type: "success" });

  /* ── Muat tugas + semua submission milik siswa ─────────────────────── */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/assignments/classes/${classId}`);
      // Backend mengembalikan { assignments: [...] }
      const list = data.assignments || [];
      setAssignments(list);

      // Ambil submission masing-masing secara paralel
      const results = await Promise.allSettled(
        list.map((a) =>
          apiRequest(`/assignments/${a.id}/my-submission`)
            .then((sub) => [a.id, sub])
            .catch(() => [a.id, null]),
        ),
      );

      const subMap = {};
      const ansMap = {};
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          const [id, sub] = r.value;
          subMap[id] = sub;
          ansMap[id] = sub?.answer || "";
        }
      });

      setSubmissions(subMap);
      setAnswers(ansMap);
    } catch (err) {
      setMessage({ text: err.message || "Gagal memuat tugas.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { if (classId) loadData(); }, [classId, loadData]);

  /* ── Kumpulkan / perbarui jawaban ──────────────────────────────────── */
  async function handleSubmit(assignmentId) {
    const answer = (answers[assignmentId] || "").trim();
    const file = submissionFiles[assignmentId];
    if (!answer && !file && !submissions[assignmentId]?.attachment_name) {
      setMessage({ text: "Tuliskan jawaban atau lampirkan berkas tugas.", type: "error" });
      return;
    }
    setMessage({ text: "", type: "success" });
    setSubmittingId(assignmentId);
    try {
      const payload = new FormData();
      payload.append("answer", answer);
      if (file) payload.append("attachment", file);
      await apiRequest(`/assignments/${assignmentId}/submissions`, {
        method: "POST",
        body: payload,
      });
      setSubmissionFiles((previous) => {
        const updated = { ...previous };
        delete updated[assignmentId];
        return updated;
      });
      if (submissionFileInputs.current[assignmentId]) {
        submissionFileInputs.current[assignmentId].value = "";
      }
      setMessage({ text: "✅ Jawaban berhasil dikumpulkan!", type: "success" });
      await loadData();
    } catch (err) {
      setMessage({ text: err.message || "Gagal mengumpulkan jawaban.", type: "error" });
    } finally {
      setSubmittingId(null);
    }
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

  /* ─── Statistik ringkas ───────────────────────────────────────────── */
  const done    = assignments.filter((a) => submissions[a.id]).length;
  const pending = assignments.length - done;

  /* ═══════════════════════════════════════════════════════════════════════
     Render
  ═══════════════════════════════════════════════════════════════════════ */
  return (
    <main
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 px-4 py-8 sm:px-8"
      style={{
        fontSize:   `${preferences.font_size}px`,
        lineHeight: preferences.line_spacing,
        fontFamily: preferences.dyslexia_friendly_font
          ? "Arial, Verdana, sans-serif"
          : "inherit",
      }}
    >
      <div className="mx-auto max-w-4xl">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <BackLink href={`/dashboard/siswa/kelas/${classId}`}>
              Kembali ke kelas
            </BackLink>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              📝 Tugas & Soal
            </h1>
            <p className="mt-1 text-slate-600">
              Baca soal dari guru, tulis jawaban, dan kumpulkan sebelum tenggat.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/siswa/notifikasi"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              🔔 Notifikasi
            </Link>
            <LogoutButton />
          </div>
        </header>

        {/* ── Statistik ringkas ─────────────────────────────────────────── */}
        {!loading && assignments.length > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { label: "Total Tugas", value: assignments.length, color: "text-slate-900" },
              { label: "Sudah Dikumpulkan", value: done, color: "text-emerald-700" },
              { label: "Belum Dikerjakan", value: pending, color: pending > 0 ? "text-amber-600" : "text-slate-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Notifikasi global ─────────────────────────────────────────── */}
        {message.text && (
          <div role={message.type === "error" ? "alert" : "status"}
            className={`mb-6 flex items-start gap-2 rounded-2xl border p-4 text-sm fade-in ${msgColor}`}>
            <span>{message.text}</span>
          </div>
        )}

        {/* ── Daftar soal / tugas ───────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-36 rounded-2xl" />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold text-slate-700">Belum ada tugas</p>
            <p className="mt-1 text-sm text-slate-500">
              Guru belum memberikan tugas untuk kelas ini.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {assignments.map((assignment, index) => {
              const submission    = submissions[assignment.id];
              const dueDate       = assignment.due_at ? new Date(assignment.due_at) : null;
              const deadlinePassed = dueDate && dueDate < new Date();
              const days          = daysLeft(assignment.due_at);
              const urgent        = days !== null && days >= 0 && days <= 2;
              const isOpen        = openId === assignment.id;
              const scored        = submission?.score !== null && submission?.score !== undefined;

              return (
                <article key={assignment.id}
                  className={`rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
                    scored ? "border-emerald-200" :
                    submission ? "border-blue-200" :
                    deadlinePassed ? "border-slate-200 opacity-75" : "border-slate-200"
                  }`}
                >
                  {/* ── Header soal (klik untuk expand) ─────────────── */}
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : assignment.id)}
                    className="w-full p-5 text-left focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-inset rounded-2xl"
                    aria-expanded={isOpen}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Nomor soal */}
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          scored ? "bg-emerald-100 text-emerald-700" :
                          submission ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <h2 className="font-bold text-slate-900">
                            {assignment.title}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            🗓 {formatDate(assignment.due_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {urgent && !deadlinePassed && (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600">
                            ⏰ {days === 0 ? "Hari ini!" : `${days} hari lagi`}
                          </span>
                        )}
                        <StatusBadge submission={submission} deadlinePassed={deadlinePassed} />
                        <span className="text-slate-400 text-sm ml-1">
                          {isOpen ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* ── Konten soal (expand) ─────────────────────────── */}
                  {isOpen && (
                    <div className="border-t border-slate-100 p-5 pt-4 fade-in">

                      {/* Soal / instruksi */}
                      <div className="rounded-2xl bg-blue-50/60 border border-blue-100 p-5 mb-5">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-600">
                          📋 Soal / Instruksi Guru
                        </p>
                        <div
                          className="whitespace-pre-wrap text-slate-800"
                          style={{ fontSize: `${preferences.font_size}px`, lineHeight: preferences.line_spacing }}
                        >
                          {assignment.instructions}
                        </div>
                        {assignment.attachment_name && (
                          <div className="mt-4 border-t border-blue-100 pt-4">
                            <p className="mb-2 text-sm font-semibold text-slate-700">
                              Lampiran dari guru
                            </p>
                            <AttachmentDownload
                              endpoint={`/assignments/${assignment.id}/attachment`}
                              filename={assignment.attachment_name}
                            />
                          </div>
                        )}
                      </div>

                      {/* Kotak jawaban */}
                      {!deadlinePassed ? (
                        <div>
                          <label
                            htmlFor={`answer-${assignment.id}`}
                            className="mb-2 block text-sm font-bold text-slate-800"
                          >
                            ✍️ Jawaban Kamu
                            {submission && (
                              <span className="ml-2 text-xs font-normal text-slate-500">
                                (sudah dikumpulkan — bisa diperbarui)
                              </span>
                            )}
                          </label>
                          <textarea
                            id={`answer-${assignment.id}`}
                            rows={8}
                            value={answers[assignment.id] || ""}
                            onChange={(e) =>
                              setAnswers((prev) => ({
                                ...prev,
                                [assignment.id]: e.target.value,
                              }))
                            }
                            placeholder="Tuliskan jawabanmu di sini secara lengkap dan jelas…"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            style={{ fontSize: `${preferences.font_size}px`, lineHeight: preferences.line_spacing }}
                          />
                          <p className="mt-1 text-right text-xs text-slate-400">
                            {(answers[assignment.id] || "").length} karakter
                          </p>

                          <div className="mt-4">
                            <label
                              htmlFor={`submission-file-${assignment.id}`}
                              className="mb-1.5 block text-sm font-bold text-slate-800"
                            >
                              📎 Lampiran Jawaban <span className="font-normal text-slate-400">(opsional, maksimal 15 MB)</span>
                            </label>
                            <input
                              id={`submission-file-${assignment.id}`}
                              ref={(input) => {
                                submissionFileInputs.current[assignment.id] = input;
                              }}
                              type="file"
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.ogg,.mp4,.webm"
                              onChange={(event) =>
                                setSubmissionFiles((previous) => ({
                                  ...previous,
                                  [assignment.id]: event.target.files?.[0] || null,
                                }))
                              }
                              className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:font-semibold file:text-blue-800"
                            />
                            {submissionFiles[assignment.id] && (
                              <p className="mt-2 text-sm text-slate-600">
                                Berkas dipilih: {submissionFiles[assignment.id].name}
                              </p>
                            )}
                            {!submissionFiles[assignment.id] && submission?.attachment_name && (
                              <div className="mt-2">
                                <p className="mb-1 text-xs text-slate-500">
                                  Lampiran jawaban yang sudah dikirim:
                                </p>
                                <AttachmentDownload
                                  endpoint={`/assignments/submissions/${submission.id}/attachment`}
                                  filename={submission.attachment_name}
                                />
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSubmit(assignment.id)}
                            disabled={submittingId === assignment.id}
                            className="mt-3 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {submittingId === assignment.id
                              ? "Mengirim…"
                              : submission
                                ? "🔄 Perbarui Jawaban"
                                : "📤 Kumpulkan Jawaban"}
                          </button>
                        </div>
                      ) : (
                        !submission && (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-slate-500">
                            <p className="text-2xl mb-2">⏰</p>
                            <p className="font-semibold">Tenggat waktu sudah berakhir</p>
                            <p className="text-sm mt-1">Pengumpulan tidak lagi tersedia untuk tugas ini.</p>
                          </div>
                        )
                      )}

                      {/* Hasil penilaian */}
                      {submission && (
                        <div className={`mt-5 rounded-2xl border p-5 ${
                          scored ? "border-emerald-200 bg-emerald-50/60" : "border-blue-200 bg-blue-50/40"
                        }`}>
                          <h3 className="mb-3 font-bold text-slate-900">
                            📊 Hasil Penilaian
                          </h3>

                          {/* Nilai */}
                          <div className="mb-4 flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-xs text-slate-500">Nilai</p>
                              <p className={`text-4xl font-extrabold ${
                                scored
                                  ? Number(submission.score) >= 80
                                    ? "text-emerald-600"
                                    : Number(submission.score) >= 60
                                      ? "text-amber-600"
                                      : "text-red-600"
                                  : "text-slate-400"
                              }`}>
                                {scored ? submission.score : "—"}
                              </p>
                              {scored && (
                                <p className="text-xs text-slate-500">/ 100</p>
                              )}
                            </div>
                            {scored && (
                              <div className="flex-1">
                                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                                  <div
                                    className={`h-3 rounded-full progress-bar-fill ${
                                      Number(submission.score) >= 80 ? "bg-emerald-500" :
                                      Number(submission.score) >= 60 ? "bg-amber-400"   : "bg-red-400"
                                    }`}
                                    style={{ width: `${submission.score}%` }}
                                  />
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                  {Number(submission.score) >= 80
                                    ? "🌟 Sangat baik!"
                                    : Number(submission.score) >= 60
                                      ? "👍 Cukup baik, terus semangat!"
                                      : "💪 Tetap semangat belajar!"}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Jawaban yang dikirim */}
                          <div className="mb-4">
                            <p className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Jawaban yang dikumpulkan
                            </p>
                            <div className="rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-700 whitespace-pre-wrap">
                              {submission.answer || "Tidak ada jawaban teks."}
                            </div>
                            {submission.attachment_name && (
                              <div className="mt-2">
                                <AttachmentDownload
                                  endpoint={`/assignments/submissions/${submission.id}/attachment`}
                                  filename={submission.attachment_name}
                                />
                              </div>
                            )}
                            <p className="mt-1 text-xs text-slate-400">
                              Dikumpulkan: {submission.submitted_at
                                ? new Date(submission.submitted_at).toLocaleString("id-ID")
                                : "—"}
                            </p>
                          </div>

                          {/* Umpan balik guru */}
                          <div>
                            <p className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Umpan balik guru
                            </p>
                            {submission.feedback ? (
                              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-800 whitespace-pre-wrap">
                                💬 {submission.feedback}
                              </div>
                            ) : (
                              <p className="text-sm italic text-slate-400">
                                Belum ada umpan balik dari guru.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function StudentAssignmentsPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentAssignmentsContent />
    </ProtectedRoute>
  );
}
