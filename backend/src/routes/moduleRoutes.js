const express = require("express");
const router = express.Router();

const moduleController = require("../controllers/moduleController");
const { requireRole, requireAuth } = require("../middleware/db");

// Guru membuat dan mengelola materi.
router.post(
  "/classes/:classId/modules",
  requireRole("teacher"),
  moduleController.createModule,
);

router.put("/:id", requireRole("teacher"), moduleController.updateModule);

router.patch(
  "/:id/publish",
  requireRole("teacher"),
  moduleController.setModulePublished,
);

router.delete("/:id", requireRole("teacher"), moduleController.deleteModule);

// Guru dan siswa melihat daftar materi kelas.
router.get(
  "/classes/:classId/modules",
  requireRole("teacher", "student"),
  moduleController.getClassModules,
);

// Siswa memperbarui dan melihat progres belajar.
router.put(
  "/:id/progress",
  requireRole("student"),
  moduleController.updateProgress,
);

router.get(
  "/classes/:classId/progress",
  requireRole("student"),
  moduleController.getMyProgress,
);

// Guru dan siswa membuka materi sesuai hak akses.
// Letakkan setelah route spesifik agar tidak menangkap "/classes/:classId/..."
router.get(
  "/:id",
  requireRole("teacher", "student"),
  moduleController.getModuleById,
);

module.exports = router;
