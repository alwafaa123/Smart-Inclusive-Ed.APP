const express = require("express");
const router = express.Router();

const {
  getTeacherNotifications,
  markTeacherNotificationRead,
  markAllTeacherNotificationsRead,
  getPendingGrading,
} = require("../controllers/teacherNotificationController");

const { requireRole } = require("../middleware/db");

router.use(requireRole("teacher"));

router.get("/", getTeacherNotifications);
router.get("/pending-grading", getPendingGrading);
router.patch("/read-all", markAllTeacherNotificationsRead);
router.patch("/:id/read", markTeacherNotificationRead);

module.exports = router;
