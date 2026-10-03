const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { requireRole } = require("../middleware/db");

// Semua endpoint di file ini khusus admin.
router.use(requireRole("admin"));

// GET  /api/admin/users       – daftar semua pengguna
router.get("/users", adminController.getUsers);

// POST /api/admin/users       – buat pengguna baru (hanya teacher / student)
router.post("/users", adminController.createUser);

// PUT  /api/admin/users/:id   – update data pengguna
router.put("/users/:id", adminController.updateUser);

// PATCH /api/admin/users/:id/status – aktifkan / nonaktifkan akun
router.patch("/users/:id/status", adminController.updateUserStatus);

module.exports = router;
