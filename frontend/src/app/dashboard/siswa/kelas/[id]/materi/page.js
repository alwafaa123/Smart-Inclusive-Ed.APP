"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import BackLink from "@/components/BackLink";
import AttachmentDownload from "@/components/AttachmentDownload";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LogoutButton from "@/components/auth/LogoutButton";
import { apiRequest } from "@/services/api";

const DEFAULT_PREFERENCES = {
  font_size: 18,
  line_spacing: 1.8,
  high_contrast: false,
  dyslexia_friendly_font: false,
  text_to_speech: false,
};

function StudentModulesContent() {
  const params = useParams();
  const classId = params.id;

  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState({});
  const [selected, setSelected] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // ─── Muat materi, progres, dan preferensi sekaligus ──────────────────────
  const loadData = useCallback(async () => {
    if (!classId) return;
    try {
      setLoading(true);
      const [moduleData, progressData, preferenceData] = await Promise.all([
        apiRequest(`/modules/classes/${classId}/modules`),
        apiRequest(`/modules/classes/${classId}/progress`),
        apiRequest("/preferences/me"),
      ]);

      setModules(moduleData.modules || []);

      const progressMap = {};
      (progressData.progress || []).forEach((item) => {
        progressMap[item.module_id] = item.status;
      });
      setProgress(progressMap);

      const saved = preferenceData.preferences || {};
      setPreferences({
        font_size: Number(saved.font_size) || DEFAULT_PREFERENCES.font_size,
        line_spacing:
          Number(saved.line_spacing) || DEFAULT_PREFERENCES.line_spacing,
        high_contrast: Number(saved.high_contrast) === 1,
        dyslexia_friendly_font: Number(saved.dyslexia_friendly_font) === 1,
        text_to_speech: Number(saved.text_to_speech) === 1,
      });
    } catch (error) {
      setMessage(error.message || "Gagal memuat materi.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Simpan preferensi ke server ─────────────────────────────────────────
  async function savePreferences(updatedPrefs) {
    try {
      setSavingPreferences(true);
      await apiRequest("/preferences/me", {
        method: "PUT",
        body: JSON.stringify(updatedPrefs),
      });
    } catch (error) {
      setMessage(error.message || "Gagal menyimpan pengaturan.");
    } finally {
      setSavingPreferences(false);
    }
  }

  function updatePreference(key, value) {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    savePreferences(updated);
  }

  // ─── Buka modul & perbarui progres ───────────────────────────────────────
  async function openModule(module) {
    setSelected(module);
    setMessage("");

    if (!progress[module.id] || progress[module.id] === "not_started") {
      try {
        await apiRequest(`/modules/${module.id}/progress`, {
          method: "PUT",
          body: JSON.stringify({ status: "in_progress" }),
        });
        setProgress((prev) => ({ ...prev, [module.id]: "in_progress" }));
      } catch (error) {
        // Gagal update progres tidak harus memblokir tampilan materi
        console.warn("Gagal update progres:", error.message);
      }
    }
  }

  async function markCompleted(moduleId) {
    try {
      await apiRequest(`/modules/${moduleId}/progress`, {
        method: "PUT",
        body: JSON.stringify({ status: "completed" }),
      });
      setProgress((prev) => ({ ...prev, [moduleId]: "completed" }));
      setMessage("Materi ditandai selesai.");
    } catch (error) {
      setMessage(error.message || "Gagal memperbarui progres.");
    }
  }

  // ─── Text-to-Speech ───────────────────────────────────────────────────────
  function speakContent() {
    if (!preferences.text_to_speech) {
      setMessage(
        "Aktifkan pembaca teks pada pengaturan aksesibilitas terlebih dahulu.",
      );
      return;
    }
    if (!selected || !("speechSynthesis" in window)) {
      setMessage("Fitur pembaca teks tidak tersedia di browser ini.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${selected.title}. ${selected.description || ""}. ${selected.content}`,
    );
    utterance.lang = "id-ID";
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  // ─── Warna dinamis berdasarkan high-contrast ──────────────────────────────
  const pageColors = preferences.high_contrast
    ? "bg-black text-yellow-300"
    : "bg-slate-50 text-slate-900";

  const cardColors = preferences.high_contrast
    ? "border-yellow-300 bg-black text-yellow-300"
    : "border-slate-200 bg-white text-slate-900";

  return (
    <main className={`min-h-screen p-4 sm:p-8 ${pageColors}`}>
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Smart Inclusive Ed
            </p>
            <h1 className="text-2xl font-bold">Materi Pembelajaran</h1>
            <p className="mt-1 text-sm opacity-80">
              Baca materi dengan pengaturan yang nyaman.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BackLink
              href={`/dashboard/siswa/kelas/${classId}`}
              highContrast={preferences.high_contrast}
            >
              Kembali ke kelas
            </BackLink>
            <LogoutButton />
          </div>
        </header>

        {message && (
          <div
            role="status"
            className={`mb-5 rounded-lg border p-3 text-sm ${
              preferences.high_contrast
                ? "border-yellow-300"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            {message}
          </div>
        )}

        {/* Panel Pengaturan Aksesibilitas */}
        <section className={`mb-6 rounded-2xl border p-4 ${cardColors}`}>
          <h2 className="mb-3 font-semibold">Pengaturan Aksesibilitas</h2>
          <div className="flex flex-wrap items-center gap-4">
            {/* Ukuran teks */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Ukuran teks</span>
              <button
                type="button"
                onClick={() =>
                  updatePreference(
                    "font_size",
                    Math.max(14, preferences.font_size - 2),
                  )
                }
                aria-label="Perkecil teks"
                className="rounded border px-3 py-1 font-bold"
              >
                A−
              </button>
              <span aria-live="polite" className="text-sm">
                {preferences.font_size}px
              </span>
              <button
                type="button"
                onClick={() =>
                  updatePreference(
                    "font_size",
                    Math.min(32, preferences.font_size + 2),
                  )
                }
                aria-label="Perbesar teks"
                className="rounded border px-3 py-1 font-bold"
              >
                A+
              </button>
            </div>

            {/* Jarak baris */}
            <label className="flex items-center gap-2 text-sm">
              Jarak baris
              <select
                value={preferences.line_spacing}
                onChange={(event) =>
                  updatePreference("line_spacing", Number(event.target.value))
                }
                className="rounded border bg-transparent px-2 py-1"
              >
                <option value={1.5}>Normal</option>
                <option value={1.8}>Lebih renggang</option>
                <option value={2.2}>Sangat renggang</option>
              </select>
            </label>

            {/* Kontras tinggi */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={preferences.high_contrast}
                onChange={(event) =>
                  updatePreference("high_contrast", event.target.checked)
                }
              />
              Kontras tinggi
            </label>

            {/* Font disleksia */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={preferences.dyslexia_friendly_font}
                onChange={(event) =>
                  updatePreference(
                    "dyslexia_friendly_font",
                    event.target.checked,
                  )
                }
              />
              Font disleksia
            </label>

            {/* Text-to-Speech */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={preferences.text_to_speech}
                onChange={(event) =>
                  updatePreference("text_to_speech", event.target.checked)
                }
              />
              Pembaca teks (TTS)
            </label>

            {savingPreferences && (
              <span className="text-xs opacity-60">Menyimpan...</span>
            )}
          </div>
        </section>

        {/* Konten utama */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)]">
          {/* Daftar materi */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Daftar Materi</h2>
            {loading ? (
              <p>Memuat materi...</p>
            ) : modules.length === 0 ? (
              <div
                className={`rounded-xl border border-dashed p-6 text-center ${cardColors}`}
              >
                Belum ada materi yang diterbitkan untuk kelas ini.
              </div>
            ) : (
              <div className="space-y-3">
                {modules.map((module) => (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => openModule(module)}
                    className={`w-full rounded-xl border p-4 text-left transition hover:ring-2 hover:ring-blue-400 ${cardColors} ${
                      selected?.id === module.id ? "ring-2 ring-blue-600" : ""
                    }`}
                  >
                    <span className="block font-semibold">{module.title}</span>
                    <span className="mt-1 block text-sm opacity-80">
                      {module.description || "Tidak ada deskripsi."}
                    </span>
                    <span className="mt-2 block text-xs font-medium">
                      {progress[module.id] === "completed"
                        ? "✅ Selesai"
                        : progress[module.id] === "in_progress"
                          ? "📖 Sedang dipelajari"
                          : "⬜ Belum dimulai"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Pembaca materi */}
          <section
            className={`min-h-72 rounded-2xl border p-5 sm:p-7 ${cardColors}`}
          >
            {!selected ? (
              <div className="flex min-h-60 items-center justify-center text-center opacity-70">
                Pilih materi dari daftar untuk mulai membaca.
              </div>
            ) : (
              <>
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{selected.title}</h2>
                    {selected.description && (
                      <p className="mt-2 text-sm opacity-80">
                        {selected.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={speakContent}
                      title={
                        preferences.text_to_speech
                          ? "Bacakan materi ini"
                          : "Aktifkan TTS di pengaturan aksesibilitas"
                      }
                      className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                        preferences.text_to_speech
                          ? "border-blue-400 text-blue-700"
                          : "opacity-50"
                      }`}
                    >
                      🔊 Bacakan
                    </button>
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      className="rounded-lg border px-3 py-2 text-sm font-medium"
                    >
                      ⏹ Hentikan
                    </button>
                  </div>
                </div>

                <article
                  className={`whitespace-pre-wrap break-words ${
                    preferences.dyslexia_friendly_font
                      ? "font-[Arial,Verdana,sans-serif]"
                      : ""
                  }`}
                  style={{
                    fontSize: `${preferences.font_size}px`,
                    lineHeight: preferences.line_spacing,
                  }}
                >
                  {selected.content}
                </article>

                {selected.attachment_name && (
                  <div className="mt-5">
                    <p className="mb-2 text-sm font-semibold">Lampiran materi</p>
                    <AttachmentDownload
                      endpoint={`/modules/${selected.id}/attachment`}
                      filename={selected.attachment_name}
                    />
                  </div>
                )}

                <div className="mt-8 border-t border-current border-opacity-20 pt-5">
                  {progress[selected.id] === "completed" ? (
                    <p className="font-semibold text-green-600">
                      ✅ Materi ini sudah ditandai selesai.
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => markCompleted(selected.id)}
                      className="rounded-lg bg-blue-700 px-5 py-2.5 font-medium text-white hover:bg-blue-800"
                    >
                      Tandai Selesai
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default function StudentModulesPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentModulesContent />
    </ProtectedRoute>
  );
}
