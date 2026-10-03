const express = require("express");
const router = express.Router();

const classController = require("../controllers/classController");
const { requireRole } = require("../middleware/db");

// Guru
router.post("/", requireRole("teacher"), classController.createClass);

router.get("/:id/members", requireRole("teacher"), classController.getClassMembers);

router.delete(
  "/:id/members/:studentId",
  requireRole("teacher"),
  classController.removeStudent,
);

// Siswa bergabung ke kelas
router.post("/join", requireRole("student"), classController.joinClass);

// Guru dan siswa dapat melihat daftar kelas masing-masing.
router.get("/", requireRole("teacher", "student"), classController.getMyClasses);

module.exports = router;
