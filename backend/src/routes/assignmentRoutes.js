const express = require("express");
const router = express.Router();

const assignmentController = require("../controllers/assignmentController");
const { requireRole } = require("../middleware/db");

// Guru membuat dan mengelola tugas
router.post(
  "/classes/:classId",
  requireRole("teacher"),
  assignmentController.createAssignment,
);

router.get(
  "/classes/:classId",
  requireRole("teacher", "student"),
  assignmentController.getClassAssignments,
);

router.put("/:id", requireRole("teacher"), assignmentController.updateAssignment);

router.delete("/:id", requireRole("teacher"), assignmentController.deleteAssignment);

// Siswa mengumpulkan tugas dan melihat hasilnya
router.post(
  "/:id/submissions",
  requireRole("student"),
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

router.put(
  "/submissions/:submissionId/grade",
  requireRole("teacher"),
  assignmentController.gradeSubmission,
);

module.exports = router;
