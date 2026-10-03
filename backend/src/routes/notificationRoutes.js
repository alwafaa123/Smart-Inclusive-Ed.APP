const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const { requireAuth } = require("../middleware/db");

router.use(requireAuth);

router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.get("/upcoming-deadlines", notificationController.getUpcomingDeadlines);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);

module.exports = router;
