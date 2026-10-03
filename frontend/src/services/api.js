const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function apiRequest(endpoint, options = {}) {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = new Headers(options.headers);
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: "Respons server tidak dapat dibaca.",
  }));

  if (!response.ok) {
    const error = new Error(
      data.message || "Terjadi kesalahan saat menghubungi server.",
    );

    error.status = response.status;
    throw error;
  }

  return data;
}

export async function downloadAttachment(endpoint, filename) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Gagal mengunduh berkas.");
  }

  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
