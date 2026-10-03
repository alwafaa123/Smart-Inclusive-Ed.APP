const express = require("express");
const router = express.Router();

const { getClassAnalytics } = require("../controllers/analyticsController");
const { requireRole } = require("../middleware/db");

router.get("/classes/:classId", requireRole("teacher"), getClassAnalytics);

module.exports = router;
