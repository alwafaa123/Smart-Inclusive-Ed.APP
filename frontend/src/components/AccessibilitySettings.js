"use client";

import { useAccessibility } from "@/components/AccessibilityProvider";

const TOGGLE_OPTIONS = [
  {
    key:   "high_contrast",
    label: "Kontras Tinggi",
    desc:  "Meningkatkan perbedaan warna teks dan latar agar lebih mudah dibaca.",
    icon:  "🌓",
  },
  {
    key:   "dyslexia_friendly_font",
    label: "Font Disleksia",
    desc:  "Menggunakan Arial / Verdana yang lebih mudah dibaca untuk disleksia.",
    icon:  "🔤",
  },
  {
    key:   "text_to_speech",
    label: "Pembaca Teks (TTS)",
    desc:  "Mengaktifkan fitur suara pada halaman materi pembelajaran.",
    icon:  "🔊",
  },
];

export default function AccessibilitySettings() {
  const { preferences, updatePreferences, loadingPreferences, error } =
    useAccessibility();

  async function change(name, value) {
    await updatePreferences({ [name]: value });
  }

  if (loadingPreferences) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-10 rounded-xl" />
        ))}
        <p className="sr-only">Memuat pengaturan aksesibilitas…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠️ {error}
        </p>
      )}

      {/* ── Ukuran teks ─────────────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="font-size" className="font-semibold text-slate-800">
            Ukuran Teks
          </label>
          <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-700">
            {preferences.font_size}px
          </span>
        </div>
        <input
          id="font-size"
          type="range"
          min="14"
          max="32"
          step="2"
          value={preferences.font_size}
          onChange={(e) => change("font_size", Number(e.target.value))}
          className="w-full accent-blue-600"
          aria-valuemin={14}
          aria-valuemax={32}
          aria-valuenow={preferences.font_size}
        />
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>Kecil (14px)</span>
          <span>Besar (32px)</span>
        </div>
        {/* Preview teks */}
        <p
          className="mt-3 rounded-lg bg-slate-50 p-3 text-slate-700"
          style={{ fontSize: `${preferences.font_size}px`, lineHeight: preferences.line_spacing }}
          aria-hidden="true"
        >
          Contoh tampilan teks dengan ukuran ini.
        </p>
      </div>

      {/* ── Jarak baris ─────────────────────────────────────────────────── */}
      <div>
        <label htmlFor="line-spacing" className="mb-2 block font-semibold text-slate-800">
          Jarak Antarbaris
        </label>
        <select
          id="line-spacing"
          value={preferences.line_spacing}
          onChange={(e) => change("line_spacing", Number(e.target.value))}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="1.5">Normal (1,5×)</option>
          <option value="1.8">Lebih renggang (1,8×)</option>
          <option value="2.2">Sangat renggang (2,2×)</option>
        </select>
      </div>

      {/* ── Toggle aksesibilitas ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="font-semibold text-slate-800">Fitur Aksesibilitas</p>
        {TOGGLE_OPTIONS.map((opt) => {
          const isOn = Boolean(preferences[opt.key]);
          return (
            <label
              key={opt.key}
              className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${
                isOn
                  ? "border-blue-200 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {/* Toggle switch */}
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isOn}
                  onChange={(e) => change(opt.key, e.target.checked)}
                />
                <div
                  className={`h-6 w-11 rounded-full transition-colors ${
                    isOn ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      isOn ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </div>
              </div>
              {/* Label */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true">{opt.icon}</span>
                  <span className="font-semibold text-slate-900">{opt.label}</span>
                  {isOn && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{opt.desc}</p>
              </div>
            </label>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400" aria-live="polite">
        ✓ Semua perubahan disimpan otomatis ke akun Anda.
      </p>
    </div>
  );
}
