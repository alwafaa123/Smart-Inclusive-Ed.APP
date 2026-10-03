const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/db");

// POST /api/auth/register – tidak butuh auth (pendaftaran mandiri)
router.post("/register", authController.register);

// POST /api/auth/login   – tidak butuh auth
router.post("/login", authController.login);

// POST /api/auth/logout  – butuh sesi aktif
router.post("/logout", requireAuth, authController.logout);

// GET  /api/auth/me      – kembalikan data pengguna saat ini
router.get("/me", requireAuth, authController.me);

module.exports = router;
