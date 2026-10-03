"use client";

import { useState } from "react";
import { downloadAttachment } from "@/services/api";

export default function AttachmentDownload({ endpoint, filename }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setDownloading(true);
    setError("");
    try {
      await downloadAttachment(endpoint, filename);
    } catch (downloadError) {
      setError(downloadError.message || "Gagal mengunduh berkas.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-wait disabled:opacity-60"
      >
        <span aria-hidden="true">📎</span>
        <span>{downloading ? "Mengunduh..." : filename}</span>
        {!downloading && <span aria-hidden="true">↓</span>}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>
      )}
    </div>
  );
}
