const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { randomUUID } = require("crypto");

const uploadDirectory = path.join(__dirname, "../../uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword", "application/octet-stream"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"],
  ".ppt": ["application/vnd.ms-powerpoint", "application/octet-stream"],
  ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/octet-stream"],
  ".xls": ["application/vnd.ms-excel", "application/octet-stream"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream"],
  ".csv": ["text/csv", "application/vnd.ms-excel", "application/octet-stream"],
  ".txt": ["text/plain", "application/octet-stream"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".gif": ["image/gif"],
  ".webp": ["image/webp"],
  ".mp3": ["audio/mpeg", "audio/mp3"],
  ".wav": ["audio/wav", "audio/x-wav"],
  ".ogg": ["audio/ogg", "application/ogg"],
  ".mp4": ["video/mp4", "application/mp4"],
  ".webm": ["video/webm"],
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const acceptedMimeTypes = allowedTypes[extension];

    if (!acceptedMimeTypes || !acceptedMimeTypes.includes(file.mimetype)) {
      const error = new Error(
        "Jenis berkas tidak didukung. Gunakan PDF, Office, teks, gambar, audio, atau video.",
      );
      error.code = "INVALID_FILE_TYPE";
      return callback(error);
    }

    return callback(null, true);
  },
});

function uploadAttachment(req, res, next) {
  upload.single("attachment")(req, res, (error) => {
    if (!error) return next();

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "Ukuran berkas maksimal 15 MB." });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ message: "Hanya satu berkas yang dapat diunggah." });
    }

    if (error.code === "INVALID_FILE_TYPE") {
      return res.status(400).json({ message: error.message });
    }

    console.error("Attachment upload error:", error);
    return res.status(500).json({ message: "Gagal mengunggah berkas." });
  });
}

function attachmentData(file) {
  if (!file) return null;

  return {
    attachment_path: file.filename,
    attachment_name: file.originalname,
    attachment_type: file.mimetype,
  };
}

function getStoredFilePath(filename) {
  if (!filename || path.basename(filename) !== filename) return null;
  return path.join(uploadDirectory, filename);
}

function removeStoredFile(filename) {
  const filePath = getStoredFilePath(filename);
  if (!filePath) return;

  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Failed to remove attachment:", error);
    }
  }
}

function discardUploadedFile(req) {
  if (req.file) removeStoredFile(req.file.filename);
}

function sendStoredFile(res, filename, originalName, message) {
  const filePath = getStoredFilePath(filename);
  if (!filePath) return res.status(404).json({ message });

  return res.download(filePath, originalName, (error) => {
    if (error && !res.headersSent) {
      if (error.code === "ENOENT") {
        return res.status(404).json({ message: "Berkas tidak ditemukan." });
      }
      console.error("Attachment download error:", error);
      return res.status(500).json({ message: "Gagal mengunduh berkas." });
    }
  });
}

module.exports = {
  attachmentData,
  discardUploadedFile,
  removeStoredFile,
  sendStoredFile,
  uploadAttachment,
};
