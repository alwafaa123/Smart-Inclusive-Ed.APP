const express = require("express");
const router = express.Router();

const preferenceController = require("../controllers/preferenceController");
const { requireAuth } = require("../middleware/db");

router.get("/me", requireAuth, preferenceController.getMyPreferences);
router.put("/me", requireAuth, preferenceController.updateMyPreferences);

module.exports = router;
