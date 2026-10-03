const express = require("express");
const router = express.Router();

const assignmentController = require("../controllers/assignmentController");
const { requireRole } = require("../middleware/db");
const { uploadAttachment } = require("../middleware/attachmentUpload");

// Guru membuat dan mengelola tugas
router.post(
  "/classes/:classId",
  requireRole("teacher"),
  uploadAttachment,
  assignmentController.createAssignment,
);

router.get(
  "/classes/:classId",
  requireRole("teacher", "student"),
  assignmentController.getClassAssignments,
);

router.put("/:id", requireRole("teacher"), uploadAttachment, assignmentController.updateAssignment);

router.delete("/:id", requireRole("teacher"), assignmentController.deleteAssignment);
router.get(
  "/:id/attachment",
  requireRole("teacher", "student"),
  assignmentController.downloadAssignmentAttachment,
);

// Siswa mengumpulkan tugas dan melihat hasilnya
router.post(
  "/:id/submissions",
  requireRole("student"),
  uploadAttachment,
  assignmentController.submitAssignment,
);

router.get(
  "/:id/my-submission",
  requireRole("student"),
  assignmentController.getMySubmission,
);

// Guru melihat dan menilai pengumpulan
router.get(
  "/:id/submissions",
  requireRole("teacher"),
  assignmentController.getAssignmentSubmissions,
);

router.get(
  "/submissions/:submissionId/attachment",
  requireRole("teacher", "student"),
  assignmentController.downloadSubmissionAttachment,
);

router.put(
  "/submissions/:submissionId/grade",
  requireRole("teacher"),
  assignmentController.gradeSubmission,
);

module.exports = router;
