const { pool } = require("../config/database");

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT
        id,
        name,
        email,
        role,
        is_active,
        created_at
       FROM users
       ORDER BY created_at DESC`,
    );

    return res.status(200).json({
      success: true,
      message: "Daftar pengguna berhasil diambil.",
      total: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar pengguna.",
    });
  }
};

const bcrypt = require("bcryptjs");

// POST /api/admin/users
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validasi data wajib
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof role !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Semua data wajib diisi dengan format yang benar.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Nama harus terdiri dari 2 sampai 100 karakter.",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail) || cleanEmail.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Format email tidak valid.",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password harus terdiri dari 8 sampai 72 karakter.",
      });
    }

    // Admin hanya dapat membuat akun guru atau siswa.
    if (!["teacher", "student"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Peran hanya boleh teacher atau student.",
      });
    }

    // Periksa apakah email sudah digunakan.
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [cleanEmail],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar.",
      });
    }

    // Hash password sebelum disimpan.
    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [cleanName, cleanEmail, passwordHash, role, 1],
    );

    return res.status(201).json({
      success: true,
      message: "Pengguna berhasil ditambahkan.",
      user: {
        id: result.insertId,
        name: cleanName,
        email: cleanEmail,
        role,
        is_active: 1,
      },
    });
  } catch (error) {
    // Menangani kemungkinan email duplikat akibat permintaan bersamaan.
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar.",
      });
    }

    console.error("Create user error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal menambahkan pengguna.",
    });
  }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { name, email } = req.body;

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID pengguna tidak valid.",
      });
    }

    if (typeof name !== "string" || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Nama dan email wajib diisi.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Nama harus terdiri dari 2 sampai 100 karakter.",
      });
    }

    if (!emailPattern.test(cleanEmail) || cleanEmail.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Format email tidak valid.",
      });
    }

    const [users] = await pool.execute(
      "SELECT id, role FROM users WHERE id = ? LIMIT 1",
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
    }

    // Endpoint ini hanya mengelola akun guru dan siswa.
    if (!["teacher", "student"].includes(users[0].role)) {
      return res.status(403).json({
        success: false,
        message: "Akun admin tidak dapat diubah melalui fitur ini.",
      });
    }

    const [duplicates] = await pool.execute(
      "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
      [cleanEmail, userId],
    );

    if (duplicates.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email sudah digunakan oleh pengguna lain.",
      });
    }

    await pool.execute("UPDATE users SET name = ?, email = ? WHERE id = ?", [
      cleanName,
      cleanEmail,
      userId,
    ]);

    return res.status(200).json({
      success: true,
      message: "Data pengguna berhasil diperbarui.",
      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        role: users[0].role,
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email sudah digunakan.",
      });
    }

    console.error("Update user error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui data pengguna.",
    });
  }
};

// PATCH /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { is_active } = req.body;

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID pengguna tidak valid.",
      });
    }

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Status harus berupa true atau false.",
      });
    }

    const [users] = await pool.execute(
      "SELECT id, role FROM users WHERE id = ? LIMIT 1",
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
    }

    if (!["teacher", "student"].includes(users[0].role)) {
      return res.status(403).json({
        success: false,
        message: "Status akun admin tidak dapat diubah melalui fitur ini.",
      });
    }

    await pool.execute("UPDATE users SET is_active = ? WHERE id = ?", [
      is_active ? 1 : 0,
      userId,
    ]);

    return res.status(200).json({
      success: true,
      message: is_active
        ? "Akun berhasil diaktifkan."
        : "Akun berhasil dinonaktifkan.",
      user: {
        id: userId,
        is_active,
      },
    });
  } catch (error) {
    console.error("Update user status error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal mengubah status akun.",
    });
  }
};
